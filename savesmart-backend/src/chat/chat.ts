import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-2" });
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

interface ErrorResponse {
  error: string;
  code: string;
  statusCode: number;
}

interface N8NResponse {
  reply: string;
  savings?: number;
  plan?: {
    goal: string;
    timeline: string;
    monthly: number;
    breakdown: Array<{
      category: string;
      amount: number;
      tip: string;
    }>;
  };
}

const createResponse = (statusCode: number, body: object): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

const createErrorResponse = (statusCode: number, error: string, code: string): APIGatewayProxyResult =>
  createResponse(statusCode, { error, code, statusCode } as ErrorResponse);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event));

  try {
    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, "Request body is required", "VALIDATION_ERROR");
    }

    const body = JSON.parse(event.body);
    const { userId, message } = body;

    if (!userId || !message) {
      return createErrorResponse(400, "Missing required fields: userId and message", "VALIDATION_ERROR");
    }

    // Step 1: Fetch user profile from DynamoDB
    console.log("Fetching user profile:", userId);
    const userResult = await client.send(new GetItemCommand({
      TableName: process.env.USERS_TABLE_NAME || "savesmart-users",
      Key: {
        userId: { S: userId }
      }
    }));

    if (!userResult.Item) {
      return createErrorResponse(404, "User not found", "USER_NOT_FOUND");
    }

    const userProfile = unmarshall(userResult.Item);
    console.log("User profile retrieved");

    // Step 2: Send to n8n webhook with user context
    if (!N8N_WEBHOOK_URL) {
      console.error("N8N_WEBHOOK_URL environment variable not set");
      return createErrorResponse(500, "AI agent configuration missing", "INTERNAL_ERROR");
    }

    console.log("Calling n8n webhook:", N8N_WEBHOOK_URL);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout

    let n8nResponse: Response;
    try {
      n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: userId,
          message: message,
          userProfile: userProfile
        }),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        console.error("n8n webhook timeout");
        return createErrorResponse(502, "AI agent timeout", "AI_AGENT_ERROR");
      }

      console.error("n8n webhook fetch error:", fetchError);
      return createErrorResponse(502, "AI agent unavailable", "AI_AGENT_ERROR");
    }

    clearTimeout(timeoutId);

    if (!n8nResponse.ok) {
      console.error("n8n webhook error:", n8nResponse.status, n8nResponse.statusText);
      return createErrorResponse(502, "AI agent unavailable", "AI_AGENT_ERROR");
    }

    const agentResponse = await n8nResponse.json() as N8NResponse;
    console.log("n8n response received");

    // Step 3: Optionally save plan to DynamoDB
    if (agentResponse.plan) {
      console.log("Saving plan to DynamoDB");
      const planId = `plan-${Date.now()}`;

      await client.send(new PutItemCommand({
        TableName: process.env.PLANS_TABLE_NAME || "savesmart-plans",
        Item: marshall({
          planId: planId,
          userId: userId,
          plan: agentResponse.plan,
          createdAt: new Date().toISOString()
        })
      }));

      console.log("Plan saved:", planId);
    }

    // Step 4: Return response to frontend
    return createResponse(200, {
      reply: agentResponse.reply,
      savings: agentResponse.savings || null,
      plan: agentResponse.plan || null
    });

  } catch (error) {
    console.error("Error in chat handler:", error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return createErrorResponse(400, "Invalid JSON in request body", "VALIDATION_ERROR");
    }

    return createErrorResponse(500, "Internal server error", "INTERNAL_ERROR");
  }
};

import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-2" });

interface ErrorResponse {
  error: string;
  code: string;
  statusCode: number;
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
    // Extract userId from path parameters
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return createErrorResponse(400, "Missing userId parameter", "VALIDATION_ERROR");
    }

    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, "Request body is required", "VALIDATION_ERROR");
    }

    const body = JSON.parse(event.body);

    // Build update expression dynamically
    const updateFields: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const allowedFields = [
      "email", "name", "income", "rent", "groceryBudget", "savings",
      "hasCar", "fuelType", "location", "postcode", "dietaryPreferences", "subscriptions"
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;

        // Handle different data types
        if (typeof body[field] === "number") {
          expressionAttributeValues[`:${field}`] = { N: String(body[field]) };
        } else if (typeof body[field] === "boolean") {
          expressionAttributeValues[`:${field}`] = { BOOL: body[field] };
        } else if (Array.isArray(body[field])) {
          expressionAttributeValues[`:${field}`] = { L: body[field].map((v: any) => ({ S: String(v) })) };
        } else if (body[field] === null) {
          expressionAttributeValues[`:${field}`] = { NULL: true };
        } else {
          expressionAttributeValues[`:${field}`] = { S: String(body[field]) };
        }
      }
    }

    if (updateFields.length === 0) {
      return createErrorResponse(400, "No valid fields to update", "VALIDATION_ERROR");
    }

    // Update DynamoDB
    await client.send(new UpdateItemCommand({
      TableName: process.env.USERS_TABLE_NAME || "savesmart-users",
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: `SET ${updateFields.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }));

    console.log("User updated:", userId);

    return createResponse(200, {
      message: "User updated successfully"
    });

  } catch (error) {
    console.error("Error updating user:", error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return createErrorResponse(400, "Invalid JSON in request body", "VALIDATION_ERROR");
    }

    return createErrorResponse(500, "Internal server error", "INTERNAL_ERROR");
  }
};

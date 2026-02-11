import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
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

    // Fetch from DynamoDB
    const result = await client.send(new GetItemCommand({
      TableName: process.env.USERS_TABLE_NAME || "savesmart-users",
      Key: {
        userId: { S: userId }
      }
    }));

    if (!result.Item) {
      return createErrorResponse(404, "User not found", "USER_NOT_FOUND");
    }

    const user = unmarshall(result.Item);
    console.log("User retrieved:", userId);

    return createResponse(200, user);

  } catch (error) {
    console.error("Error retrieving user:", error);

    return createErrorResponse(500, "Internal server error", "INTERNAL_ERROR");
  }
};

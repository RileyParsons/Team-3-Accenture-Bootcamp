import { DynamoDBClient, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
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

    let plans: any[] = [];

    try {
      // Try to query using GSI (userId-index)
      const result = await client.send(new QueryCommand({
        TableName: process.env.PLANS_TABLE_NAME || "savesmart-plans",
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: userId }
        },
        ScanIndexForward: false // Most recent first
      }));

      plans = result.Items ? result.Items.map(item => unmarshall(item)) : [];
      console.log(`Retrieved ${plans.length} plans for user using GSI:`, userId);

    } catch (error: any) {
      // If GSI doesn't exist, fall back to scan with filter
      if (error.name === "ValidationException" || error.name === "ResourceNotFoundException") {
        console.log("GSI not found, falling back to scan");

        const scanResult = await client.send(new ScanCommand({
          TableName: process.env.PLANS_TABLE_NAME || "savesmart-plans",
          FilterExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": { S: userId }
          }
        }));

        plans = scanResult.Items ? scanResult.Items.map(item => unmarshall(item)) : [];
        console.log(`Retrieved ${plans.length} plans for user using scan:`, userId);
      } else {
        throw error;
      }
    }

    return createResponse(200, plans);

  } catch (error) {
    console.error("Error retrieving plans:", error);

    return createErrorResponse(500, "Internal server error", "INTERNAL_ERROR");
  }
};

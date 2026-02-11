import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-2" });

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  income: number;
  rent: number;
  groceryBudget: number;
  savings: number;
  hasCar: boolean;
  fuelType?: string | null;
  location: string;
  postcode?: string | null;
  dietaryPreferences: string[];
  subscriptions: string[];
  createdAt: string;
}

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
    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, "Request body is required", "VALIDATION_ERROR");
    }

    const body = JSON.parse(event.body);

    // Validate required fields
    const requiredFields = ["userId", "email", "name", "income", "rent", "groceryBudget", "savings", "location"];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return createErrorResponse(400, `Missing required field: ${field}`, "VALIDATION_ERROR");
      }
    }

    // Validate data types
    if (typeof body.income !== "number" || body.income < 0) {
      return createErrorResponse(400, "Income must be a non-negative number", "VALIDATION_ERROR");
    }

    if (typeof body.rent !== "number" || body.rent < 0) {
      return createErrorResponse(400, "Rent must be a non-negative number", "VALIDATION_ERROR");
    }

    if (typeof body.groceryBudget !== "number" || body.groceryBudget <= 0) {
      return createErrorResponse(400, "Grocery budget must be a positive number", "VALIDATION_ERROR");
    }

    if (typeof body.savings !== "number" || body.savings < 0) {
      return createErrorResponse(400, "Savings must be a non-negative number", "VALIDATION_ERROR");
    }

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return createErrorResponse(400, "Invalid email format", "VALIDATION_ERROR");
    }

    // Prepare user object
    const user: UserProfile = {
      userId: body.userId,
      email: body.email,
      name: body.name,
      income: body.income,
      rent: body.rent,
      groceryBudget: body.groceryBudget,
      savings: body.savings,
      hasCar: body.hasCar || false,
      fuelType: body.fuelType || null,
      location: body.location,
      postcode: body.postcode || null,
      dietaryPreferences: body.dietaryPreferences || [],
      subscriptions: body.subscriptions || [],
      createdAt: new Date().toISOString()
    };

    // Write to DynamoDB
    await client.send(new PutItemCommand({
      TableName: process.env.USERS_TABLE_NAME || "savesmart-users",
      Item: marshall(user)
    }));

    console.log("User created:", user.userId);

    return createResponse(200, {
      message: "User created successfully",
      userId: user.userId
    });

  } catch (error) {
    console.error("Error creating user:", error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return createErrorResponse(400, "Invalid JSON in request body", "VALIDATION_ERROR");
    }

    // Handle DynamoDB errors
    if (error instanceof Error && error.name === "ConditionalCheckFailedException") {
      return createErrorResponse(409, "User already exists", "DUPLICATE_USER");
    }

    return createErrorResponse(500, "Internal server error", "INTERNAL_ERROR");
  }
};

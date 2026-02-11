/**
 * updateUser handler
 *
 * Handles user update requests with authentication:
 * - Validates access token
 * - Ensures user can only update their own data
 * - Updates user data excluding password field
 * - Returns updated user data
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateToken } from '../auth/validateToken';
import { TokenService } from '../auth/TokenService';
import { UserRepository } from '../auth/UserRepository';

interface ErrorResponse {
  error: string;
  code?: string;
  statusCode?: number;
}

const createResponse = (statusCode: number, body: object): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

const createErrorResponse = (statusCode: number, error: string, code?: string): APIGatewayProxyResult => {
  const errorBody: ErrorResponse = { error };
  if (code) {
    errorBody.code = code;
    errorBody.statusCode = statusCode;
  }
  return createResponse(statusCode, errorBody);
};

/**
 * Handles PUT /users/{userId} with authentication
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export async function handleUpdateUser(
  event: APIGatewayProxyEvent,
  tokenService: TokenService,
  userRepository: UserRepository
): Promise<APIGatewayProxyResult> {
  try {
    // Apply validateToken middleware
    // Requirements: 8.1, 8.2, 8.3
    const validationResult = validateToken(event, tokenService);

    if (!validationResult.success) {
      return createErrorResponse(
        validationResult.statusCode || 401,
        validationResult.error || 'Unauthorized'
      );
    }

    // Extract userId from token context
    const tokenUserId = validationResult.userId!;

    // Extract requested userId from path parameters
    const requestedUserId = event.pathParameters?.userId;

    if (!requestedUserId) {
      return createErrorResponse(400, "Missing userId parameter", "VALIDATION_ERROR");
    }

    // Return 403 if token userId doesn't match requested userId
    // Requirements: 8.4
    if (tokenUserId !== requestedUserId) {
      return createErrorResponse(403, "Forbidden: You can only update your own data");
    }

    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, "Request body is required", "VALIDATION_ERROR");
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      return createErrorResponse(400, "Invalid JSON in request body", "VALIDATION_ERROR");
    }

    // Validate update payload - don't allow password updates here
    const allowedFields = [
      "email", "name", "income", "incomeFrequency", "savings",
      "location", "postcode", "recurringExpenses"
    ];

    // Check if trying to update password
    if (body.password || body.hashedPassword) {
      return createErrorResponse(400, "Password updates are not allowed through this endpoint", "VALIDATION_ERROR");
    }

    // Filter to only allowed fields
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse(400, "No valid fields to update", "VALIDATION_ERROR");
    }

    // Get current user data
    const currentUser = await userRepository.getUserById(requestedUserId);

    if (!currentUser) {
      return createErrorResponse(404, "User not found", "USER_NOT_FOUND");
    }

    // Update user data via UserRepository
    // Note: For now, we'll use DynamoDB directly since UserRepository doesn't have a generic update method
    // In a production system, we'd add an updateUser method to UserRepository
    const { DynamoDBClient, UpdateItemCommand } = await import("@aws-sdk/client-dynamodb");
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-2" });

    const updateFields: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    for (const [field, value] of Object.entries(updateData)) {
      updateFields.push(`#${field} = :${field}`);
      expressionAttributeNames[`#${field}`] = field;

      // Handle different data types
      if (typeof value === "number") {
        expressionAttributeValues[`:${field}`] = { N: String(value) };
      } else if (typeof value === "boolean") {
        expressionAttributeValues[`:${field}`] = { BOOL: value };
      } else if (Array.isArray(value)) {
        expressionAttributeValues[`:${field}`] = { L: value.map((v: any) => ({ S: String(v) })) };
      } else if (value === null) {
        expressionAttributeValues[`:${field}`] = { NULL: true };
      } else {
        expressionAttributeValues[`:${field}`] = { S: String(value) };
      }
    }

    await client.send(new UpdateItemCommand({
      TableName: process.env.USERS_TABLE_NAME || "savesmart-users",
      Key: {
        userId: { S: requestedUserId }
      },
      UpdateExpression: `SET ${updateFields.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }));

    // Get updated user data
    const updatedUser = await userRepository.getUserById(requestedUserId);

    if (!updatedUser) {
      return createErrorResponse(500, "Failed to retrieve updated user data", "INTERNAL_ERROR");
    }

    // Return updated user data (exclude hashedPassword, resetToken fields)
    const { hashedPassword, resetToken, resetTokenExpiry, ...safeUserData } = updatedUser;

    console.log("User updated:", requestedUserId);

    return createResponse(200, safeUserData);

  } catch (error) {
    console.error("Error updating user:", error);

    return createErrorResponse(500, "Internal server error", "INTERNAL_ERROR");
  }
}

// Legacy handler for backward compatibility
// This will be replaced when the Lambda is updated to use the new handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return createErrorResponse(501, "This endpoint requires authentication. Please update the Lambda configuration.");
};

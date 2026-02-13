#!/bin/bash

# Test meal plan API with a real user
# This creates a test user, generates a meal plan, and tests all operations

BASE_URL="http://localhost:3001/api"

echo "========================================="
echo "Meal Plan API - Full Integration Test"
echo "========================================="
echo ""

# Step 1: Create a test user
echo "Step 1: Creating test user..."
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mealplan-test@example.com",
    "password": "TestPassword123!",
    "name": "Meal Plan Test User"
  }')

echo "User creation response: $USER_RESPONSE"

# Extract userId from response (assuming it returns userId)
USER_ID=$(echo "$USER_RESPONSE" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "❌ Failed to create user or extract userId"
  echo "Trying with a known test user ID instead..."
  USER_ID="test-user-123"
fi

echo "Using User ID: $USER_ID"
echo ""

# Step 2: Generate meal plan
echo "Step 2: Generating meal plan..."
GENERATE_RESPONSE=$(curl -s -X POST "$BASE_URL/meal-plan/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$USER_ID"'",
    "preferences": {
      "allergies": ["Dairy"],
      "calorieGoal": 2000,
      "culturalPreference": "Mediterranean",
      "dietType": "Vegetarian",
      "notes": "I love pasta and vegetables"
    }
  }')

echo "Generate response (first 500 chars):"
echo "$GENERATE_RESPONSE" | head -c 500
echo ""
echo ""

# Step 3: Get meal plan
echo "Step 3: Retrieving meal plan..."
GET_RESPONSE=$(curl -s -X GET "$BASE_URL/meal-plan/$USER_ID")
echo "Get response (first 500 chars):"
echo "$GET_RESPONSE" | head -c 500
echo ""
echo ""

# Step 4: Add a meal (if we have recipes)
echo "Step 4: Testing add meal endpoint..."
ADD_RESPONSE=$(curl -s -X POST "$BASE_URL/meal-plan/$USER_ID/meal" \
  -H "Content-Type: application/json" \
  -d '{
    "day": "Monday",
    "mealType": "snack",
    "recipeId": "recipe-test-1"
  }')
echo "Add meal response (first 300 chars):"
echo "$ADD_RESPONSE" | head -c 300
echo ""
echo ""

# Step 5: Remove a meal
echo "Step 5: Testing remove meal endpoint..."
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/meal-plan/$USER_ID/meal" \
  -H "Content-Type: application/json" \
  -d '{
    "day": "Monday",
    "mealType": "breakfast"
  }')
echo "Delete meal response (first 300 chars):"
echo "$DELETE_RESPONSE" | head -c 300
echo ""
echo ""

echo "========================================="
echo "Integration Test Complete"
echo "========================================="
echo ""
echo "Note: Some operations may fail if:"
echo "  - OpenAI API is not configured"
echo "  - Recipe database is empty"
echo "  - User creation endpoint doesn't exist"
echo ""

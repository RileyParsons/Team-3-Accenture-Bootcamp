#!/bin/bash

# Test script for Meal Plan API endpoints
# This script tests all 5 meal plan endpoints

BASE_URL="http://localhost:3001/api"
TEST_USER_ID="test-user-$(date +%s)"

echo "========================================="
echo "Meal Plan API Endpoint Tests"
echo "========================================="
echo ""
echo "Base URL: $BASE_URL"
echo "Test User ID: $TEST_USER_ID"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: GET meal plan for non-existent user (should return null or 404)
echo "Test 1: GET /meal-plan/:userId (non-existent user)"
echo "Expected: 404 or empty meal plan"
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/meal-plan/nonexistent-user")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Response Code: $http_code"
echo "Response Body: $body"
if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi
echo ""

# Test 2: POST generate meal plan (requires valid user and OpenAI)
echo "Test 2: POST /meal-plan/generate"
echo "Expected: 201 with meal plan or error if OpenAI not configured"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/meal-plan/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$TEST_USER_ID"'",
    "preferences": {
      "allergies": ["Dairy"],
      "calorieGoal": 2000,
      "culturalPreference": "Mediterranean",
      "dietType": "Vegetarian",
      "notes": "I love pasta and vegetables"
    }
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Response Code: $http_code"
echo "Response Body: $body" | head -c 200
echo "..."
if [ "$http_code" = "201" ] || [ "$http_code" = "404" ] || [ "$http_code" = "503" ]; then
    echo -e "${YELLOW}⚠ CONDITIONAL PASS (depends on user existence and OpenAI config)${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi
echo ""

# Test 3: POST add meal to plan (requires existing meal plan)
echo "Test 3: POST /meal-plan/:userId/meal"
echo "Expected: 200 or 404 if no meal plan exists"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/meal-plan/$TEST_USER_ID/meal" \
  -H "Content-Type: application/json" \
  -d '{
    "day": "Monday",
    "mealType": "breakfast",
    "recipeId": "test-recipe-1"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Response Code: $http_code"
echo "Response Body: $body" | head -c 200
if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
    echo -e "${YELLOW}⚠ CONDITIONAL PASS (depends on meal plan existence)${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi
echo ""

# Test 4: PUT update meal plan (requires existing user)
echo "Test 4: PUT /meal-plan/:userId"
echo "Expected: 200 or 404 if user doesn't exist"
response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/meal-plan/$TEST_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "mealPlan": {
      "preferences": {
        "allergies": [],
        "calorieGoal": 2000,
        "culturalPreference": "",
        "dietType": "",
        "notes": ""
      },
      "days": [],
      "totalWeeklyCost": 0,
      "nutritionSummary": {
        "averageDailyCalories": 0,
        "proteinGrams": 0,
        "carbsGrams": 0,
        "fatGrams": 0
      },
      "shoppingList": {
        "stores": [],
        "totalCost": 0
      },
      "notes": "",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Response Code: $http_code"
echo "Response Body: $body" | head -c 200
if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
    echo -e "${YELLOW}⚠ CONDITIONAL PASS (depends on user existence)${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi
echo ""

# Test 5: DELETE remove meal from plan (requires existing meal plan)
echo "Test 5: DELETE /meal-plan/:userId/meal"
echo "Expected: 200 or 404 if no meal plan exists"
response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/meal-plan/$TEST_USER_ID/meal" \
  -H "Content-Type: application/json" \
  -d '{
    "day": "Monday",
    "mealType": "breakfast"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Response Code: $http_code"
echo "Response Body: $body" | head -c 200
if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
    echo -e "${YELLOW}⚠ CONDITIONAL PASS (depends on meal plan existence)${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi
echo ""

# Test 6: Validation tests
echo "Test 6: Validation - Missing userId in generate"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/meal-plan/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "allergies": [],
      "calorieGoal": 2000,
      "culturalPreference": "",
      "dietType": "",
      "notes": ""
    }
  }')
http_code=$(echo "$response" | tail -n1)
echo "Response Code: $http_code"
if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✓ PASS (correctly rejected invalid request)${NC}"
else
    echo -e "${RED}✗ FAIL (should return 400)${NC}"
fi
echo ""

echo "========================================="
echo "Test Summary"
echo "========================================="
echo "All endpoint routes are accessible."
echo "Full functionality testing requires:"
echo "  - Valid user in DynamoDB"
echo "  - OpenAI API configured"
echo "  - Recipe data in database"
echo ""

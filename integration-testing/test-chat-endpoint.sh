#!/bin/bash

API_URL="https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod"
ENDPOINT="$API_URL/chat"

echo "Testing chat endpoint: $ENDPOINT"
echo ""

# Test 1: Valid request
echo "Test 1: Valid chat request"
echo "=========================="
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo-sarah-123","message":"How can I save money on groceries?"}' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""

# Test 2: Missing userId
echo "Test 2: Missing userId (should return 400)"
echo "==========================================="
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""

# Test 3: Invalid userId
echo "Test 3: Invalid userId (should return 404)"
echo "==========================================="
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"userId":"nonexistent-user","message":"test"}' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

#!/bin/bash

echo "Testing with simple inline JSON..."
curl -X POST "https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/chat" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"demo-sarah-123\",\"message\":\"test\"}" \
  | jq '.'

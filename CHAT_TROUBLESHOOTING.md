# Chat Endpoint Troubleshooting

## Current Issue

The chat endpoint is returning:
```json
{
  "statusCode": 400,
  "headers": {"Access-Control-Allow-Origin": "*"},
  "body": "{\"error\":\"Invalid JSON in request body\",\"code\":\"VALIDATION_ERROR\"}"
}
```

This means `JSON.parse(event.body)` is failing in the Lambda function.

## Possible Causes

1. **API Gateway Integration Type Issue**
   - If API Gateway is NOT configured as "Lambda Proxy Integration", the event structure is different
   - Check: API Gateway → Resources → POST /chat → Integration Request → Integration type should be "Lambda Function (proxy)"

2. **Body Already Parsed**
   - Some API Gateway configurations auto-parse JSON
   - The Lambda might be trying to parse an already-parsed object

3. **Character Encoding**
   - Special characters in the request might be causing issues

4. **Old Code Still Deployed**
   - The new code might not have been fully deployed
   - Lambda might be caching the old version

## Diagnostic Steps

### Step 1: Check API Gateway Integration

In AWS Console:
1. Go to API Gateway
2. Find your API (should be named something like "savesmart-api")
3. Click on Resources
4. Find POST /chat
5. Click on "Integration Request"
6. Verify "Integration type" is "Lambda Function" with "Use Lambda Proxy integration" checked

### Step 2: Check Lambda Code

In AWS Console:
1. Go to Lambda
2. Find function "savesmart-chat"
3. Scroll down to "Code source"
4. Verify the code matches what was deployed
5. Look for the line: `const body = JSON.parse(event.body);`

### Step 3: Check CloudWatch Logs

1. Go to CloudWatch → Log groups
2. Find `/aws/lambda/savesmart-chat`
3. Look at the most recent log stream
4. Find the line that says `"Event": {...}`
5. Check what `event.body` actually contains

### Step 4: Test with Lambda Console

In Lambda console:
1. Click "Test" tab
2. Create a test event with this JSON:
```json
{
  "body": "{\"userId\":\"demo-sarah-123\",\"message\":\"test\"}",
  "headers": {
    "Content-Type": "application/json"
  },
  "httpMethod": "POST",
  "path": "/chat"
}
```
3. Click "Test"
4. Check the response

## Quick Fix Options

### Option A: Add Defensive Parsing

Replace this line:
```javascript
const body = JSON.parse(event.body);
```

With this:
```javascript
let body;
try {
  // Try parsing if it's a string
  body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
} catch (e) {
  console.error("Body parsing error:", e);
  console.error("event.body type:", typeof event.body);
  console.error("event.body value:", event.body);
  return {
    statusCode: 400,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
      error: "Invalid JSON in request body",
      code: "VALIDATION_ERROR",
      debug: {
        bodyType: typeof event.body,
        bodyValue: event.body
      }
    })
  };
}
```

This will give us more information about what's actually being received.

### Option B: Check if Body is Already Parsed

Add this at the start of the handler:
```javascript
console.log("event.body type:", typeof event.body);
console.log("event.body:", event.body);
```

Then check CloudWatch logs to see what's being logged.

## Testing Commands

### Test 1: Basic curl
```bash
curl -X POST "https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/chat" \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo-sarah-123","message":"test"}'
```

### Test 2: With file
```bash
echo '{"userId":"demo-sarah-123","message":"test"}' > test.json
curl -X POST "https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/chat" \
  -H "Content-Type: application/json" \
  -d @test.json
```

### Test 3: Verbose output
```bash
curl -v -X POST "https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/chat" \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo-sarah-123","message":"test"}'
```

## Next Steps

1. Check CloudWatch logs to see what `event.body` actually contains
2. Verify API Gateway is configured as Lambda Proxy Integration
3. Add defensive parsing code to get more debug information
4. Test with Lambda console test event to isolate if it's an API Gateway issue

## Contact

If issue persists, share:
- CloudWatch log output showing the event structure
- API Gateway integration type screenshot
- Lambda function code screenshot

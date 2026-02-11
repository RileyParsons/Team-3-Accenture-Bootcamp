# Execution Plan

# **Step-by-Step Execution Guide**

> How to actually build and connect every piece of our website.
> 

---

## **Step 1 — Build the Frontend (React + Next.js)**

### **What We're Doing**

Creating the website the user sees: Home page, Chat page, Profile page, and Onboarding flow.

### **How To Do It**

1. **Create a new Next.js project**
    - Open your terminal and run:
        
        ```bash
        npx create-next-app@latest savesmart-frontend
        ```
        
    - Choose: Yes to TypeScript, Yes to Tailwind CSS, Yes to App Router
    - This creates a folder with everything you need
2. **Set up the pages**
    - Inside `app/` create these folders/files:
        
        ```
        app/
          page.tsx              ← Home/Landing page
          chat/page.tsx         ← Chat interface
          profile/page.tsx      ← User profile & saved plans
          onboarding/page.tsx   ← Onboarding questionnaire
        ```
        
3. **Build the Home Page** (`app/page.tsx`)
    - Hero section: "SaveSmart — Your AI Savings Agent"
    - Explain what it does with example savings
    - "Get Started" button → links to `/onboarding`
4. **Build the Onboarding Page** (`app/onboarding/page.tsx`)
    - A multi-step form asking:
        - Do you live out of home? (yes/no)
        - Monthly income ($)
        - Monthly rent ($)
        - Weekly grocery budget ($)
        - Current savings ($)
        - Car ownership & fuel type
        - Active subscriptions (checkboxes)
        - Dietary/cultural/religious preferences
        - Location (suburb or postcode)
    - On submit → send data to our API (Step 2 below)
    - Redirect to `/chat`
5. **Build the Chat Page** (`app/chat/page.tsx`)
    - Text input at the bottom (like ChatGPT)
    - Messages display area above
    - On page load, show suggested prompts like:
        - "Help me save $3,000 in 6 months"
        - "Find me cheap meals for the week"
        - "Where's the cheapest fuel near me?"
    - When user sends a message:
        - POST to our API endpoint
        - Show a loading spinner
        - Display the agent's response when it comes back
6. **Build the Profile Page** (`app/profile/page.tsx`)
    - Display the user's onboarding answers (editable)
    - Show summaries and info gathered through chatbot conversations
    - Show any saved meal plans or fuel recommendations
7. **Run Locally**
    - In your terminal, from the `savesmart-frontend` folder, run:
        
        ```bash
        npm run dev
        ```
        
    - Open your browser to `http://localhost:3000`
    - The website is now running locally on your machine

### **Key Frontend Environment Variable**

Create a `.env.local` file in your `savesmart-frontend` folder:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

This points to your local backend (you'll set up a local server or use the AWS API Gateway URL later for testing).

---

## **Step 2 — Set Up DynamoDB (The Database)**

### **What We're Doing**

Creating a database table in AWS to store user answers from onboarding questions.

### **How To Do It**

1. **Log into AWS Console**
    - Go to [aws.amazon.com/console](https://aws.amazon.com/console)
    - Sign in with your team's AWS account
2. **Navigate to DynamoDB**
    - In the search bar at the top, type "DynamoDB" and click it
3. **Create the Users Table**
    - Click **"Create table"**
    - Table name: `savesmart-users`
    - Partition key: `userId` (String)
    - Leave everything else as default
    - Click **"Create table"**
    - Wait ~30 seconds for it to become "Active"

### **What Gets Stored**

This table holds the answers from the onboarding questions so the AI agent has context:

**savesmart-users table:**

```json
{
  "userId": "user-abc-123",
  "email": "sarah@uni.edu.au",
  "name": "Sarah",
  "income": 1200,
  "rent": 600,
  "groceryBudget": 80,
  "savings": 500,
  "hasCar": true,
  "fuelType": "E10",
  "location": "Parramatta",
  "dietaryPreferences": ["vegetarian"],
  "culturalPreferences": ["halal"],
  "subscriptions": ["Netflix", "Spotify"],
  "createdAt": "2026-02-11T10:00:00Z"
}
```

---

## **Step 3 — Set Up API Gateway (The Front Door)**

### **What We're Doing**

Creating a public URL that our frontend can talk to. API Gateway receives requests from the website and forwards them to the correct Lambda function.

### **How To Do It**

1. **Navigate to API Gateway**
    - In the AWS search bar, type "API Gateway" and click it
2. **Create a new API**
    - Click **"Create API"**
    - Choose **"REST API"** → Click **"Build"**
    - API name: `savesmart-api`
    - Click **"Create API"**
3. **Create the routes (resources + methods)**
    
    You need these endpoints:
    
    | Method | Path | Purpose | Lambda It Calls |
    | --- | --- | --- | --- |
    | POST | `/users` | Save onboarding answers | savesmart-saveUser |
    | GET | `/users/{userId}` | Get user's onboarding answers | savesmart-getUser |
    | PUT | `/users/{userId}` | Update onboarding answers | savesmart-updateUser |
    | POST | `/chat` | Send chat message to AI | savesmart-chat |
    
    **For each route:**
    
    - Click **"Create Resource"** → enter path (e.g., `users`)
    - Click **"Create Method"** → choose GET/POST/PUT
    - Integration type: **Lambda Function**
    - Select the Lambda function (you'll create these next in Step 4)
4. **Enable CORS** (so the frontend can talk to the API)
    - For each resource, click **"Enable CORS"**
    - Allow origin:  (for development; restrict later)
    - Allow headers: `Content-Type, Authorization`
    - Allow methods: `GET, POST, PUT, OPTIONS`
5. **Deploy the API**
    - Click **"Deploy API"**
    - Stage name: `prod`
    - You'll get a URL like: `https://abc123.execute-api.ap-southeast-2.amazonaws.com/prod`
    - **This is the URL your frontend uses**

---

## **Step 4 — Set Up Lambda Functions (The Brain)**

### **What We're Doing**

Creating the backend functions that process requests. Each function does one job.

### **How To Do It**

1. **Navigate to Lambda**
    - In the AWS search bar, type "Lambda" and click it
2. **Create Lambda: savesmart-saveUser**
    - Click **"Create function"**
    - Function name: `savesmart-saveUser`
    - Runtime: **Node.js 20.x** (or Python 3.12)
    - Click **"Create function"**
    - Paste this code:
    
    ```jsx
    import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
    
    const client = new DynamoDBClient({});
    
    export const handler = async (event) => {
      const body = JSON.parse(event.body);
    
      const params = {
        TableName: "savesmart-users",
        Item: {
          userId: { S: body.userId },
          email: { S: body.email },
          name: { S: body.name },
          income: { N: String(body.income) },
          rent: { N: String(body.rent) },
          groceryBudget: { N: String(body.groceryBudget) },
          location: { S: body.location },
          dietaryPreferences: { S: JSON.stringify(body.dietaryPreferences) },
          subscriptions: { S: JSON.stringify(body.subscriptions) },
          createdAt: { S: new Date().toISOString() }
        }
      };
    
      await client.send(new PutItemCommand(params));
    
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "User saved successfully" })
      };
    };
    ```
    
    - Click **"Deploy"**
3. **Create Lambda: savesmart-chat** (the most important one)
    - Function name: `savesmart-chat`
    - This is the orchestrator. It:
        1. Receives the user's chat message
        2. Reads user's onboarding answers from DynamoDB
        3. Sends both to n8n via webhook
        4. Waits for n8n's response
        5. Returns the response to the frontend
    
    ```jsx
    import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
    
    const client = new DynamoDBClient({});
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    
    export const handler = async (event) => {
      const body = JSON.parse(event.body);
      const { userId, message } = body;
    
      // 1. Get user's onboarding answers from DynamoDB
      const userResult = await client.send(new GetItemCommand({
        TableName: "savesmart-users",
        Key: { userId: { S: userId } }
      }));
    
      const userProfile = userResult.Item;
    
      // 2. Send user message + onboarding answers to n8n
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          message: message,
          userProfile: userProfile
        })
      });
    
      const agentResponse = await n8nResponse.json();
    
      // 3. Return agent's response to frontend
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          reply: agentResponse.reply,
          savings: agentResponse.savings,
          plan: agentResponse.plan
        })
      };
    };
    ```
    
4. **Set the Lambda environment variable**
    - In the Lambda console, go to **Configuration → Environment variables**
    - Add: `N8N_WEBHOOK_URL` = your n8n webhook URL (you'll get this in Step 5)
5. **Give Lambda permission to access DynamoDB**
    - Go to **Configuration → Permissions**
    - Click the role name (opens IAM)
    - Click **"Add permissions" → "Attach policies"**
    - Search for `AmazonDynamoDBFullAccess` and attach it
6. **Increase Lambda timeout**
    - Go to **Configuration → General configuration → Edit**
    - Set timeout to **60 seconds** (AI agents take time)
    - Set memory to **256 MB**
7. **Repeat** for `savesmart-getUser` and `savesmart-updateUser` (simpler — they just read/write DynamoDB)

---

## **Step 5 — Set Up n8n (The AI Agents)**

### **What We're Doing**

Building the AI agent workflows that actually do the smart stuff — call grocery APIs, find fuel prices, check public transport options, find entertainment, and create savings plans.

### **How To Do It**

1. **Set up n8n**
    - **Option A (Cloud — easiest):** Sign up at [n8n.io](https://n8n.io/) — free tier available
    - **Option B (Self-hosted):** Run locally with Docker:
        
        ```bash
        docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
        ```
        
    - Open n8n at `http://localhost:5678` (or your cloud URL)
2. **Create the Main Agent Workflow**
    - Click **"New Workflow"**
    - Name it: `SaveSmart Main Agent`
3. **Add a Webhook Trigger node** (this is how Lambda talks to n8n)
    - Add node → search "Webhook"
    - Method: POST
    - Path: `savesmart-chat`
    - Click **"Test"** to get the webhook URL
    - **Copy this URL** → paste it into your Lambda environment variable (`N8N_WEBHOOK_URL`)
4. **Add an AI Agent node** (Main Orchestrator)
    - Add node → search "AI Agent"
    - Connect it after the Webhook
    - Set the system prompt:
        
        ```
        You are SaveSmart, a personal savings agent for Australian university students.
        You have access to the user's financial information from their onboarding answers.
        Based on their question, decide which tools to use:
        - For grocery questions, meal plans, recipes → use the Grocery tool
        - For fuel prices or public transport costs → use the Transport tool
        - For entertainment, events, things to do → use the Entertainment tool
        - For savings goals or budgeting → use the Financial Planner tool
        Always give specific, actionable advice with real numbers.
        Format responses clearly with bullet points and dollar amounts.
        Consider the user's dietary, cultural, and religious preferences.
        Consider the user's location for all location-based recommendations.
        ```
        
    - Model: Claude Sonnet 4 (via Anthropic API key) or GPT-4o
    - Add your API key in n8n credentials
5. **Build the Grocery Sub-Agent (Tool)**
    - Add a **Tool** node connected to the AI Agent
    - Name: `Grocery Agent`
    - Description: "Looks up Coles and Woolworths prices. Use this for grocery questions, meal plans, shopping lists, and recipe recommendations."
    - Inside this tool, add an **HTTP Request** node:
        - This calls the **Pulse MCP** API
        - URL: The Pulse MCP endpoint for product search
        - Method: GET
        - Query parameters: product name, store
    - The tool should:
        1. Take the user's grocery budget, dietary/cultural/religious preferences, and location
        2. Search current prices and specials from Coles/Woolworths
        3. Recommend recipes based on nutritional values and cultural/religious needs
        4. Build a weekly meal plan that fits the budget
        5. Return: meal plan + shopping list + estimated cost + savings
6. **Build the Transport Sub-Agent (Tool)** — combines fuel AND public transport
    - Add another **Tool** node
    - Name: `Transport Agent`
    - Description: "Handles both fuel prices and public transport. Use this for fuel questions, getting around cheaply, and transport costs to grocery stores or events."
    - This tool has **two functions**:
    
    **Function A — Fuel:**
    
    - Add an **HTTP Request** node:
        - URL: `https://api.nsw.gov.au/v1/fuel/prices/nearby`
        - Method: GET
        - Headers:
            - `apikey`: your FuelCheck API key
            - `Content-Type`: application/json
        - Query parameters:
            - `latitude`: from user's location
            - `longitude`: from user's location
            - `fueltype`: from user's onboarding answers (E10, U91, etc.)
            - `radius`: 5 (km)
        - Return: top 5 cheapest stations with name, address, price, and savings vs average
    
    **Function B — Public Transport (PTV):**
    
    - Add an **HTTP Request** node:
        - This can query public transport APIs or use web search for route costs
        - Helps calculate: "Is it cheaper to drive or take the bus to Coles/the event?"
        - Return: transport options with costs and travel time
    
    **To get a FuelCheck API key:**
    
    - Go to [api.nsw.gov.au](https://api.nsw.gov.au/)
    - Create an account
    - Subscribe to the "Fuel" product
    - Copy your API key
7. **Build the Entertainment Sub-Agent (Tool)**
    - Add another **Tool** node
    - Name: `Entertainment Agent`
    - Description: "Finds free and cheap events and entertainment near the user. Compares prices for paid vs free options."
    - This can use web search or an events API
    - Takes the user's location
    - Return: list of free vs paid events nearby with prices and how to get there
8. **Build the Financial Planner Sub-Agent (Tool)**
    - Add another **Tool** node
    - Name: `Financial Planner`
    - Description: "Creates savings plans and budgets. Use this when users mention savings goals."
    - This is calculation-based (no external API needed)
    - Takes: income, expenses, goal amount, timeline
    - Returns: monthly savings target, budget breakdown, gap analysis
9. **Add a "Respond to Webhook" node at the end**
    - Add node → search "Respond to Webhook"
    - Connect it after the AI Agent
    - This sends the agent's response back to Lambda
    - Set response body to include the agent's output
10. **Test the full workflow**
    - Click **"Test Workflow"**
    - Send a test POST to the webhook URL:
        
        ```json
        {
          "userId": "test-user",
          "message": "Help me save money on groceries, my budget is $60/week",
          "userProfile": {
            "income": 1200,
            "rent": 600,
            "location": "Parramatta",
            "dietaryPreferences": ["vegetarian"]
          }
        }
        ```
        
    - Check each node executed correctly
    - Verify the response makes sense
11. **Activate the workflow**
    - Toggle the workflow to **"Active"** (top right)
    - Now it's live and ready to receive requests from Lambda

---

## **Step 6 — Connect Everything Together**

### **What We're Doing**

Making sure every piece talks to each other properly.

### **Checklist**

1. **Frontend → API Gateway**
    - [ ]  Set `NEXT_PUBLIC_API_URL` in your Vercel environment variables to your API Gateway URL
    - [ ]  Test: open browser console, make a fetch request to `{API_URL}/users` — should not get CORS errors
2. **API Gateway → Lambda**
    - [ ]  Each route in API Gateway points to the correct Lambda function
    - [ ]  Test: use Postman or curl to hit `{API_URL}/chat` with a test message
3. **Lambda → DynamoDB**
    - [ ]  Lambda has `AmazonDynamoDBFullAccess` permission
    - [ ]  Test: call saveUser Lambda — check DynamoDB table for the new record
4. **Lambda → n8n**
    - [ ]  [ ] `N8N_WEBHOOK_URL` environment variable is set in the chat Lambda
    - [ ]  n8n workflow is **Active** (not just saved)
    - [ ]  Test: call chat Lambda — check n8n execution history for the incoming request
5. **n8n → External APIs**
    - [ ]  Pulse MCP credentials are set in n8n
    - [ ]  FuelCheck API key is set in n8n
    - [ ]  PTV / public transport data source configured
    - [ ]  Test: trigger each sub-agent tool manually in n8n
6. **n8n → Lambda (response)**
    - [ ]  "Respond to Webhook" node is connected at the end
    - [ ]  Test: full round trip — send chat message from frontend, get response displayed

---

## **Step 7 — Test the Full Demo Flow**

### **Run Through This Exact Scenario**

1. **Open the website** → see landing page
2. **Click "Get Started"** → go to onboarding
3. **Fill in Sarah's profile:**
    - Lives out of home: Yes
    - Income: $1,200/month
    - Rent: $600/month
    - Grocery budget: $80/week
    - Savings: $500
    - Has car: Yes, fuel type E10
    - Location: Parramatta
    - Dietary: Vegetarian
    - Subscriptions: Netflix, Spotify
4. **Go to chat** → see suggested prompts
5. **Type:** "I want to save $3,000 in 6 months for a Japan trip"
6. **Expect response like:**
    - Required: $500/month
    - Current surplus: ~$200/month
    - Grocery savings: $120/month (with meal plan)
    - Fuel savings: $60/month (cheapest stations)
    - Cancel Netflix: $17/month
    - Reduce eating out: $103/month
    - "Your Japan trip is achievable! Here's your plan..."
7. **Check profile page** → onboarding info + chatbot summaries should appear

### **If Something Breaks**

| Problem | Where to Check | Fix |
| --- | --- | --- |
| Frontend can't reach API | Browser console (Network tab) | Check API Gateway URL and CORS settings |
| API returns 500 error | Lambda CloudWatch Logs | Check Lambda code and permissions |
| n8n doesn't trigger | n8n Execution History | Check webhook URL is correct and workflow is Active |
| No data from grocery API | n8n HTTP Request node | Check Pulse MCP credentials and request format |
| No data from fuel API | n8n HTTP Request node | Check FuelCheck API key and location params |
| No transport data | n8n Transport Agent | Check PTV API config or web search setup |
| DynamoDB empty | AWS DynamoDB console → Items | Check Lambda has write permissions |

---

## **Quick Reference: Where Everything Lives**

| What | Where | URL/Location |
| --- | --- | --- |
| Frontend code | Your GitHub repo | `/savesmart-frontend` |
| Local website | Your machine | `http://localhost:3000` (run `npm run dev`) |
| API Gateway | AWS Console → API Gateway | `https://xxx.execute-api.ap-southeast-2.amazonaws.com/prod` |
| Lambda functions | AWS Console → Lambda | 3 functions starting with `savesmart-` |
| Database | AWS Console → DynamoDB | Table: `savesmart-users` |
| AI Agents | n8n | Workflow: "SaveSmart Main Agent" |
| Grocery data | Pulse MCP | `pulsemcp.com/servers/coles-woolworths` |
| Fuel data | FuelCheck NSW | `api.nsw.gov.au` |
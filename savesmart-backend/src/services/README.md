# Services

This directory contains business logic services for the SaveSmart backend.

## GroceryService

The `GroceryService` provides integration with Coles/Woolworths APIs for product pricing. Falls back to mock data when the API is unavailable or not configured.

### Usage Example

```typescript
import { GroceryService } from './services/grocery.js';

const groceryService = new GroceryService();

// Get price for a specific product
const price = await groceryService.getProductPrice('Spaghetti');
console.log(`Price: $${price}`);

// Search for products
const products = await groceryService.searchProducts('pasta');
products.forEach(product => {
  console.log(`${product.name}: $${product.price} per ${product.unit}`);
});
```

### Features

- **Automatic fallback** to mock data when API is unavailable (Requirement 14.5)
- **Product price lookup** by name (Requirement 10.6)
- **Product search** with query string (Requirement 10.7)
- **Consistent mock prices** for demonstration purposes
- **Error logging** with descriptive messages

### Environment Configuration

Optional `GROCERY_API_KEY` in environment variables. If not provided, the service automatically uses mock data. See `.env.example` for configuration.

## WebhookService

The `WebhookService` provides integration with AI agents for chat, savings plan generation, and meal planning.

### Current Implementation

Currently uses OpenAI API directly as n8n webhooks are temporarily unavailable. The interface is designed to be easily swappable back to n8n webhooks when they become available.

### Usage Example

```typescript
import { WebhookService } from './services/webhooks.js';

const webhookService = new WebhookService();

// Chat with context
const chatResponse = await webhookService.callChatAgent(
  'How can I save money on groceries?',
  {
    pageType: 'recipe',
    dataId: 'recipe-123',
    dataName: 'Pasta Carbonara'
  }
);

// Generate savings plan
const savingsPlan = await webhookService.callSavingsPlanGenerator(
  'user-123',
  {
    income: 5000,
    expenses: {
      rent: 1500,
      food: 600,
      transport: 300
    },
    goals: ['Save for vacation', 'Build emergency fund']
  }
);

// Create meal plan
const mealPlan = await webhookService.callMealPlanningAgent(
  'user-123',
  ['recipe-1', 'recipe-2', 'recipe-3'],
  '2024-01-15'
);
```

### Features

- **30-second timeout** for chat requests (Requirement 3.5)
- **Context-aware messaging** with minimal data transfer (Requirement 4.4)
- **Error handling** with descriptive messages
- **Logging** of all webhook calls (Requirement 14.4)

### Environment Configuration

Requires `OPENAI_API_KEY` in environment variables. See `.env.example` for configuration.

### Future Migration to n8n

When n8n webhooks become available, the implementation can be updated to use HTTP POST requests to webhook URLs while maintaining the same interface:

```typescript
// Future n8n implementation
async callChatAgent(message: string, context?: ChatContext): Promise<string> {
  const response = await axios.post(config.n8n.chatWebhookUrl, {
    message,
    context
  }, {
    timeout: 30000
  });
  return response.data.response;
}
```

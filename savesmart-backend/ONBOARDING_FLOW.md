# Simplified Onboarding Flow

## Goal: Maximum 4 Pages/Forms

The new schema supports a streamlined onboarding experience with flexible recurring expenses.

---

## Page 1: Basic Info (3 fields)
```
📝 Let's get started!

Name: [____________]
Email: [____________]
Location: [____________] (Suburb)
```

---

## Page 2: Income (2 fields)
```
💰 Tell us about your income

How much do you earn? $[______]
How often? [Monthly ▼] (dropdown: Weekly/Monthly/Yearly)
```

---

## Page 3: Recurring Expenses (Dynamic)
```
📊 What are your regular expenses?

Add as many as you need - rent, subscriptions, bills, etc.

[+ Add Expense]

┌─────────────────────────────────────┐
│ Expense: [Rent          ]           │
│ Amount:  $[600          ]           │
│ Frequency: [Monthly ▼]              │
│                            [Remove] │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Expense: [Groceries     ]           │
│ Amount:  $[80           ]           │
│ Frequency: [Weekly  ▼]              │
│                            [Remove] │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Expense: [Netflix       ]           │
│ Amount:  $[16.99        ]           │
│ Frequency: [Monthly ▼]              │
│                            [Remove] │
└─────────────────────────────────────┘

[+ Add Another Expense]
```

**Common Expense Suggestions (optional quick-add buttons):**
- 🏠 Rent
- 🛒 Groceries
- 🚗 Fuel
- 💪 Gym
- 📺 Streaming (Netflix, Spotify, etc.)
- 📱 Phone Bill
- ⚡ Utilities

---

## Page 4: Savings Goal (1 field)
```
🎯 Current Savings

How much do you have saved? $[______]

[Get Started →]
```

---

## Total Questions: 6 core fields + dynamic expenses

### Required Fields:
1. Name
2. Email
3. Location
4. Income amount
5. Income frequency
6. Current savings

### Optional/Dynamic:
- Recurring expenses (user adds as many as needed)
- Postcode (can be auto-filled from location)

---

## API Request Example

After onboarding, the frontend sends:

```json
POST /users
{
  "userId": "user-abc-123",
  "email": "sarah@uni.edu.au",
  "name": "Sarah",
  "income": 1200,
  "incomeFrequency": "monthly",
  "savings": 500,
  "location": "Parramatta",
  "postcode": "2150",
  "recurringExpenses": [
    {
      "name": "Rent",
      "amount": 600,
      "frequency": "monthly"
    },
    {
      "name": "Groceries",
      "amount": 80,
      "frequency": "weekly"
    },
    {
      "name": "Netflix",
      "amount": 16.99,
      "frequency": "monthly"
    },
    {
      "name": "Gym Membership",
      "amount": 25,
      "frequency": "monthly"
    },
    {
      "name": "Fuel",
      "amount": 60,
      "frequency": "weekly"
    }
  ]
}
```

---

## Benefits of New Schema

### 1. Flexible
- Users can add ANY expense (not limited to predefined categories)
- No need to ask about car ownership, fuel type, specific subscriptions

### 2. Scalable
- Easy to add new expenses later
- No schema changes needed for new expense types

### 3. Better UX
- Fewer required fields
- Users only enter what's relevant to them
- Dynamic form feels more natural

### 4. AI-Friendly
- AI agent gets complete expense breakdown
- Can provide more personalized advice
- Easier to calculate total monthly expenses

---

## Frontend Implementation Tips

### Calculating Monthly Total
```javascript
function calculateMonthlyExpenses(recurringExpenses) {
  return recurringExpenses.reduce((total, expense) => {
    const monthlyAmount = expense.frequency === "weekly"
      ? expense.amount * 4.33
      : expense.frequency === "yearly"
      ? expense.amount / 12
      : expense.amount;

    return total + monthlyAmount;
  }, 0);
}
```

### Validating Expenses
```javascript
function validateExpense(expense) {
  return (
    expense.name &&
    expense.name.trim().length > 0 &&
    expense.amount > 0 &&
    ["weekly", "monthly", "yearly"].includes(expense.frequency)
  );
}
```

---

## Migration from Old Schema

If you have existing data with the old schema, you can convert it:

```javascript
function migrateUserData(oldUser) {
  const recurringExpenses = [];

  // Convert rent
  if (oldUser.rent) {
    recurringExpenses.push({
      name: "Rent",
      amount: oldUser.rent,
      frequency: "monthly"
    });
  }

  // Convert groceries
  if (oldUser.groceryBudget) {
    recurringExpenses.push({
      name: "Groceries",
      amount: oldUser.groceryBudget,
      frequency: "weekly"
    });
  }

  // Convert subscriptions
  if (oldUser.subscriptions) {
    oldUser.subscriptions.forEach(sub => {
      recurringExpenses.push({
        name: sub,
        amount: 0, // Would need to be filled in
        frequency: "monthly"
      });
    });
  }

  return {
    userId: oldUser.userId,
    email: oldUser.email,
    name: oldUser.name,
    income: oldUser.income,
    incomeFrequency: "monthly", // Assume monthly
    savings: oldUser.savings,
    location: oldUser.location,
    postcode: oldUser.postcode,
    recurringExpenses: recurringExpenses
  };
}
```

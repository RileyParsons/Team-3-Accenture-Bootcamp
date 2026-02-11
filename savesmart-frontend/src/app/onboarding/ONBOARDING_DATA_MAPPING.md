# Onboarding Form - Data Mapping

## Questions Asked vs Data Captured

### ✅ Step 1: Welcome & Location (Optional)
**Questions:**
- Welcome message with user's first name (from signup)
- Optional: City/Suburb OR Postcode

**Data Captured:**
```json
{
  "name": "Sarah Smith",
  "location": "Parramatta",
  "postcode": "2150"
}
```

**Note:** Name comes from signup (firstName + lastName). Location is optional to help find local deals.

### ✅ Step 2: Living Situation
**Questions:**
- Do you live out of home? (Yes/No)
- If yes: Rent amount + frequency (weekly/fortnightly/monthly)

**Data Captured:**
```json
{
  "recurringExpenses": [
    {
      "name": "Rent",
      "amount": 150,
      "frequency": "weekly",
      "isFixed": true
    }
  ]
}
```

### ✅ Step 2: Living Situation
**Questions:**
- Income amount
- Income frequency (weekly/fortnightly/monthly)

**Data Captured:**
```json
{
  "income": 1200,
  "incomeFrequency": "monthly"
}
```

### ✅ Step 3: Income
**Questions:**
- Weekly grocery spending

**Data Captured:**
```json
{
  "recurringExpenses": [
    {
      "name": "Groceries",
      "amount": 80,
      "frequency": "weekly",
      "isFixed": false
    }
  ]
}
```

### ✅ Step 4: Grocery Budget
**Questions:**
- Total savings amount

**Data Captured:**
```json
{
  "savings": 1500
}
```

### ✅ Step 5: Current Savings
**Questions:**
- Phone Bill (amount + frequency + type)
- Internet (amount + frequency + type)
- Fuel (amount + frequency + type)
- Custom expenses (user can add more)

**Data Captured:**
```json
{
  "recurringExpenses": [
    {
      "name": "Phone Bill",
      "amount": 50,
      "frequency": "monthly",
      "isFixed": true
    },
    {
      "name": "Internet",
      "amount": 60,
      "frequency": "monthly",
      "isFixed": true
    },
    {
      "name": "Fuel",
      "amount": 40,
      "frequency": "weekly",
      "isFixed": false
    }
  ]
}
```

### ✅ Step 6: Recurring Costs

```json
{
  "userId": "test-1770781580779",
  "email": "test@example.com",
  "name": "Test User",
  "income": 1200,
  "incomeFrequency": "monthly",
  "savings": 1500,
  "location": "Sydney",
  "postcode": null,
  "recurringExpenses": [
    {
      "name": "Rent",
      "amount": 150,
      "frequency": "weekly",
      "isFixed": true
    },
    {
      "name": "Groceries",
      "amount": 80,
      "frequency": "weekly",
      "isFixed": false
    },
    {
      "name": "Phone Bill",
      "amount": 50,
      "frequency": "monthly",
      "isFixed": true
    },
    {
      "name": "Internet",
      "amount": 60,
      "frequency": "monthly",
      "isFixed": true
    },
    {
      "name": "Fuel",
      "amount": 40,
      "frequency": "weekly",
      "isFixed": false
    }
  ],
  "createdAt": "2026-02-11T03:46:20.780Z"
}
```

---

## Complete User Profile Schema

```json
{
  "hashedPassword": "$2b$10$...",
  "resetToken": null,
  "resetTokenExpiry": null
}
```

---

## Data Coverage Analysis

### ✅ Fully Captured:
- Name (from signup: firstName + lastName)
- Income (amount + frequency)
- Savings
- Rent (if applicable)
- Groceries
- Phone Bill
- Internet
- Fuel
- Custom recurring expenses
- Location (optional - user provided)
- Postcode (optional - user provided)

### ⚠️ No Longer Hardcoded:
- **Location**: Now asked in Step 1 (optional)
- **Postcode**: Now asked in Step 1 (optional)

### ❌ Not Captured (But in Old Schema):
- Car ownership (hasCar) - can be inferred from Fuel expense
- Fuel type (E10, U91, etc.) - not asked
- Dietary preferences - not asked
- Subscriptions - now part of recurringExpenses

---

## Recommendations

### 1. Location Integration (Future Enhancement)
Consider adding Google Maps autocomplete for location/postcode in the future for better accuracy.

### 2. Consider Adding (Optional):
- Savings goal (amount + timeframe) - currently not saved
- Dietary preferences (for grocery recommendations)
- Fuel type (for fuel price recommendations)

### 3. Data Validation
All required fields are being captured:
- ✅ userId
- ✅ email
- ✅ name
- ✅ income + incomeFrequency
- ✅ savings
- ✅ recurringExpenses (array)
- ✅ location (hardcoded)
- ✅ createdAt (auto-generated)

---

## Migration Notes

### Old Schema → New Schema Mapping:

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `rent` | `recurringExpenses[name="Rent"]` | Now part of expenses array |
| `groceryBudget` | `recurringExpenses[name="Groceries"]` | Now part of expenses array |
| `hasCar` | Inferred from Fuel expense | Not stored directly |
| `fuelType` | Not captured | Removed from schema |
| `dietaryPreferences` | Not captured | Removed from schema |
| `subscriptions` | `recurringExpenses` | Now part of expenses array |
| N/A | `incomeFrequency` | New field added |
| N/A | `recurringExpenses[].isFixed` | New field added |


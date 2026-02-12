# SaveSmart Signup Flow

## Updated Flow (POST Request After Onboarding)

The signup flow has been refactored so that user registration happens AFTER onboarding is completed, not during the initial signup page.

## Flow Diagram

```
┌─────────────┐
│   Signup    │
│    Page     │
└──────┬──────┘
       │
       │ 1. Collect credentials
       │    - Email
       │    - Password
       │    - First Name
       │    - Last Name
       │
       │ 2. Store temporarily in localStorage
       │    Key: 'savesmart_temp_signup'
       │
       ▼
┌─────────────┐
│ Onboarding  │
│    Page     │
└──────┬──────┘
       │
       │ 3. Collect profile data
       │    - Income & frequency
       │    - Rent (if applicable)
       │    - Grocery budget
       │    - Savings
       │    - Location
       │    - Recurring expenses
       │
       │ 4. On final step submission:
       │    - Get temp signup data
       │    - Hash password
       │    - Combine with profile data
       │    - POST to /test_users
       │
       │ 5. Store user data in localStorage
       │    Key: 'savesmart_user'
       │
       │ 6. Clear temp signup data
       │    Remove: 'savesmart_temp_signup'
       │
       ▼
┌─────────────┐
│  Meal Plan  │
│    Page     │
└──────┬──────┘
       │
       │ 7. Collect dietary preferences
       │    - Allergies
       │    - Calorie goal
       │    - Cultural preference
       │    - Diet type
       │
       │ 8. Generate meal plan (future API)
       │
       ▼
┌─────────────┐
│    Chat     │
│    Page     │
└─────────────┘
```

## Data Storage

### Step 1: Signup Page

**Stored in:** `localStorage['savesmart_temp_signup']`

```json
{
  "email": "user@example.com",
  "password": "plaintext_password",
  "firstName": "John",
  "lastName": "Doe",
  "name": "John Doe",
  "signupDate": "2026-02-12T10:30:00.000Z"
}
```

**Note:** Password is stored in plaintext temporarily. It will be hashed during the POST request.

### Step 2: Onboarding Completion

**POST Request to:** `/test_users`

```json
{
  "userId": "user-example-com",
  "email": "user@example.com",
  "name": "John Doe",
  "hashedPassword": "hashed_password_string",
  "income": 1200,
  "incomeFrequency": "monthly",
  "savings": 500,
  "location": "Parramatta",
  "postcode": "2150",
  "recurringExpenses": [
    {
      "name": "Rent",
      "amount": 600,
      "frequency": "weekly",
      "isFixed": true
    },
    {
      "name": "Groceries",
      "amount": 80,
      "frequency": "weekly",
      "isFixed": false
    }
  ]
}
```

**Stored in:** `localStorage['savesmart_user']`

```json
{
  "userId": "user-example-com",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "name": "John Doe",
  "createdAt": "2026-02-12T10:35:00.000Z"
}
```

**Stored in:** `localStorage['savesmart_authenticated']`

```
"true"
```

**Removed:** `localStorage['savesmart_temp_signup']` (cleared after successful registration)

## Code Changes

### 1. Signup Page (`src/app/auth/signup/page.tsx`)

**Before:**
- Called `registerUser()` API function
- Sent POST request to `/test_users`
- Redirected to `/onboarding`

**After:**
- Stores credentials in `localStorage['savesmart_temp_signup']`
- No API call
- Redirects to `/onboarding`

### 2. Onboarding Page (`src/app/onboarding/page.tsx`)

**Before:**
- Retrieved user data from `localStorage['savesmart_user']`
- Sent profile data to `/test_users`
- Redirected to `/chat`

**After:**
- Retrieves temp signup data from `localStorage['savesmart_temp_signup']`
- Calls `registerUser()` with email, password, name, and profile data
- Sends complete user data (credentials + profile) to `/test_users`
- Stores user data in `localStorage['savesmart_user']`
- Clears `localStorage['savesmart_temp_signup']`
- Redirects to `/meal-plan`

### 3. API Functions (`src/lib/api.ts`)

**Updated `registerUser()` function:**

```typescript
export const registerUser = async (
    email: string,
    password: string,
    name: string,
    profileData?: {
        income?: number;
        incomeFrequency?: string;
        savings?: number;
        location?: string | null;
        postcode?: string | null;
        recurringExpenses?: any[];
    }
): Promise<SaveUserResponse | null>
```

**Changes:**
- Added optional `profileData` parameter
- Changed userId generation from random to email-based
- Includes profile data in POST request if provided

## Benefits of This Approach

1. **Single API Call:** Only one POST request to create user with complete data
2. **Better UX:** User doesn't wait for API during signup, only after providing all info
3. **Data Integrity:** All user data (credentials + profile) saved together
4. **Atomic Operation:** Either everything succeeds or nothing is saved
5. **Cleaner Flow:** Signup → Onboarding → Registration → Meal Plan → Chat

## Security Considerations

### Temporary Password Storage

**Risk:** Password stored in plaintext in localStorage temporarily

**Mitigation:**
- Password is only in localStorage for a few minutes (during onboarding)
- Cleared immediately after successful registration
- localStorage is origin-specific (not accessible by other sites)
- User is on the same device/browser throughout the flow

**Alternative (More Secure):**
If security is a concern, consider:
1. Hash password on signup page before storing
2. Store only the hash in localStorage
3. Send hash directly to backend (backend doesn't re-hash)

### Implementation for Alternative:

```typescript
// In signup page
const hashedPassword = await hashPassword(formData.password);
localStorage.setItem('savesmart_temp_signup', JSON.stringify({
  ...tempSignupData,
  hashedPassword, // Store hash instead of plaintext
  password: undefined // Don't store plaintext
}));

// In onboarding page
const result = await registerUser(
  tempSignup.email,
  tempSignup.hashedPassword, // Pass hash directly
  profile.name.trim() || tempSignup.name,
  profileData,
  true // Flag to indicate password is already hashed
);
```

## Error Handling

### Scenario 1: User Closes Browser During Onboarding

**Result:** Temp signup data remains in localStorage

**Solution:** Add cleanup logic or expiration check

```typescript
// Check if temp signup is expired (e.g., > 1 hour old)
const tempSignup = JSON.parse(localStorage.getItem('savesmart_temp_signup'));
const signupDate = new Date(tempSignup.signupDate);
const now = new Date();
const hoursSinceSignup = (now - signupDate) / (1000 * 60 * 60);

if (hoursSinceSignup > 1) {
  localStorage.removeItem('savesmart_temp_signup');
  router.push('/auth/signup');
}
```

### Scenario 2: API Fails During Onboarding Submission

**Result:** User sees error message, stays on onboarding page

**Solution:** User can retry submission, temp data still available

### Scenario 3: User Navigates Directly to Onboarding Without Signup

**Result:** No temp signup data found

**Solution:** Error message shown, redirect to signup

```typescript
if (!tempSignupStr) {
  throw new Error('Signup data not found. Please sign up first.');
}
```

## Testing Checklist

- [ ] Complete signup → onboarding → meal plan flow
- [ ] Verify temp signup data stored correctly
- [ ] Verify temp signup data cleared after registration
- [ ] Verify user data stored in localStorage after registration
- [ ] Verify POST request includes all data (credentials + profile)
- [ ] Test error handling when temp signup data missing
- [ ] Test error handling when API fails
- [ ] Verify password is hashed before sending to backend
- [ ] Test login with newly created account
- [ ] Verify user can access chat page after registration

## Future Enhancements

1. **Add expiration to temp signup data** (auto-cleanup after 1 hour)
2. **Hash password on signup page** (more secure)
3. **Add progress indicator** showing user is on step 2 of 3
4. **Add "Save and Continue Later"** feature (email magic link)
5. **Add email verification** before allowing full access
6. **Add session timeout** for security
7. **Add "Resume Onboarding"** if user returns with temp data

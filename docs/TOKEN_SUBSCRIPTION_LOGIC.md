
# Token & Subscription System Documentation

## Overview
The application uses a dual-token system combining monthly worksheet allowances with purchasable tokens, designed to maximize value for users while providing flexible payment options.

## Core Concepts

### Account Types
1. **Anonymous Users**: Can generate worksheets for free, must pay $1 per download session
2. **Registered Users**: Get automatic download unlock + token/subscription benefits
3. **Free Demo**: 2 free tokens on signup, no monthly allowance
4. **Side-Gig Plan**: 15 monthly worksheets + rollover system
5. **Full-Time Plans**: 30-120 monthly worksheets + rollover system

## Token Consumption Logic

### Priority Order (Critical Implementation Detail)
```
1. Monthly worksheet allowance (if available)
2. Available tokens (purchased + rollover)
3. Block generation if insufficient resources
```

### Database Fields
- `monthly_worksheet_limit`: Plan allowance (15, 30, 60, 90, 120)
- `monthly_worksheets_used`: Current month consumption
- `available_tokens`: Purchased tokens + rollover tokens
- `rollover_tokens`: Carried forward from unused monthly allowances
- `total_worksheets_created`: Lifetime counter (excludes first 2 demo)

### Monthly Worksheet Calculation
```sql
monthly_remaining = monthly_worksheet_limit - monthly_worksheets_used
can_use_monthly = monthly_remaining > 0
```

### Token Availability Check
```sql
total_available = available_tokens + (
  CASE WHEN monthly_worksheets_used < monthly_worksheet_limit 
  THEN (monthly_worksheet_limit - monthly_worksheets_used) 
  ELSE 0 END
)
```

## Rollover System

### Automatic Rollover Process
- **When**: At billing cycle renewal
- **What**: Unused monthly worksheets → rollover tokens
- **Calculation**: `rollover_tokens += (monthly_limit - monthly_used)`
- **Reset**: `monthly_worksheets_used = 0`

### Token Integration
- **Available tokens** = purchased tokens + rollover tokens
- **Usage priority**: Purchased tokens used before rollover tokens
- **Expiration**: Rollover tokens never expire

## Download Access Control

### Anonymous Users
- **Generation**: Free, unlimited
- **Download**: Requires $1 payment per session (~24 hours)
- **Session storage**: Uses `downloadToken` and `downloadTokenExpiry`
- **No auto-unlock**: Must pay regardless of worksheet source

### Registered Users
- **Auto-unlock condition**: Valid `userId` (not null, not 'anonymous')
- **Session duration**: Long-term (1 year token)
- **No payment required**: Downloads automatically available

### Critical Security Check
```typescript
// In useDownloadStatus.tsx
const checkTokenGeneratedWorksheet = (worksheetId: string, userId?: string) => {
  if (!userId || userId === 'anonymous') {
    console.log('❌ No valid userId - anonymous user must pay');
    return; // Prevents auto-unlock for anonymous users
  }
  // Auto-unlock for authenticated users only
};
```

## Database Operations

### Worksheet Generation (`consume_token`)
```sql
-- Check monthly allowance first
IF monthly_worksheets_used < monthly_worksheet_limit THEN
  UPDATE profiles SET monthly_worksheets_used = monthly_worksheets_used + 1
ELSE
  -- Use available tokens
  UPDATE profiles SET available_tokens = available_tokens - 1
END IF;

-- Always increment total (excluding first 2 demo worksheets)
UPDATE profiles SET total_worksheets_created = total_worksheets_created + 1
WHERE total_worksheets_created >= 2;
```

### Subscription Renewal
```sql
-- Calculate rollover from unused monthly worksheets
rollover_amount = monthly_worksheet_limit - monthly_worksheets_used;

-- Add to available tokens
UPDATE profiles SET 
  available_tokens = available_tokens + rollover_amount,
  rollover_tokens = rollover_tokens + rollover_amount,
  monthly_worksheets_used = 0;
```

## Payment Integration

### Stripe Subscription Flow
1. **Plan selection**: Side-gig or Full-time variants
2. **Checkout creation**: Via `create-subscription` edge function
3. **Webhook processing**: Updates subscription status and tokens
4. **Profile sync**: Automatic token and limit updates

### One-time Payments (Anonymous Downloads)
1. **Export payment**: Via `create-export-payment` edge function
2. **Session creation**: 24-hour download window
3. **Payment verification**: Via `verify-export-payment` edge function
4. **Access unlock**: Both Student and Teacher versions

## User Interface Integration

### Token Display Logic
```typescript
// Profile page
const availableTokens = profile?.available_tokens || 0;
const rolloverTokens = profile?.rollover_tokens || 0;
const totalWorksheetsCreated = profile?.total_worksheets_created || 0;

// Dashboard stats
const tokenLeft = hasActiveSubscription ? 
  availableTokens + monthlyRemaining : 
  availableTokens;
```

### Download Button States
```typescript
// Anonymous users: Always locked until payment
const isLocked = !isDownloadUnlocked;

// Registered users: Always unlocked
const isLocked = false;
```

## Edge Cases & Considerations

### Demo Worksheets (First 2)
- **Not counted** toward `total_worksheets_created`
- **Still consume** monthly allowance or tokens
- **Purpose**: Allow new users to test without penalty

### Anonymous vs Registered Detection
- **Critical**: Must distinguish between `null` and `'anonymous'` userId
- **Anonymous**: `userId === null` or `userId === 'anonymous'`
- **Registered**: `userId` is valid UUID string

### Subscription Cancellation
- **Access**: Continues until period end
- **Token preservation**: Available tokens remain
- **Rollover**: Final unused monthly worksheets roll over

### Error Handling
- **Insufficient tokens**: Show upgrade modal for registered users
- **Payment failures**: Clear session storage, retry payment
- **Auth failures**: Redirect to login with proper error messages

## Monitoring & Analytics

### Key Metrics
- `total_worksheets_created`: Lifetime usage per user
- `monthly_worksheets_used`: Current month consumption
- Conversion rate: Anonymous → registered users
- Payment success rate: $1 download payments

### Database Triggers
- Auto-increment counters on worksheet generation
- Validation of token consumption logic
- Audit trail for subscription changes

*This document reflects the current implementation as of the latest system updates.*

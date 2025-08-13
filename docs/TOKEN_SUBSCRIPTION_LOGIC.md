
# Token & Subscription System Documentation - ETAP 2

## Overview
The application implements a comprehensive account-based system with subscription plans and token management. Anonymous generation has been removed - all users must create accounts to generate worksheets.

## Core Concepts - ETAP 2

### Account Requirements
- **Registration mandatory**: All worksheet generation requires user account
- **Email verification**: Required for full feature access
- **Student management**: Must add students before generating worksheets
- **Automatic download unlock**: Registered users get immediate download access

### Account Types
1. **Free Demo Plan**: 2 free tokens on signup, no monthly allowance
2. **Side-Gig Plan**: 15 monthly worksheets + rollover system ($9/month)
3. **Full-Time Plans**: 30-120 monthly worksheets + rollover system ($19-79/month)

## Token Consumption Logic

### Priority Order (Critical Implementation Detail)
```
1. Monthly worksheet allowance (if available and > 0)
2. Available tokens (purchased + rollover)
3. Block generation if insufficient resources
```

### Database Fields
- `monthly_worksheet_limit`: Plan allowance (0, 15, 30, 60, 90, 120)
- `monthly_worksheets_used`: Current month consumption
- `available_tokens`: Purchased tokens + rollover tokens
- `rollover_tokens`: Carried forward from unused monthly allowances
- `total_worksheets_created`: Lifetime counter (excludes first 2 demo)

### Monthly Worksheet Calculation
```sql
monthly_remaining = monthly_worksheet_limit - monthly_worksheets_used
can_use_monthly = monthly_remaining > 0 AND monthly_worksheet_limit > 0
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
- **Usage priority**: Monthly allowance → purchased tokens → rollover tokens
- **Expiration**: Rollover tokens and purchased tokens never expire

## Worksheet Generation Requirements - ETAP 2

### Prerequisites
1. **Valid user account** with confirmed email
2. **At least one student** added to account
3. **Sufficient resources** (monthly worksheets or tokens)
4. **Student selection** during generation process

### Generation Flow
```typescript
// Check authentication
if (!user || !user.email_confirmed_at) {
  redirect_to_login();
  return;
}

// Check student requirement
if (students.length === 0) {
  show_add_student_prompt();
  return;
}

// Check resource availability
if (monthly_remaining > 0) {
  consume_monthly_worksheet();
} else if (available_tokens > 0) {
  consume_token();
} else {
  show_upgrade_modal();
  return;
}
```

## Download Access Control - ETAP 2

### Registered Users (All Users in ETAP 2)
- **Auto-unlock condition**: Valid authenticated user
- **No payment required**: Downloads included with account
- **Immediate access**: Both Student and Teacher versions
- **Persistent access**: Re-download anytime

### Download Process
```typescript
// All authenticated users get downloads automatically
const canDownload = !!user?.id && user.email_confirmed_at;
```

## Subscription Management

### Plan Upgrade Logic
```typescript
// Immediate effect for upgrades
const upgradePrice = (newPlan.price - currentPlan.price) * remainingDays / totalDays;
const upgradeTokens = Math.max(0, currentPlan.tokens - newPlan.tokens);
```

### Plan Downgrade Logic
```typescript
// Effective at next billing cycle
const rolloverAmount = monthly_worksheet_limit - monthly_worksheets_used;
// Unused worksheets become rollover tokens
```

## Database Operations

### Account Creation (`on_signup`)
```sql
INSERT INTO profiles (
  id, 
  available_tokens, 
  monthly_worksheet_limit,
  subscription_type
) VALUES (
  NEW.id, 
  2, -- Free tokens
  0, -- No monthly limit for free
  'free'
);
```

### Worksheet Generation (`consume_token`)
```sql
-- Check monthly allowance first
IF monthly_worksheets_used < monthly_worksheet_limit AND monthly_worksheet_limit > 0 THEN
  UPDATE profiles SET 
    monthly_worksheets_used = monthly_worksheets_used + 1,
    total_worksheets_created = CASE 
      WHEN total_worksheets_created >= 2 THEN total_worksheets_created + 1
      ELSE total_worksheets_created + 1
    END
ELSE
  -- Use available tokens
  UPDATE profiles SET 
    available_tokens = available_tokens - 1,
    total_worksheets_created = CASE 
      WHEN total_worksheets_created >= 2 THEN total_worksheets_created + 1
      ELSE total_worksheets_created + 1
    END
END IF;
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

## User Interface Integration

### Dashboard Requirements
- **Student management**: Add/edit students before generation
- **Resource display**: Clear token and monthly worksheet counters
- **Generation access**: Direct links from student cards
- **History tracking**: Per-student worksheet organization

### Token Display Logic
```typescript
const monthlyRemaining = Math.max(0, 
  (profile?.monthly_worksheet_limit || 0) - (profile?.monthly_worksheets_used || 0)
);
const availableTokens = profile?.available_tokens || 0;
const totalAvailable = monthlyRemaining + availableTokens;
```

### Generation Button States
```typescript
const canGenerate = totalAvailable > 0 && students.length > 0;
const buttonText = !students.length 
  ? "Add Student First" 
  : totalAvailable === 0 
    ? "Upgrade Plan" 
    : "Generate Worksheet";
```

## Error Handling & User Experience

### Student Requirement
- **No students**: Show "Add Student" prompt before generation
- **Student selection**: Required dropdown in generator form
- **Auto-fill**: Student level and goals populate automatically

### Resource Depletion
- **No resources**: Show subscription upgrade modal
- **Clear messaging**: Exact costs and benefits of each plan
- **Immediate upgrade**: Prorated billing for instant access

### Generation Failures
- **Form preservation**: All input data retained on error
- **No token consumption**: Failed generations don't use resources
- **Retry capability**: Users can attempt generation again

## Security & Data Protection

### Account Verification
- **Email confirmation**: Required for full access
- **Password requirements**: Secure authentication
- **Session management**: Proper token handling

### Data Ownership
- **User worksheets**: Fully owned by account holder
- **Student data**: Private to account owner
- **Commercial use**: Permitted for all generated content

## Monitoring & Analytics - ETAP 2

### Key Metrics
- **User registration**: Account creation rate
- **Email confirmation**: Verification completion rate
- **Student addition**: Time to first student
- **First generation**: Time to first worksheet
- **Subscription conversion**: Free to paid transitions

### Usage Tracking
- `total_worksheets_created`: Lifetime per-user generation
- `monthly_worksheets_used`: Current billing cycle usage
- Student worksheet assignment and history

*This document reflects the ETAP 2 implementation - MVP Accounts and Subscriptions with mandatory authentication and student management.*

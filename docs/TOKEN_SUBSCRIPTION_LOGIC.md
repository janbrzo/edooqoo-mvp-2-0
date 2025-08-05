# Token and Subscription System Documentation

## Overview
This document describes the comprehensive token and subscription system for the edooqoo worksheet generator application, including all subscription lifecycle events and token management logic.

## Core Principles

### Token Management
- **Single Token Pool**: All tokens are stored in `available_tokens` field
- **Token Freezing**: Tokens can be frozen but never deleted
- **No Token Expiration**: Tokens never expire, only get frozen/unfrozen
- **Cumulative System**: Tokens accumulate over time from various sources

### Subscription Lifecycle
- **Stripe as Source of Truth**: All subscription data originates from Stripe
- **Supabase Replication**: Local copy with additional business logic
- **Webhook Synchronization**: Real-time updates via Stripe webhooks
- **Upgrade/Downgrade**: Uses `subscription.update()` preserving renewal dates

## Database Schema

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  available_tokens INTEGER DEFAULT 2,
  is_tokens_frozen BOOLEAN DEFAULT FALSE,
  subscription_type TEXT DEFAULT 'Free Demo',
  subscription_status TEXT DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  
  -- Historical data for analysis
  rollover_tokens INTEGER DEFAULT 0,
  monthly_worksheet_limit INTEGER DEFAULT 0,
  monthly_worksheets_used INTEGER DEFAULT 0,
  
  -- Cumulative statistics
  total_worksheets_created INTEGER DEFAULT 0,
  total_tokens_consumed INTEGER DEFAULT 0,
  total_tokens_received INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  monthly_limit INTEGER NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Subscription Events Table
```sql
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id),
  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'renewed', 'cancelled', 'expired'
  event_data JSONB,
  stripe_event_id TEXT,
  old_plan_type TEXT,
  new_plan_type TEXT,
  tokens_added INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Subscription Plans

### Available Plans
- **Free Demo**: 2 initial tokens, no monthly limit
- **Side-Gig**: $9/month, 15 tokens on purchase + 15 tokens monthly
- **Full-Time 30**: $19/month, 30 tokens on purchase + 30 tokens monthly
- **Full-Time 60**: $39/month, 60 tokens on purchase + 60 tokens monthly
- **Full-Time 90**: $59/month, 90 tokens on purchase + 90 tokens monthly
- **Full-Time 120**: $79/month, 120 tokens on purchase + 120 tokens monthly

## Token Logic Rules

### 1. Account Creation
```
New user registration:
- available_tokens = 2 (free demo tokens)
- is_tokens_frozen = FALSE
- subscription_type = 'Free Demo'
- Can use tokens WITHOUT subscription
```

### 2. Available Tokens Calculation
```javascript
const getAvailableTokens = (profile) => {
  if (profile.is_tokens_frozen) {
    return 0; // Tokens frozen - not available for use
  }
  return profile.available_tokens; // All tokens available
};
```

### 3. Token Consumption
```
Pre-consumption check:
1. is_tokens_frozen === FALSE
2. available_tokens > 0

If both TRUE:
- available_tokens -= 1
- total_tokens_consumed += 1
- Log consumption in token_transactions

If either FALSE:
- Show paywall (subscription/upgrade prompt)
```

## Subscription Workflows

### New Subscription Purchase
1. **User Action**: Select plan and complete Stripe checkout
2. **Stripe**: Creates new subscription, sends webhook
3. **Supabase Updates**:
   ```javascript
   available_tokens += plan_tokens
   subscription_type = plan_name
   subscription_status = 'active'
   subscription_expires_at = current_period_end
   is_tokens_frozen = FALSE
   total_tokens_received += plan_tokens
   ```
4. **Event Log**: Record 'created' event in subscription_events

### Upgrade Subscription
1. **User Action**: Select higher plan
2. **Stripe**: Uses `subscription.update()` - preserves renewal date
3. **Immediate Charge**: Prorated amount for upgrade
4. **Supabase Updates**:
   ```javascript
   token_difference = new_plan_tokens - old_plan_tokens
   available_tokens += token_difference
   subscription_type = new_plan_name
   // subscription_expires_at UNCHANGED
   total_tokens_received += token_difference
   ```
5. **Event Log**: Record 'upgraded' event with token difference

### Downgrade Subscription
1. **User Action**: Select lower plan
2. **Stripe**: Uses `subscription.update()` - preserves renewal date
3. **Future Billing**: Lower price at next renewal
4. **Supabase Updates**:
   ```javascript
   // available_tokens UNCHANGED (user keeps existing tokens)
   subscription_type = new_plan_name
   // subscription_expires_at UNCHANGED
   ```
5. **Event Log**: Record 'downgraded' event

### Monthly Renewal
1. **Stripe**: Automatic billing, sends webhook
2. **Supabase Updates**:
   ```javascript
   available_tokens += monthly_plan_tokens
   subscription_expires_at = new_period_end
   monthly_worksheets_used = 0 // Reset monthly counter
   total_tokens_received += monthly_plan_tokens
   ```
3. **Event Log**: Record 'renewed' event

### Subscription Cancellation
1. **User Action**: Cancel via Stripe Customer Portal
2. **Stripe**: Sets `cancel_at_period_end = true`
3. **Until Expiration**:
   ```javascript
   // Tokens remain active
   is_tokens_frozen = FALSE
   subscription_status = 'active' (until period ends)
   ```
4. **After Expiration**:
   ```javascript
   is_tokens_frozen = TRUE // Freeze all tokens
   subscription_type = 'Free Demo'
   subscription_status = 'cancelled'
   ```
5. **Event Log**: Record 'cancelled' and later 'expired' events

### Subscription Reactivation
1. **User Action**: Purchase new subscription after cancellation
2. **Supabase Updates**:
   ```javascript
   is_tokens_frozen = FALSE // Unfreeze ALL existing tokens
   available_tokens += new_plan_tokens
   subscription_type = new_plan_name
   subscription_status = 'active'
   total_tokens_received += new_plan_tokens
   ```
3. **Result**: All previously frozen tokens become available again

## Edge Functions

### stripe-webhook
Handles all Stripe subscription events:
- `checkout.session.completed`: New subscriptions
- `customer.subscription.updated`: Upgrades/downgrades
- `customer.subscription.deleted`: Cancellations
- `invoice.payment_succeeded`: Monthly renewals

### create-subscription
Creates new subscriptions or updates existing ones:
```javascript
// Check for existing active subscription
const existingSubscription = await getActiveSubscription(customerId);

if (existingSubscription) {
  // Upgrade/Downgrade: Update existing subscription
  await stripe.subscriptions.update(existingSubscription.id, {
    items: [{ price: newPriceId }],
    proration_behavior: 'always_invoice'
  });
} else {
  // New subscription: Create checkout session
  await stripe.checkout.sessions.create({...});
}
```

### check-subscription-status
Synchronizes subscription data from Stripe to Supabase:
- Fetches current subscription status from Stripe
- Updates local Supabase data
- Handles discrepancies and repairs data inconsistencies

## Token Tracking

### Token Sources
1. **Initial Registration**: 2 free demo tokens
2. **New Subscription**: Full plan amount (15-120 tokens)
3. **Monthly Renewal**: Plan amount added monthly
4. **Upgrades**: Difference between old and new plan
5. **Reactivation**: New plan tokens + unfrozen existing tokens

### Token States
- **Active**: `is_tokens_frozen = FALSE`, can be consumed
- **Frozen**: `is_tokens_frozen = TRUE`, visible but not consumable
- **Available**: Current usable token count for UI display

### Consumption Logic
```javascript
const consumeToken = async (userId, worksheetId) => {
  const profile = await getProfile(userId);
  
  // Check if tokens are available
  if (profile.is_tokens_frozen || profile.available_tokens <= 0) {
    return { success: false, reason: 'no_tokens_available' };
  }
  
  // Consume token
  await updateProfile(userId, {
    available_tokens: profile.available_tokens - 1,
    total_tokens_consumed: profile.total_tokens_consumed + 1
  });
  
  // Log transaction
  await logTokenTransaction(userId, 'consumption', -1, worksheetId);
  
  return { success: true };
};
```

## Business Rules

### Token Freezing Rules
1. **Free Demo Users**: Tokens never frozen (can use 2 tokens without subscription)
2. **Active Subscribers**: Tokens never frozen
3. **Cancelled Subscriptions**: Tokens frozen after `current_period_end`
4. **Expired Subscriptions**: Tokens remain frozen until reactivation

### Upgrade/Downgrade Rules
1. **Timing**: Takes effect immediately
2. **Billing**: Prorated for upgrades, adjusted for next renewal on downgrades
3. **Tokens**: Upgrades add difference, downgrades preserve existing tokens
4. **Renewal Date**: Always preserved during plan changes

### Data Consistency Rules
1. **Single Active Subscription**: User can have only one active subscription
2. **Email Synchronization**: Email must match in profiles and subscriptions tables
3. **Token Conservation**: Tokens are never deleted, only frozen/unfrozen
4. **Audit Trail**: All subscription changes logged in subscription_events

## Error Handling

### Common Scenarios
1. **Multiple Active Subscriptions**: Consolidate to most recent
2. **Missing Tokens**: Repair based on subscription history
3. **Webhook Failures**: Retry mechanism with exponential backoff
4. **Data Inconsistency**: Repair function to sync with Stripe

### Repair Functions
```javascript
// Consolidate duplicate subscriptions
const repairDuplicateSubscriptions = async (userId) => {
  const subscriptions = await getActiveSubscriptions(userId);
  if (subscriptions.length > 1) {
    // Keep most recent, cancel others
    const latest = subscriptions.sort((a, b) => b.created_at - a.created_at)[0];
    const toCancel = subscriptions.filter(s => s.id !== latest.id);
    
    for (const sub of toCancel) {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    }
  }
};
```

## Frontend Integration

### useTokenSystem Hook
```javascript
const useTokenSystem = (userId) => {
  const getAvailableTokens = () => {
    if (!profile) return 0;
    return profile.is_tokens_frozen ? 0 : profile.available_tokens;
  };
  
  const canUseTokens = () => {
    return !profile?.is_tokens_frozen && profile?.available_tokens > 0;
  };
  
  return { availableTokens: getAvailableTokens(), canUseTokens: canUseTokens() };
};
```

### Subscription Management UI
- **Current Plan Display**: Show active subscription with expiration date
- **Upgrade Options**: List higher tier plans with token differences
- **Downgrade Options**: List lower tier plans with preserved tokens notice
- **Token Display**: Show available tokens with frozen state indicator
- **No Token Purchase**: Only subscription-based token acquisition

## Security Considerations

### Access Control
- Row-Level Security on all user-related tables
- Service role access for webhook processing
- User access limited to own subscription data

### Data Validation
- Webhook signature verification
- Email domain validation
- Token balance non-negative constraints
- Subscription status validation

## Monitoring and Analytics

### Key Metrics
- Active subscription distribution by plan
- Token consumption patterns
- Upgrade/downgrade conversion rates
- Cancellation and reactivation rates
- Revenue tracking by subscription tier

### Event Logging
All subscription events logged with:
- Timestamp and user identification
- Event type and associated data
- Token changes and balance snapshots
- Stripe event correlation IDs

## Migration and Maintenance

### Data Migration
When updating the system:
1. Backup existing subscription data
2. Run migration scripts for schema changes
3. Repair any data inconsistencies
4. Validate token balances against subscription history

### Regular Maintenance
- Weekly subscription data synchronization with Stripe
- Monthly token balance audits
- Quarterly subscription analytics reviews
- Annual pricing and plan structure evaluation

This documentation reflects the current implementation and should be updated as the system evolves.


# Token and Subscription Logic Documentation

## Overview
This document describes the complete token and subscription system in the English Worksheet Generator application. The system manages user access to worksheet generation through three mechanisms: purchased tokens, rollover tokens, and monthly subscription limits.

## Core Concepts

### Token System
- **Token Balance**: Purchased tokens that users can buy and use anytime
- **Rollover Tokens**: Unused monthly worksheets that carry forward from previous months
- **Monthly Worksheet Limit**: Number of worksheets included in subscription plans
- **Monthly Worksheets Used**: Counter tracking how many worksheets were generated this month from subscription
- **Token Left**: Combined available tokens = `token_balance + rollover_tokens + (monthly_limit - monthly_used)`

### User Types
1. **Anonymous Users (Demo Mode)**: Limited access without registration
2. **Registered Users**: Can purchase tokens and subscribe to plans
3. **Subscribed Users**: Have monthly limits based on their subscription tier

## Database Schema

### profiles Table
```sql
- id: UUID (user ID)
- token_balance: INTEGER (default: 2) - purchased tokens
- rollover_tokens: INTEGER (default: 0) - unused monthly worksheets from previous periods
- monthly_worksheet_limit: INTEGER - subscription monthly limit
- monthly_worksheets_used: INTEGER (default: 0) - used this month
- subscription_type: TEXT - plan name
- subscription_status: TEXT - active/inactive
- subscription_expires_at: TIMESTAMP - renewal date
```

### subscriptions Table
```sql
- teacher_id: UUID
- stripe_subscription_id: TEXT
- stripe_customer_id: TEXT
- plan_type: TEXT (side-gig, full-time)
- monthly_limit: INTEGER
- status: TEXT
- current_period_start/end: TIMESTAMP
```

### token_transactions Table
```sql
- teacher_id: UUID
- transaction_type: TEXT (purchase, usage, rollover)
- amount: INTEGER
- description: TEXT
- reference_id: UUID (worksheet_id for usage)
```

## Token Consumption Logic

### Priority Order (consume_token function)
1. **First**: Use purchased tokens (`token_balance`)
2. **Second**: Use rollover tokens (`rollover_tokens`) 
3. **Third**: Use monthly subscription limit (`monthly_worksheet_limit`)
4. **Last**: Reject if no tokens available

### Token Consumption Process
```sql
1. Check token_balance > 0
   - If YES: Deduct 1 from token_balance
   - Log transaction: type='usage', amount=-1, description='from purchased tokens'
   - Return TRUE

2. Check rollover_tokens > 0
   - If YES: Deduct 1 from rollover_tokens
   - Log transaction: type='usage', amount=-1, description='from rollover tokens'
   - Return TRUE

3. Check monthly_limit > 0 AND monthly_used < monthly_limit
   - If YES: Increment monthly_worksheets_used by 1
   - Log transaction: type='usage', amount=0, description='from monthly limit'
   - Return TRUE

4. If no condition met: Return FALSE
```

## Rollover Token System

### Monthly Rollover Process
When a subscription renews:
1. Calculate unused worksheets: `unused = monthly_limit - monthly_used`
2. Add to rollover tokens: `rollover_tokens = rollover_tokens + unused`
3. Reset monthly usage: `monthly_worksheets_used = 0`
4. Log rollover transaction

### Rollover Benefits
- **No Waste**: Unused monthly worksheets never disappear
- **Flexible Usage**: Can save up tokens for busy periods
- **Accumulated Value**: Long-term subscribers build up substantial rollover banks

## Subscription Plans

### Plan Types
1. **Free Demo**: 
   - No monthly limit
   - 2 free tokens on registration
   - Anonymous users get limited access

2. **Side-Gig Plan**: $9/month
   - 15 worksheets/month
   - Unused worksheets carry forward
   - Additional purchased tokens available

3. **Full-Time Plans**: $19-$79/month
   - 30-120 worksheets/month based on tier
   - Unused worksheets carry forward
   - Additional purchased tokens available

### Subscription Tiers with Upgrade Pricing
- **Full-Time 30**: $19/month, 30 worksheets
- **Full-Time 60**: $39/month, 60 worksheets  
- **Full-Time 90**: $59/month, 90 worksheets
- **Full-Time 120**: $79/month, 120 worksheets

### Upgrade Logic
- **Cannot downgrade**: Users can only upgrade to higher tiers
- **Upgrade pricing**: Pay only the difference (new_price - current_price)
- **Upgrade tokens**: Receive only the difference (new_tokens - current_tokens)
- **Button states**: Disable buttons for current/lower plans

## Token Scenarios

### New User Registration
1. User signs up → `handle_new_user()` trigger fires
2. Profile created with `token_balance = 2` (free tokens)
3. `rollover_tokens = 0`, `monthly_worksheet_limit = 0`
4. `monthly_worksheets_used = 0`

### Token Purchase
1. User completes Stripe payment
2. `stripe-webhook` processes payment
3. Tokens added via `add_tokens()` function
4. Transaction logged as type='purchase'

### Worksheet Generation
1. User generates worksheet
2. `consumeToken()` called with worksheet_id
3. `consume_token()` SQL function executes priority logic
4. Token balance, rollover, or monthly usage updated
5. Transaction logged with worksheet reference

### Subscription Purchase/Upgrade
1. User selects plan on pricing page
2. `create-subscription` edge function called
3. Upgrade pricing calculated (difference from current plan)
4. Stripe checkout session created with upgrade price
5. On successful payment, webhook processes:
   - Creates/updates subscription record
   - Updates profile with subscription details
   - Adds upgrade tokens (difference only)
   - Resets `monthly_worksheets_used = 0`

### Subscription Renewal with Rollover
1. Stripe automatically charges monthly
2. `invoice.payment_succeeded` webhook fires
3. Calculate unused worksheets: `unused = monthly_limit - monthly_used`
4. Add to rollover: `rollover_tokens = rollover_tokens + unused`
5. Reset monthly usage: `monthly_worksheets_used = 0`
6. Log rollover transaction
7. Update subscription period dates

### Subscription Cancellation
1. User cancels via Stripe Customer Portal
2. Webhook updates subscription status
3. At period end:
   - `monthly_worksheet_limit = 0`
   - `subscription_type = null`
   - Purchased tokens and rollover tokens remain available

## Frontend Logic

### useTokenSystem Hook
```typescript
// Calculates combined available tokens with rollover
const tokenLeft = tokenBalance + rolloverTokens + monthlyAvailable;
const monthlyAvailable = Math.max(0, monthlyLimit - monthlyUsed);

// Consumption method
const consumeToken = async (worksheetId: string) => {
  // Calls consume_token SQL function
  // Refreshes token data after successful consumption
};
```

### usePlanLogic Hook
```typescript
// Plan upgrade logic
const canUpgradeTo = (targetPlan) => {
  // Returns true only if target plan is higher tier
};

const getUpgradePrice = (targetPlan) => {
  // Returns price difference for upgrades
};

const getUpgradeTokens = (targetPlan) => {
  // Returns token difference for upgrades
};
```

### Token Display Logic
- **Token Left**: Shows total available (purchased + rollover + monthly remaining)
- **Purchased Tokens**: Shows only token_balance
- **Rollover Tokens**: Shows carried-forward unused worksheets
- **Monthly Used**: Shows worksheets used from subscription
- **Monthly Limit**: Shows subscription limit

## Button States on Pricing/Profile Pages

### Free Demo Users
- **Get Started Free**: Disabled (current plan)
- **Side-Gig Plan**: Enabled (upgrade available)
- **Full-Time Plan**: Enabled (upgrade available)

### Side-Gig Users
- **Get Started Free**: Disabled (cannot downgrade)
- **Side-Gig Plan**: Disabled (current plan)
- **Full-Time Plan**: Enabled (upgrade available)
- **Full-Time Dropdown**: Auto-set to 30 (next available)

### Full-Time Users
- **Get Started Free**: Disabled (cannot downgrade)
- **Side-Gig Plan**: Disabled (cannot downgrade)
- **Full-Time Plan**: Enabled only for higher tiers
- **Full-Time Dropdown**: Auto-set to next higher tier
- **Current Tier**: Button disabled for current plan

## Error Handling

### Insufficient Tokens
- `hasTokens()` returns false
- `TokenPaywall` component shown
- User redirected to pricing page

### Payment Failures
- Stripe webhook handles failed payments
- Subscription status updated to 'past_due'
- Access restricted until payment resolved

### Database Sync Issues
- `useSubscriptionSync` hook provides manual sync
- `check-subscription-status` edge function verifies Stripe data
- Updates local database with Stripe source of truth

## Security Considerations

### Row Level Security (RLS)
- Users can only access their own tokens/subscriptions
- Edge functions use service role to bypass RLS
- Anonymous users have no database access

### Token Validation
- All token operations go through secure SQL functions
- Worksheet generation requires valid token consumption
- No client-side token manipulation possible

## Monitoring & Analytics

### Transaction Logging
- All token operations logged in `token_transactions`
- Purchase/usage/rollover tracking for analytics
- Reference IDs link to worksheets

### Subscription Tracking
- Active subscription monitoring
- Upgrade/downgrade analysis
- Rollover token accumulation insights

## Future Enhancements

### Potential Improvements
1. **Rollover Limits**: Set maximum rollover token accumulation
2. **Expiry Warnings**: Notify users about expiring rollover tokens
3. **Bulk Discounts**: Volume pricing for token purchases
4. **Gifting System**: Transfer tokens between users
5. **Usage Predictions**: AI-based usage forecasting

### Technical Debt
1. **Webhook Dependencies**: Reduce reliance on Stripe webhooks
2. **Real-time Updates**: Implement WebSocket for live token updates
3. **Caching**: Cache token calculations for performance
4. **Audit Trail**: Enhanced transaction history

## Testing Scenarios

### Test Cases to Verify
1. New user gets 2 free tokens
2. Token consumption follows priority order (purchased → rollover → monthly)
3. Subscription purchase adds correct tokens
4. Upgrade pricing calculates correctly
5. Rollover tokens accumulate on renewal
6. Monthly reset works correctly
7. Cancellation preserves purchased and rollover tokens
8. Button states update correctly based on current plan
9. Upgrade restrictions prevent downgrades
10. Webhook failures don't break system

## Troubleshooting Guide

### Common Issues
1. **Token Not Deducted**: Check consume_token function logs
2. **Incorrect Rollover**: Verify renewal webhook processing
3. **Wrong Button State**: Check plan logic calculations
4. **Subscription Not Active**: Verify webhook processing
5. **Wrong Token Count**: Check transaction log for discrepancies

### Debug Steps
1. Check Edge Function logs
2. Verify database transaction logs
3. Test webhook endpoints
4. Validate Stripe dashboard
5. Review RLS policies
6. Check plan logic calculations

This comprehensive system ensures fair usage, proper billing, smooth user experience, and efficient token management while maintaining security and scalability. The rollover system provides excellent value to users by ensuring no purchased worksheets are ever wasted.

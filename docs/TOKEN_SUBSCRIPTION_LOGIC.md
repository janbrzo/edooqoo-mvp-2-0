
# Token and Subscription Logic Documentation

## Overview
This document describes the complete token and subscription system in the English Worksheet Generator application. The system manages user access to worksheet generation through two mechanisms: purchased tokens and monthly subscription limits.

## Core Concepts

### Token System
- **Token Balance**: Purchased tokens that users can buy and use anytime
- **Monthly Worksheet Limit**: Number of worksheets included in subscription plans
- **Monthly Worksheets Used**: Counter tracking how many worksheets were generated this month from subscription
- **Token Left**: Combined available tokens = `token_balance + (monthly_limit - monthly_used)`

### User Types
1. **Anonymous Users (Demo Mode)**: Limited access without registration
2. **Registered Users**: Can purchase tokens and subscribe to plans
3. **Subscribed Users**: Have monthly limits based on their subscription tier

## Database Schema

### profiles Table
```sql
- id: UUID (user ID)
- token_balance: INTEGER (default: 2) - purchased tokens
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
- transaction_type: TEXT (purchase, usage)
- amount: INTEGER
- description: TEXT
- reference_id: UUID (worksheet_id for usage)
```

## Token Consumption Logic

### Priority Order (consume_token function)
1. **First**: Use purchased tokens (`token_balance`)
2. **Second**: Use monthly subscription limit (`monthly_worksheet_limit`)
3. **Last**: Reject if no tokens available

### Token Consumption Process
```sql
1. Check token_balance > 0
   - If YES: Deduct 1 from token_balance
   - Log transaction: type='usage', amount=-1, description='from token balance'
   - Return TRUE

2. Check monthly_limit > 0 AND monthly_used < monthly_limit
   - If YES: Increment monthly_worksheets_used by 1
   - Log transaction: type='usage', amount=0, description='from monthly limit'
   - Return TRUE

3. If neither condition met: Return FALSE
```

## Subscription Plans

### Plan Types
1. **Free Demo**: 
   - No monthly limit
   - 2 free tokens on registration
   - Anonymous users get limited access

2. **Side-Gig Plan**: $9/month
   - 15 worksheets/month
   - Additional purchased tokens available

3. **Full-Time Plans**: $19-$79/month
   - 30-120 worksheets/month based on tier
   - Additional purchased tokens available

### Subscription Tiers
- **Full-Time 30**: $19/month, 30 worksheets
- **Full-Time 60**: $39/month, 60 worksheets  
- **Full-Time 90**: $59/month, 90 worksheets
- **Full-Time 120**: $79/month, 120 worksheets

## Token Scenarios

### New User Registration
1. User signs up → `handle_new_user()` trigger fires
2. Profile created with `token_balance = 2` (free tokens)
3. `monthly_worksheet_limit = 0` (no subscription)
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
4. Token balance or monthly usage updated
5. Transaction logged with worksheet reference

### Subscription Purchase
1. User selects plan on pricing page
2. `create-subscription` edge function called
3. Stripe checkout session created
4. On successful payment, webhook processes:
   - Creates/updates subscription record
   - Updates profile with subscription details
   - Adds initial tokens equal to monthly limit
   - Resets `monthly_worksheets_used = 0`

### Subscription Renewal
1. Stripe automatically charges monthly
2. `invoice.payment_succeeded` webhook fires
3. Profile updated with new period dates
4. `monthly_worksheets_used` reset to 0
5. New tokens added equal to monthly limit

### Subscription Cancellation
1. User cancels via Stripe Customer Portal
2. Webhook updates subscription status
3. At period end:
   - `monthly_worksheet_limit = 0`
   - `subscription_type = null`
   - Purchased tokens remain available

## Frontend Logic

### useTokenSystem Hook
```typescript
// Calculates combined available tokens
const tokenLeft = tokenBalance + monthlyAvailable;
const monthlyAvailable = Math.max(0, monthlyLimit - monthlyUsed);

// Consumption method
const consumeToken = async (worksheetId: string) => {
  // Calls consume_token SQL function
  // Refreshes token data after successful consumption
};
```

### Token Display Logic
- **Token Left**: Shows total available (purchased + monthly remaining)
- **Purchased Tokens**: Shows only token_balance
- **Monthly Used**: Shows worksheets used from subscription
- **Monthly Limit**: Shows subscription limit

## Edge Cases & Scenarios

### Scenario 1: User with tokens and subscription
- Has 5 purchased tokens + Side-Gig plan (15/month)
- Used 10 worksheets this month
- Token Left = 5 + (15 - 10) = 10
- Next worksheet uses purchased token (becomes 4 + 5 = 9)

### Scenario 2: Subscription expires
- Monthly limit becomes 0
- Purchased tokens remain available
- Token Left = purchased tokens only

### Scenario 3: Mid-month subscription upgrade
- Monthly limit increases immediately
- Monthly used count remains same
- More worksheets become available

### Scenario 4: Token purchase during active subscription
- Tokens added to balance
- Monthly limit unchanged
- Token Left increases by purchased amount

### Scenario 5: Monthly reset
- `monthly_worksheets_used` resets to 0
- Monthly limit restored
- Purchased tokens unchanged

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
- Purchase/usage tracking for analytics
- Reference IDs link to worksheets

### Subscription Tracking
- Active subscription monitoring
- Churn analysis possible
- Usage pattern insights

## Future Enhancements

### Potential Improvements
1. **Token Expiration**: Add expiry dates to purchased tokens
2. **Bulk Discounts**: Volume pricing for token purchases
3. **Rollover Limits**: Unused monthly worksheets carry forward
4. **Usage Alerts**: Notify when approaching limits
5. **Gifting System**: Transfer tokens between users

### Technical Debt
1. **Webhook Dependencies**: Reduce reliance on Stripe webhooks
2. **Real-time Updates**: Implement WebSocket for live token updates
3. **Caching**: Cache token calculations for performance
4. **Audit Trail**: Enhanced transaction history

## Testing Scenarios

### Test Cases to Verify
1. New user gets 2 free tokens
2. Token consumption follows priority order
3. Subscription purchase adds tokens and sets limits
4. Monthly reset works correctly
5. Cancellation preserves purchased tokens
6. Webhook failures don't break system
7. Edge cases handled gracefully

## Troubleshooting Guide

### Common Issues
1. **Token Not Deducted**: Check consume_token function logs
2. **Subscription Not Active**: Verify webhook processing
3. **Wrong Token Count**: Check transaction log for discrepancies
4. **Payment Not Reflected**: Use subscription sync feature

### Debug Steps
1. Check Edge Function logs
2. Verify database transaction logs
3. Test webhook endpoints
4. Validate Stripe dashboard
5. Review RLS policies

## API Reference

### Key Functions
- `consume_token(teacher_id, worksheet_id)` - Deduct token for worksheet
- `add_tokens(teacher_id, amount, description)` - Add purchased tokens
- `get_token_balance(teacher_id)` - Get current token balance
- `track_user_event()` - Log user actions

### Edge Functions
- `create-subscription` - Create Stripe subscription
- `customer-portal` - Access subscription management
- `check-subscription-status` - Sync subscription data
- `stripe-webhook` - Process payment events

This comprehensive system ensures fair usage, proper billing, and smooth user experience while maintaining security and scalability.

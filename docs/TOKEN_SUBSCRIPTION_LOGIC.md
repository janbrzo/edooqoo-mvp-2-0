
# Token and Subscription Logic Documentation

## Overview
This document describes the token and subscription system implemented in the edooqoo worksheet generator application.

## Token System

### Token Types
1. **Purchased Tokens**: Never expire, bought separately from subscriptions
2. **Rollover Tokens**: Unused monthly worksheets that carry forward to next month
3. **Monthly Worksheets**: Included in subscription plans, reset monthly

### Token Consumption Order
The system consumes tokens in the following priority:
1. Purchased tokens (first)
2. Rollover tokens (second)
3. Monthly worksheets (last)

### Token Storage
- **purchased_tokens**: Tokens bought separately, never expire
- **rollover_tokens**: Unused monthly worksheets from previous months
- **monthly_worksheet_limit**: Current month's worksheet allowance based on subscription

## Subscription Plans

### Available Plans
1. **Free Demo**: 2 free tokens on signup, no subscription required
2. **Side-Gig**: $9/month, 15 worksheets/month
3. **Full-Time Plans**:
   - 30 worksheets: $19/month
   - 60 worksheets: $39/month
   - 90 worksheets: $59/month
   - 120 worksheets: $79/month

### Subscription Features
- All plans include unlimited student management
- Export to HTML and PDF
- All worksheet types available
- Editable worksheets
- Unused monthly worksheets carry forward as rollover tokens

## Database Schema

### User Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  subscription_type TEXT DEFAULT 'Free Demo',
  subscription_status TEXT DEFAULT 'active',
  monthly_worksheet_limit INTEGER DEFAULT 0,
  purchased_tokens INTEGER DEFAULT 0,
  rollover_tokens INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Key Functions

#### Token Consumption (`consume_token_updated`)
```sql
CREATE OR REPLACE FUNCTION consume_token_updated(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  worksheets_used INTEGER;
  can_consume BOOLEAN := FALSE;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  
  -- Check purchased tokens first
  IF user_profile.purchased_tokens > 0 THEN
    UPDATE profiles 
    SET purchased_tokens = purchased_tokens - 1,
        updated_at = now()
    WHERE id = user_id;
    RETURN TRUE;
  END IF;
  
  -- Check rollover tokens second
  IF user_profile.rollover_tokens > 0 THEN
    UPDATE profiles 
    SET rollover_tokens = rollover_tokens - 1,
        updated_at = now()
    WHERE id = user_id;
    RETURN TRUE;
  END IF;
  
  -- Check monthly worksheets last
  SELECT COUNT(*) INTO worksheets_used 
  FROM worksheet_history 
  WHERE user_id = user_id 
  AND created_at >= date_trunc('month', now());
  
  IF worksheets_used < user_profile.monthly_worksheet_limit THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

#### Rollover Processing
At the end of each month, unused monthly worksheets are automatically converted to rollover tokens through the subscription webhook system.

## Authentication Flow

### Registration Process
1. User signs up with email and password
2. Email confirmation required (security feature)
3. User receives 2 free tokens upon email confirmation
4. Profile created with default values

### Email Confirmation
- Required for all new users
- Confirmation email sent automatically
- Users must click email link to activate account
- Free tokens only added after email confirmation

## Subscription Management

### Stripe Integration
- All subscriptions managed through Stripe
- Webhooks handle subscription events
- Customer portal for subscription management
- Automatic billing and renewal

### Upgrade Logic
- Users can upgrade from any plan to higher tier
- Prorated billing through Stripe
- Immediate access to higher limits
- Unused tokens/worksheets preserved

### Cancellation
- Users can cancel anytime through customer portal
- Subscription remains active until billing period ends
- Access to features maintained until expiration
- Rollover tokens preserved after cancellation

## Token Tracking

### Available Tokens Calculation
```typescript
const getAvailableTokens = (profile: Profile) => {
  const purchasedTokens = profile.purchased_tokens || 0;
  const rolloverTokens = profile.rollover_tokens || 0;
  
  // Calculate monthly worksheets used
  const monthlyUsed = getMonthlyWorksheetsUsed(profile.id);
  const monthlyAvailable = Math.max(0, profile.monthly_worksheet_limit - monthlyUsed);
  
  return purchasedTokens + rolloverTokens + monthlyAvailable;
};
```

### Usage Tracking
- All worksheet generations tracked in `worksheet_history`
- Monthly usage calculated from creation timestamps
- Real-time token balance updates
- Historical usage data maintained

## Business Rules

### Token Expiration
- Purchased tokens: Never expire
- Rollover tokens: Never expire
- Monthly worksheets: Reset monthly, unused convert to rollover

### Plan Restrictions
- Free Demo: Limited to 2 initial tokens
- All paid plans: Unlimited student management
- No restrictions on worksheet types or export features

### Fair Usage
- Rate limiting on worksheet generation (30-60 seconds per request)
- Geolocation tracking for usage analytics
- Security measures against abuse

## Error Handling

### Common Scenarios
1. **Insufficient tokens**: User redirected to upgrade page
2. **Subscription expiration**: Graceful degradation to free tier
3. **Payment failures**: Retry logic with user notification
4. **Email confirmation pending**: Limited access until confirmed

### Fallback Mechanisms
- Demo mode for unauthenticated users
- Token purchase as alternative to subscription
- Manual token addition for support cases
- Webhook retry system for failed events

## Integration Points

### Frontend Components
- `useTokenSystem`: Hook for token balance and consumption
- `usePlanLogic`: Hook for subscription plan management
- `TokenPaywall`: Component for upgrade prompts
- `PricingCalculator`: Dynamic pricing based on usage

### Backend Functions
- `generateWorksheet`: Token consumption and worksheet creation
- `create-subscription`: Stripe subscription creation
- `stripe-webhook`: Subscription event handling
- `add-tokens`: Manual token addition (admin)

## Monitoring and Analytics

### Key Metrics
- Token consumption rates
- Subscription conversion rates
- Monthly recurring revenue
- User engagement levels
- Worksheet generation patterns

### Data Points
- User registration and confirmation rates
- Plan upgrade/downgrade frequency
- Token purchase vs subscription preference
- Geographic usage distribution
- Feature usage analytics

## Security Considerations

### Data Protection
- Row-level security on all user data
- Encrypted payment information
- Secure token storage
- Audit trails for all transactions

### Access Control
- Authentication required for all features
- Email confirmation mandatory
- Subscription status validation
- Rate limiting and abuse prevention

## Future Enhancements

### Planned Features
- Team/organization accounts
- Bulk token purchases
- Advanced analytics dashboard
- API access for enterprise users
- Multi-language support

### Technical Improvements
- Performance optimization
- Enhanced error handling
- Automated testing coverage
- Documentation updates
- Mobile app compatibility

This documentation reflects the current implementation as of the latest system update and should be maintained as the system evolves.

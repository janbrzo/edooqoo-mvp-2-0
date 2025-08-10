
# Technical Documentation - English Worksheet Generator

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth (email/password + anonymous)
- **Payments**: Stripe (subscriptions + one-time payments)
- **AI**: Custom worksheet generation API
- **Deployment**: Lovable platform

### Key Components Structure
```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── worksheet/             # Worksheet-specific components
│   └── [various]/             # Feature-specific components
├── hooks/                     # Custom React hooks
├── pages/                     # Route components
├── services/                  # API and business logic
├── utils/                     # Utility functions
└── integrations/supabase/     # Database types and client
```

## Database Schema

### Core Tables

#### `profiles` (User Management & Tokens)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  subscription_type TEXT DEFAULT 'Free Demo',
  subscription_status TEXT DEFAULT 'active',
  monthly_worksheet_limit INTEGER DEFAULT 0,
  monthly_worksheets_used INTEGER DEFAULT 0,
  available_tokens INTEGER DEFAULT 2,
  rollover_tokens INTEGER DEFAULT 0,
  total_worksheets_created INTEGER DEFAULT 0,
  is_tokens_frozen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `worksheets` (Generated Content)
```sql
CREATE TABLE worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id),
  student_id UUID REFERENCES students(id),
  title TEXT NOT NULL,
  ai_response JSONB,
  form_data JSONB,
  generation_time_seconds INTEGER,
  download_count INTEGER DEFAULT 0,
  rating INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `students` (Student Management)
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  english_level TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Payment Tables

#### `subscriptions` (Stripe Integration)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  subscription_status TEXT,
  subscription_type TEXT,
  monthly_limit INTEGER,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
);
```

#### `export_payments` (One-time Downloads)
```sql
CREATE TABLE export_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id TEXT,
  stripe_session_id TEXT UNIQUE,
  user_identifier TEXT,
  status TEXT DEFAULT 'pending',
  amount INTEGER,
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Authentication System

### User Types & Flow
1. **Anonymous Users**
   - No account required for generation
   - Pay $1 per download session
   - No data persistence

2. **Registered Users**
   - Email/password authentication
   - Email verification required
   - Persistent data and subscriptions

### Auth State Management
```typescript
// useAuthFlow.tsx
const { user, session, loading, isAnonymous, isRegisteredUser } = useAuthFlow();

// Key states:
// - user: Supabase user object
// - session: Complete session with tokens
// - isAnonymous: user?.is_anonymous === true
// - isRegisteredUser: user && !isAnonymous && user.email
```

### Critical Auth Logic
```typescript
// Anonymous detection for download locks
const isValidUser = userId && userId !== 'anonymous';

// Auto-unlock only for authenticated users
if (!isValidUser) {
  // Force payment for anonymous users
  return;
}
```

## Token & Subscription System

### Consumption Priority Logic
```typescript
// 1. Check monthly allowance first
const monthlyRemaining = monthlyLimit - monthlyUsed;
const canUseMonthly = monthlyRemaining > 0;

// 2. Use available tokens as fallback
const totalAvailable = availableTokens + (canUseMonthly ? monthlyRemaining : 0);

// 3. Block if insufficient
if (totalAvailable <= 0) {
  showTokenModal();
  return;
}
```

### Database Function: `consume_token`
```sql
CREATE OR REPLACE FUNCTION consume_token(user_id UUID)
RETURNS TABLE(success BOOLEAN, remaining_tokens INTEGER, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  current_monthly_used INTEGER;
  current_monthly_limit INTEGER;
  current_available_tokens INTEGER;
  current_total_worksheets INTEGER;
BEGIN
  -- Get current values
  SELECT monthly_worksheets_used, monthly_worksheet_limit, 
         available_tokens, total_worksheets_created
  INTO current_monthly_used, current_monthly_limit, 
       current_available_tokens, current_total_worksheets
  FROM profiles WHERE id = user_id;

  -- Use monthly allowance first
  IF current_monthly_used < current_monthly_limit THEN
    UPDATE profiles 
    SET monthly_worksheets_used = monthly_worksheets_used + 1,
        total_worksheets_created = CASE 
          WHEN total_worksheets_created >= 2 
          THEN total_worksheets_created + 1 
          ELSE total_worksheets_created + 1 
        END
    WHERE id = user_id;
    
    RETURN QUERY SELECT TRUE, current_available_tokens, 'Used monthly allowance';
  
  -- Fallback to available tokens
  ELSIF current_available_tokens > 0 THEN
    UPDATE profiles 
    SET available_tokens = available_tokens - 1,
        total_worksheets_created = CASE 
          WHEN total_worksheets_created >= 2 
          THEN total_worksheets_created + 1 
          ELSE total_worksheets_created + 1 
        END
    WHERE id = user_id;
    
    RETURN QUERY SELECT TRUE, current_available_tokens - 1, 'Used available token';
  
  -- Insufficient resources
  ELSE
    RETURN QUERY SELECT FALSE, current_available_tokens, 'Insufficient tokens';
  END IF;
END;
$$;
```

## Download Access Control

### Anonymous Users
- **Generation**: Free via anonymous auth
- **Download**: Requires $1 Stripe payment
- **Session**: ~24 hours via sessionStorage
- **Security**: No auto-unlock regardless of generation method

### Registered Users  
- **Generation**: Consumes tokens/monthly allowance
- **Download**: Automatically unlocked
- **Session**: Long-term (1 year) via sessionStorage
- **Security**: Auto-unlock only with valid authenticated userId

### Implementation: `useDownloadStatus`
```typescript
const checkTokenGeneratedWorksheet = (worksheetId: string, userId?: string) => {
  // CRITICAL: Prevent auto-unlock for anonymous users
  if (!userId || userId === 'anonymous') {
    console.log('❌ Anonymous user must pay for downloads');
    return;
  }
  
  // Auto-unlock for authenticated users only
  if (worksheetId && worksheetId !== 'unknown') {
    const autoToken = `token_${worksheetId}_${userId}_${Date.now()}`;
    const expiryTime = Date.now() + (365 * 24 * 60 * 60 * 1000);
    
    sessionStorage.setItem('downloadToken', autoToken);
    sessionStorage.setItem('downloadTokenExpiry', expiryTime.toString());
    setIsDownloadUnlocked(true);
  }
};
```

## Edge Functions

### Worksheet Generation: `generateWorksheet`
- **Purpose**: AI-powered worksheet creation
- **Rate limiting**: Per IP and user
- **Token consumption**: Via `consume_token` function
- **Security**: Input validation and sanitization

### Payment Processing: `create-export-payment`
- **Purpose**: One-time $1 download payments
- **Flow**: Create Stripe session → Store payment record
- **Security**: Rate limiting and user validation

### Subscription Management: `create-subscription`
- **Purpose**: Recurring subscription checkout
- **Plans**: Side-gig ($9) and Full-time ($19-79)
- **Integration**: Stripe subscription + webhook processing

### Webhook Handler: `stripe-webhook`
- **Purpose**: Process Stripe events
- **Events**: `customer.subscription.created/updated/deleted`
- **Actions**: Update user profiles and token balances

## Frontend Architecture

### State Management
- **Global Auth**: `useAuthFlow` hook
- **Token System**: `useTokenSystem` hook  
- **Worksheet State**: `useWorksheetState` hook
- **Download Control**: `useDownloadStatus` hook

### Key Hooks

#### `useTokenSystem`
```typescript
// Calculates available resources
const tokenLeft = hasActiveSubscription ? 
  availableTokens + monthlyRemaining : 
  availableTokens;

const hasTokens = tokenLeft > 0;
const isDemo = !user || (!hasActiveSubscription && availableTokens <= 2);
```

#### `useWorksheetGeneration`
```typescript
// Handles generation flow with token consumption
const generateWorksheetHandler = async (formData) => {
  setIsGenerating(true);
  
  try {
    const response = await supabase.functions.invoke('generateWorksheet', {
      body: { ...formData, userId, studentId }
    });
    
    if (response.data) {
      setGeneratedWorksheet(response.data);
      // Handle success
    }
  } catch (error) {
    // Handle error
  } finally {
    setIsGenerating(false);
  }
};
```

### Component Architecture

#### `WorksheetToolbar`
- **Purpose**: Main action controls (edit, save, download)
- **Props**: View mode, editing state, download status
- **Features**: View switching, payment integration, tooltips

#### `PaymentPopup`
- **Purpose**: $1 download payment flow
- **Integration**: Stripe Elements
- **Flow**: Payment → verification → download unlock

#### `GenerationView`
- **Purpose**: Display generated worksheets
- **Features**: Live editing, view switching, download controls
- **State**: Manages editable worksheet content

## Security Considerations

### Row Level Security (RLS)
```sql
-- Users can only access their own data
CREATE POLICY "users_own_data" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "teachers_own_worksheets" ON worksheets
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "teachers_own_students" ON students
  FOR ALL USING (auth.uid() = teacher_id);
```

### Input Validation
- **Client-side**: React Hook Form with zod schemas
- **Server-side**: Edge function validation
- **SQL injection**: Parameterized queries only
- **XSS protection**: Content sanitization

### Rate Limiting
```typescript
// Per-IP and per-user limits
const rateLimitKey = `${ip}_${userId}`;
if (!rateLimiter.isAllowed(rateLimitKey)) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

## Performance Optimizations

### Database
- **Indexes**: On foreign keys and frequently queried fields
- **Connection pooling**: Supabase managed
- **Query optimization**: Selective field loading

### Frontend
- **Code splitting**: React.lazy for route components
- **Memoization**: React.memo for expensive components
- **Debouncing**: Search inputs and API calls
- **Caching**: TanStack Query for API responses

### Edge Functions
- **Cold start optimization**: Minimal imports
- **Response caching**: Where appropriate
- **Error handling**: Graceful degradation

## Deployment & Infrastructure

### Lovable Platform
- **Build**: Automatic on code changes
- **Preview**: Branch-based deployments
- **Environment**: Production-ready configuration

### Supabase
- **Database**: PostgreSQL with automatic backups
- **Edge Functions**: Deno runtime
- **Authentication**: Built-in user management
- **Storage**: File uploads (if needed)

### Monitoring
- **Error tracking**: Console logs and error boundaries
- **Performance**: Core Web Vitals monitoring
- **User analytics**: Event tracking system

## Testing Strategy

### Frontend Testing
- **Unit tests**: Component logic and utilities
- **Integration tests**: User flows and API interactions
- **E2E tests**: Critical payment and generation flows

### Backend Testing
- **Function tests**: Edge function logic
- **Database tests**: SQL function correctness
- **Payment tests**: Stripe test mode integration

### Security Testing
- **Authentication**: Auth flow verification
- **Authorization**: RLS policy testing
- **Input validation**: Malicious input handling

*This document is maintained alongside code changes and reflects the current system architecture.*


# English Worksheet Generator - Technical Documentation

## System Overview - ETAP 2

The English Worksheet Generator is a full-featured SaaS platform built on React, TypeScript, and Supabase. After completing ETAP 2, the application provides comprehensive account management, student organization, and subscription-based worksheet generation for English teachers.

## Architecture Stack

### Frontend
- **React 18.3** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** component library for consistent UI
- **React Router** for client-side routing
- **React Query** for server state management

### Backend
- **Supabase** as Backend-as-a-Service
- **PostgreSQL** database with Row Level Security
- **Supabase Auth** for user authentication
- **Edge Functions** for serverless API endpoints
- **Stripe** for payment processing and subscription management

### External Integrations
- **OpenAI/LLM** for AI-powered worksheet generation
- **Stripe** for payment processing, subscriptions, and billing
- **Supabase Email** for transactional emails

## Database Schema - ETAP 2

### Core Tables

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  subscription_type TEXT DEFAULT 'free',
  subscription_status TEXT,
  stripe_customer_id TEXT,
  monthly_worksheet_limit INTEGER DEFAULT 0,
  monthly_worksheets_used INTEGER DEFAULT 0,
  available_tokens INTEGER DEFAULT 2,
  rollover_tokens INTEGER DEFAULT 0,
  total_worksheets_created INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### students
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  english_level TEXT NOT NULL,
  learning_goal TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### worksheets
```sql
CREATE TABLE worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  lesson_topic TEXT NOT NULL,
  english_level TEXT NOT NULL,
  learning_goals TEXT,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Authentication System

### User Registration Flow
1. **Email/Password signup** through Supabase Auth
2. **Email confirmation** required for full access
3. **Profile creation** with 2 free tokens automatically added
4. **Student addition prompt** before worksheet generation

### Security Features
- **Row Level Security (RLS)** on all tables
- **Email verification** mandatory for account activation
- **Secure password requirements** enforced by Supabase
- **JWT-based sessions** with automatic refresh

## Student Management System

### Student Entity
```typescript
interface Student {
  id: string;
  user_id: string;
  name: string;
  english_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  learning_goal: 'Work' | 'Exam' | 'General English';
  created_at: string;
  updated_at: string;
}
```

### Key Features
- **Unlimited students** per account
- **CRUD operations** through React hooks
- **Required for generation**: Must select student before creating worksheet
- **Auto-population**: Student data fills generator form automatically

## Worksheet Generation System

### Generation Requirements
```typescript
// Prerequisites for worksheet generation
const canGenerate = 
  user?.email_confirmed_at && 
  students.length > 0 && 
  (monthlyRemaining > 0 || availableTokens > 0);
```

### Content Types
- **Vocabulary Sheets**: Term definitions and examples
- **Grammar Exercises**: Context-specific grammar practice
- **Reading Comprehension**: Custom passages with questions
- **Fill-in-the-Blanks**: Targeted vocabulary and grammar
- **Multiple Choice**: Various difficulty levels
- **Matching Exercises**: Terms, definitions, concepts
- **Dialogue Practice**: Conversation scenarios
- **Mixed Exercises**: Combination of multiple types

### Generation Flow
1. **Student selection** (required dropdown)
2. **Auto-fill** student level and learning goal
3. **Topic and objectives** input by teacher
4. **AI generation** (30-60 seconds)
5. **Student assignment** and database storage
6. **Download availability** (both Student/Teacher versions)

## Token & Subscription System

### Resource Priority Logic
```typescript
// Critical consumption order
const consumeResource = () => {
  if (monthlyRemaining > 0) {
    // Use monthly worksheet allowance first
    updateMonthlyUsage();
  } else if (availableTokens > 0) {
    // Use available tokens second
    consumeToken();
  } else {
    // Show upgrade options
    showPaywall();
  }
};
```

### Subscription Plans
```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // USD per month
  monthlyLimit: number; // Worksheets per month
  features: string[];
}

const plans = [
  { id: 'free', name: 'Free Demo', price: 0, monthlyLimit: 0 },
  { id: 'side-gig', name: 'Side-Gig Plan', price: 9, monthlyLimit: 15 },
  { id: 'full-time-30', name: 'Full-Time 30', price: 19, monthlyLimit: 30 },
  { id: 'full-time-60', name: 'Full-Time 60', price: 39, monthlyLimit: 60 },
  { id: 'full-time-90', name: 'Full-Time 90', price: 59, monthlyLimit: 90 },
  { id: 'full-time-120', name: 'Full-Time 120', price: 79, monthlyLimit: 120 }
];
```

### Rollover System
```sql
-- Automatic rollover at billing cycle
CREATE OR REPLACE FUNCTION handle_subscription_renewal()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate unused worksheets
  NEW.rollover_tokens = OLD.rollover_tokens + 
    (OLD.monthly_worksheet_limit - OLD.monthly_worksheets_used);
  
  -- Add to available tokens
  NEW.available_tokens = OLD.available_tokens + 
    (OLD.monthly_worksheet_limit - OLD.monthly_worksheets_used);
  
  -- Reset monthly usage
  NEW.monthly_worksheets_used = 0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Payment Integration

### Stripe Implementation
```typescript
// Subscription creation
const createSubscription = async (planData) => {
  const { data } = await supabase.functions.invoke('create-subscription', {
    body: {
      planType: planData.type,
      monthlyLimit: planData.monthlyLimit,
      price: planData.price,
      planName: planData.name
    }
  });
  
  if (data?.url) {
    window.location.href = data.url; // Redirect to Stripe Checkout
  }
};
```

### Webhook Handling
- **Payment success**: Automatic subscription activation
- **Subscription renewal**: Rollover calculation and reset
- **Payment failure**: Graceful degradation with notifications
- **Cancellation**: End-of-period access preservation

## Download System

### Access Control
```typescript
// Automatic unlock for all registered users
const checkDownloadAccess = (userId: string) => {
  return !!userId && userId !== 'anonymous';
};
```

### File Generation
- **HTML format**: Optimal quality, offline-capable
- **PDF format**: Universal compatibility
- **Timestamped filenames**: Easy organization
- **Separate versions**: Student (clean) and Teacher (with answers)

## User Interface Architecture

### Component Structure
```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── dashboard/            # Dashboard-specific components
│   ├── worksheet/            # Worksheet-related components
│   └── WorksheetForm/        # Generation form components
├── hooks/                    # Custom React hooks
├── pages/                    # Route components
├── services/                 # API and business logic
└── utils/                    # Utility functions
```

### State Management
- **React Query**: Server state and caching
- **React Context**: Global user state
- **Local State**: Component-specific state
- **Custom Hooks**: Business logic encapsulation

### Responsive Design
- **Mobile-first**: Tailwind responsive utilities
- **Touch-friendly**: Proper button sizes and spacing
- **Cross-browser**: Tested on major browsers
- **Accessibility**: ARIA labels and keyboard navigation

## API Architecture

### Edge Functions
```
supabase/functions/
├── generateWorksheet/        # AI worksheet generation
├── create-subscription/      # Stripe subscription creation
├── stripe-webhook/          # Payment webhook handling
├── customer-portal/         # Stripe customer portal
├── downgrade-subscription/  # Plan downgrade logic
└── check-subscription-status/ # Subscription sync
```

### Database Functions
```sql
-- Token consumption with priority logic
CREATE OR REPLACE FUNCTION consume_token(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = user_id;
  
  -- Check monthly allowance first
  IF profile_record.monthly_worksheets_used < profile_record.monthly_worksheet_limit THEN
    UPDATE profiles 
    SET monthly_worksheets_used = monthly_worksheets_used + 1,
        total_worksheets_created = total_worksheets_created + 1
    WHERE id = user_id;
    RETURN TRUE;
  ELSIF profile_record.available_tokens > 0 THEN
    UPDATE profiles 
    SET available_tokens = available_tokens - 1,
        total_worksheets_created = total_worksheets_created + 1
    WHERE id = user_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## Performance Optimizations

### Frontend Optimizations
- **Code splitting**: Route-based lazy loading
- **React Query caching**: Reduced API calls
- **Optimistic updates**: Immediate UI feedback
- **Memoization**: React.memo and useMemo for expensive operations

### Backend Optimizations
- **Database indexes**: On frequently queried columns
- **Row Level Security**: Efficient access control
- **Edge Functions**: Serverless auto-scaling
- **CDN delivery**: Fast global content delivery

### Caching Strategy
```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  }
});
```

## Security Considerations

### Data Protection
- **Encryption at rest**: Supabase handles database encryption
- **HTTPS only**: All communications encrypted in transit
- **Environment variables**: Sensitive data in secure storage
- **API key rotation**: Regular security key updates

### Access Control
```sql
-- Row Level Security example
CREATE POLICY "Users can only access their own data" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only manage their students" ON students
  FOR ALL USING (auth.uid() = user_id);
```

### Content Security
- **Input validation**: All user inputs sanitized
- **XSS prevention**: Content escaping in templates
- **CSRF protection**: Built into Supabase Auth
- **Rate limiting**: API request throttling

## Monitoring & Analytics

### Error Tracking
```typescript
// Comprehensive error boundaries
class WorksheetErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Worksheet generation error:', error, errorInfo);
    // Report to monitoring service
  }
}
```

### Performance Monitoring
- **Core Web Vitals**: Loading performance tracking
- **User interactions**: Button clicks and form submissions
- **API response times**: Generation and download speeds
- **Error rates**: Failed generations and payment issues

### Business Metrics
- **User registration**: Account creation funnel
- **Feature adoption**: Student addition and generation rates
- **Revenue tracking**: Subscription conversions and upgrades
- **Usage patterns**: Worksheets per user and retention

## Deployment & Infrastructure

### Production Environment
- **Vercel/Netlify**: Frontend hosting with global CDN
- **Supabase**: Managed backend with auto-scaling
- **Stripe**: PCI-compliant payment processing
- **Domain management**: Custom domains supported

### Development Workflow
```bash
# Local development
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
```

### Environment Configuration
```typescript
// Environment variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Testing Strategy

### Unit Testing
- **Component testing**: React Testing Library
- **Hook testing**: Custom hook validation
- **Utility testing**: Pure function verification
- **Edge case coverage**: Error handling validation

### Integration Testing
- **API endpoint testing**: Full request/response cycles
- **Database testing**: CRUD operations validation
- **Payment testing**: Stripe test mode integration
- **Email testing**: Supabase email functionality

### User Acceptance Testing
- **User journey testing**: Complete workflows
- **Cross-browser testing**: Major browser compatibility
- **Mobile testing**: Responsive design validation
- **Performance testing**: Load and stress testing

## Maintenance & Updates

### Code Maintenance
- **Dependency updates**: Regular package updates
- **Security patches**: Immediate security fix deployment
- **Performance optimization**: Continuous improvement
- **Refactoring**: Code quality improvement cycles

### Feature Development
- **Feature flags**: Gradual rollout capabilities
- **A/B testing**: User experience optimization
- **Backward compatibility**: Seamless user experience
- **Documentation updates**: Continuous documentation maintenance

---

**Current Version**: ETAP 2 - MVP Konta i Subskrypcje
**Last Updated**: ETAP 2 Completion
**Next Major Release**: ETAP 3 - Advanced Features
**Maintenance Schedule**: Continuous deployment with weekly reviews

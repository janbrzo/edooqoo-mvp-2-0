
# Technical Documentation - English Worksheet Generator

## Project Overview
Advanced AI-powered worksheet generator for English teachers working with adult students in one-on-one settings. Built with modern web technologies and integrated payment system.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** as build tool
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Lucide React** for icons

### Backend
- **Supabase** as Backend-as-a-Service
- **Edge Functions** for serverless computing
- **PostgreSQL** database
- **Row Level Security (RLS)** for data protection

### AI Integration
- **OpenAI GPT API** for worksheet generation
- Custom prompts optimized for educational content
- Token management (max 6500 tokens)

### Payment System
- **Stripe** integration for one-time payments ($1 USD)
- Session-based download unlocking
- Secure payment processing via Edge Functions

### Analytics & Tracking
- Custom event tracking system
- User journey analytics
- Conversion funnel monitoring
- Geographic data collection

## Architecture

### Database Schema

#### Core Tables
- `worksheets` - Generated worksheet data and metadata
- `feedbacks` - User ratings and comments
- `export_payments` - Payment records and status
- `download_sessions` - Temporary download permissions
- `user_events` - Comprehensive event tracking

#### Key Functions
- `insert_worksheet_bypass_limit()` - Worksheet creation without limits
- `track_user_event()` - Event logging
- `increment_worksheet_download_count()` - Download statistics

### Edge Functions
- `generateWorksheet` - AI-powered worksheet creation
- `create-export-payment` - Stripe payment session creation
- `verify-export-payment` - Payment verification
- `track-user-event` - Analytics data collection
- `submitFeedback` - User feedback processing

### Frontend Components

#### Core Components
- `WorksheetForm` - Main input form with validation
- `WorksheetDisplay` - Generated content presentation
- `WorksheetToolbar` - View switching and download controls
- `PaymentPopup` - Stripe payment integration
- `GeneratingModal` - Loading state management

#### Exercise Types
- Multiple Choice (`ExerciseMultipleChoice`)
- Fill in the Blanks (`ExerciseFillInBlanks`)
- Reading Comprehension (`ExerciseReading`)
- Dialogue Practice (`ExerciseDialogue`)
- Matching Exercises (`ExerciseMatching`)

### State Management
- Custom hooks for worksheet state (`useWorksheetState`)
- Anonymous authentication (`useAnonymousAuth`)
- Event tracking (`useEventTracking`)
- Download status management (`useDownloadStatus`)

## API Endpoints

### Supabase Edge Functions
```
POST /generateWorksheet
- Generates AI-powered worksheets
- Rate limiting: IP-based
- Authentication: Anonymous users
- Response: JSON worksheet structure

POST /create-export-payment
- Creates Stripe checkout session
- Parameters: worksheetId, userId, success/cancel URLs
- Returns: Stripe session URL

POST /verify-export-payment
- Verifies payment completion
- Returns: Download session token

POST /track-user-event
- Logs user interactions
- Parameters: event_type, event_data, user_identifier
```

## Security Features

### Data Protection
- Row Level Security (RLS) on all tables
- Secure Edge Functions with input validation
- IP-based rate limiting
- SQL injection prevention

### Payment Security
- Stripe-certified payment processing
- Secure webhook handling
- Token-based download authorization
- Session expiration (24 hours)

## Performance Optimization

### Frontend
- Lazy loading of components
- Image optimization
- Bundle splitting
- Service Worker for caching

### Backend
- Database indexing on frequent queries
- Connection pooling
- Edge function optimization
- CDN for static assets

## Development Workflow

### Environment Setup
```bash
npm install
npm run dev
```

### Database Management
```bash
# Run migrations
supabase db push

# Reset database
supabase db reset
```

### Deployment
- Automated deployment via Lovable platform
- Environment variables managed in Supabase
- Edge functions deployed automatically

## Monitoring & Analytics

### Key Metrics
- Worksheet generation rate
- Payment conversion rate
- User retention
- Geographic distribution
- Error rates

### Logging
- Comprehensive error logging
- Performance monitoring
- User journey tracking
- Payment transaction logs

## Configuration

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access key
- `OPENAI_API_KEY` - AI service authentication
- `STRIPE_SECRET_KEY` - Payment processing

### Feature Flags
- Payment system (currently active)
- Mock data fallback (development)
- Rate limiting (production)
- Analytics tracking (active)

## Troubleshooting

### Common Issues
1. **JSON Parsing Errors** - Increase max_tokens limit
2. **Payment Failures** - Check Stripe configuration
3. **Generation Timeouts** - Optimize AI prompts
4. **CORS Issues** - Verify domain configuration

### Debug Tools
- Browser console for frontend issues
- Supabase logs for backend errors
- Stripe dashboard for payment issues
- Edge function logs for AI generation problems

## Testing

### Manual Testing
- Cross-browser compatibility
- Mobile responsiveness
- Payment flow testing
- Error handling validation

### Automated Testing
- Component unit tests (planned)
- Integration tests (planned)
- E2E testing (planned)

## Maintenance

### Regular Tasks
- Database cleanup (test data)
- Log rotation
- Performance monitoring
- Security updates

### Backup Strategy
- Automated database backups
- Code repository backups
- Configuration backups
- Regular restore testing

## Future Technical Improvements
- Component test suite implementation
- Performance monitoring dashboard
- Automated error alerting
- Advanced caching strategies
- Progressive Web App features

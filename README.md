# BLU Networking App

A comprehensive PWA networking app for BLU (blunetworking.com) with AI-powered connection suggestions, event management, proximity-based meetup features, and everything a business networker needs to grow their connections.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, Database, Real-time, Edge Functions)
- **AI:** Groq API (Llama 4 Maverick)
- **Payments:** Stripe
- **Deployment:** Vercel
- **PWA:** Vite PWA plugin

## Features

- **User Profiles** - Rich business profiles with skills, goals, and offers
- **AI Connection Suggestions** - Smart matching powered by Llama 4 Maverick
- **Event Management** - Recurring and one-time events with RSVP
- **Proximity Alerts** - Get notified when members are nearby
- **Real-time Messaging** - Direct and group chat
- **Gamification** - Badges, streaks, and leaderboards
- **Admin Dashboard** - Member and event management

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Stripe account
- Groq API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd blu-networking
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the migration from `supabase/migrations/0001_initial_schema.sql`
   - Copy your project URL and anon key to `.env`

5. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key
GROQ_API_KEY=your-groq-api-key
VITE_APP_URL=http://localhost:5173
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run lint
```

## Database Schema

The database schema is defined in `supabase/migrations/0001_initial_schema.sql`. Key tables include:

- `profiles` - User profiles (extends Supabase auth.users)
- `user_skills`, `user_goals`, `user_offers` - Profile details
- `connections` - User connections
- `events`, `event_registrations` - Event management
- `messages`, `conversations` - Messaging
- `ai_suggestions` - AI-powered connection suggestions
- `user_badges`, `user_streaks` - Gamification

## Project Structure

```
blu-networking/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── ui/            # shadcn components
│   │   ├── layout/        # Layout components
│   │   └── ...            # Feature components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities and clients
│   └── types/             # TypeScript types
├── supabase/
│   ├── migrations/        # Database migrations
│   └── functions/         # Edge functions
└── ...
```

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Add environment variables
3. Deploy

### Supabase

1. Run migrations on production database
2. Set up Edge Functions for AI suggestions and proximity alerts

## License

Private - BLU Networking

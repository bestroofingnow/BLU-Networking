# 🚀 BLU Networking - Deployment Guide

This guide will help you deploy your white-labeled networking platform to production.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ **Node.js 18+** installed
- ✅ **PostgreSQL database** (Neon, Supabase, or self-hosted)
- ✅ **Git** for version control
- ✅ Accounts created for external services (see below)

---

## 🔑 Required External Services

### 1. **Database - PostgreSQL** (REQUIRED)

You need a PostgreSQL database. We recommend **Neon** for simplicity.

**Option A: Neon (Recommended - Free tier available)**
1. Go to https://neon.tech
2. Sign up for a free account
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@host/database`)

**Option B: Supabase (Alternative - Free tier available)**
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string

**Option C: Self-hosted PostgreSQL**
- Install PostgreSQL 14+
- Create a database: `createdb blunetworking`
- Get connection string: `postgresql://localhost/blunetworking`

### 2. **Payment Processing - Stripe** (OPTIONAL - For membership dues & event tickets)

**Setup Steps:**
1. Go to https://stripe.com and create an account
2. Navigate to **Developers → API keys**
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
4. Create a webhook endpoint (see Stripe Webhooks section below)

**Why Stripe?**
- Industry standard for payment processing
- Built-in subscription management
- Automatic tax calculation
- PCI compliant (you don't handle card data)
- Excellent documentation

**Pricing:**
- No monthly fees
- 2.9% + $0.30 per successful transaction

### 3. **Email Service - Resend** (OPTIONAL - For bulk emails & notifications)

**Setup Steps:**
1. Go to https://resend.com and create an account
2. Verify your sending domain (e.g., notifications.yourorg.com)
3. Go to **API Keys** and create a new key
4. Copy the API key (starts with `re_`)

**Why Resend?**
- Modern, developer-friendly API
- 100 emails/day on free tier
- 3,000 emails/month for $20
- No complex setup
- Great deliverability

**Alternative: SendGrid**
- More established (owned by Twilio)
- 100 emails/day free tier
- Setup at https://sendgrid.com

### 4. **OpenAI API** (OPTIONAL - Already configured for networking tips)

If you want AI-powered networking tips:
1. Go to https://platform.openai.com
2. Create an API key
3. Add to environment variables

---

## 🌍 Environment Variables

Create a `.env` file in the project root:

```bash
# ============================================================================
# REQUIRED - Database
# ============================================================================
DATABASE_URL="postgresql://user:password@host:5432/database"

# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET="your-random-32-character-secret-here"

# ============================================================================
# OPTIONAL - Payment Processing (Stripe)
# ============================================================================
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_..."  # Use sk_live_... for production
STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Use pk_live_... for production

# Get this from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET="whsec_..."

# ============================================================================
# OPTIONAL - Email Service (Resend)
# ============================================================================
# Get this from: https://resend.com/api-keys
RESEND_API_KEY="re_..."

# Your verified sending domain
RESEND_FROM_EMAIL="notifications@yourorg.com"

# ============================================================================
# OPTIONAL - AI Features (OpenAI)
# ============================================================================
# Get this from: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-..."

# ============================================================================
# APPLICATION SETTINGS
# ============================================================================
# Production URL (for callbacks, webhooks, etc.)
APP_URL="https://yourapp.com"

# Node environment
NODE_ENV="production"

# Port (default: 5000)
PORT=5000
```

---

## 📦 Installation & Database Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Database

```bash
# Push schema to database (creates all tables)
npm run db:push
```

This will create all necessary tables:
- ✅ users, chapters
- ✅ organization_settings
- ✅ custom_roles, membership_tiers
- ✅ custom_field_definitions
- ✅ events, event_registrations
- ✅ geo_location_log
- ✅ leads, user_goals
- ✅ member_spotlights, member_messages
- ✅ board_meeting_minutes

### Step 3: Verify Database

```bash
# Check that tables were created
psql $DATABASE_URL -c "\dt"
```

You should see all tables listed.

---

## 🎨 Initial Setup

### First Login

The app automatically creates an admin user on first run:

**Default Admin Credentials:**
- Username: `admin`
- Password: `password123`

**🚨 IMPORTANT:** Change this password immediately after first login!

### Initial Configuration

After logging in as admin:

1. **Navigate to Organization Settings** (sidebar link)
2. Configure each tab:
   - **General**: Set contact info, timezone, welcome message
   - **Branding**: Upload logo, set colors
   - **Features**: Enable/disable features you need
   - **Roles**: Create custom roles (optional)
   - **Membership Tiers**: Set up pricing tiers (optional)
   - **Custom Fields**: Add fields to member profiles (optional)

---

## 💳 Stripe Integration Setup (If Using Payments)

### Step 1: Create Products in Stripe Dashboard

For membership tiers:
1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Name it (e.g., "Gold Membership")
4. Set price and billing interval
5. Copy the **Price ID** (starts with `price_`)

### Step 2: Configure Membership Tiers in App

1. Go to **Organization Settings → Membership Tiers**
2. Create a tier matching your Stripe product
3. Save the Stripe Price ID for reference

### Step 3: Set Up Stripe Webhooks

Stripe needs to notify your app about payment events:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set URL to: `https://yourapp.com/api/webhooks/stripe`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook Secret** to your `.env` file

### Step 4: Test in Development

Use Stripe CLI for local testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

### Payment Flow for Members

1. Member selects a membership tier
2. Clicks "Subscribe"
3. Stripe checkout modal appears
4. Member enters payment info
5. Payment processed
6. Webhook confirms success
7. Member's account is upgraded

---

## 📧 Email Integration Setup (If Using Bulk Emails)

### Step 1: Verify Domain with Resend

1. Go to https://resend.com/domains
2. Add your domain (e.g., `yourorg.com`)
3. Add DNS records they provide:
   - SPF record
   - DKIM record
   - DMARC record (optional)
4. Wait for verification (usually 5-15 minutes)

### Step 2: Create Sending Address

Common patterns:
- `notifications@yourorg.com`
- `noreply@yourorg.com`
- `hello@yourorg.com`

### Step 3: Test Email Sending

Use Resend's test mode first:

```bash
# Send test email via API
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_your_key' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "notifications@yourorg.com",
    "to": "your@email.com",
    "subject": "Test Email",
    "html": "<h1>Hello from BLU Networking!</h1>"
  }'
```

### Email Templates (Future Feature)

The app supports custom email templates. Once configured:
1. Create templates in the admin panel
2. Use variables like `{{firstName}}`, `{{organizationName}}`
3. Schedule campaigns to specific member groups

---

## 🏗️ Deployment Options

### Option 1: Replit (Easiest)

1. Fork this project on Replit
2. Add environment variables in Secrets tab
3. Click "Run"
4. Your app is live!

**Pros:**
- Zero config
- Free tier available
- Auto-scaling
- Built-in database options

**Cons:**
- Limited customization
- Shared resources on free tier

### Option 2: Vercel (Recommended for Frontend-Heavy Apps)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables
vercel env add DATABASE_URL
vercel env add STRIPE_SECRET_KEY
# ... add all others

# Deploy to production
vercel --prod
```

**Pros:**
- Excellent performance
- Free tier (generous)
- Auto HTTPS
- Great DX

**Cons:**
- Serverless limits (10s timeout on free tier)
- PostgreSQL needs external hosting

### Option 3: Railway (Recommended for Full-Stack Apps)

1. Go to https://railway.app
2. Connect your GitHub repo
3. Add PostgreSQL database (one click)
4. Add environment variables
5. Deploy!

**Pros:**
- Full-stack support
- Includes PostgreSQL hosting
- $5/month credit free
- Easy scaling

**Cons:**
- Costs more at scale

### Option 4: DigitalOcean App Platform

1. Go to https://cloud.digitalocean.com/apps
2. Create new app from GitHub
3. Select repository
4. Add environment variables
5. Deploy

**Pricing:**
- $5/month for basic app
- $7-15/month for managed PostgreSQL

### Option 5: Self-Hosted (VPS)

**Requirements:**
- Ubuntu 20.04+ server
- 1GB RAM minimum (2GB+ recommended)
- Node.js 18+
- PostgreSQL 14+
- Nginx or Caddy for reverse proxy

```bash
# On your server

# 1. Clone repository
git clone https://github.com/yourorg/BLU-Networking.git
cd BLU-Networking

# 2. Install dependencies
npm install

# 3. Set environment variables
nano .env  # Add all your variables

# 4. Build application
npm run build

# 5. Set up PM2 for process management
npm install -g pm2
pm2 start npm --name "blu-networking" -- start
pm2 startup
pm2 save

# 6. Set up Nginx reverse proxy
sudo nano /etc/nginx/sites-available/blu-networking
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name yourapp.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/blu-networking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourapp.com
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Change default admin password
- [ ] Use strong `SESSION_SECRET` (32+ random characters)
- [ ] Enable HTTPS (SSL/TLS certificate)
- [ ] Use production Stripe keys (not test keys)
- [ ] Set up database backups
- [ ] Enable database SSL connection
- [ ] Add rate limiting for API endpoints
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure CORS properly
- [ ] Review user permissions
- [ ] Test payment flows end-to-end
- [ ] Verify email deliverability
- [ ] Set up uptime monitoring

---

## 🧪 Testing Before Launch

### 1. Test User Registration

```bash
# Create test user
POST /api/register
{
  "username": "testuser",
  "password": "TestPass123!",
  "fullName": "Test User",
  "email": "test@example.com",
  "company": "Test Co",
  "title": "Tester"
}
```

### 2. Test Payment Flow (Stripe)

Use test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### 3. Test Email Sending

Send a test welcome email to yourself

### 4. Test Geo-Location Features

Use a mobile device to test:
- Event check-in with GPS
- Verify geo-fencing works

### 5. Load Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils  # Linux
brew install apr-util  # macOS

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 https://yourapp.com/
```

---

## 📊 Monitoring & Maintenance

### Set Up Logging

The app logs to console by default. For production:

**Option 1: Papertrail**
```bash
npm install winston winston-papertrail
```

**Option 2: LogRocket** (Frontend + Backend)
```bash
npm install logrocket
```

### Database Backups

**Neon:**
- Auto-backups included
- Point-in-time recovery available

**Self-hosted:**
```bash
# Daily backup cron job
0 2 * * * pg_dump $DATABASE_URL > /backups/blu_$(date +\%Y\%m\%d).sql
```

### Uptime Monitoring

**Free options:**
- UptimeRobot: https://uptimerobot.com
- Pingdom: https://pingdom.com (limited free tier)
- Better Uptime: https://betteruptime.com

**Setup:**
1. Add your app URL
2. Set check interval (5 minutes)
3. Add notification email/SMS

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check tables exist
psql $DATABASE_URL -c "\dt"

# Re-push schema if needed
npm run db:push
```

### Stripe Webhook Failures

```bash
# Check webhook logs in Stripe dashboard
# Verify webhook secret is correct
# Ensure /api/webhooks/stripe is accessible

# Test locally with Stripe CLI
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

### Email Not Sending

1. Verify domain DNS records
2. Check API key is correct
3. Ensure `from` address matches verified domain
4. Check spam folder
5. Review Resend dashboard for errors

### Session Issues

```bash
# Clear all sessions
psql $DATABASE_URL -c "TRUNCATE TABLE session"

# Regenerate SESSION_SECRET
openssl rand -base64 32
```

---

## 📈 Scaling Considerations

### When to Scale

Monitor these metrics:
- **Response time** > 500ms consistently
- **Database connections** > 80% of limit
- **Memory usage** > 80%
- **CPU usage** > 70% sustained

### Horizontal Scaling

Use load balancer (Nginx, HAProxy) with multiple app instances:

```bash
# Run multiple instances with PM2
pm2 start npm --name "blu-networking-1" -i max -- start
```

### Database Scaling

**Vertical scaling first:**
- Upgrade to larger database instance

**Then horizontal:**
- Read replicas for queries
- Connection pooling (PgBouncer)

### CDN for Static Assets

Use Cloudflare or CloudFront for:
- Images
- CSS/JS bundles
- Logo files

---

## 🎉 You're Ready to Launch!

Your white-labeled networking platform is now ready for production. Here's your launch checklist:

1. ✅ Database configured and migrated
2. ✅ Environment variables set
3. ✅ Admin account secured
4. ✅ Organization settings configured
5. ✅ Payment processing tested (if enabled)
6. ✅ Email delivery verified (if enabled)
7. ✅ SSL certificate installed
8. ✅ Monitoring set up
9. ✅ Backups configured
10. ✅ Load tested

**Need Help?**
- 📖 Check IMPLEMENTATION_SUMMARY.md for technical details
- 🐛 Open an issue on GitHub
- 📧 Contact your development team

**Happy Networking! 🚀**

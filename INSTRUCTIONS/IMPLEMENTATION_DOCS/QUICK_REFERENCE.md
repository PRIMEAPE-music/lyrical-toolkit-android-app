# 📝 QUICK REFERENCE GUIDE

Essential information for implementing the subscription system.

---

## 🔑 ENVIRONMENT VARIABLES

### Required in `.env` (Both Repos)

```bash
# Authentication (existing)
JWT_SECRET=your-jwt-secret
REFRESH_SECRET=your-refresh-secret

# Supabase (existing)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Stripe (new)
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_PRICE_ID=price_1...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs (new)
STRIPE_SUCCESS_URL=https://lyrical-toolkit.netlify.app/subscribe/success
STRIPE_CANCEL_URL=https://lyrical-toolkit.netlify.app/subscribe/cancel
```

---

## 🧪 TEST DATA

### Stripe Test Cards

```
✅ Successful Payment:
   4242 4242 4242 4242
   Exp: Any future date | CVC: Any 3 digits

🔐 Requires Authentication (3D Secure):
   4000 0025 0000 3155

❌ Payment Declined:
   4000 0000 0000 9995

💳 More test cards:
   https://stripe.com/docs/testing#cards
```

### Test User Data

```
Username: testuser
Email: test@example.com
Password: TestPass123!
```

---

## 📊 DATABASE SCHEMA QUICK VIEW

### subscriptions table
```sql
id                      UUID PRIMARY KEY
user_id                 UUID REFERENCES users(id)
stripe_customer_id      TEXT
stripe_subscription_id  TEXT UNIQUE
status                  TEXT (active, canceled, past_due, etc.)
current_period_end      TIMESTAMP
cancel_at_period_end    BOOLEAN
created_at             TIMESTAMP
```

### users table (new columns)
```sql
subscription_status    TEXT DEFAULT 'free'
cloud_storage_limit    INTEGER DEFAULT 5
```

---

## 🛠️ COMMON COMMANDS

### Local Development

```bash
# Start Stripe webhook listener (Terminal 1)
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Start Netlify Dev (Terminal 2)
netlify dev

# Build Android app
cd lyrical-toolkit-android-app
npm run build
npx cap sync android
npx cap open android
```

### Database Queries

```sql
-- Check active subscriptions
SELECT u.username, s.status, s.current_period_end
FROM users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active';

-- Check subscription events
SELECT event_type, created_at
FROM subscription_events
ORDER BY created_at DESC
LIMIT 10;

-- Reset test user (CAREFUL!)
DELETE FROM subscriptions WHERE user_id = 'user-id-here';
UPDATE users SET subscription_status = 'free', cloud_storage_limit = 5 
WHERE id = 'user-id-here';
```

---

## 🔗 API ENDPOINTS

### Netlify Functions

```
POST /.netlify/functions/create-checkout-session
Body: { userId: "uuid" }
Returns: { sessionId: "cs_...", url: "https://..." }

POST /.netlify/functions/check-subscription
Body: { userId: "uuid" }
Returns: { isSubscribed: boolean, cloudStorageLimit: number }

POST /.netlify/functions/cancel-subscription
Body: { userId: "uuid" }
Returns: { success: true, message: "..." }

POST /.netlify/functions/create-portal-session
Body: { userId: "uuid" }
Returns: { url: "https://..." }

POST /.netlify/functions/stripe-webhook
(Called by Stripe, not directly)
```

---

## 🎨 UI COMPONENT PROPS

### Settings Component

```javascript
<Settings
  darkMode={boolean}
  onClose={function}
  user={object}              // { id, username, email, createdAt }
  isAuthenticated={boolean}
  storageType={string}       // 'local' | 'database'
  onStorageTypeChange={function}
  onLogout={function}
/>
```

### SubscriptionSettings Component

```javascript
<SubscriptionSettings
  darkMode={boolean}
  user={object}              // { id, username, email }
/>
```

---

## 🚨 TROUBLESHOOTING QUICK FIXES

### "No such price"
```
❌ Problem: Wrong price ID or test vs live mode mismatch
✅ Fix: Verify STRIPE_PRICE_ID matches current mode (test/live)
```

### "Webhook signature verification failed"
```
❌ Problem: Wrong webhook secret
✅ Fix: 
   Local: Run `stripe listen` and update .env with new whsec_
   Production: Get secret from Stripe Dashboard → copy to Netlify
```

### "Subscription not updating"
```
❌ Problem: Webhook not firing or database not updating
✅ Fix:
   1. Check webhook endpoint is reachable
   2. Check Stripe Dashboard → Events for delivery status
   3. Check Netlify function logs
   4. Verify Supabase RLS policies
```

### "Browser not opening (Android)"
```
❌ Problem: Capacitor Browser not installed
✅ Fix:
   npm install @capacitor/browser
   npx cap sync
   Rebuild app
```

### "CORS errors"
```
❌ Problem: Missing CORS headers
✅ Fix: Ensure all functions include:
   {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
     'Access-Control-Allow-Methods': 'POST, OPTIONS'
   }
```

---

## 📈 MONITORING DASHBOARD

### Check These Daily (First Week)

**Stripe Dashboard:**
- Customers → See new signups
- Subscriptions → See active subscriptions
- Events → See webhook events

**Supabase:**
- Table Editor → subscriptions (check new rows)
- Table Editor → subscription_events (check webhook logs)
- Database → Logs (check for errors)

**Netlify:**
- Functions → Check logs for errors
- Deploys → Verify latest deploy succeeded
- Analytics → Monitor traffic

---

## 💰 REVENUE TRACKING

### Key Metrics to Track

```
Daily:
- New signups
- New subscriptions
- Conversion rate (signups → paid)
- Failed payments
- Cancellations

Weekly:
- MRR (Monthly Recurring Revenue)
- Churn rate
- Average customer lifetime
- Cloud storage usage

Monthly:
- Growth rate
- Customer acquisition cost
- Lifetime value
- Profit margin
```

### Simple Revenue Calculator

```javascript
// Get current MRR
const activeSubscriptions = 50; // from database
const pricePerMonth = 3;
const mrr = activeSubscriptions * pricePerMonth;
// = $150/month

// Project annual revenue
const arr = mrr * 12;
// = $1,800/year

// Calculate profit (99% margin after Stripe fees)
const profit = arr * 0.99;
// = $1,782/year
```

---

## 🔐 SECURITY CHECKLIST

- [ ] `.env` file in `.gitignore`
- [ ] Webhook signature verification enabled
- [ ] Row Level Security enabled in Supabase
- [ ] Service role key not exposed to client
- [ ] HTTPS only for production
- [ ] Test mode during development
- [ ] Live mode only in production

---

## 📱 PLATFORM-SPECIFIC NOTES

### Website
- Checkout opens in same window/tab
- User can pay directly
- Immediate feedback

### Android App
- Checkout opens in external browser
- Returns to app after payment
- Polls for subscription status

### Key Difference
```javascript
// Website
window.open(stripeUrl, '_blank');

// Android
import { Browser } from '@capacitor/browser';
Browser.open({ url: stripeUrl });
```

---

## 🎯 LAUNCH DAY CHECKLIST

**Before Launch:**
- [ ] Test entire flow with real card
- [ ] Cancel test subscription
- [ ] Switch Stripe to live mode
- [ ] Update all environment variables
- [ ] Configure production webhook
- [ ] Deploy both repos
- [ ] Test on production
- [ ] Set up monitoring alerts

**Launch Day:**
- [ ] Monitor Stripe Dashboard
- [ ] Watch Netlify function logs
- [ ] Check Supabase for errors
- [ ] Respond to first users quickly
- [ ] Document any issues

**After Launch:**
- [ ] Send welcome email to first subscribers
- [ ] Gather feedback
- [ ] Fix any bugs immediately
- [ ] Update documentation
- [ ] Plan next features

---

## 📞 SUPPORT TEMPLATES

### Welcome Email (First Subscriber)
```
Subject: Welcome to Lyrical Toolkit Pro! 🎉

Hi [name],

Thank you for becoming one of our first Pro subscribers!

Your account now has:
✅ Unlimited cloud storage
✅ Sync across all devices
✅ Automatic backups

If you have any questions or feedback, reply to this email.

Thanks for your support!
- [Your name]
```

### Cancellation Response
```
Subject: Sorry to see you go

Hi [name],

I noticed you canceled your Pro subscription. 
Your subscription will remain active until [date].

I'd love to know: what could we improve?
Your feedback helps make Lyrical Toolkit better.

You can always reactivate anytime from Settings.

Thanks,
- [Your name]
```

---

## 🔄 UPDATE WORKFLOW

### When Updating Subscription Features:

1. Update database schema (if needed)
2. Update Netlify functions
3. Update UI components
4. Test locally with Stripe test mode
5. Deploy to production
6. Monitor for issues
7. Document changes

---

## 📖 USEFUL LINKS

**Stripe:**
- Dashboard: https://dashboard.stripe.com
- Test Cards: https://stripe.com/docs/testing
- Webhook Testing: https://stripe.com/docs/webhooks/test

**Supabase:**
- Dashboard: https://app.supabase.com
- Documentation: https://supabase.com/docs

**Netlify:**
- Dashboard: https://app.netlify.com
- Functions: https://docs.netlify.com/functions/overview

---

## 🎓 LEARNING RESOURCES

**Understanding Stripe:**
- Stripe's official YouTube channel
- "Stripe Payments in 60 Minutes" tutorial
- Stripe's developer documentation

**Webhook Debugging:**
- Use Stripe CLI: `stripe listen`
- Check webhook delivery in Stripe Dashboard
- Test webhooks with `stripe trigger`

**Supabase Best Practices:**
- Row Level Security guide
- Database functions tutorial
- Real-time subscriptions docs

---

This quick reference should help you implement and maintain the subscription system efficiently! 🚀

# PHASE 6: TESTING & DEPLOYMENT

**Goal:** Test the complete subscription flow and deploy to production

**Estimated Time:** 1-2 hours

---

## 📋 OVERVIEW

This final phase covers:
- Local testing with Stripe test mode
- End-to-end subscription flow testing
- Deployment to Netlify
- Production Stripe configuration
- Monitoring and troubleshooting

---

## 🧪 LOCAL TESTING

### Step 1: Start Local Development

```bash
# Terminal 1: Start Stripe webhook listener
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Copy the webhook signing secret that appears (whsec_...)
# Add it to your .env file

# Terminal 2: Start Netlify Dev
netlify dev

# App should be running on http://localhost:8888
```

### Step 2: Test Subscription Flow

**Test Checklist:**

1. **Create Test User**
   - [ ] Sign up with test email
   - [ ] Verify user created in Supabase

2. **Check Initial Status**
   - [ ] Open Settings → Subscription
   - [ ] Should show "Free Plan"
   - [ ] Should show "5 songs" limit

3. **Start Subscription**
   - [ ] Click "Upgrade to Pro"
   - [ ] Stripe Checkout opens (website: same window, Android: new browser)
   - [ ] Use test card: `4242 4242 4242 4242`
   - [ ] Complete checkout

4. **Verify Webhook Processing**
   - [ ] Check Terminal 1 for webhook events
   - [ ] Should see: `checkout.session.completed`
   - [ ] Check Supabase: subscription row created
   - [ ] Check Supabase: user.subscription_status = 'active'

5. **Check Updated Status**
   - [ ] Return to app
   - [ ] Open Settings → Subscription
   - [ ] Should show "Cloud Storage Pro"
   - [ ] Should show "Unlimited" songs
   - [ ] Should show "Active" badge

6. **Test Cloud Storage**
   - [ ] Switch to Cloud Storage mode
   - [ ] Upload 10+ songs with audio
   - [ ] Should not hit any limits

7. **Test Cancellation**
   - [ ] Click "Manage Billing"
   - [ ] Stripe Portal opens
   - [ ] Cancel subscription
   - [ ] Should show "Cancels on [date]"

8. **Test Failed Payment**
   - [ ] In Stripe Dashboard, find test subscription
   - [ ] Force payment failure
   - [ ] Verify status updates to "past_due"

---

## 🚀 DEPLOYMENT TO NETLIFY

### Step 3: Configure Production Environment

1. **In Netlify Dashboard:**
   - Go to: Site Settings → Environment Variables
   - Add all production environment variables:

```
JWT_SECRET=[production-value]
REFRESH_SECRET=[production-value]
SUPABASE_URL=[production-url]
SUPABASE_SERVICE_KEY=[production-key]

# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_...  # Get from Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_ID=price_...  # Production price ID
STRIPE_WEBHOOK_SECRET=[we'll get this after webhook setup]

# URLs
STRIPE_SUCCESS_URL=https://lyrical-toolkit.netlify.app/subscribe/success
STRIPE_CANCEL_URL=https://lyrical-toolkit.netlify.app/subscribe/cancel
```

2. **Switch Stripe to Live Mode:**
   - In Stripe Dashboard, toggle "Test mode" to OFF
   - You'll see all your test data disappear (this is normal)
   - Create new product with same pricing: $3/month
   - Copy the new **live** Price ID

### Step 4: Deploy Both Repos

```bash
# Website repo (lyrical-toolkit)
cd lyrical-toolkit
git add .
git commit -m "feat: add subscription management"
git push origin main

# Android app repo (lyrical-toolkit-android-app)
cd ../lyrical-toolkit-android-app
git add .
git commit -m "feat: add subscription management"
git push origin main

# Netlify will auto-deploy from git push
```

### Step 5: Configure Production Webhook

1. In Stripe Dashboard (Live mode):
   - Go to: Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://lyrical-toolkit.netlify.app/.netlify/functions/stripe-webhook`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click "Add endpoint"

2. Copy webhook signing secret:
   - Click on the endpoint
   - Click "Reveal" under "Signing secret"
   - Copy the value (starts with `whsec_`)

3. Update Netlify environment:
   - Go to: Netlify Dashboard → Environment Variables
   - Update: `STRIPE_WEBHOOK_SECRET=whsec_[production-value]`
   - Redeploy site for changes to take effect

---

## ✅ PRODUCTION TESTING

### Step 6: Test with Real Cards

**IMPORTANT:** Use a real credit card for testing, but cancel immediately after testing!

1. **Create Real Account**
   - [ ] Sign up with real email
   - [ ] Verify email works

2. **Test Real Subscription**
   - [ ] Click "Upgrade to Pro"
   - [ ] Use real credit card
   - [ ] Complete checkout
   - [ ] Verify webhook processed (check Supabase)
   - [ ] Verify account upgraded

3. **Test Cloud Storage**
   - [ ] Upload songs to cloud
   - [ ] Verify sync works
   - [ ] Check from different device

4. **Cancel Test Subscription**
   - [ ] Open Settings → Subscription
   - [ ] Click "Manage Billing"
   - [ ] Cancel subscription
   - [ ] Verify cancellation works

---

## 📊 MONITORING & ANALYTICS

### Step 7: Set Up Monitoring

**Stripe Dashboard Monitoring:**
- View recent events: Developers → Events
- View customers: Customers
- View subscriptions: Subscriptions
- View failed payments: Payments → Failed

**Supabase Monitoring:**
```sql
-- Check active subscriptions
SELECT 
  u.username,
  u.email,
  s.status,
  s.current_period_end
FROM users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;

-- Check subscription events
SELECT 
  event_type,
  stripe_event_id,
  created_at
FROM subscription_events
ORDER BY created_at DESC
LIMIT 20;

-- Check revenue (number of active subs)
SELECT 
  COUNT(*) as active_subscriptions,
  COUNT(*) * 3 as monthly_revenue_usd
FROM subscriptions
WHERE status = 'active'
AND current_period_end > NOW();
```

**Netlify Function Logs:**
- Go to: Netlify Dashboard → Functions
- Click on each function to see logs
- Look for errors or webhook processing issues

---

## 🔧 TROUBLESHOOTING

### Common Issues & Solutions:

**1. "No such price"**
```
Problem: Using test price ID in production
Solution: Create new product in Live mode, copy new price ID
```

**2. "Webhook signature failed"**
```
Problem: Wrong webhook secret or expired
Solution: 
- Check STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
- Regenerate webhook secret if needed
- Update Netlify environment variable
```

**3. "Subscription not updating in app"**
```
Problem: Webhook not firing or database not updating
Solution:
- Check webhook endpoint is live: test with Stripe CLI
- Check Supabase logs for database errors
- Verify user_id metadata is being passed correctly
```

**4. "Browser not opening (Android)"**
```
Problem: Capacitor Browser not installed or configured
Solution:
- npm install @capacitor/browser
- npx cap sync
- Rebuild Android app
```

**5. "CORS errors in browser"**
```
Problem: Missing CORS headers in functions
Solution: Ensure all functions return proper headers:
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}
```

---

## 📱 ANDROID APP STORE DEPLOYMENT

### Step 8: Build & Deploy Android App

```bash
cd lyrical-toolkit-android-app

# Build production
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Build → Generate Signed Bundle/APK
# 2. Choose "Android App Bundle"
# 3. Sign with your keystore
# 4. Upload to Google Play Console
```

**Important for App Store:**
- App description should NOT mention "web checkout" or "cheaper on web"
- Button should say "Upgrade Account" not "Subscribe for $3/month"
- No price information in the app (only in browser)

---

## ✅ FINAL CHECKLIST

### Pre-Launch:
- [ ] All environment variables configured in Netlify
- [ ] Stripe switched to Live mode
- [ ] Production webhook configured and tested
- [ ] Database schema deployed to production Supabase
- [ ] Both repos deployed to Netlify
- [ ] Android app built and uploaded to Play Store

### Post-Launch:
- [ ] Test complete flow with real card
- [ ] Cancel test subscription
- [ ] Monitor first few real subscriptions
- [ ] Check webhook events processing correctly
- [ ] Verify database updates happening
- [ ] Test cancellation flow
- [ ] Set up Stripe email notifications

### Ongoing Monitoring:
- [ ] Check Stripe Dashboard daily for first week
- [ ] Monitor Netlify function logs
- [ ] Check Supabase for database errors
- [ ] Watch for failed payments
- [ ] Respond to support requests quickly

---

## 🎉 SUCCESS METRICS

After 1 week, check:
- Number of signups
- Number of subscriptions
- Conversion rate (signups → paid)
- Failed payments
- Cancellations
- Revenue

**Target Metrics (Conservative):**
- Week 1: 10-50 signups, 2-5 subscriptions
- Month 1: 100-500 signups, 20-50 subscriptions ($60-150 MRR)
- Month 3: 500-1500 signups, 100-300 subscriptions ($300-900 MRR)

---

## 📝 NOTES FOR CLAUDE CODE

**Key Reminders:**
- Always test in Stripe test mode first
- Use test cards: 4242 4242 4242 4242
- Verify webhooks are processing
- Check database updates after each webhook
- Monitor logs during initial launch

**Support Checklist:**
- Document common issues for users
- Create FAQ for subscription questions
- Have refund policy ready
- Monitor support requests closely

---

## 🎯 PROJECT COMPLETE!

Congratulations! You now have:
- ✅ Full subscription management system
- ✅ Stripe integration (avoiding app store fees)
- ✅ Web-based checkout
- ✅ Webhook automation
- ✅ Database-backed subscriptions
- ✅ Unified Settings UI
- ✅ Cloud storage limits enforced

**Next Steps:**
- Market your app!
- Gather user feedback
- Iterate on features
- Monitor growth

---

## 📚 ADDITIONAL RESOURCES

**Stripe Documentation:**
- Checkout Sessions: https://stripe.com/docs/payments/checkout
- Webhooks: https://stripe.com/docs/webhooks
- Customer Portal: https://stripe.com/docs/billing/subscriptions/customer-portal

**Supabase Documentation:**
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Functions: https://supabase.com/docs/guides/database/functions

**Netlify Documentation:**
- Functions: https://docs.netlify.com/functions/overview/
- Environment Variables: https://docs.netlify.com/environment-variables/overview/

---

## 💡 FUTURE ENHANCEMENTS

Consider adding later:
- Annual billing (20% discount)
- Team/collaboration plans ($7/month for 3 users)
- Usage analytics dashboard
- Email notifications for subscription events
- Promo codes and discounts
- Free trial period (7 days)
- Referral program

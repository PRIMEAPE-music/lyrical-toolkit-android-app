# PHASE 3: NETLIFY FUNCTIONS (BACKEND API)

**Goal:** Create serverless functions to handle subscription operations

**Estimated Time:** 1-2 hours

---

## 📋 OVERVIEW

This phase creates the backend API for managing subscriptions. We'll create:
- `create-checkout-session.js` - Start subscription flow
- `check-subscription.js` - Check user's subscription status
- `stripe-webhook.js` - Handle Stripe events
- `cancel-subscription.js` - Allow users to cancel
- `create-customer-portal.js` - Stripe's hosted billing page

All functions go in `netlify/functions/` in **BOTH REPOS**.

---

## 🔧 FUNCTION 1: Create Checkout Session

📁 **File: `netlify/functions/create-checkout-session.js`**

**Purpose:** Creates a Stripe Checkout session to start subscription

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getSupabaseClient } = require('./supabase-client');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    // Get user from database
    const supabase = getSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, username')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Check if user already has a Stripe customer ID
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId,
          username: user.username
        }
      });
      customerId = customer.id;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      metadata: {
        userId: userId
      },
      subscription_data: {
        metadata: {
          userId: userId
        }
      },
      allow_promotion_codes: true
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create checkout session',
        message: error.message
      })
    };
  }
};
```

---

## 🔍 FUNCTION 2: Check Subscription Status

📁 **File: `netlify/functions/check-subscription.js`**

**Purpose:** Returns user's current subscription status

```javascript
const { getSupabaseClient } = require('./supabase-client');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    const supabase = getSupabaseClient();

    // Get active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const isSubscribed = !!subscription;
    const cloudStorageLimit = isSubscribed ? 999999 : 5;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        isSubscribed,
        cloudStorageLimit,
        subscription: subscription || null
      })
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to check subscription',
        message: error.message
      })
    };
  }
};
```

---

## 🪝 FUNCTION 3: Stripe Webhook Handler

📁 **File: `netlify/functions/stripe-webhook.js`**

**Purpose:** Receives and processes Stripe events

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getSupabaseClient } = require('./supabase-client');

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  console.log('✅ Received Stripe event:', stripeEvent.type);

  const supabase = getSupabaseClient();

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        
        // Only handle subscriptions (not one-time payments)
        if (session.mode !== 'subscription') {
          break;
        }

        const userId = session.metadata.userId;
        const subscriptionId = session.subscription;

        // Get full subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Create subscription record
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
          });

        if (insertError) {
          console.error('Error inserting subscription:', insertError);
          throw insertError;
        }

        // Update user status
        await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            cloud_storage_limit: 999999
          })
          .eq('id', userId);

        console.log('✅ Subscription created for user:', userId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object;

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        // Update user status based on subscription status
        const userId = subscription.metadata.userId;
        if (userId) {
          await supabase
            .from('users')
            .update({
              subscription_status: subscription.status,
              cloud_storage_limit: subscription.status === 'active' ? 999999 : 5
            })
            .eq('id', userId);
        }

        console.log('✅ Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        const userId = subscription.metadata.userId;

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        // Update user status
        if (userId) {
          await supabase
            .from('users')
            .update({
              subscription_status: 'canceled',
              cloud_storage_limit: 5
            })
            .eq('id', userId);
        }

        console.log('✅ Subscription canceled for user:', userId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object;
        const subscriptionId = invoice.subscription;

        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId);

        console.log('⚠️ Payment failed for subscription:', subscriptionId);
        break;
      }

      default:
        console.log('ℹ️ Unhandled event type:', stripeEvent.type);
    }

    // Log event for debugging
    await supabase.from('subscription_events').insert({
      event_type: stripeEvent.type,
      stripe_event_id: stripeEvent.id,
      event_data: stripeEvent.data.object
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

---

## ❌ FUNCTION 4: Cancel Subscription

📁 **File: `netlify/functions/cancel-subscription.js`**

**Purpose:** Allows users to cancel their subscription

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getSupabaseClient } = require('./supabase-client');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    const supabase = getSupabaseClient();

    // Get active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !subscription) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No active subscription found' })
      };
    }

    // Cancel at period end (don't immediately cancel)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Subscription will be canceled at end of billing period',
        endsAt: subscription.current_period_end
      })
    };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to cancel subscription',
        message: error.message
      })
    };
  }
};
```

---

## 🎛️ FUNCTION 5: Create Customer Portal Session

📁 **File: `netlify/functions/create-portal-session.js`**

**Purpose:** Creates a link to Stripe's hosted billing portal

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getSupabaseClient } = require('./supabase-client');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    const supabase = getSupabaseClient();

    // Get customer ID
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !subscription) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No subscription found' })
      };
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: 'https://lyrical-toolkit.netlify.app/settings'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: session.url
      })
    };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create portal session',
        message: error.message
      })
    };
  }
};
```

---

## ✅ TESTING THE FUNCTIONS

### Test Locally:

```bash
# Start Netlify Dev
netlify dev

# Test create-checkout-session
curl -X POST http://localhost:8888/.netlify/functions/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"userId":"your-test-user-id"}'

# Test check-subscription
curl -X POST http://localhost:8888/.netlify/functions/check-subscription \
  -H "Content-Type: application/json" \
  -d '{"userId":"your-test-user-id"}'
```

---

## 📝 NOTES FOR CLAUDE CODE

**Key Points:**
- All functions use CORS headers (allow cross-origin requests)
- Error handling returns proper HTTP status codes
- Webhook function verifies Stripe signature for security
- Cancel doesn't immediately end subscription (cancel_at_period_end)
- Customer portal gives users full control over billing

**Common Issues:**
- Missing environment variables → Check `.env` and Netlify
- Webhook signature errors → Verify STRIPE_WEBHOOK_SECRET matches
- User not found → Ensure userId is valid UUID
- CORS errors → Check headers are included in all responses

---

## ➡️ NEXT PHASE

Once all functions are created and tested, proceed to **PHASE 4: Settings UI Components**

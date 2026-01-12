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

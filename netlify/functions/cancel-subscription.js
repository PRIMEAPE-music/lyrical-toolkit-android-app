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

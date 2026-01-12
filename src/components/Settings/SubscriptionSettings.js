import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Calendar,
  Crown
} from 'lucide-react';
import { openCheckoutSession, openCustomerPortal } from '../../utils/subscriptionHandler';

const SubscriptionSettings = ({ darkMode, user }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) throw new Error('Failed to check subscription');

      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();

      // Open Stripe Checkout (handles web vs mobile)
      await openCheckoutSession(url);

      // Poll for subscription status after 5 seconds
      setTimeout(() => {
        checkSubscription();
      }, 5000);
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) throw new Error('Failed to create portal session');

      const { url } = await response.json();

      // Open Stripe Customer Portal (handles web vs mobile)
      await openCustomerPortal(url);
    } catch (err) {
      console.error('Error opening portal:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`w-8 h-8 animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
    );
  }

  const isSubscribed = subscriptionStatus?.isSubscribed;
  const subscription = subscriptionStatus?.subscription;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Current Plan
        </h3>

        <div className={`p-6 rounded-lg border-2 ${
          isSubscribed
            ? darkMode
              ? 'bg-blue-900/20 border-blue-600'
              : 'bg-blue-50 border-blue-400'
            : darkMode
              ? 'bg-gray-700 border-gray-600'
              : 'bg-gray-50 border-gray-300'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <Crown className={`w-6 h-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
              ) : (
                <CreditCard className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              )}
              <div>
                <h4 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {isSubscribed ? 'Cloud Storage Pro' : 'Free Plan'}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {isSubscribed ? '$3.00/month' : '$0.00/month'}
                </p>
              </div>
            </div>

            {isSubscribed && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                darkMode
                  ? 'bg-green-900/30 text-green-400 border border-green-700'
                  : 'bg-green-100 text-green-700 border border-green-300'
              }`}>
                Active
              </span>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${
                isSubscribed
                  ? darkMode ? 'text-green-400' : 'text-green-600'
                  : darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {isSubscribed ? 'Unlimited' : '5'} songs with audio in cloud storage
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${
                isSubscribed
                  ? darkMode ? 'text-green-400' : 'text-green-600'
                  : darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {isSubscribed ? 'Sync' : 'No sync'} across all devices
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${
                isSubscribed
                  ? darkMode ? 'text-green-400' : 'text-green-600'
                  : darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {isSubscribed ? 'Automatic' : 'No'} backup
              </span>
            </div>
          </div>

          {isSubscribed && subscription && (
            <div className={`pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {subscription.cancel_at_period_end
                    ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          darkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-800'}`}>{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isSubscribed ? (
          <button
            onClick={handleUpgrade}
            disabled={processing}
            className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${
              processing
                ? darkMode
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5" />
                Upgrade to Pro - $3/month
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleManageBilling}
            disabled={processing}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                Manage Billing
              </>
            )}
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className={`p-4 rounded-lg ${
        darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
      }`}>
        <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
          {isSubscribed
            ? 'You can cancel anytime. Your subscription will remain active until the end of your billing period.'
            : 'Upgrade to unlock unlimited cloud storage and sync across all your devices!'
          }
        </p>
      </div>
    </div>
  );
};

export default SubscriptionSettings;

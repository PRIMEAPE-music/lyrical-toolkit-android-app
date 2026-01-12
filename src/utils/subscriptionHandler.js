import { Browser } from '@capacitor/browser';

/**
 * Detect if running in Capacitor (mobile app)
 */
export const isCapacitorApp = () => {
  return typeof window !== 'undefined' && window.Capacitor !== undefined;
};

/**
 * Open subscription checkout page
 * - Mobile: Opens in system browser (avoids app store fees)
 * - Web: Opens in new tab
 */
export const openCheckoutSession = async (url) => {
  if (isCapacitorApp()) {
    // Mobile: Open in external browser
    await Browser.open({
      url: url,
      presentationStyle: 'popover', // iOS shows as modal
      toolbarColor: '#1f2937' // Match app theme
    });
  } else {
    // Web: Open in new tab
    window.open(url, '_blank');
  }
};

/**
 * Open Stripe Customer Portal
 */
export const openCustomerPortal = async (url) => {
  if (isCapacitorApp()) {
    await Browser.open({
      url: url,
      presentationStyle: 'popover',
      toolbarColor: '#1f2937'
    });
  } else {
    window.open(url, '_blank');
  }
};

export default {
  isCapacitorApp,
  openCheckoutSession,
  openCustomerPortal
};

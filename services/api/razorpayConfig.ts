// Razorpay Configuration
// Replace these with your actual Razorpay test/live keys

export const RAZORPAY_CONFIG = {
  // Test Mode Keys (These are sample keys - replace with your actual test keys)
  TEST_KEY_ID: 'rzp_test_RFaiRhJO0t98Xi', // Replace with your actual test key
  TEST_KEY_SECRET: 'pl6qp734S4FrGK2kh0mooNOR', // Replace with your actual test secret
  
  // Live Mode Keys (Replace with your actual live keys)
  LIVE_KEY_ID: 'rzp_live_your_live_key_id', // Replace with your live key
  LIVE_KEY_SECRET: 'your_live_secret_key', // Replace with your live secret
  
  // App Configuration
  APP_NAME: 'E-Comm App',
  APP_LOGO: 'https://your-app-logo-url.com/logo.png', // Replace with your app logo URL
  
  // Environment (change to 'live' for production)
  ENVIRONMENT: 'test' as 'test' | 'live',
};

// Helper function to get current keys based on environment
export const getRazorpayKeys = () => {
  const isTest = RAZORPAY_CONFIG.ENVIRONMENT === 'test';
  return {
    keyId: isTest ? RAZORPAY_CONFIG.TEST_KEY_ID : RAZORPAY_CONFIG.LIVE_KEY_ID,
    keySecret: isTest ? RAZORPAY_CONFIG.TEST_KEY_SECRET : RAZORPAY_CONFIG.LIVE_KEY_SECRET,
  };
};

export default RAZORPAY_CONFIG;

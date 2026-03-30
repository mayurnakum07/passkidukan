// config/appConfig.ts
// Application Configuration - Centralized settings for the app

/**
 * MargERP API Configuration
 * - CompanyID: Your company ID for MargERP API
 * - DefaultCompanyID: Default company ID to use if not configured
 */
export const MARG_ERP_CONFIG = {
  // Set your company ID here - this is sent to MargERP API for banners
  CompanyID: '1', // Change this to your actual company ID
  
  // Backup company ID in case the primary is not set
  DefaultCompanyID: '1',
  
  // API endpoint
  BaseURL: 'https://margerpexitapi.margcompusoft.com',
  Endpoint: '/api/MargERPExit/GetMargERPExit',
  
  // Request parameters
  RequestDefaults: {
    DType: 'BANNER', // Type of advertisement
    Adtype: 'IMAGE', // Advertisement type  
    ImageYN: 'Y', // Include images in response
  },
};

/**
 * Get the company ID to use for MargERP API calls
 * Priority: Stored value > Config value > Default value
 */
export const getMargERPCompanyID = (): string => {
  return MARG_ERP_CONFIG.CompanyID || MARG_ERP_CONFIG.DefaultCompanyID;
};

/**
 * Set the company ID for MargERP API calls
 * This overrides the default config value
 */
export const setMargERPCompanyID = (companyID: string): void => {
  MARG_ERP_CONFIG.CompanyID = companyID;
  console.log('✅ MargERP Company ID updated:', companyID);
};

/**
 * Other app configurations
 */
export const APP_CONFIG = {
  // App name
  AppName: 'E-Commerce Expo',
  
  // Version
  Version: '1.0.0',
  
  // Build number
  BuildNumber: '1',
  
  // Debug mode
  DebugMode: true,
  
  // API timeout (in milliseconds)
  APITimeout: 15000,
  
  // Enable/disable features
  Features: {
    EnableBannerSlider: true,
    EnableVoiceSearch: true,
    EnableQRScanner: true,
    EnablePrescriptionUpload: true,
    EnableRazorpayPayment: true,
  },
};

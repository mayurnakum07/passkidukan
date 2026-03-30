import deepLinkingService from '../services/deepLinkingService';

interface StoreQRCodeData {
  storeId: string;
  storeName?: string;
  storeType?: 'grocery' | 'pharma';
  storeAddress?: string;
}

/**
 * Generate QR code data and deep links for a store
 */
export const generateStoreDeepLinks = (storeData: StoreQRCodeData) => {
  const { storeId, storeName, storeType } = storeData;
  
  // Generate all possible deep link formats
  const deepLinks = deepLinkingService.generateStoreDeepLink(storeId, storeType, storeName);
  
  return {
    // QR Code data (use the shortened URL for QR codes)
    qrCodeData: deepLinks.qrUrl,
    
    // All deep link formats
    deepLinks: {
      customScheme: deepLinks.customScheme,
      httpsUrl: deepLinks.httpsUrl,
      qrUrl: deepLinks.qrUrl,
    },
    
    // QR Code configuration
    qrCodeConfig: {
      data: deepLinks.qrUrl,
      size: 256,
      color: '#000000',
      backgroundColor: '#FFFFFF',
      errorCorrectionLevel: 'M' as const,
    },
    
    // App store URLs for fallback
    appStoreUrls: deepLinkingService.getAppStoreUrls(),
  };
};

/**
 * Generate QR code data for multiple stores
 */
export const generateBulkStoreQRCodes = (stores: StoreQRCodeData[]) => {
  return stores.map(store => ({
    storeId: store.storeId,
    storeName: store.storeName,
    qrData: generateStoreDeepLinks(store),
  }));
};

/**
 * Validate store deep link URL
 */
export const validateStoreDeepLink = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    
    // Check if it's one of our supported domains
    const supportedHosts = [
      'stores.yourdomain.com',
      'ecomm-stores.com',
      'qr.ecomm.com'
    ];
    
    if (supportedHosts.includes(parsed.hostname)) {
      // Check if it has store path
      return parsed.pathname.startsWith('/store/') || parsed.pathname.startsWith('/s/');
    }
    
    // Check custom scheme
    if (parsed.protocol === 'ecomm:' && parsed.hostname === 'store') {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Extract store ID from deep link URL
 */
export const extractStoreIdFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    
    // Handle custom scheme
    if (parsed.protocol === 'ecomm:' && parsed.hostname === 'store') {
      return parsed.pathname.replace('/', '');
    }
    
    // Handle HTTPS URLs
    const path = parsed.pathname;
    
    // Pattern: /store/{storeId}
    const storeMatch = path.match(/^\/store\/(.+)$/);
    if (storeMatch) {
      return storeMatch[1];
    }
    
    // Pattern: /s/{storeId}
    const shortMatch = path.match(/^\/s\/(.+)$/);
    if (shortMatch) {
      return shortMatch[1];
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Generate QR code for store (for admin/merchant use)
 */
export const generateStoreQRCode = (storeId: string, options?: {
  storeName?: string;
  storeType?: 'grocery' | 'pharma';
  size?: number;
  format?: 'svg' | 'png' | 'jpeg';
}): {
  qrCodeUrl: string;
  deepLinkUrl: string;
  downloadUrl: string;
} => {
  const { storeName, storeType, size = 256, format = 'png' } = options || {};
  
  const deepLinks = deepLinkingService.generateStoreDeepLink(storeId, storeType, storeName);
  
  // Generate QR code URL (you can use any QR code service)
  const qrCodeService = 'https://api.qrserver.com/v1/create-qr-code/';
  const qrParams = new URLSearchParams({
    size: `${size}x${size}`,
    data: deepLinks.qrUrl,
    format: format,
    margin: '10',
    color: '000000',
    bgcolor: 'FFFFFF',
  });
  
  return {
    qrCodeUrl: `${qrCodeService}?${qrParams.toString()}`,
    deepLinkUrl: deepLinks.qrUrl,
    downloadUrl: `${qrCodeService}?${qrParams.toString()}&download=1`,
  };
};

export default {
  generateStoreDeepLinks,
  generateBulkStoreQRCodes,
  validateStoreDeepLink,
  extractStoreIdFromUrl,
  generateStoreQRCode,
};

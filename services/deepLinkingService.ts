import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

interface StoreDeepLinkParams {
  storeId: string;
  storeType?: 'grocery' | 'pharma';
  storeName?: string;
}

interface DeepLinkResult {
  type: 'store' | 'unknown';
  params?: StoreDeepLinkParams;
  originalUrl: string;
}

class DeepLinkingService {
  private readonly playStoreUrl = 'https://play.google.com/store/apps/details?id=com.yourcompany.ecommexpo';
  private readonly appStoreUrl = 'https://apps.apple.com/app/e-comm-expo/id1234567890';
  private readonly apiBaseUrl = 'https://passkidukaanapi.margerp.com'; // Your domain

  /**
   * Parse deep link URL and extract store information
   */
  parseDeepLink(url: string): DeepLinkResult {
    console.log('🔗 Parsing deep link:', url);

    try {
      // Parse the URL
      const parsed = Linking.parse(url);
      console.log('🔗 Parsed URL:', parsed);

      // Handle custom scheme: ecomm://store/{storeId} and paaskidukaan://store/{storeId}
      if (parsed.scheme === 'ecomm' || parsed.scheme === 'paaskidukaan') {
        console.log('🔗 Custom scheme detected:', parsed);
        if (parsed.hostname === 'store' && parsed.path) {
          const storeId = parsed.path.replace('/', '');
          console.log('🔗 Store ID extracted:', storeId);
          return {
            type: 'store',
            params: { storeId },
            originalUrl: url
          };
        }
      }

      // Handle HTTPS URLs: https://stores.yourdomain.com/store/{storeId}
      if (parsed.scheme === 'https') {
        console.log('🔗 HTTPS scheme detected:', parsed);
        const path = parsed.path || '';
        console.log('🔗 Path:', path);
        
        // Pattern: /store/{storeId}
        const storeMatch = path.match(/^\/store\/(.+)$/);
        if (storeMatch) {
          const storeId = storeMatch[1];
          console.log('🔗 Store ID extracted from HTTPS:', storeId);
          return {
            type: 'store',
            params: { 
              storeId,
              storeType: this.extractStoreTypeFromUrl(url),
              storeName: this.extractStoreNameFromUrl(url)
            },
            originalUrl: url
          };
        }

        // Pattern: /s/{storeId} (shortened QR code URLs)
        const shortMatch = path.match(/^\/s\/(.+)$/);
        if (shortMatch) {
          const storeId = shortMatch[1];
          console.log('🔗 Store ID extracted from short URL:', storeId);
          return {
            type: 'store',
            params: { 
              storeId,
              storeType: this.extractStoreTypeFromUrl(url),
              storeName: this.extractStoreNameFromUrl(url)
            },
            originalUrl: url
          };
        }

        // Pattern: /dl/{storeId} (API domain deep link)
        const dlMatch = path.match(/^\/dl\/(.+)$/);
        if (dlMatch) {
          const storeId = dlMatch[1];
          console.log('🔗 Store ID extracted from API /dl path:', storeId);
          return {
            type: 'store',
            params: {
              storeId,
              storeType: this.extractStoreTypeFromUrl(url),
              storeName: this.extractStoreNameFromUrl(url)
            },
            originalUrl: url
          };
        }
      }

      return {
        type: 'unknown',
        originalUrl: url
      };

    } catch (error) {
      console.error('  Error parsing deep link:', error);
      return {
        type: 'unknown',
        originalUrl: url
      };
    }
  }

  /**
   * Extract store type from URL parameters or path
   */
  private extractStoreTypeFromUrl(url: string): 'grocery' | 'pharma' | undefined {
    try {
      const urlObj = new URL(url);
      
      // Check query parameters
      const type = urlObj.searchParams.get('type');
      if (type === 'grocery' || type === 'pharma') {
        return type;
      }

      // Check path for store type indicators
      if (url.includes('/grocery/') || url.includes('/store/grocery/')) {
        return 'grocery';
      }
      if (url.includes('/pharma/') || url.includes('/store/pharma/')) {
        return 'pharma';
      }

      return undefined;
    } catch (error) {
      console.error('  Error extracting store type:', error);
      return undefined;
    }
  }

  /**
   * Extract store name from URL parameters
   */
  private extractStoreNameFromUrl(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('name') || undefined;
    } catch (error) {
      console.error('  Error extracting store name:', error);
      return undefined;
    }
  }

  /**
   * Handle deep link when app is not installed
   * Redirect to appropriate app store
   */
  async handleAppNotInstalled(url: string): Promise<void> {
    console.log('📱 App not installed, redirecting to app store for URL:', url);
    
    try {
      // Parse the deep link to show relevant information
      const deepLinkResult = this.parseDeepLink(url);
      
      if (deepLinkResult.type === 'store' && deepLinkResult.params) {
        const { storeId, storeName } = deepLinkResult.params;
        
        // Show a web page with store info and app download links
        const webPageUrl = this.createStoreWebPage(storeId, storeName);
        
        await WebBrowser.openBrowserAsync(webPageUrl);
      } else {
        // Generic app download page
        await WebBrowser.openBrowserAsync(this.createGenericAppDownloadPage());
      }
    } catch (error) {
      console.error('  Error handling app not installed:', error);
      // Fallback to generic app store
      await WebBrowser.openBrowserAsync(this.playStoreUrl);
    }
  }

  /**
   * Create a web page for store-specific app download
   */
  private createStoreWebPage(storeId: string, storeName?: string): string {
    const encodedStoreName = storeName ? encodeURIComponent(storeName) : '';
    return `https://ecomm-stores.com/download?storeId=${storeId}&storeName=${encodedStoreName}`;
  }

  /**
   * Create a generic app download page
   */
  private createGenericAppDownloadPage(): string {
    return 'https://ecomm-stores.com/download';
  }

  /**
   * Get app store URLs for different platforms
   */
  getAppStoreUrls() {
    return {
      playStore: this.playStoreUrl,
      appStore: this.appStoreUrl
    };
  }

  /**
   * Generate store-specific deep link URLs
   */
  generateStoreDeepLink(storeId: string, storeType?: 'grocery' | 'pharma', storeName?: string): {
    customScheme: string;
    httpsUrl: string;
    qrUrl: string;
  } {
    const baseParams = storeType ? `?type=${storeType}` : '';
    const nameParam = storeName ? `${baseParams ? '&' : '?'}name=${encodeURIComponent(storeName)}` : '';
    const queryParams = baseParams + nameParam;

    return {
      customScheme: `ecomm://store/${storeId}`,
      httpsUrl: `https://stores.yourdomain.com/store/${storeId}${queryParams}`,
      qrUrl: `https://qr.ecomm.com/s/${storeId}${queryParams}`
    };
  }

  /**
   * Listen for incoming deep links
   */
  async getInitialURL(): Promise<string | null> {
    try {
      const url = await Linking.getInitialURL();
      console.log('🔗 Initial deep link URL:', url);
      return url;
    } catch (error) {
      console.error('  Error getting initial URL:', error);
      return null;
    }
  }

  /**
   * Fetch store details by store ID from your API
   */
  async fetchStoreDetails(storeId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔍 Fetching store details for ID:', storeId);
      
      const response = await fetch(`${this.apiBaseUrl}/dl/${storeId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(' Store details fetched:', data);
        return { success: true, data: data.data };
      } else {
        console.error('  Store fetch failed:', response.status, response.statusText);
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error('  Error fetching store details:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Add listener for deep link events
   */
  addDeepLinkListener(callback: (url: string) => void): () => void {
    console.log('🔗 Setting up deep link listener in service');
    
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Deep link received in service:', url);
      console.log('🔗 Calling callback with URL:', url);
      callback(url);
    });

    console.log('🔗 Deep link listener subscription created');
    return () => {
      console.log('🔗 Removing deep link listener subscription');
      subscription?.remove();
    };
  }
}

export default new DeepLinkingService();

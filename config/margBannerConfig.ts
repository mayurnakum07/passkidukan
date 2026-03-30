// // // config/margBannerConfig.ts
// // // MargERP Banner Configuration Helper
// // // This file helps manage the MargERP banner API configuration

// // import { margBannerService } from '../services/api/margBannerService';
// // import { setMargERPCompanyID } from './appConfig';

// // /**
// //  * Initialize MargERP Banner Service
// //  * Call this in your App.tsx useEffect during app startup
// //  */
// // export const initializeMargBannerService = async (companyID?: string) => {
// //   try {
// //     console.log('🔧 Initializing MargERP Banner Service');
    
// //     if (companyID) {
// //       // Set custom company ID if provided
// //       await margBannerService.setCompanyID(companyID);
// //       setMargERPCompanyID(companyID);
// //       console.log('✅ MargERP Company ID set to:', companyID);
// //     } else {
// //       console.log('ℹ️ Using default MargERP Company ID from config');
// //     }
    
// //     // Optionally fetch banners during initialization to test connection
// //     console.log('ℹ️ Banner service ready for use');
// //     return true;
// //   } catch (error) {
// //     console.error('❌ Error initializing MargERP Banner Service:', error);
// //     return false;
// //   }
// // };

// // /**
// //  * Example usage in App.tsx:
// //  * 
// //  * useEffect(() => {
// //  *   initializeMargBannerService('YOUR_COMPANY_ID');
// //  * }, []);
// //  */

// // /**
// //  * Update Company ID at runtime
// //  */
// // export const updateMargCompanyID = async (companyID: string) => {
// //   try {
// //     await margBannerService.setCompanyID(companyID);
// //     setMargERPCompanyID(companyID);
// //     console.log('✅ Company ID updated:', companyID);
// //   } catch (error) {
// //     console.error('❌ Error updating company ID:', error);
// //   }
// // };

// // /**
// //  * Manual banner fetch for testing
// //  */
// // export const testMargBannerAPI = async () => {
// //   try {
// //     console.log('🧪 Testing MargERP Banner API...');
// //     const response = await margBannerService.getBanners();
    
// //     if (response.success) {
// //       console.log('✅ Test successful! Banners fetched:', response.data?.length);
// //       return response.data;
// //     } else {
// //       console.warn('⚠️ Test failed:', response.error);
// //       return null;
// //     }
// //   } catch (error) {
// //     console.error('❌ Test error:', error);
// //     return null;
// //   }
// // };


// // margBannerConfig.ts or index.ts (whichever you're importing from)
// import { margBannerService } from '../services/api/margBannerService';

// /**
//  * Initialize MargERP Banner Service
//  * Call this in your App.tsx useEffect during app startup
//  */
// export const initializeMargBannerService = async (companyID?: string) => {
//   try {
//     console.log('🔧 Initializing MargERP Banner Service');
    
//     if (companyID) {
//       console.log('ℹ️ Custom Company ID provided:', companyID);
//       margBannerService.setCompanyID(companyID);
//     } else {
//       console.log('ℹ️ Using default configuration');
//     }
    
//     // Test the connection by fetching banners
//     console.log('🧪 Testing MargERP API connection...');
//     const testBanners = await margBannerService.getBanners();
//     console.log('✅ Banner service initialized successfully');
//     console.log(`   Found ${testBanners.length} banner(s) from API`);
    
//     return true;
//   } catch (error) {
//     console.error('❌ Error initializing MargERP Banner Service:', error);
//     return false;
//   }
// };

// /**
//  * Manual banner fetch for testing
//  * Returns the banners array directly (not wrapped in ApiResponse)
//  */
// export const testMargBannerAPI = async () => {
//   try {
//     console.log('🧪 Testing MargERP Banner API...');
//     const banners = await margBannerService.getBanners();
    
//     if (banners && banners.length > 0) {
//       console.log('✅ Test successful! Banners fetched:', banners.length);
//       console.log('Sample banner:', {
//         id: banners[0].id,
//         storeType: banners[0].storeType,
//         hasImage: !!banners[0].imageUrl,
//         isActive: banners[0].isActive,
//       });
//       return banners;
//     } else {
//       console.warn('⚠️ Test returned 0 banners');
//       console.log('Possible reasons:');
//       console.log('  1. API returned no data');
//       console.log('  2. All banners filtered out (no image URLs)');
//       console.log('  3. Decryption/decompression failed');
//       return [];
//     }
//   } catch (error: any) {
//     console.error('❌ Test error:', error);
//     console.error('   Message:', error.message);
//     return [];
//   }
// };

// /**
//  * Test decryption with sample data
//  * Useful for debugging encryption issues
//  */
// export const testDecryptionOnly = async () => {
//   try {
//     console.log('🧪 Testing decryption independently...');
    
//     // Sample encrypted data from C# reference
//     const testEncryptedData = "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";
    
//     const { decryptAndDecompress } = await import('../utils/margCrypto');
    
//     const decrypted = decryptAndDecompress(testEncryptedData, '690QIDCX1WU1');
//     console.log('✅ Decryption successful');
//     console.log('   Decrypted length:', decrypted.length);
//     console.log('   First 100 chars:', decrypted.substring(0, 100));
    
//     return true;
//   } catch (error: any) {
//     console.error('❌ Decryption test failed:', error);
//     console.error('   Message:', error.message);
//     return false;
//   }
// };

// /**
//  * Get banner statistics
//  * Useful for debugging and monitoring
//  */
// export const getBannerStats = async () => {
//   try {
//     const banners = await margBannerService.getBanners();
    
//     const stats = {
//       total: banners.length,
//       byStoreType: {
//         grocery: banners.filter(b => b.storeType === 'grocery').length,
//         pharma: banners.filter(b => b.storeType === 'pharma').length,
//       },
//       active: banners.filter(b => b.isActive !== false).length,
//       inactive: banners.filter(b => b.isActive === false).length,
//       withImages: banners.filter(b => b.imageUrl).length,
//       withTitles: banners.filter(b => b.title).length,
//     };
    
//     console.log('📊 Banner Statistics:');
//     console.log('   Total:', stats.total);
//     console.log('   Grocery:', stats.byStoreType.grocery);
//     console.log('   Pharma:', stats.byStoreType.pharma);
//     console.log('   Active:', stats.active);
//     console.log('   With Images:', stats.withImages);
    
//     return stats;
//   } catch (error: any) {
//     console.error('❌ Error getting banner stats:', error);
//     return null;
//   }
// };

// // Export everything as a single object for convenience
// export const margBannerConfig = {
//   initializeMargBannerService,
//   testMargBannerAPI,
//   testDecryptionOnly,
//   getBannerStats,
//   margBannerService,
// };

// // Default export for convenience
// export default margBannerConfig;



// config/margBannerConfig.ts
import { margBannerService } from '../services/api/margBannerService';

export const initializeMargBannerService = async (companyID?: string): Promise<boolean> => {
  try {
    console.log('🔧 [CONFIG] Initializing MargERP Banner Service...');
    
    if (companyID) {
      console.log('   Setting Company ID:', companyID);
      margBannerService.setCompanyID(companyID);
    }
    
    console.log('🧪 [CONFIG] Testing API connection...');
    const banners = await margBannerService.getBanners();
    
    console.log('✅ [CONFIG] Banner service initialized successfully!');
    console.log(`   Found ${banners.length} banner(s)`);
    
    return true;
  } catch (error) {
    console.error('❌ [CONFIG] Failed to initialize:', error);
    return false;
  }
};

export const testMargBannerAPI = async () => {
  try {
    console.log('🧪 [TEST] Testing MargERP Banner API...');
    const banners = await margBannerService.getBanners();
    
    if (banners.length > 0) {
      console.log('✅ [TEST] Success! Got', banners.length, 'banners');
      return banners;
    } else {
      console.warn('⚠️ [TEST] Got 0 banners');
      return [];
    }
  } catch (error: any) {
    console.error('❌ [TEST] Error:', error.message);
    return [];
  }
};

export const getBannerStats = async () => {
  try {
    const banners = await margBannerService.getBanners();
    
    const stats = {
      total: banners.length,
      grocery: banners.filter(b => b.storeType === 'grocery').length,
      pharma: banners.filter(b => b.storeType === 'pharma').length,
      active: banners.filter(b => b.isActive).length,
      withImages: banners.filter(b => b.imageUrl).length,
    };
    
    console.log('📊 [STATS] Banner Statistics:');
    console.log('   Total:', stats.total);
    console.log('   Grocery:', stats.grocery);
    console.log('   Pharma:', stats.pharma);
    console.log('   Active:', stats.active);
    console.log('   With Images:', stats.withImages);
    
    return stats;
  } catch (error) {
    console.error('❌ [STATS] Error getting stats:', error);
    return null;
  }
};

// Export everything together
export const margBannerConfig = {
  initializeMargBannerService,
  testMargBannerAPI,
  getBannerStats,
  service: margBannerService,
};

export default margBannerConfig;
/**
 * Network Security Utilities
 * Handles SSL certificate validation and network security for HTTPS APIs
 */

import { Platform } from 'react-native';

/**
 * Check if we're in development mode
 */
export const isDevelopment = __DEV__;

/**
 * SSL Certificate Error Detection
 */
export interface SSLError {
  isSSLError: boolean;
  message: string;
  code?: string;
}

/**
 * Detect if an error is an SSL certificate error
 */
export function isSSLError(error: any): SSLError {
  if (!error) {
    return { isSSLError: false, message: 'Unknown error' };
  }

  const errorMessage = error.message || error.toString() || '';
  const errorCode = error.code || '';
  const errorName = error.name || '';

  // Common SSL error patterns
  const sslErrorPatterns = [
    'CertPathValidatorException',
    'SSLException',
    'javax.net.ssl.SSLHandshakeException',
    'javax.net.ssl.SSLPeerUnverifiedException',
    'Trust anchor for certification path not found',
    'Certificate validation failed',
    'SSL certificate problem',
    'self signed certificate',
    'certificate verify failed',
    'ERR_CERT_AUTHORITY_INVALID',
    'ERR_CERT_COMMON_NAME_INVALID',
    'ERR_CERT_DATE_INVALID',
  ];

  const isSSLError = sslErrorPatterns.some(pattern =>
    errorMessage.includes(pattern) ||
    errorCode.includes(pattern) ||
    errorName.includes(pattern)
  );

  return {
    isSSLError,
    message: errorMessage,
    code: errorCode || errorName,
  };
}

/**
 * Enhanced fetch wrapper with SSL error handling
 * For development: Provides better error messages
 * For production: Uses standard fetch
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return response;
  } catch (error: any) {
    const sslError = isSSLError(error);
    
    if (sslError.isSSLError && isDevelopment) {
      console.error('🔴 SSL Certificate Error Detected:');
      console.error('   URL:', url);
      console.error('   Error:', sslError.message);
      console.error('   Code:', sslError.code);
      console.error('');
      console.error('💡 Solutions:');
      console.error('   1. Ensure network_security_config.xml is properly configured');
      console.error('   2. Rebuild the Android app: npx expo run:android');
      console.error('   3. Check if API certificate is valid');
      console.error('   4. For development, ensure debug-overrides are enabled');
    }

    throw error;
  }
}

/**
 * Enhanced axios interceptor for SSL errors
 */
export function setupAxiosSSLInterceptor() {
  if (Platform.OS !== 'android' || !isDevelopment) {
    return;
  }

  // This will be handled by the axios instance configuration
  // See services/api/client.ts
}

/**
 * Get network security status
 */
export function getNetworkSecurityStatus(): {
  platform: string;
  isDevelopment: boolean;
  sslEnabled: boolean;
} {
  return {
    platform: Platform.OS,
    isDevelopment,
    sslEnabled: true, // Always enabled for HTTPS APIs
  };
}


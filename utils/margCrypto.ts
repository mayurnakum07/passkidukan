// // // // // // // // // // // // // // // // // utils/margCrypto.ts
// // // // // // // // // // // // // // // // import CryptoJS from 'crypto-js';
// // // // // // // // // // // // // // // // import pako from 'pako';

// // // // // // // // // // // // // // // // /**
// // // // // // // // // // // // // // // //  * Decrypt data using AES/Rijndael with the same settings as C# backend
// // // // // // // // // // // // // // // //  * Backend uses: RijndaelManaged with CBC mode, PKCS7 padding, 128-bit key and block size
// // // // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // // // export function decryptMargData(encryptedBase64: string, key: string): string {
// // // // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // // // //     console.log('🔐 Starting decryption...');
// // // // // // // // // // // // // // // //     console.log('   Encrypted data length:', encryptedBase64.length);
// // // // // // // // // // // // // // // //     console.log('   Key:', key);

// // // // // // // // // // // // // // // //     // Convert the key to bytes (UTF-8) and pad/truncate to 16 bytes (128 bits)
// // // // // // // // // // // // // // // //     const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
// // // // // // // // // // // // // // // //     const keyBytes = CryptoJS.lib.WordArray.create();
    
// // // // // // // // // // // // // // // //     // Copy up to 16 bytes from the key
// // // // // // // // // // // // // // // //     for (let i = 0; i < 4; i++) { // 4 words = 16 bytes
// // // // // // // // // // // // // // // //       if (i < keyUtf8.words.length) {
// // // // // // // // // // // // // // // //         keyBytes.words[i] = keyUtf8.words[i];
// // // // // // // // // // // // // // // //       } else {
// // // // // // // // // // // // // // // //         keyBytes.words[i] = 0;
// // // // // // // // // // // // // // // //       }
// // // // // // // // // // // // // // // //     }
// // // // // // // // // // // // // // // //     keyBytes.sigBytes = 16;

// // // // // // // // // // // // // // // //     // In the C# code, IV = Key (they use the same 16 bytes)
// // // // // // // // // // // // // // // //     const iv = keyBytes.clone();

// // // // // // // // // // // // // // // //     console.log('   Key prepared (16 bytes)');
// // // // // // // // // // // // // // // //     console.log('   IV = Key (same as C# implementation)');

// // // // // // // // // // // // // // // //     // Decrypt using AES (CryptoJS's AES is compatible with Rijndael when using 128-bit blocks)
// // // // // // // // // // // // // // // //     const decrypted = CryptoJS.AES.decrypt(
// // // // // // // // // // // // // // // //       encryptedBase64,
// // // // // // // // // // // // // // // //       keyBytes,
// // // // // // // // // // // // // // // //       {
// // // // // // // // // // // // // // // //         iv: iv,
// // // // // // // // // // // // // // // //         mode: CryptoJS.mode.CBC,
// // // // // // // // // // // // // // // //         padding: CryptoJS.pad.Pkcs7
// // // // // // // // // // // // // // // //       }
// // // // // // // // // // // // // // // //     );

// // // // // // // // // // // // // // // //     // Convert to UTF-8 string
// // // // // // // // // // // // // // // //     const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
// // // // // // // // // // // // // // // //     if (!decryptedString) {
// // // // // // // // // // // // // // // //       throw new Error('Decryption resulted in empty string');
// // // // // // // // // // // // // // // //     }

// // // // // // // // // // // // // // // //     console.log('✅ Decryption successful');
// // // // // // // // // // // // // // // //     console.log('   Decrypted length:', decryptedString.length);
// // // // // // // // // // // // // // // //     console.log('   First 100 chars:', decryptedString.substring(0, 100));

// // // // // // // // // // // // // // // //     return decryptedString;
// // // // // // // // // // // // // // // //   } catch (error) {
// // // // // // // // // // // // // // // //     console.error('❌ Decryption error:', error);
// // // // // // // // // // // // // // // //     throw new Error(`Failed to decrypt data: ${error}`);
// // // // // // // // // // // // // // // //   }
// // // // // // // // // // // // // // // // }

// // // // // // // // // // // // // // // // /**
// // // // // // // // // // // // // // // //  * Decompress data using DEFLATE algorithm (same as C# DeflateStream)
// // // // // // // // // // // // // // // //  * The C# backend uses DeflateStream with CompressionMode.Decompress
// // // // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // // // export function decompressMargData(compressedBase64: string): string {
// // // // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // // // //     console.log('🗜️ Starting decompression...');
// // // // // // // // // // // // // // // //     console.log('   Compressed data length:', compressedBase64.length);

// // // // // // // // // // // // // // // //     // Convert base64 to binary
// // // // // // // // // // // // // // // //     const compressedBytes = Uint8Array.from(atob(compressedBase64), c => c.charCodeAt(0));
// // // // // // // // // // // // // // // //     console.log('   Compressed bytes length:', compressedBytes.length);

// // // // // // // // // // // // // // // //     // Decompress using pako (DEFLATE algorithm)
// // // // // // // // // // // // // // // //     const decompressed = pako.inflate(compressedBytes, { to: 'string' });

// // // // // // // // // // // // // // // //     console.log('✅ Decompression successful');
// // // // // // // // // // // // // // // //     console.log('   Decompressed length:', decompressed.length);
// // // // // // // // // // // // // // // //     console.log('   First 100 chars:', decompressed.substring(0, 100));

// // // // // // // // // // // // // // // //     return decompressed;
// // // // // // // // // // // // // // // //   } catch (error) {
// // // // // // // // // // // // // // // //     console.error('❌ Decompression error:', error);
// // // // // // // // // // // // // // // //     throw new Error(`Failed to decompress data: ${error}`);
// // // // // // // // // // // // // // // //   }
// // // // // // // // // // // // // // // // }

// // // // // // // // // // // // // // // // /**
// // // // // // // // // // // // // // // //  * Try to decompress data, return original if decompression fails
// // // // // // // // // // // // // // // //  * Useful when you're not sure if the data is compressed
// // // // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // // // export function tryDecompress(data: string): string {
// // // // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // // // //     return decompressMargData(data);
// // // // // // // // // // // // // // // //   } catch (error) {
// // // // // // // // // // // // // // // //     console.log('⚠️ Decompression failed, returning original data');
// // // // // // // // // // // // // // // //     return data;
// // // // // // // // // // // // // // // //   }
// // // // // // // // // // // // // // // // }

// // // // // // // // // // // // // // // // /**
// // // // // // // // // // // // // // // //  * Full pipeline: decrypt then decompress (matching C# backend flow)
// // // // // // // // // // // // // // // //  * Use this when the backend does: Compress -> Encrypt
// // // // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // // // export function decryptAndDecompress(encryptedData: string, key: string): string {
// // // // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // // // //     // Step 1: Decrypt
// // // // // // // // // // // // // // // //     const decrypted = decryptMargData(encryptedData, key);
    
// // // // // // // // // // // // // // // //     // Step 2: Decompress
// // // // // // // // // // // // // // // //     const decompressed = decompressMargData(decrypted);
    
// // // // // // // // // // // // // // // //     return decompressed;
// // // // // // // // // // // // // // // //   } catch (error) {
// // // // // // // // // // // // // // // //     console.error('❌ Decrypt and decompress pipeline error:', error);
// // // // // // // // // // // // // // // //     throw error;
// // // // // // // // // // // // // // // //   }
// // // // // // // // // // // // // // // // }


// // // // // // // // // // // // // // // // utils/margCrypto.ts - FIXED TO MATCH C# IMPLEMENTATION
// // // // // // // // // // // // // // // import CryptoJS from 'crypto-js';
// // // // // // // // // // // // // // // import pako from 'pako';

// // // // // // // // // // // // // // // /**
// // // // // // // // // // // // // // //  * Decrypt and decompress data from MargERP API
// // // // // // // // // // // // // // //  * 
// // // // // // // // // // // // // // //  * C# Implementation Flow:
// // // // // // // // // // // // // // //  * 1. Decrypt(encryptedBase64, key) → Returns Base64 compressed data
// // // // // // // // // // // // // // //  * 2. Decompress(base64CompressedData) → Returns JSON string
// // // // // // // // // // // // // // //  * 
// // // // // // // // // // // // // // //  * Key Details from C# Code:
// // // // // // // // // // // // // // //  * - Algorithm: RijndaelManaged (AES)
// // // // // // // // // // // // // // //  * - Mode: CBC
// // // // // // // // // // // // // // //  * - Padding: PKCS7
// // // // // // // // // // // // // // //  * - KeySize: 128 bits (0x80)
// // // // // // // // // // // // // // //  * - BlockSize: 128 bits (0x80)
// // // // // // // // // // // // // // //  * - Key and IV are the SAME (both derived from the secret key)
// // // // // // // // // // // // // // //  * - Compression: DeflateStream (not GZip!)
// // // // // // // // // // // // // // //  */

// // // // // // // // // // // // // // // /**
// // // // // // // // // // // // // // //  * Step 1: Decrypt the data
// // // // // // // // // // // // // // //  * Matches C# Decrypt() method
// // // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // // function decrypt(encryptedBase64: string, secretKey: string): string {
// // // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // // //     console.log('🔐 Starting decryption...');
// // // // // // // // // // // // // // //     console.log('   Encrypted data length:', encryptedBase64.length);
// // // // // // // // // // // // // // //     console.log('   Key:', secretKey);

// // // // // // // // // // // // // // //     // Prepare the key (16 bytes for AES-128)
// // // // // // // // // // // // // // //     // C# uses: byte[] pwdBytes = Encoding.UTF8.GetBytes(key);
// // // // // // // // // // // // // // //     const pwdBytes = CryptoJS.enc.Utf8.parse(secretKey);
    
// // // // // // // // // // // // // // //     // C# creates a 16-byte array and copies password bytes
// // // // // // // // // // // // // // //     // byte[] keyBytes = new byte[0x10]; // 16 bytes
// // // // // // // // // // // // // // //     // Array.Copy(pwdBytes, keyBytes, len);
// // // // // // // // // // // // // // //     const keyBytes = CryptoJS.lib.WordArray.create(pwdBytes.words.slice(0, 4)); // First 16 bytes
    
// // // // // // // // // // // // // // //     console.log('   Key prepared (16 bytes)');
// // // // // // // // // // // // // // //     console.log('   IV = Key (same as C# implementation)');

// // // // // // // // // // // // // // //     // Decrypt using AES-128-CBC
// // // // // // // // // // // // // // //     // rijndaelCipher.Key = keyBytes;
// // // // // // // // // // // // // // //     // rijndaelCipher.IV = keyBytes;
// // // // // // // // // // // // // // //     const decrypted = CryptoJS.AES.decrypt(
// // // // // // // // // // // // // // //       encryptedBase64,
// // // // // // // // // // // // // // //       keyBytes,
// // // // // // // // // // // // // // //       {
// // // // // // // // // // // // // // //         iv: keyBytes,  // Same as key in C#
// // // // // // // // // // // // // // //         mode: CryptoJS.mode.CBC,
// // // // // // // // // // // // // // //         padding: CryptoJS.pad.Pkcs7
// // // // // // // // // // // // // // //       }
// // // // // // // // // // // // // // //     );

// // // // // // // // // // // // // // //     console.log('   Decryption completed');

// // // // // // // // // // // // // // //     // CRITICAL: The decrypted data is Base64 compressed data, NOT plain text!
// // // // // // // // // // // // // // //     // C# returns: Encoding.UTF8.GetString(plainText)
// // // // // // // // // // // // // // //     // But this UTF-8 string is actually a Base64-encoded compressed payload
// // // // // // // // // // // // // // //     const decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);
    
// // // // // // // // // // // // // // //     console.log('   Decrypted data length:', decryptedBase64.length);
// // // // // // // // // // // // // // //     console.log('   Decrypted data preview:', decryptedBase64.substring(0, 100));
    
// // // // // // // // // // // // // // //     return decryptedBase64;
    
// // // // // // // // // // // // // // //   } catch (error: any) {
// // // // // // // // // // // // // // //     console.error('❌ Decryption error:', error);
// // // // // // // // // // // // // // //     throw new Error(`Failed to decrypt data: ${error.message}`);
// // // // // // // // // // // // // // //   }
// // // // // // // // // // // // // // // }

// // // // // // // // // // // // // // // /**
// // // // // // // // // // // // // // //  * Step 2: Decompress the data
// // // // // // // // // // // // // // //  * Matches C# Decompress() method which uses DeflateStream
// // // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // // function decompress(base64CompressedData: string): string {
// // // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // // //     console.log('📂 Starting decompression...');
// // // // // // // // // // // // // // //     console.log('   Compressed data length:', base64CompressedData.length);
// // // // // // // // // // // // // // //     console.log('   Compressed data preview:', base64CompressedData.substring(0, 100));

// // // // // // // // // // // // // // //     // C# converts from Base64 to byte array
// // // // // // // // // // // // // // //     // byte[] input = Convert.FromBase64String(compressedstring);
// // // // // // // // // // // // // // //     const compressedBytes = Uint8Array.from(
// // // // // // // // // // // // // // //       atob(base64CompressedData),
// // // // // // // // // // // // // // //       c => c.charCodeAt(0)
// // // // // // // // // // // // // // //     );
    
// // // // // // // // // // // // // // //     console.log('   Compressed bytes length:', compressedBytes.length);
// // // // // // // // // // // // // // //     console.log('   First 20 bytes (hex):', 
// // // // // // // // // // // // // // //       Array.from(compressedBytes.slice(0, 20))
// // // // // // // // // // // // // // //         .map(b => b.toString(16).padStart(2, '0'))
// // // // // // // // // // // // // // //         .join(' ')
// // // // // // // // // // // // // // //     );

// // // // // // // // // // // // // // //     // C# uses DeflateStream with CompressionMode.Decompress
// // // // // // // // // // // // // // //     // using (DeflateStream gzip = new DeflateStream(inputStream, CompressionMode.Decompress))
// // // // // // // // // // // // // // //     // 
// // // // // // // // // // // // // // //     // IMPORTANT: C# DeflateStream = pako.inflateRaw (raw deflate, no zlib wrapper)
// // // // // // // // // // // // // // //     const decompressed = pako.inflateRaw(compressedBytes, { to: 'string' });
    
// // // // // // // // // // // // // // //     console.log('✅ Decompression completed');
// // // // // // // // // // // // // // //     console.log('   Decompressed length:', decompressed.length);
// // // // // // // // // // // // // // //     console.log('   Decompressed preview:', decompressed.substring(0, 200));
    
// // // // // // // // // // // // // // //     return decompressed;
    
// // // // // // // // // // // // // // //   } catch (error: any) {
// // // // // // // // // // // // // // //     console.error('❌ Decompression error:', error);
// // // // // // // // // // // // // // //     console.error('   Error message:', error.message);
    
// // // // // // // // // // // // // // //     // Try with regular inflate if inflateRaw fails
// // // // // // // // // // // // // // //     console.log('   Trying regular inflate (with zlib header)...');
// // // // // // // // // // // // // // //     try {
// // // // // // // // // // // // // // //       const compressedBytes = Uint8Array.from(
// // // // // // // // // // // // // // //         atob(base64CompressedData),
// // // // // // // // // // // // // // //         c => c.charCodeAt(0)
// // // // // // // // // // // // // // //       );
// // // // // // // // // // // // // // //       const decompressed = pako.inflate(compressedBytes, { to: 'string' });
// // // // // // // // // // // // // // //       console.log('✅ Decompression with zlib header succeeded');
// // // // // // // // // // // // // // //       return decompressed;
// // // // // // // // // // // // // // //     } catch (retryError: any) {
// // // // // // // // // // // // // // //       console.error('❌ Both decompression methods failed');
// // // // // // // // // // // // // // //       throw new Error(`Failed to decompress data: ${error.message}`);
// // // // // // // // // // // // // // //     }
// // // // // // // // // // // // // // //   }
// // // // // // // // // // // // // // // }

// // // // // // // // // // // // // // // /**
// // // // // // // // // // // // // // //  * Main function: Decrypt and decompress
// // // // // // // // // // // // // // //  * This matches the C# workflow in Program.cs:
// // // // // // // // // // // // // // //  * 1. decData = Decrypt(data, key)
// // // // // // // // // // // // // // //  * 2. decomData = Decompress(decData)
// // // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // // export function decryptAndDecompress(encryptedBase64: string, secretKey: string): string {
// // // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // // //     console.log('🔐 Starting decrypt and decompress pipeline...');
// // // // // // // // // // // // // // //     console.log('   Input length:', encryptedBase64.length);
// // // // // // // // // // // // // // //     console.log('   Secret key:', secretKey);
    
// // // // // // // // // // // // // // //     // Step 1: Decrypt (returns Base64 compressed data)
// // // // // // // // // // // // // // //     const decryptedCompressedBase64 = decrypt(encryptedBase64, secretKey);
    
// // // // // // // // // // // // // // //     // Step 2: Decompress (returns JSON string)
// // // // // // // // // // // // // // //     const decompressedJson = decompress(decryptedCompressedBase64);
    
// // // // // // // // // // // // // // //     console.log('✅ Pipeline completed successfully');
// // // // // // // // // // // // // // //     console.log('   Final JSON length:', decompressedJson.length);
    
// // // // // // // // // // // // // // //     return decompressedJson;
    
// // // // // // // // // // // // // // //   } catch (error: any) {
// // // // // // // // // // // // // // //     console.error('❌ Decrypt and decompress pipeline error:', error);
// // // // // // // // // // // // // // //     throw error;
// // // // // // // // // // // // // // //   }
// // // // // // // // // // // // // // // }

// // // // // // // // // // // // // // // /**
// // // // // // // // // // // // // // //  * Test function - use this to verify the implementation
// // // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // // export function testDecryption(encryptedData: string, key: string = '690QIDCX1WU1'): void {
// // // // // // // // // // // // // // //   console.log('\n╔════════════════════════════════════════════════════════════╗');
// // // // // // // // // // // // // // //   console.log('║  🧪 TESTING DECRYPTION IMPLEMENTATION                    ║');
// // // // // // // // // // // // // // //   console.log('╚════════════════════════════════════════════════════════════╝\n');
  
// // // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // // //     const result = decryptAndDecompress(encryptedData, key);
// // // // // // // // // // // // // // //     console.log('\n✅ Test PASSED');
// // // // // // // // // // // // // // //     console.log('   Decrypted and decompressed successfully');
// // // // // // // // // // // // // // //     console.log('   Result length:', result.length);
// // // // // // // // // // // // // // //     console.log('   Result preview:', result.substring(0, 500));
    
// // // // // // // // // // // // // // //     // Try to parse as JSON
// // // // // // // // // // // // // // //     try {
// // // // // // // // // // // // // // //       const parsed = JSON.parse(result);
// // // // // // // // // // // // // // //       console.log('   ✓ Result is valid JSON');
// // // // // // // // // // // // // // //       console.log('   ✓ JSON type:', Array.isArray(parsed) ? 'Array' : typeof parsed);
// // // // // // // // // // // // // // //       if (Array.isArray(parsed)) {
// // // // // // // // // // // // // // //         console.log('   ✓ Array length:', parsed.length);
// // // // // // // // // // // // // // //       } else if (typeof parsed === 'object') {
// // // // // // // // // // // // // // //         console.log('   ✓ Object keys:', Object.keys(parsed));
// // // // // // // // // // // // // // //       }
// // // // // // // // // // // // // // //     } catch (e) {
// // // // // // // // // // // // // // //       console.log('   ⚠️ Result is not JSON');
// // // // // // // // // // // // // // //     }
    
// // // // // // // // // // // // // // //   } catch (error: any) {
// // // // // // // // // // // // // // //     console.log('\n❌ Test FAILED');
// // // // // // // // // // // // // // //     console.log('   Error:', error.message);
// // // // // // // // // // // // // // //     console.log('   Stack:', error.stack);
// // // // // // // // // // // // // // //   }
  
// // // // // // // // // // // // // // //   console.log('\n╚════════════════════════════════════════════════════════════╝\n');
// // // // // // // // // // // // // // // }


// // // // // // // // // // // // // // // utils/margCrypto.ts - FINAL FIX
// // // // // // // // // // // // // // import CryptoJS from 'crypto-js';
// // // // // // // // // // // // // // import pako from 'pako';

// // // // // // // // // // // // // // /**
// // // // // // // // // // // // // //  * Decrypt and decompress data from MargERP API
// // // // // // // // // // // // // //  * 
// // // // // // // // // // // // // //  * C# Implementation Flow:
// // // // // // // // // // // // // //  * 1. Decrypt(encryptedBase64, key) → Returns Base64 compressed data
// // // // // // // // // // // // // //  * 2. Decompress(base64CompressedData) → Returns JSON string
// // // // // // // // // // // // // //  * 
// // // // // // // // // // // // // //  * CRITICAL INSIGHT:
// // // // // // // // // // // // // //  * The C# code does: Encoding.UTF8.GetString(plainText)
// // // // // // // // // // // // // //  * BUT the plainText contains compressed BINARY data that happens to be valid UTF-8
// // // // // // // // // // // // // //  * when interpreted as a Base64 string!
// // // // // // // // // // // // // //  * 
// // // // // // // // // // // // // //  * So the flow is:
// // // // // // // // // // // // // //  * Encrypted Base64 → [Decrypt] → Compressed Binary → [Encode as UTF-8] → Base64 String → [Decode Base64] → Binary → [Decompress] → JSON
// // // // // // // // // // // // // //  */

// // // // // // // // // // // // // // /**
// // // // // // // // // // // // // //  * Step 1: Decrypt the data
// // // // // // // // // // // // // //  * Returns the decrypted bytes as a Base64 string (matching C# behavior)
// // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // function decrypt(encryptedBase64: string, secretKey: string): string {
// // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // //     console.log('🔐 Starting decryption...');
// // // // // // // // // // // // // //     console.log('   Encrypted data length:', encryptedBase64.length);
// // // // // // // // // // // // // //     console.log('   Key:', secretKey);

// // // // // // // // // // // // // //     // Prepare the key (16 bytes for AES-128)
// // // // // // // // // // // // // //     const pwdBytes = CryptoJS.enc.Utf8.parse(secretKey);
// // // // // // // // // // // // // //     const keyBytes = CryptoJS.lib.WordArray.create(pwdBytes.words.slice(0, 4)); // First 16 bytes
    
// // // // // // // // // // // // // //     console.log('   Key prepared (16 bytes)');
// // // // // // // // // // // // // //     console.log('   IV = Key (same as C# implementation)');

// // // // // // // // // // // // // //     // Decrypt using AES-128-CBC
// // // // // // // // // // // // // //     const decrypted = CryptoJS.AES.decrypt(
// // // // // // // // // // // // // //       encryptedBase64,
// // // // // // // // // // // // // //       keyBytes,
// // // // // // // // // // // // // //       {
// // // // // // // // // // // // // //         iv: keyBytes,  // Same as key in C#
// // // // // // // // // // // // // //         mode: CryptoJS.mode.CBC,
// // // // // // // // // // // // // //         padding: CryptoJS.pad.Pkcs7
// // // // // // // // // // // // // //       }
// // // // // // // // // // // // // //     );

// // // // // // // // // // // // // //     console.log('   Decryption completed');

// // // // // // // // // // // // // //     // CRITICAL FIX: Don't convert to UTF-8 string (will fail on binary data)
// // // // // // // // // // // // // //     // Instead, convert the decrypted WordArray to Base64
// // // // // // // // // // // // // //     // This matches what C# does: the binary data is valid when interpreted as Base64
// // // // // // // // // // // // // //     const decryptedBase64 = CryptoJS.enc.Base64.stringify(decrypted);
    
// // // // // // // // // // // // // //     console.log('   Decrypted data length:', decryptedBase64.length);
// // // // // // // // // // // // // //     console.log('   Decrypted data preview:', decryptedBase64.substring(0, 100));
    
// // // // // // // // // // // // // //     return decryptedBase64;
    
// // // // // // // // // // // // // //   } catch (error: any) {
// // // // // // // // // // // // // //     console.error('❌ Decryption error:', error);
// // // // // // // // // // // // // //     throw new Error(`Failed to decrypt data: ${error.message}`);
// // // // // // // // // // // // // //   }
// // // // // // // // // // // // // // }

// // // // // // // // // // // // // // /**
// // // // // // // // // // // // // //  * Step 2: Decompress the data
// // // // // // // // // // // // // //  * Takes Base64 compressed data and returns decompressed JSON
// // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // function decompress(base64CompressedData: string): string {
// // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // //     console.log('📂 Starting decompression...');
// // // // // // // // // // // // // //     console.log('   Compressed data length:', base64CompressedData.length);
// // // // // // // // // // // // // //     console.log('   Compressed data preview:', base64CompressedData.substring(0, 100));

// // // // // // // // // // // // // //     // Convert Base64 to bytes
// // // // // // // // // // // // // //     const compressedBytes = Uint8Array.from(
// // // // // // // // // // // // // //       atob(base64CompressedData),
// // // // // // // // // // // // // //       c => c.charCodeAt(0)
// // // // // // // // // // // // // //     );
    
// // // // // // // // // // // // // //     console.log('   Compressed bytes length:', compressedBytes.length);
// // // // // // // // // // // // // //     console.log('   First 20 bytes (hex):', 
// // // // // // // // // // // // // //       Array.from(compressedBytes.slice(0, 20))
// // // // // // // // // // // // // //         .map(b => b.toString(16).padStart(2, '0'))
// // // // // // // // // // // // // //         .join(' ')
// // // // // // // // // // // // // //     );

// // // // // // // // // // // // // //     // Try DeflateStream (pako.inflateRaw) first
// // // // // // // // // // // // // //     try {
// // // // // // // // // // // // // //       const decompressed = pako.inflateRaw(compressedBytes, { to: 'string' });
// // // // // // // // // // // // // //       console.log('✅ Decompression completed (inflateRaw)');
// // // // // // // // // // // // // //       console.log('   Decompressed length:', decompressed.length);
// // // // // // // // // // // // // //       console.log('   Decompressed preview:', decompressed.substring(0, 200));
// // // // // // // // // // // // // //       return decompressed;
// // // // // // // // // // // // // //     } catch (rawError) {
// // // // // // // // // // // // // //       // If inflateRaw fails, try regular inflate (with zlib header)
// // // // // // // // // // // // // //       console.log('   inflateRaw failed, trying inflate...');
// // // // // // // // // // // // // //       const decompressed = pako.inflate(compressedBytes, { to: 'string' });
// // // // // // // // // // // // // //       console.log('✅ Decompression completed (inflate)');
// // // // // // // // // // // // // //       console.log('   Decompressed length:', decompressed.length);
// // // // // // // // // // // // // //       console.log('   Decompressed preview:', decompressed.substring(0, 200));
// // // // // // // // // // // // // //       return decompressed;
// // // // // // // // // // // // // //     }
    
// // // // // // // // // // // // // //   } catch (error: any) {
// // // // // // // // // // // // // //     console.error('❌ Decompression error:', error);
// // // // // // // // // // // // // //     console.error('   Error message:', error.message);
// // // // // // // // // // // // // //     throw new Error(`Failed to decompress data: ${error.message}`);
// // // // // // // // // // // // // //   }
// // // // // // // // // // // // // // }

// // // // // // // // // // // // // // /**
// // // // // // // // // // // // // //  * Main function: Decrypt and decompress
// // // // // // // // // // // // // //  * Matches C# workflow:
// // // // // // // // // // // // // //  * 1. decData = Decrypt(data, key)      → Returns Base64 compressed string
// // // // // // // // // // // // // //  * 2. decomData = Decompress(decData)   → Returns JSON string
// // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // export function decryptAndDecompress(encryptedBase64: string, secretKey: string): string {
// // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // //     console.log('🔐 Starting decrypt and decompress pipeline...');
// // // // // // // // // // // // // //     console.log('   Input length:', encryptedBase64.length);
// // // // // // // // // // // // // //     console.log('   Secret key:', secretKey);
    
// // // // // // // // // // // // // //     // Step 1: Decrypt (returns Base64 compressed data)
// // // // // // // // // // // // // //     const decryptedCompressedBase64 = decrypt(encryptedBase64, secretKey);
    
// // // // // // // // // // // // // //     // Step 2: Decompress (returns JSON string)
// // // // // // // // // // // // // //     const decompressedJson = decompress(decryptedCompressedBase64);
    
// // // // // // // // // // // // // //     console.log('✅ Pipeline completed successfully');
// // // // // // // // // // // // // //     console.log('   Final JSON length:', decompressedJson.length);
    
// // // // // // // // // // // // // //     return decompressedJson;
    
// // // // // // // // // // // // // //   } catch (error: any) {
// // // // // // // // // // // // // //     console.error('❌ Decrypt and decompress pipeline error:', error);
// // // // // // // // // // // // // //     throw error;
// // // // // // // // // // // // // //   }
// // // // // // // // // // // // // // }

// // // // // // // // // // // // // // /**
// // // // // // // // // // // // // //  * Test function - use this to verify the implementation
// // // // // // // // // // // // // //  */
// // // // // // // // // // // // // // export function testDecryption(encryptedData: string, key: string = '690QIDCX1WU1'): void {
// // // // // // // // // // // // // //   console.log('\n╔════════════════════════════════════════════════════════════╗');
// // // // // // // // // // // // // //   console.log('║  🧪 TESTING DECRYPTION IMPLEMENTATION                    ║');
// // // // // // // // // // // // // //   console.log('╚════════════════════════════════════════════════════════════╝\n');
  
// // // // // // // // // // // // // //   try {
// // // // // // // // // // // // // //     const result = decryptAndDecompress(encryptedData, key);
// // // // // // // // // // // // // //     console.log('\n✅ Test PASSED');
// // // // // // // // // // // // // //     console.log('   Decrypted and decompressed successfully');
// // // // // // // // // // // // // //     console.log('   Result length:', result.length);
// // // // // // // // // // // // // //     console.log('   Result preview:', result.substring(0, 500));
    
// // // // // // // // // // // // // //     // Try to parse as JSON
// // // // // // // // // // // // // //     try {
// // // // // // // // // // // // // //       const parsed = JSON.parse(result);
// // // // // // // // // // // // // //       console.log('   ✓ Result is valid JSON');
// // // // // // // // // // // // // //       console.log('   ✓ JSON type:', Array.isArray(parsed) ? 'Array' : typeof parsed);
// // // // // // // // // // // // // //       if (Array.isArray(parsed)) {
// // // // // // // // // // // // // //         console.log('   ✓ Array length:', parsed.length);
// // // // // // // // // // // // // //       } else if (typeof parsed === 'object') {
// // // // // // // // // // // // // //         console.log('   ✓ Object keys:', Object.keys(parsed));
// // // // // // // // // // // // // //       }
// // // // // // // // // // // // // //     } catch (e) {
// // // // // // // // // // // // // //       console.log('   ⚠️ Result is not JSON');
// // // // // // // // // // // // // //     }
    
// // // // // // // // // // // // // //   } catch (error: any) {
// // // // // // // // // // // // // //     console.log('\n❌ Test FAILED');
// // // // // // // // // // // // // //     console.log('   Error:', error.message);
// // // // // // // // // // // // // //     console.log('   Stack:', error.stack);
// // // // // // // // // // // // // //   }
  
// // // // // // // // // // // // // //   console.log('\n╚════════════════════════════════════════════════════════════╝\n');
// // // // // // // // // // // // // // }


// // // // // // // // // // // // // import CryptoJS from "crypto-js";
// // // // // // // // // // // // // import pako from "pako";

// // // // // // // // // // // // // export function decryptAndDecompress(
// // // // // // // // // // // // //   encryptedData: string,
// // // // // // // // // // // // //   secretKey: string
// // // // // // // // // // // // // ): string {

// // // // // // // // // // // // //   // 🔐 AES decrypt (matches C# RijndaelManaged)
// // // // // // // // // // // // //   const key = CryptoJS.enc.Utf8.parse(secretKey);

// // // // // // // // // // // // //   const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
// // // // // // // // // // // // //     iv: key, // IV = key (as in C#)
// // // // // // // // // // // // //     mode: CryptoJS.mode.CBC,
// // // // // // // // // // // // //     padding: CryptoJS.pad.Pkcs7,
// // // // // // // // // // // // //   });

// // // // // // // // // // // // //   // This is BASE64 string (same as C# Encoding.UTF8.GetString)
// // // // // // // // // // // // //   const decryptedBase64 = CryptoJS.enc.Utf8.stringify(decrypted);

// // // // // // // // // // // // //   if (!decryptedBase64) {
// // // // // // // // // // // // //     throw new Error("Decryption failed: empty output");
// // // // // // // // // // // // //   }

// // // // // // // // // // // // //   // 🔄 Base64 → byte[]
// // // // // // // // // // // // //   const binary = atob(decryptedBase64);
// // // // // // // // // // // // //   const compressedBytes = new Uint8Array(binary.length);

// // // // // // // // // // // // //   for (let i = 0; i < binary.length; i++) {
// // // // // // // // // // // // //     compressedBytes[i] = binary.charCodeAt(i);
// // // // // // // // // // // // //   }

// // // // // // // // // // // // //   // 📦 ZLIB DEFLATE (NOT RAW)
// // // // // // // // // // // // //   const decompressedBytes = pako.inflate(compressedBytes);

// // // // // // // // // // // // //   // 🔤 bytes → string
// // // // // // // // // // // // //   return new TextDecoder("utf-8").decode(decompressedBytes);
// // // // // // // // // // // // // }

// // // // // // // // // // // // import CryptoJS from "crypto-js";
// // // // // // // // // // // // import pako from "pako";

// // // // // // // // // // // // export function decryptAndDecompress(
// // // // // // // // // // // //   encryptedData: string,
// // // // // // // // // // // //   secretKey: string
// // // // // // // // // // // // ): string {
// // // // // // // // // // // //   // 🔐 Parse the key
// // // // // // // // // // // //   const key = CryptoJS.enc.Utf8.parse(secretKey);
  
// // // // // // // // // // // //   // Convert base64 string to CryptoJS WordArray
// // // // // // // // // // // //   const encryptedBase64 = CryptoJS.enc.Base64.parse(encryptedData);

// // // // // // // // // // // //   // 🔐 AES decrypt (RijndaelManaged with CBC mode and PKCS7 padding)
// // // // // // // // // // // //   const decrypted = CryptoJS.AES.decrypt(
// // // // // // // // // // // //     { ciphertext: encryptedBase64 } as any,
// // // // // // // // // // // //     key,
// // // // // // // // // // // //     {
// // // // // // // // // // // //       iv: key, // IV = key (as in C#)
// // // // // // // // // // // //       mode: CryptoJS.mode.CBC,
// // // // // // // // // // // //       padding: CryptoJS.pad.Pkcs7,
// // // // // // // // // // // //     }
// // // // // // // // // // // //   );

// // // // // // // // // // // //   // ⚠️ IMPORTANT: Get the raw bytes, NOT a UTF-8 string
// // // // // // // // // // // //   // The decrypted data is binary (compressed bytes), not text
// // // // // // // // // // // //   const decryptedBytes = CryptoJS.enc.Latin1.parse(
// // // // // // // // // // // //     decrypted.toString(CryptoJS.enc.Latin1)
// // // // // // // // // // // //   );

// // // // // // // // // // // //   // Convert to Uint8Array for pako
// // // // // // // // // // // //   const compressedBytes = new Uint8Array(decryptedBytes.words.length * 4);
// // // // // // // // // // // //   for (let i = 0; i < decryptedBytes.words.length; i++) {
// // // // // // // // // // // //     const word = decryptedBytes.words[i];
// // // // // // // // // // // //     compressedBytes[i * 4] = (word >> 24) & 0xff;
// // // // // // // // // // // //     compressedBytes[i * 4 + 1] = (word >> 16) & 0xff;
// // // // // // // // // // // //     compressedBytes[i * 4 + 2] = (word >> 8) & 0xff;
// // // // // // // // // // // //     compressedBytes[i * 4 + 3] = word & 0xff;
// // // // // // // // // // // //   }
  
// // // // // // // // // // // //   // Trim to actual length
// // // // // // // // // // // //   const actualBytes = compressedBytes.slice(0, decryptedBytes.sigBytes);

// // // // // // // // // // // //   try {
// // // // // // // // // // // //     // 📦 ZLIB DEFLATE decompression
// // // // // // // // // // // //     const decompressedBytes = pako.inflate(actualBytes);
    
// // // // // // // // // // // //     // 🔤 Convert decompressed bytes to UTF-8 string
// // // // // // // // // // // //     return new TextDecoder("utf-8").decode(decompressedBytes);
// // // // // // // // // // // //   } catch (decompressError) {
// // // // // // // // // // // //     console.error("Decompression error:", decompressError);
// // // // // // // // // // // //     throw new Error(`Decompression failed: ${decompressError}`);
// // // // // // // // // // // //   }
// // // // // // // // // // // // }


// // // // // // // // // // // import CryptoJS from "crypto-js";
// // // // // // // // // // // import pako from "pako";

// // // // // // // // // // // export function decryptAndDecompress(
// // // // // // // // // // //   encryptedData: string,
// // // // // // // // // // //   secretKey: string
// // // // // // // // // // // ): string {
// // // // // // // // // // //   // Create key (16 bytes like in C#)
// // // // // // // // // // //   const keyBytes = CryptoJS.enc.Utf8.parse(secretKey);
// // // // // // // // // // //   const key = CryptoJS.lib.WordArray.create(keyBytes.words.slice(0, 4), 16);

// // // // // // // // // // //   // Decrypt
// // // // // // // // // // //   const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
// // // // // // // // // // //     iv: key,
// // // // // // // // // // //     mode: CryptoJS.mode.CBC,
// // // // // // // // // // //     padding: CryptoJS.pad.Pkcs7,
// // // // // // // // // // //     format: CryptoJS.format.Base64 // Tell CryptoJS the input is Base64
// // // // // // // // // // //   });

// // // // // // // // // // //   // Get as Latin1 (raw bytes)
// // // // // // // // // // //   const decryptedLatin1 = decrypted.toString(CryptoJS.enc.Latin1);
  
// // // // // // // // // // //   // Convert to Uint8Array
// // // // // // // // // // //   const compressedBytes = new Uint8Array(decryptedLatin1.length);
// // // // // // // // // // //   for (let i = 0; i < decryptedLatin1.length; i++) {
// // // // // // // // // // //     compressedBytes[i] = decryptedLatin1.charCodeAt(i);
// // // // // // // // // // //   }

// // // // // // // // // // //   // Try different decompression methods
// // // // // // // // // // //   try {
// // // // // // // // // // //     // Method 1: Standard zlib
// // // // // // // // // // //     const decompressed = pako.inflate(compressedBytes);
// // // // // // // // // // //     return new TextDecoder("utf-8").decode(decompressed);
// // // // // // // // // // //   } catch (e1) {
// // // // // // // // // // //     try {
// // // // // // // // // // //       // Method 2: Raw DEFLATE
// // // // // // // // // // //       const decompressed = pako.inflateRaw(compressedBytes);
// // // // // // // // // // //       return new TextDecoder("utf-8").decode(decompressed);
// // // // // // // // // // //     } catch (e2) {
// // // // // // // // // // //       try {
// // // // // // // // // // //         // Method 3: GZIP
// // // // // // // // // // //         const decompressed = pako.ungzip(compressedBytes);
// // // // // // // // // // //         return new TextDecoder("utf-8").decode(decompressed);
// // // // // // // // // // //       } catch (e3) {
// // // // // // // // // // //         throw new Error(`All decompression failed: ${e1.message}, ${e2.message}, ${e3.message}`);
// // // // // // // // // // //       }
// // // // // // // // // // //     }
// // // // // // // // // // //   }
// // // // // // // // // // // }




















































// // // // // // // // // // // import CryptoJS from 'crypto-js';
// // // // // // // // // // // import pako from 'pako';
// // // // // // // // // // // import { Buffer } from 'buffer';

// // // // // // // // // // // function createAesKey(secretKey: string) {
// // // // // // // // // // //   const keyBytes = new Uint8Array(16);
// // // // // // // // // // //   const utf8 = new TextEncoder().encode(secretKey);
// // // // // // // // // // //   keyBytes.set(utf8.slice(0, 16));
// // // // // // // // // // //   return CryptoJS.lib.WordArray.create(keyBytes as any);
// // // // // // // // // // // }

// // // // // // // // // // // export function decryptAndDecompress(
// // // // // // // // // // //   encryptedData: string,
// // // // // // // // // // //   secretKey: string
// // // // // // // // // // // ): string {
// // // // // // // // // // //   const key = createAesKey(secretKey);

// // // // // // // // // // //   const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
// // // // // // // // // // //     iv: key,
// // // // // // // // // // //     mode: CryptoJS.mode.CBC,
// // // // // // // // // // //     padding: CryptoJS.pad.Pkcs7,
// // // // // // // // // // //   });

// // // // // // // // // // //   const base64 = decrypted.toString(CryptoJS.enc.Utf8);
// // // // // // // // // // //   console.log( 'the decrypted base data', base64.slice(0, 20));
// // // // // // // // // // //   if (!base64) throw new Error('AES decryption failed');

// // // // // // // // // // //   const compressed = Uint8Array.from(Buffer.from(base64, 'base64'));
// // // // // // // // // // //   const decompressed = pako.inflateRaw(compressed);

// // // // // // // // // // //   return new TextDecoder('utf-8').decode(decompressed);
// // // // // // // // // // // }



// // // // // // // // // // import CryptoJS from 'crypto-js';
// // // // // // // // // // import pako from 'pako';
// // // // // // // // // // import { Buffer } from 'buffer';

// // // // // // // // // // function createAesKey(secretKey: string): CryptoJS.lib.WordArray {
// // // // // // // // // //   // Match C# implementation exactly
// // // // // // // // // //   const pwdBytes = new TextEncoder().encode(secretKey);
// // // // // // // // // //   const keyBytes = new Uint8Array(16);
  
// // // // // // // // // //   // Copy bytes, truncating if secretKey is longer than 16 bytes
// // // // // // // // // //   const len = Math.min(pwdBytes.length, 16);
// // // // // // // // // //   keyBytes.set(pwdBytes.slice(0, len));
  
// // // // // // // // // //   return CryptoJS.lib.WordArray.create(keyBytes);
// // // // // // // // // // }

// // // // // // // // // // export function decryptAndDecompress(
// // // // // // // // // //   encryptedData: string,
// // // // // // // // // //   secretKey: string
// // // // // // // // // // ): string {
// // // // // // // // // //   try {
// // // // // // // // // //     console.log('🔐 Starting decryption...');
// // // // // // // // // //     console.log('   Encrypted data length:', encryptedData.length);
// // // // // // // // // //     console.log('   Using key:', secretKey);

// // // // // // // // // //     // Step 1: Create key (16 bytes) - same as C#
// // // // // // // // // //     const key = createAesKey(secretKey);
// // // // // // // // // //     console.log('   Key created, length:', key.sigBytes, 'bytes');

// // // // // // // // // //     // Step 2: Decrypt using AES-CBC with PKCS7 padding
// // // // // // // // // //     console.log('   Decrypting with AES-CBC...');
    
// // // // // // // // // //     // IMPORTANT: IV is same as key in C# implementation
// // // // // // // // // //     const iv = key; // rijndaelCipher.IV = keyBytes
    
// // // // // // // // // //     // Convert encrypted data to CryptoJS format
// // // // // // // // // //     const encrypted = CryptoJS.enc.Base64.parse(encryptedData);
    
// // // // // // // // // //     // Decrypt
// // // // // // // // // //     const decrypted = CryptoJS.AES.decrypt(
// // // // // // // // // //       { ciphertext: encrypted } as any,
// // // // // // // // // //       key,
// // // // // // // // // //       {
// // // // // // // // // //         iv: iv,
// // // // // // // // // //         mode: CryptoJS.mode.CBC,
// // // // // // // // // //         padding: CryptoJS.pad.Pkcs7
// // // // // // // // // //       }
// // // // // // // // // //     );

// // // // // // // // // //     // Convert to UTF-8 string first
// // // // // // // // // //     const decryptedUtf8 = decrypted.toString(CryptoJS.enc.Utf8);
    
// // // // // // // // // //     if (!decryptedUtf8) {
// // // // // // // // // //       console.error('❌ Decryption failed - empty output');
// // // // // // // // // //       throw new Error('Decryption failed - empty output');
// // // // // // // // // //     }
    
// // // // // // // // // //     console.log('✅ Decryption successful');
// // // // // // // // // //     console.log('   Decrypted UTF8 length:', decryptedUtf8.length);
// // // // // // // // // //     console.log('   First 100 chars:', decryptedUtf8.substring(0, 100));

// // // // // // // // // //     // Step 3: The decrypted data should be base64 encoded compressed data
// // // // // // // // // //     console.log('   Converting to base64...');
// // // // // // // // // //     const base64Data = decryptedUtf8;
    
// // // // // // // // // //     // Step 4: Decode base64 to bytes
// // // // // // // // // //     console.log('   Decoding base64 to bytes...');
// // // // // // // // // //     let compressedBytes: Uint8Array;
    
// // // // // // // // // //     try {
// // // // // // // // // //       // Try decoding as base64
// // // // // // // // // //       compressedBytes = Uint8Array.from(Buffer.from(base64Data, 'base64'));
// // // // // // // // // //     } catch (e) {
// // // // // // // // // //       console.log('   Not base64, using raw bytes...');
// // // // // // // // // //       // If not base64, use the UTF-8 bytes directly
// // // // // // // // // //       compressedBytes = new TextEncoder().encode(base64Data);
// // // // // // // // // //     }
    
// // // // // // // // // //     console.log('   Compressed bytes length:', compressedBytes.length);

// // // // // // // // // //     // Step 5: Decompress using raw deflate (C# uses DeflateStream)
// // // // // // // // // //     console.log('   Decompressing with raw deflate...');
    
// // // // // // // // // //     let decompressed: Uint8Array;
// // // // // // // // // //     try {
// // // // // // // // // //       // Try raw deflate first (C# DeflateStream)
// // // // // // // // // //       decompressed = pako.inflateRaw(compressedBytes);
// // // // // // // // // //     } catch (rawError) {
// // // // // // // // // //       console.log('   Raw deflate failed, trying regular inflate...');
// // // // // // // // // //       try {
// // // // // // // // // //         // Try regular inflate
// // // // // // // // // //         decompressed = pako.inflate(compressedBytes);
// // // // // // // // // //       } catch (regularError) {
// // // // // // // // // //         console.log('   Both decompression methods failed, returning raw data');
// // // // // // // // // //         // If both fail, return the data as-is (might already be plain text)
// // // // // // // // // //         return base64Data;
// // // // // // // // // //       }
// // // // // // // // // //     }

// // // // // // // // // //     // Convert to string
// // // // // // // // // //     const result = new TextDecoder('utf-8').decode(decompressed);
    
// // // // // // // // // //     console.log('✅ Decompression successful');
// // // // // // // // // //     console.log('   Decompressed data length:', result.length);
// // // // // // // // // //     console.log('   First 200 chars:', result.substring(0, 200));

// // // // // // // // // //     return result;

// // // // // // // // // //   } catch (error: any) {
// // // // // // // // // //     console.error('❌ Error in decryptAndDecompress:', error);
// // // // // // // // // //     console.error('   Error message:', error.message);
// // // // // // // // // //     console.error('   Stack:', error.stack);
    
// // // // // // // // // //     // Try alternative approach: direct base64 decode
// // // // // // // // // //     console.log('🔄 Trying alternative approach...');
// // // // // // // // // //     try {
// // // // // // // // // //       const directDecode = Buffer.from(encryptedData, 'base64').toString('utf8');
// // // // // // // // // //       console.log('   Alternative successful, length:', directDecode.length);
// // // // // // // // // //       return directDecode;
// // // // // // // // // //     } catch (altError) {
// // // // // // // // // //       throw error; // Re-throw original error
// // // // // // // // // //     }
// // // // // // // // // //   }
// // // // // // // // // // }


// // // // // // // // // // utils/margCrypto.ts
// // // // // // // // // import CryptoJS from 'crypto-js';
// // // // // // // // // import pako from 'pako';
// // // // // // // // // import { Buffer } from 'buffer';

// // // // // // // // // function createAesKey(secretKey: string): CryptoJS.lib.WordArray {
// // // // // // // // //   // Match C# implementation: Create 16-byte key from secret
// // // // // // // // //   const pwdBytes = new TextEncoder().encode(secretKey);
// // // // // // // // //   const keyBytes = new Uint8Array(16);
  
// // // // // // // // //   // Copy bytes, truncating if secretKey is longer than 16 bytes
// // // // // // // // //   const len = Math.min(pwdBytes.length, 16);
// // // // // // // // //   keyBytes.set(pwdBytes.slice(0, len));
  
// // // // // // // // //   return CryptoJS.lib.WordArray.create(keyBytes);
// // // // // // // // // }

// // // // // // // // // export function decryptAndDecompress(
// // // // // // // // //   encryptedData: string,
// // // // // // // // //   secretKey: string
// // // // // // // // // ): string {
// // // // // // // // //   try {
// // // // // // // // //     console.log('🔐 [CRYPTO] Starting decryption...');
// // // // // // // // //     console.log('   Encrypted data length:', encryptedData.length);
// // // // // // // // //     console.log('   Using key:', secretKey);

// // // // // // // // //     // Step 1: Create key (16 bytes) - same as C#
// // // // // // // // //     const key = createAesKey(secretKey);
// // // // // // // // //     console.log('   Key created, length:', key.sigBytes, 'bytes');

// // // // // // // // //     // Step 2: Decrypt using AES-CBC with PKCS7 padding
// // // // // // // // //     console.log('   Decrypting with AES-CBC...');
    
// // // // // // // // //     // IMPORTANT: IV is same as key in C# implementation
// // // // // // // // //     const iv = key; // rijndaelCipher.IV = keyBytes
    
// // // // // // // // //     // Clean the base64 input (remove any whitespace)
// // // // // // // // //     const cleanEncryptedData = encryptedData.replace(/\s+/g, '');
    
// // // // // // // // //     // Decrypt - CryptoJS expects Base64 string
// // // // // // // // //     const decrypted = CryptoJS.AES.decrypt(cleanEncryptedData, key, {
// // // // // // // // //       iv: iv,
// // // // // // // // //       mode: CryptoJS.mode.CBC,
// // // // // // // // //       padding: CryptoJS.pad.Pkcs7
// // // // // // // // //     });

// // // // // // // // //     // Convert to UTF-8 string (this contains the compressed data as base64)
// // // // // // // // //     const decryptedUtf8 = decrypted.toString(CryptoJS.enc.Utf8);
    
// // // // // // // // //     if (!decryptedUtf8 || decryptedUtf8.length === 0) {
// // // // // // // // //       console.error('❌ [CRYPTO] Decryption failed - empty output');
// // // // // // // // //       throw new Error('Decryption failed - empty output');
// // // // // // // // //     }
    
// // // // // // // // //     console.log('✅ [CRYPTO] Decryption successful');
// // // // // // // // //     console.log('   Decrypted UTF8 length:', decryptedUtf8.length);
// // // // // // // // //     console.log('   First 100 chars:', decryptedUtf8.substring(0, 100));

// // // // // // // // //     // Step 3: The decrypted data is base64 encoded compressed data
// // // // // // // // //     // Decode from base64 to get the compressed bytes
// // // // // // // // //     console.log('   Decoding base64 to get compressed bytes...');
// // // // // // // // //     const compressedBytes = Buffer.from(decryptedUtf8, 'base64');
    
// // // // // // // // //     if (compressedBytes.length === 0) {
// // // // // // // // //       console.error('❌ [CRYPTO] Base64 decode failed - no bytes');
// // // // // // // // //       throw new Error('Base64 decode failed');
// // // // // // // // //     }
    
// // // // // // // // //     console.log('   Compressed bytes length:', compressedBytes.length);

// // // // // // // // //     // Step 4: Decompress using raw deflate (C# uses DeflateStream)
// // // // // // // // //     console.log('   Decompressing with raw deflate...');
    
// // // // // // // // //     let decompressed: Uint8Array;
// // // // // // // // //     try {
// // // // // // // // //       // Convert Buffer to Uint8Array for pako
// // // // // // // // //       const uint8Array = new Uint8Array(compressedBytes);
// // // // // // // // //       // Use raw deflate (no headers) for C# DeflateStream
// // // // // // // // //       decompressed = pako.inflateRaw(uint8Array);
// // // // // // // // //     } catch (decompressError: any) {
// // // // // // // // //       console.error('❌ [CRYPTO] Raw deflate failed:', decompressError.message);
// // // // // // // // //       console.log('   Trying regular inflate...');
      
// // // // // // // // //       try {
// // // // // // // // //         const uint8Array = new Uint8Array(compressedBytes);
// // // // // // // // //         decompressed = pako.inflate(uint8Array);
// // // // // // // // //       } catch (error2: any) {
// // // // // // // // //         console.error('❌ [CRYPTO] Regular inflate also failed:', error2.message);
// // // // // // // // //         console.log('   Returning raw decrypted data');
// // // // // // // // //         return decryptedUtf8;
// // // // // // // // //       }
// // // // // // // // //     }

// // // // // // // // //     // Convert to UTF-8 string
// // // // // // // // //     const result = new TextDecoder('utf-8').decode(decompressed);
    
// // // // // // // // //     console.log('✅ [CRYPTO] Decompression successful');
// // // // // // // // //     console.log('   Result length:', result.length);
// // // // // // // // //     console.log('   First 200 chars:', result.substring(0, 200));

// // // // // // // // //     return result;

// // // // // // // // //   } catch (error: any) {
// // // // // // // // //     console.error('❌ [CRYPTO] Error in decryptAndDecompress:', error);
// // // // // // // // //     console.error('   Error message:', error.message);
// // // // // // // // //     console.error('   Stack:', error.stack);
    
// // // // // // // // //     // Re-throw to let caller handle
// // // // // // // // //     throw error;
// // // // // // // // //   }
// // // // // // // // // }


// // // // // // // // // utils/margCrypto.ts - DEBUG VERSION
// // // // // // // // import CryptoJS from 'crypto-js';
// // // // // // // // import pako from 'pako';

// // // // // // // // export function decryptAndDecompress(
// // // // // // // //   encryptedData: string,
// // // // // // // //   secretKey: string
// // // // // // // // ): string {
// // // // // // // //   try {
// // // // // // // //     console.log('\n🔐🔐🔐 CRYPTO DEBUG START 🔐🔐🔐');
// // // // // // // //     console.log('Input length:', encryptedData.length);
// // // // // // // //     console.log('Key:', secretKey);
// // // // // // // //     console.log('First 100 chars:', encryptedData.substring(0, 100));
    
// // // // // // // //     // 1. Clean input
// // // // // // // //     const cleanData = encryptedData.replace(/\s/g, '');
// // // // // // // //     console.log('Cleaned length:', cleanData.length);
    
// // // // // // // //     // 2. Parse key (exactly like C#)
// // // // // // // //     // C# does: byte[] pwdBytes = Encoding.UTF8.GetBytes(key);
// // // // // // // //     // Then copies to 16-byte array
// // // // // // // //     const pwdBytes = CryptoJS.enc.Utf8.parse(secretKey);
// // // // // // // //     const keyBytes = new Uint8Array(16);
    
// // // // // // // //     // Copy bytes (C#: Array.Copy(pwdBytes, keyBytes, len))
// // // // // // // //     const pwdWords = pwdBytes.words;
// // // // // // // //     const pwdSigBytes = pwdBytes.sigBytes;
    
// // // // // // // //     for (let i = 0; i < Math.min(pwdSigBytes, 16); i++) {
// // // // // // // //       const bytePos = i % 4;
// // // // // // // //       const wordIndex = Math.floor(i / 4);
// // // // // // // //       const shift = 24 - (bytePos * 8);
// // // // // // // //       const byte = (pwdWords[wordIndex] >>> shift) & 0xff;
// // // // // // // //       keyBytes[i] = byte;
// // // // // // // //     }
    
// // // // // // // //     // Convert back to CryptoJS WordArray
// // // // // // // //     const keyWords = [];
// // // // // // // //     for (let i = 0; i < 16; i += 4) {
// // // // // // // //       let word = 0;
// // // // // // // //       for (let j = 0; j < 4 && i + j < 16; j++) {
// // // // // // // //         word = (word << 8) | keyBytes[i + j];
// // // // // // // //       }
// // // // // // // //       keyWords.push(word);
// // // // // // // //     }
    
// // // // // // // //     const key = CryptoJS.lib.WordArray.create(keyWords, 16);
// // // // // // // //     const iv = key; // Same IV as key
    
// // // // // // // //     console.log('Key bytes (hex):', CryptoJS.enc.Hex.stringify(key));
// // // // // // // //     console.log('IV bytes (hex):', CryptoJS.enc.Hex.stringify(iv));
    
// // // // // // // //     // 3. Decrypt
// // // // // // // //     console.log('\n🔄 Decrypting...');
// // // // // // // //     const encrypted = CryptoJS.enc.Base64.parse(cleanData);
    
// // // // // // // //     const decrypted = CryptoJS.AES.decrypt(
// // // // // // // //       { ciphertext: encrypted } as any,
// // // // // // // //       key,
// // // // // // // //       {
// // // // // // // //         iv: iv,
// // // // // // // //         mode: CryptoJS.mode.CBC,
// // // // // // // //         padding: CryptoJS.pad.Pkcs7
// // // // // // // //       }
// // // // // // // //     );
    
// // // // // // // //     // 4. Get raw bytes (NOT as UTF-8)
// // // // // // // //     const decryptedBytes = decrypted.toString(CryptoJS.enc.Latin1);
// // // // // // // //     console.log('Decrypted Latin1 length:', decryptedBytes.length);
// // // // // // // //     console.log('First 50 chars Latin1:', decryptedBytes.substring(0, 50));
    
// // // // // // // //     // 5. Check if it looks like base64
// // // // // // // //     const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(decryptedBytes);
// // // // // // // //     console.log('Looks like base64?', isBase64);
    
// // // // // // // //     let compressedBytes: Uint8Array;
    
// // // // // // // //     if (isBase64) {
// // // // // // // //       // It's base64 encoded compressed data
// // // // // // // //       const binaryString = atob(decryptedBytes);
// // // // // // // //       compressedBytes = new Uint8Array(binaryString.length);
// // // // // // // //       for (let i = 0; i < binaryString.length; i++) {
// // // // // // // //         compressedBytes[i] = binaryString.charCodeAt(i);
// // // // // // // //       }
// // // // // // // //     } else {
// // // // // // // //       // It's already binary
// // // // // // // //       compressedBytes = new Uint8Array(decryptedBytes.length);
// // // // // // // //       for (let i = 0; i < decryptedBytes.length; i++) {
// // // // // // // //         compressedBytes[i] = decryptedBytes.charCodeAt(i);
// // // // // // // //       }
// // // // // // // //     }
    
// // // // // // // //     console.log('Compressed bytes:', compressedBytes.length);
// // // // // // // //     console.log('First 20 bytes:', Array.from(compressedBytes.slice(0, 20)));
    
// // // // // // // //     // 6. Decompress
// // // // // // // //     console.log('\n🔄 Decompressing...');
// // // // // // // //     let decompressed: Uint8Array;
    
// // // // // // // //     try {
// // // // // // // //       decompressed = pako.inflateRaw(compressedBytes);
// // // // // // // //       console.log('✓ Used raw deflate');
// // // // // // // //     } catch (e1) {
// // // // // // // //       console.log('Raw deflate failed, trying regular...');
// // // // // // // //       try {
// // // // // // // //         decompressed = pako.inflate(compressedBytes);
// // // // // // // //         console.log('✓ Used regular inflate');
// // // // // // // //       } catch (e2) {
// // // // // // // //         console.log('Both failed, trying as plain text...');
// // // // // // // //         // Try as plain text
// // // // // // // //         const textResult = new TextDecoder('utf-8').decode(compressedBytes);
// // // // // // // //         console.log('Result as text:', textResult.substring(0, 200));
// // // // // // // //         console.log('\n🔐🔐🔐 CRYPTO DEBUG END 🔐🔐🔐');
// // // // // // // //         return textResult;
// // // // // // // //       }
// // // // // // // //     }
    
// // // // // // // //     // 7. Convert to string
// // // // // // // //     const result = new TextDecoder('utf-8').decode(decompressed);
    
// // // // // // // //     console.log('✅ Final result length:', result.length);
// // // // // // // //     console.log('First 500 chars:', result.substring(0, 500));
// // // // // // // //     console.log('\n🔐🔐🔐 CRYPTO DEBUG END 🔐🔐🔐');
    
// // // // // // // //     return result;
    
// // // // // // // //   } catch (error: any) {
// // // // // // // //     console.error('\n❌❌❌ CRYPTO ERROR ❌❌❌');
// // // // // // // //     console.error('Error:', error.message);
// // // // // // // //     console.error('Stack:', error.stack);
// // // // // // // //     console.error('❌❌❌ END ERROR ❌❌❌\n');
    
// // // // // // // //     // Return empty string instead of throwing
// // // // // // // //     return '';
// // // // // // // //   }
// // // // // // // // }

// // // // // // // // utils/margCrypto.ts - FIXED VERSION
// // // // // // // import CryptoJS from 'crypto-js';
// // // // // // // import pako from 'pako';

// // // // // // // export function decryptAndDecompress(
// // // // // // //   encryptedData: string,
// // // // // // //   secretKey: string
// // // // // // // ): string {
// // // // // // //   try {
// // // // // // //     console.log('🔐 [CRYPTO] Starting decryption...');
// // // // // // //     console.log('   Input length:', encryptedData.length);
    
// // // // // // //     // Step 1: Clean input (remove whitespace)
// // // // // // //     const cleanData = encryptedData.replace(/\s/g, '');
    
// // // // // // //     // Step 2: Create key (16 bytes) exactly like C#
// // // // // // //     // C# code: byte[] pwdBytes = Encoding.UTF8.GetBytes(key);
// // // // // // //     const pwdBytes = CryptoJS.enc.Utf8.parse(secretKey);
    
// // // // // // //     // C# code: byte[] keyBytes = new byte[0x10]; (16 bytes)
// // // // // // //     // C# code: Array.Copy(pwdBytes, keyBytes, len);
// // // // // // //     const key = CryptoJS.lib.WordArray.create(new Array(4)); // 16 bytes = 4 words
    
// // // // // // //     // Copy bytes from pwdBytes to key
// // // // // // //     const pwdWords = pwdBytes.words;
// // // // // // //     const len = Math.min(pwdBytes.sigBytes, 16);
    
// // // // // // //     for (let i = 0; i < len; i++) {
// // // // // // //       const bytePos = i % 4;
// // // // // // //       const wordIndex = Math.floor(i / 4);
// // // // // // //       const shift = 24 - (bytePos * 8);
      
// // // // // // //       // Get byte from pwdBytes
// // // // // // //       const pwdWord = pwdWords[wordIndex] || 0;
// // // // // // //       const pwdByte = (pwdWord >>> shift) & 0xff;
      
// // // // // // //       // Set byte in key
// // // // // // //       if (!key.words[wordIndex]) key.words[wordIndex] = 0;
// // // // // // //       key.words[wordIndex] |= (pwdByte << shift);
// // // // // // //     }
    
// // // // // // //     key.sigBytes = 16;
    
// // // // // // //     // Step 3: IV is same as key (from C#: rijndaelCipher.IV = keyBytes)
// // // // // // //     const iv = key;
    
// // // // // // //     console.log('   Key (hex):', CryptoJS.enc.Hex.stringify(key));
    
// // // // // // //     // Step 4: Decrypt
// // // // // // //     console.log('   Decrypting...');
// // // // // // //     const decrypted = CryptoJS.AES.decrypt(cleanData, key, {
// // // // // // //       iv: iv,
// // // // // // //       mode: CryptoJS.mode.CBC,
// // // // // // //       padding: CryptoJS.pad.Pkcs7
// // // // // // //     });
    
// // // // // // //     // Step 5: Get the raw bytes (NOT as UTF-8)
// // // // // // //     const decryptedBytes = decrypted.toString(CryptoJS.enc.Latin1);
    
// // // // // // //     if (!decryptedBytes) {
// // // // // // //       throw new Error('Decryption returned empty result');
// // // // // // //     }
    
// // // // // // //     console.log('✅ Decryption successful');
// // // // // // //     console.log('   Decrypted bytes length:', decryptedBytes.length);
    
// // // // // // //     // Step 6: Convert to Uint8Array for decompression
// // // // // // //     const compressedBytes = new Uint8Array(decryptedBytes.length);
// // // // // // //     for (let i = 0; i < decryptedBytes.length; i++) {
// // // // // // //       compressedBytes[i] = decryptedBytes.charCodeAt(i);
// // // // // // //     }
    
// // // // // // //     console.log('   Compressed bytes:', compressedBytes.length);
    
// // // // // // //     // Step 7: Decompress using raw deflate (C# DeflateStream)
// // // // // // //     console.log('   Decompressing...');
// // // // // // //     let decompressed: Uint8Array;
    
// // // // // // //     try {
// // // // // // //       // First try raw deflate (most likely for C# DeflateStream)
// // // // // // //       decompressed = pako.inflateRaw(compressedBytes);
// // // // // // //       console.log('   ✓ Used raw deflate');
// // // // // // //     } catch (rawError) {
// // // // // // //       console.log('   Raw deflate failed, trying regular inflate...');
// // // // // // //       try {
// // // // // // //         decompressed = pako.inflate(compressedBytes);
// // // // // // //         console.log('   ✓ Used regular inflate');
// // // // // // //       } catch (regularError) {
// // // // // // //         console.log('   Both decompression failed, returning raw data');
// // // // // // //         // Return the decrypted data as-is (might already be JSON string)
// // // // // // //         return decryptedBytes;
// // // // // // //       }
// // // // // // //     }
    
// // // // // // //     // Step 8: Convert to string
// // // // // // //     const result = new TextDecoder('utf-8').decode(decompressed);
    
// // // // // // //     console.log('✅ Decompression successful');
// // // // // // //     console.log('   Result length:', result.length);
// // // // // // //     console.log('   First 200 chars:', result.substring(0, 200));
    
// // // // // // //     return result;
    
// // // // // // //   } catch (error: any) {
// // // // // // //     console.error('❌ [CRYPTO] Error:', error.message);
    
// // // // // // //     // Try direct base64 decode as fallback
// // // // // // //     console.log('🔄 Trying fallback: direct base64 decode');
// // // // // // //     try {
// // // // // // //       const cleanData = encryptedData.replace(/\s/g, '');
// // // // // // //       const decoded = atob(cleanData);
// // // // // // //       console.log('   Fallback successful, length:', decoded.length);
// // // // // // //       return decoded;
// // // // // // //     } catch (fallbackError) {
// // // // // // //       console.error('   Fallback also failed');
// // // // // // //       throw error;
// // // // // // //     }
// // // // // // //   }
// // // // // // // }



// // // // // // // utils/margCrypto.ts
// // // // // // import CryptoJS from 'crypto-js';
// // // // // // import pako from 'pako';

// // // // // // export function decryptAndDecompress(
// // // // // //   encryptedData: string,
// // // // // //   secretKey: string
// // // // // // ): string {
// // // // // //   try {
// // // // // //     console.log('\n🔐🔐🔐 CRYPTO DEBUG START 🔐🔐🔐');
// // // // // //     console.log('Input length:', encryptedData.length);
// // // // // //     console.log('Key:', secretKey);
    
// // // // // //     // Step 1: Clean input
// // // // // //     const cleanData = encryptedData.replace(/\s+/g, '');
// // // // // //     console.log('Cleaned length:', cleanData.length);
    
// // // // // //     // Step 2: Create 16-byte key exactly like C#
// // // // // //     // C#: byte[] pwdBytes = Encoding.UTF8.GetBytes(key);
// // // // // //     // C#: byte[] keyBytes = new byte[0x10];
// // // // // //     // C#: Array.Copy(pwdBytes, keyBytes, len);
    
// // // // // //     // Convert secretKey to UTF-8 bytes
// // // // // //     const encoder = new TextEncoder();
// // // // // //     const pwdBytes = encoder.encode(secretKey);
    
// // // // // //     // Create 16-byte key array
// // // // // //     const keyBytes = new Uint8Array(16);
// // // // // //     const len = Math.min(pwdBytes.length, 16);
// // // // // //     keyBytes.set(pwdBytes.subarray(0, len));
    
// // // // // //     console.log('Key bytes (hex):', Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    
// // // // // //     // Convert to CryptoJS WordArray
// // // // // //     const keyWords = [];
// // // // // //     for (let i = 0; i < 16; i += 4) {
// // // // // //       let word = 0;
// // // // // //       for (let j = 0; j < 4 && i + j < 16; j++) {
// // // // // //         word = (word << 8) | keyBytes[i + j];
// // // // // //       }
// // // // // //       keyWords.push(word);
// // // // // //     }
    
// // // // // //     const key = CryptoJS.lib.WordArray.create(keyWords, 16);
// // // // // //     const iv = key; // Same IV as key (from C#)
    
// // // // // //     console.log('Key (CryptoJS):', key.toString());
// // // // // //     console.log('IV (same as key):', iv.toString());
    
// // // // // //     // Step 3: Parse base64 input
// // // // // //     console.log('\n🔄 Parsing base64 input...');
// // // // // //     let encrypted: CryptoJS.lib.WordArray;
    
// // // // // //     try {
// // // // // //       encrypted = CryptoJS.enc.Base64.parse(cleanData);
// // // // // //       console.log('✓ Base64 parse successful');
// // // // // //       console.log('Encrypted bytes:', encrypted.sigBytes);
// // // // // //     } catch (parseError) {
// // // // // //       console.error('❌ Base64 parse failed:', parseError);
// // // // // //       throw new Error('Invalid base64 data');
// // // // // //     }
    
// // // // // //     // Step 4: Decrypt
// // // // // //     console.log('\n🔄 Decrypting AES-CBC...');
// // // // // //     const decrypted = CryptoJS.AES.decrypt(
// // // // // //       { ciphertext: encrypted } as any,
// // // // // //       key,
// // // // // //       {
// // // // // //         iv: iv,
// // // // // //         mode: CryptoJS.mode.CBC,
// // // // // //         padding: CryptoJS.pad.Pkcs7
// // // // // //       }
// // // // // //     );
    
// // // // // //     // Step 5: Get decrypted bytes as Latin1 (binary)
// // // // // //     const decryptedLatin1 = decrypted.toString(CryptoJS.enc.Latin1);
    
// // // // // //     if (!decryptedLatin1) {
// // // // // //       console.error('❌ Decryption returned empty result');
// // // // // //       throw new Error('Decryption failed - empty result');
// // // // // //     }
    
// // // // // //     console.log('✅ Decryption successful!');
// // // // // //     console.log('Decrypted length (Latin1):', decryptedLatin1.length);
// // // // // //     console.log('First 50 chars (Latin1):', 
// // // // // //       decryptedLatin1.substring(0, 50).split('').map(c => 
// // // // // //         c.charCodeAt(0).toString(16).padStart(2, '0')
// // // // // //       ).join(' ')
// // // // // //     );
    
// // // // // //     // Step 6: Convert Latin1 to Uint8Array for decompression
// // // // // //     const compressedBytes = new Uint8Array(decryptedLatin1.length);
// // // // // //     for (let i = 0; i < decryptedLatin1.length; i++) {
// // // // // //       compressedBytes[i] = decryptedLatin1.charCodeAt(i);
// // // // // //     }
    
// // // // // //     console.log('\n🔄 Decompressing...');
// // // // // //     console.log('Compressed bytes:', compressedBytes.length);
// // // // // //     console.log('First 20 bytes (hex):', 
// // // // // //       Array.from(compressedBytes.slice(0, 20)).map(b => 
// // // // // //         b.toString(16).padStart(2, '0')
// // // // // //       ).join(' ')
// // // // // //     );
    
// // // // // //     // Step 7: Check for common compression headers
// // // // // //     const firstBytes = Array.from(compressedBytes.slice(0, 4));
// // // // // //     console.log('First 4 bytes (decimal):', firstBytes.join(', '));
    
// // // // // //     let decompressed: Uint8Array;
    
// // // // // //     // Check if it's raw deflate (C# DeflateStream)
// // // // // //     if (compressedBytes.length > 0) {
// // // // // //       try {
// // // // // //         // Try raw deflate first (most likely)
// // // // // //         decompressed = pako.inflateRaw(compressedBytes);
// // // // // //         console.log('✓ Used raw deflate (no headers)');
// // // // // //       } catch (rawError) {
// // // // // //         console.log('Raw deflate failed, trying regular inflate...');
// // // // // //         try {
// // // // // //           decompressed = pako.inflate(compressedBytes);
// // // // // //           console.log('✓ Used regular inflate (with headers)');
// // // // // //         } catch (regularError) {
// // // // // //           console.log('Both decompression failed');
// // // // // //           console.log('⚠️ Returning raw decrypted data');
// // // // // //           console.log('🔐🔐🔐 CRYPTO DEBUG END 🔐🔐🔐\n');
// // // // // //           return decryptedLatin1;
// // // // // //         }
// // // // // //       }
// // // // // //     } else {
// // // // // //       console.log('⚠️ No compressed data, returning empty');
// // // // // //       console.log('🔐🔐🔐 CRYPTO DEBUG END 🔐🔐🔐\n');
// // // // // //       return '';
// // // // // //     }
    
// // // // // //     // Step 8: Convert to string
// // // // // //     const result = new TextDecoder('utf-8').decode(decompressed);
    
// // // // // //     console.log('✅ Decompression successful!');
// // // // // //     console.log('Result length:', result.length);
    
// // // // // //     // Check if result looks like JSON
// // // // // //     const trimmedResult = result.trim();
// // // // // //     const looksLikeJson = (trimmedResult.startsWith('[') && trimmedResult.endsWith(']')) || 
// // // // // //                          (trimmedResult.startsWith('{') && trimmedResult.endsWith('}'));
    
// // // // // //     console.log('Looks like JSON?', looksLikeJson);
    
// // // // // //     if (looksLikeJson) {
// // // // // //       console.log('First 500 chars of result:', result.substring(0, 500));
// // // // // //     } else {
// // // // // //       console.log('Result (first 200 chars):', result.substring(0, 200));
// // // // // //       console.log('Result char codes (first 50):', 
// // // // // //         result.substring(0, 50).split('').map(c => 
// // // // // //           c.charCodeAt(0).toString(16).padStart(2, '0')
// // // // // //         ).join(' ')
// // // // // //       );
// // // // // //     }
    
// // // // // //     console.log('🔐🔐🔐 CRYPTO DEBUG END 🔐🔐🔐\n');
// // // // // //     return result;
    
// // // // // //   } catch (error: any) {
// // // // // //     console.error('\n❌❌❌ CRYPTO ERROR ❌❌❌');
// // // // // //     console.error('Error:', error.message);
// // // // // //     console.error('Stack:', error.stack ? error.stack.substring(0, 500) : 'No stack');
// // // // // //     console.error('❌❌❌ END ERROR ❌❌❌\n');
    
// // // // // //     // Return empty string to prevent crashes
// // // // // //     return '';
// // // // // //   }
// // // // // // }


// // // // // // utils/margCrypto.ts - UPDATED FOR C# DEFLATESTREAM
// // // // // import CryptoJS from 'crypto-js';
// // // // // import pako from 'pako';
// // // // // import { Buffer } from 'buffer';

// // // // // export function decryptAndDecompress(
// // // // //   encryptedData: string,
// // // // //   secretKey: string
// // // // // ): string {
// // // // //   try {
// // // // //     console.log('\n🔐🔐🔐 CRYPTO DEBUG START 🔐🔐🔐');
// // // // //     console.log('Input length:', encryptedData.length);
// // // // //     console.log('Key:', secretKey);
    
// // // // //     // Step 1: Clean input
// // // // //     const cleanData = encryptedData.replace(/\s+/g, '');
    
// // // // //     // Step 2: Create key exactly like C#
// // // // //     // C#: RijndaelManaged with KeySize = 0x80 (128 bits = 16 bytes)
// // // // //     const encoder = new TextEncoder();
// // // // //     const pwdBytes = encoder.encode(secretKey);
// // // // //     const keyBytes = new Uint8Array(16);
// // // // //     const len = Math.min(pwdBytes.length, 16);
// // // // //     keyBytes.set(pwdBytes.subarray(0, len));
    
// // // // //     console.log('Key bytes (hex):', Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    
// // // // //     // Convert to CryptoJS WordArray
// // // // //     const keyWords = [];
// // // // //     for (let i = 0; i < 16; i += 4) {
// // // // //       let word = 0;
// // // // //       for (let j = 0; j < 4 && i + j < 16; j++) {
// // // // //         word = (word << 8) | keyBytes[i + j];
// // // // //       }
// // // // //       keyWords.push(word);
// // // // //     }
    
// // // // //     const key = CryptoJS.lib.WordArray.create(keyWords, 16);
// // // // //     const iv = key; // Same as C#: rijndaelCipher.IV = keyBytes
    
// // // // //     // Step 3: Decrypt
// // // // //     console.log('\n🔄 Decrypting...');
// // // // //     const encrypted = CryptoJS.enc.Base64.parse(cleanData);
    
// // // // //     const decrypted = CryptoJS.AES.decrypt(
// // // // //       { ciphertext: encrypted } as any,
// // // // //       key,
// // // // //       {
// // // // //         iv: iv,
// // // // //         mode: CryptoJS.mode.CBC,
// // // // //         padding: CryptoJS.pad.Pkcs7
// // // // //       }
// // // // //     );
    
// // // // //     // Get as Latin1 (binary)
// // // // //     const decryptedLatin1 = decrypted.toString(CryptoJS.enc.Latin1);
    
// // // // //     if (!decryptedLatin1) {
// // // // //       throw new Error('Decryption returned empty');
// // // // //     }
    
// // // // //     console.log('✅ Decryption successful');
// // // // //     console.log('Decrypted bytes:', decryptedLatin1.length);
    
// // // // //     // Step 4: Convert to Buffer for easier manipulation
// // // // //     const buffer = Buffer.from(decryptedLatin1, 'binary');
// // // // //     console.log('Buffer length:', buffer.length);
    
// // // // //     // Step 5: IMPORTANT - C# DeflateStream might have different format
// // // // //     // Let's try multiple decompression approaches
    
// // // // //     // Approach 1: Try standard inflate (zlib)
// // // // //     try {
// // // // //       console.log('\n🔄 Trying standard zlib inflate...');
// // // // //       const decompressed = pako.inflate(buffer);
// // // // //       const result = Buffer.from(decompressed).toString('utf8');
// // // // //       console.log('✅ Standard inflate worked!');
// // // // //       console.log('Result length:', result.length);
// // // // //       console.log('First 200 chars:', result.substring(0, 200));
// // // // //       console.log('🔐🔐🔐 CRYPTO DEBUG END 🔐🔐🔐\n');
// // // // //       return result;
// // // // //     } catch (error1) {
// // // // //       console.log('Standard inflate failed');
// // // // //     }
    
// // // // //     // Approach 2: Try raw deflate
// // // // //     try {
// // // // //       console.log('\n🔄 Trying raw deflate...');
// // // // //       const decompressed = pako.inflateRaw(buffer);
// // // // //       const result = Buffer.from(decompressed).toString('utf8');
// // // // //       console.log('✅ Raw deflate worked!');
// // // // //       console.log('Result length:', result.length);
// // // // //       console.log('First 200 chars:', result.substring(0, 200));
// // // // //       console.log('🔐🔐🔐 CRYPTO DEBUG END 🔐🔐🔐\n');
// // // // //       return result;
// // // // //     } catch (error2) {
// // // // //       console.log('Raw deflate failed');
// // // // //     }
    
// // // // //     // Approach 3: Check if it's gzip (unlikely for C#)
// // // // //     try {
// // // // //       console.log('\n🔄 Trying gzip...');
// // // // //       const decompressed = pako.ungzip(buffer);
// // // // //       const result = Buffer.from(decompressed).toString('utf8');
// // // // //       console.log('✅ Gzip worked!');
// // // // //       console.log('Result length:', result.length);
// // // // //       console.log('First 200 chars:', result.substring(0, 200));
// // // // //       console.log('🔐🔐🔐 CRYPTO DEBUG END 🔐🔐🔐\n');
// // // // //       return result;
// // // // //     } catch (error3) {
// // // // //       console.log('Gzip failed');
// // // // //     }
    
// // // // //     // Approach 4: Try without first 2 bytes (C# DeflateStream sometimes has header)
// // // // //     if (buffer.length > 2) {
// // // // //       try {
// // // // //         console.log('\n🔄 Trying without first 2 bytes...');
// // // // //         const withoutHeader = buffer.slice(2);
// // // // //         const decompressed = pako.inflate(withoutHeader);
// // // // //         const result = Buffer.from(decompressed).toString('utf8');
// // // // //         console.log('✅ Worked without first 2 bytes!');
// // // // //         console.log('Result length:', result.length);
// // // // //         console.log('First 200 chars:', result.substring(0, 200));
// // // // //         console.log('🔐🔐🔐 CRYPTO DEBUG END 🔐🔐🔐\n');
// // // // //         return result;
// // // // //       } catch (error4) {
// // // // //         console.log('Failed without first 2 bytes');
// // // // //       }
// // // // //     }
    
// // // // //     // Approach 5: Check if it's already JSON (maybe not compressed at all)
// // // // //     console.log('\n🔄 Checking if already plain text...');
// // // // //     const asUtf8 = buffer.toString('utf8');
// // // // //     const trimmed = asUtf8.trim();
    
// // // // //     // Check if it looks like JSON
// // // // //     if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
// // // // //         (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
// // // // //       console.log('✅ Already JSON!');
// // // // //       console.log('Result length:', asUtf8.length);
// // // // //       console.log('First 200 chars:', asUtf8.substring(0, 200));
// // // // //       console.log('🔐🔐🔐 CRYPTO DEBUG END 🔐🔐🔐\n');
// // // // //       return asUtf8;
// // // // //     }
    
// // // // //     // Approach 6: Try with a custom decompressor for C# DeflateStream
// // // // //     console.log('\n🔄 Trying custom C# DeflateStream approach...');
// // // // //     try {
// // // // //       // C# DeflateStream might be using a different format
// // // // //       // Let's try to manually parse it
      
// // // // //       // Check first few bytes
// // // // //       console.log('First 10 bytes (hex):', buffer.slice(0, 10).toString('hex'));
      
// // // // //       // If first byte is 0x78, it's zlib
// // // // //       if (buffer[0] === 0x78) {
// // // // //         console.log('Looks like zlib header (0x78)');
// // // // //         const decompressed = pako.inflate(buffer);
// // // // //         const result = Buffer.from(decompressed).toString('utf8');
// // // // //         console.log('✅ Zlib decompression worked');
// // // // //         return result;
// // // // //       }
      
// // // // //       // If first two bytes are 0x1F 0x8B, it's gzip
// // // // //       if (buffer[0] === 0x1F && buffer[1] === 0x8B) {
// // // // //         console.log('Looks like gzip header');
// // // // //         const decompressed = pako.ungzip(buffer);
// // // // //         const result = Buffer.from(decompressed).toString('utf8');
// // // // //         console.log('✅ Gzip decompression worked');
// // // // //         return result;
// // // // //       }
      
// // // // //       // Try as raw deflate with Adler-32 checksum
// // // // //       console.log('Trying raw deflate with Adler-32...');
// // // // //       const decompressed = pako.inflateRaw(buffer);
// // // // //       const result = Buffer.from(decompressed).toString('utf8');
// // // // //       console.log('✅ Raw deflate with Adler-32 worked');
// // // // //       return result;
      
// // // // //     } catch (customError) {
// // // // //       console.log('Custom approach failed');
// // // // //     }
    
// // // // //     // Last resort: return raw data
// // // // //     console.log('⚠️ All decompression failed, returning raw data');
// // // // //     console.log('First 200 chars raw:', asUtf8.substring(0, 200));
// // // // //     console.log('🔐🔐🔐 CRYPTO DEBUG END 🔐🔐🔐\n');
// // // // //     return asUtf8;
    
// // // // //   } catch (error: any) {
// // // // //     console.error('\n❌❌❌ CRYPTO ERROR ❌❌❌');
// // // // //     console.error('Error:', error.message);
// // // // //     console.error('❌❌❌ END ERROR ❌❌❌\n');
// // // // //     return '';
// // // // //   }
// // // // // }




// // // // import CryptoJS from 'crypto-js';
// // // // import pako from 'pako';
// // // // import { Buffer } from 'buffer';

// // // // /**
// // // //  * Decrypts and Decompresses MargERP data
// // // //  * Matches C# RijndaelManaged AES-128-CBC + DeflateStream
// // // //  */
// // // // export function decryptAndDecompress(
// // // //   encryptedData: string,
// // // //   secretKey: string
// // // // ): string {
// // // //   if (!encryptedData) return '';

// // // //   try {
// // // //     // 1. Setup Key and IV (Matches C# byte array logic)
// // // //     const encoder = new TextEncoder();
// // // //     const pwdBytes = encoder.encode(secretKey);
// // // //     const keyBytes = new Uint8Array(16);
// // // //     const len = Math.min(pwdBytes.length, 16);
// // // //     keyBytes.set(pwdBytes.subarray(0, len));

// // // //     // Convert bytes to WordArray for CryptoJS
// // // //     const keyHex = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
// // // //     const key = CryptoJS.enc.Hex.parse(keyHex);
// // // //     const iv = key; // Per C# code: rijndaelCipher.IV = keyBytes;

// // // //     // 2. Decrypt
// // // //     // We trim the string to remove any whitespace/newlines
// // // //     const decrypted = CryptoJS.AES.decrypt(
// // // //       encryptedData.trim(),
// // // //       key,
// // // //       {
// // // //         iv: iv,
// // // //         mode: CryptoJS.mode.CBC,
// // // //         padding: CryptoJS.pad.Pkcs7
// // // //       }
// // // //     );

// // // //     // 3. Extract as Latin1 (Binary)
// // // //     // This is CRITICAL. UTF-8 will corrupt the compressed bytes.
// // // //     const decryptedRaw = decrypted.toString(CryptoJS.enc.Latin1);
    
// // // //     if (!decryptedRaw) {
// // // //       throw new Error('Decryption failed to produce output');
// // // //     }

// // // //     // Convert to Buffer/Uint8Array
// // // //     const buffer = Buffer.from(decryptedRaw, 'binary');

// // // //     // 4. Decompress using Raw Inflate
// // // //     // C# DeflateStream does NOT use Zlib headers (0x78...)
// // // //     try {
// // // //       const decompressed = pako.inflateRaw(buffer);
// // // //       const result = Buffer.from(decompressed).toString('utf8');
      
// // // //       // Safety check: if it's JSON, it should start with { or [
// // // //       if (result.trim().startsWith('{') || result.trim().startsWith('[')) {
// // // //         return result;
// // // //       }
// // // //       return result;
// // // //     } catch (err) {
// // // //       // Fallback: Try standard inflate if Raw fails
// // // //       const decompressed = pako.inflate(new Uint8Array(buffer));
// // // //       return Buffer.from(decompressed).toString('utf8');
// // // //     }

// // // //   } catch (error: any) {
// // // //     console.error('Final Crypto Error:', error.message);
// // // //     return '';
// // // //   }
// // // // }


// // // import CryptoJS from 'crypto-js';
// // // import pako from 'pako';
// // // import { Buffer } from 'buffer';

// // // /**
// // //  * Decrypts and Decompresses data from MargERP
// // //  * Logic: AES-128-CBC (Key=IV) -> Raw Deflate
// // //  */
// // // export function decryptAndDecompress(
// // //   encryptedData: string,
// // //   secretKey: string
// // // ): string {
// // //   if (!encryptedData) return '';

// // //   try {
// // //     // 1. CREATE KEY AND IV (Standard 16-byte/128-bit)
// // //     // We create the WordArray manually to avoid 'enc.Hex' undefined issues
// // //     const keyBytes = new Int8Array(16);
// // //     for (let i = 0; i < secretKey.length && i < 16; i++) {
// // //       keyBytes[i] = secretKey.charCodeAt(i);
// // //     }

// // //     // Convert to CryptoJS WordArray directly
// // //     const key = CryptoJS.lib.WordArray.create(keyBytes as any, 16);
// // //     const iv = key; // Per C# code: rijndaelCipher.IV = keyBytes;

// // //     // 2. DECRYPT
// // //     // Clean the input to ensure no weird whitespace/newlines break the parse
// // //     const cipherParams = CryptoJS.lib.CipherParams.create({
// // //       ciphertext: CryptoJS.enc.Base64.parse(encryptedData.replace(/\s/g, ''))
// // //     });

// // //     const decrypted = CryptoJS.AES.decrypt(
// // //       cipherParams,
// // //       key,
// // //       {
// // //         iv: iv,
// // //         mode: CryptoJS.mode.CBC,
// // //         padding: CryptoJS.pad.Pkcs7
// // //       }
// // //     );

// // //     // 3. EXTRACT AS BINARY (LATIN1)
// // //     // We do NOT use UTF8 here because the result is compressed binary data
// // //     const decryptedRaw = decrypted.toString(CryptoJS.enc.Latin1);
    
// // //     if (!decryptedRaw || decryptedRaw.length === 0) {
// // //       throw new Error("Decryption failed: Empty output");
// // //     }

// // //     // Convert binary string to Buffer
// // //     const buffer = Buffer.from(decryptedRaw, 'binary');

// // //     // 4. DECOMPRESS
// // //     // C# DeflateStream produces a raw bitstream (no zlib headers)
// // //     try {
// // //       // Try raw inflate first (most likely for C# DeflateStream)
// // //       const decompressed = pako.inflateRaw(buffer);
// // //       return Buffer.from(decompressed).toString('utf8');
// // //     } catch (deflateError) {
// // //       // Fallback: try standard inflate
// // //       const decompressed = pako.inflate(new Uint8Array(buffer));
// // //       return Buffer.from(decompressed).toString('utf8');
// // //     }

// // //   } catch (error: any) {
// // //     // Log the actual error stack if available to catch the 'undefined' source
// // //     console.error('Final Crypto Error:', error?.message || error || 'Unknown Error');
// // //     return '';
// // //   }
// // // }


// // import CryptoJS from 'crypto-js';
// // import pako from 'pako';

// // /**
// //  * Decrypts and Decompresses data from MargERP
// //  * Matches C# implementation:
// //  * - AES-128-CBC with PKCS7 padding
// //  * - Key and IV are the same (first 16 bytes of UTF8-encoded secret)
// //  * - Result is DeflateStream compressed data (raw deflate, no zlib wrapper)
// //  */
// // export function decryptAndDecompress(
// //   encryptedData: string,
// //   secretKey: string
// // ): string {
// //   if (!encryptedData || !secretKey) {
// //     throw new Error('Missing encrypted data or secret key');
// //   }

// //   try {
// //     console.log('🔐 Starting decryption process...');
    
// //     // STEP 1: Create Key and IV (same as C# logic)
// //     // C# does: byte[] pwdBytes = Encoding.UTF8.GetBytes(key);
// //     const keyBytes = CryptoJS.enc.Utf8.parse(secretKey);
    
// //     // C# does: byte[] keyBytes = new byte[0x10]; (16 bytes)
// //     // Then copies up to 16 bytes from pwdBytes
// //     const key = CryptoJS.lib.WordArray.create(keyBytes.words.slice(0, 4), 16);
// //     const iv = key; // C# sets IV = Key
    
// //     console.log('   ✓ Key and IV created (16 bytes each)');

// //     // STEP 2: Clean and decode base64
// //     // Remove any whitespace that might be in the data
// //     const cleanedData = encryptedData.replace(/\s+/g, '');
    
// //     console.log('   ✓ Base64 data cleaned');

// //     // STEP 3: Decrypt using AES-128-CBC
// //     const decrypted = CryptoJS.AES.decrypt(
// //       cleanedData,
// //       key,
// //       {
// //         iv: iv,
// //         mode: CryptoJS.mode.CBC,
// //         padding: CryptoJS.pad.Pkcs7,
// //         keySize: 128 / 32, // 128 bits = 4 words
// //       }
// //     );

// //     console.log('   ✓ AES decryption completed');

// //     // STEP 4: Convert decrypted WordArray to Uint8Array
// //     // The decrypted data is compressed binary, NOT text
// //     const decryptedBytes = wordArrayToUint8Array(decrypted);
    
// //     if (decryptedBytes.length === 0) {
// //       throw new Error('Decryption produced empty result');
// //     }
    
// //     console.log('   ✓ Converted to bytes:', decryptedBytes.length, 'bytes');

// //     // STEP 5: Decompress using raw DEFLATE
// //     // C# uses DeflateStream which produces raw deflate (no zlib header)
// //     let decompressed: Uint8Array;
    
// //     try {
// //       // Try raw inflate first (matches C# DeflateStream)
// //       decompressed = pako.inflateRaw(decryptedBytes);
// //       console.log('   ✓ Decompressed with inflateRaw');
// //     } catch (rawError) {
// //       console.log('   ⚠ inflateRaw failed, trying inflate...');
// //       try {
// //         // Fallback to standard inflate
// //         decompressed = pako.inflate(decryptedBytes);
// //         console.log('   ✓ Decompressed with inflate');
// //       } catch (inflateError: any) {
// //         throw new Error(`Decompression failed: ${inflateError.message}`);
// //       }
// //     }

// //     // STEP 6: Convert to UTF8 string
// //     const result = new TextDecoder('utf-8').decode(decompressed);
    
// //     console.log('   ✓ Final result length:', result.length, 'chars');
    
// //     return result;

// //   } catch (error: any) {
// //     console.error('❌ Decryption/Decompression Error:', error.message);
// //     console.error('   Stack:', error.stack);
// //     throw error;
// //   }
// // }

// // /**
// //  * Convert CryptoJS WordArray to Uint8Array
// //  * WordArray stores data as 32-bit words, we need bytes
// //  */
// // function wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
// //   const words = wordArray.words;
// //   const sigBytes = wordArray.sigBytes;
// //   const bytes = new Uint8Array(sigBytes);
  
// //   for (let i = 0; i < sigBytes; i++) {
// //     const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
// //     bytes[i] = byte;
// //   }
  
// //   return bytes;
// // }

// // /**
// //  * Test function to verify decryption with known sample
// //  */
// // export function testDecryption(): void {
// //   const sampleData = "Huy7X7t6Wh20ILOL+yeIJURFcdKxrwwmi5OhVH2aJSWnby33jtrifjaZZFKISRGwltUTuJAiMs3mwE03Y+JkFoHylnOcubix2FiVx6pcoOYtDTEZ0bjYf2ro0QkH7KPOna+eHnYFO4VTIOoazBmySww0MhsYn+0dIh81OiteCAkwshZobwgWjTVIQA/wB9ik8t7y1OV1PMIl9R1LtogTu1N2XpnZ6/nnw59ukRGtpxtxviRsArOVQ1DmkY5RYiYql8S1fEpqudjUD0XnlpS0uITgoEvciJFxbw8qaMPMHXx5OORLiL8PvcqxPQfMllMXT/GZaHEaYJiT711YfKupEF3DAZ+Laz43zoopxDbZDkEwt5YDIMmWyF2p9t7C6WwybgdEkodDqp8tbCbLgBug/DGfM31kvt8BOqO0zbtF5hqceFoMJ//R0JDQJXOpaLBDlukhkI7M1KqAvDLrLWvGd3Zkf3ln2nJfLsN/D5yvRd6TBMcreXkGBxoSFtypYm/9JrNfhFcCtG5Mdj6uu64ZA2HPnj6poIYceVD3CAzjKcZ3MfH/wdtmsSyUfTjGW7BYefVsfWp8fVyh9IEEYXSMmUX0y4dCcBvUsJrqWo8v6BmENQgt9nbgPIYepYxc3aSCo76qv6o4cUUnh7SkO9fedRxiuhS/olrRdTaLnXF8fK2HD/FYBDtG6kMJ47X9W0XsWak6G8kvVE5ZJ0xjB+FFMCADZPuPfG1zG2kDvRAcEsuhyxhQtYQbU5Ki9LF72PM5h/K+VxSXRZpq/JHBz0X0Aj4ucHYf6SQZoxkNIcA7zW3BnHLBvxzJMQ5sNUpbQ+YEr0IPq7kTpo01YXfvRMvZvhsnk47GU/X/YnlQvMZKB00qj2VO/AM8iMjDZSyWmuCIM9fdQrjg1cz/ozvD3KPHq1PZbW5omojXX51XRh7FwV8OJc5f5MyrmHXS6IcYvLUIFlu7AfSjLl8hfqewgAtbpHKgDKOcmc/4lqxbDrPb4+mPr8axopyQLVoqPJtLk77eZDFFn0+XilNr2k12RwJazRF8SrPTIKoIma8u/v5l7kdvNHqn3iVGdzcxGyRfvtxaIxDWCv7AsuoL2diszvXF0J1UjQl6PyOaQ5mXSq/9ob06JBmOXJ7cqoblLOPCg/86NKjMC8S/O500qAcJ22/is5suXcjP5X1BMyt+E/DD0MtbuvXq/0wWBxqGV/lorfnuSOh+4YeXIfMQIjhOlLHZPZvuMm39RyVyBxgLSc455cjDG5Mgbp+pkXcTcXCbaR+3BfA1Y9Y0tPTjuB3k3CHCe19GRy7yf2NobFOuJmrlbm8tEgYvplrHBsaN1RRWdpq7diUI+5TOfn0BPCXcVR9xaDT68/NOZ2X2bM8JxyXwc37yfuM8lMcsGfZOjzGQ2HOk/Kj+ArCanrt+lK36RVaGcdbBPHRrhBg+Beluf1oYY+CUMQvvtbA13KkFBOiMgc60M61gAzxbHIt7cbRe8cVQEzIWtJRF0VCp//faGPwFKi3yeQyjUukfuuQPcOB4dJxeHuqOqY0zBrp08UnAl/vmb8krsEAT1hrDnXi8y1jSPjex9/v/YToOit1X9xpmbL5I/Qf3b6q88oCQzJIq2uUXB7O1CCuYkdYLrvlwrRhNZisZbopXcW4OeZGGwnCxLOcxvALBwpMQMqnhlFi5IYCTfcvK9K4GaQ8Tjm5PpVe+ah1iKIURM8AUSxMcblJAK8v75Bsej9Wdf3BfMFhu2aK6V5QaZvyn+QroC7RBfUNixMllpgiMpQ4Ufso3XXo22tQO/gJsLs/SN+CMxUz6D5ypnBBz5tSr0JdqZ1A9MxdXU5uZA8+Wrm6qmxUTjDkFxajMhTKismnLK84BGVP6UezctkMommSD70x4Z+49DV7J8T0WfI/POJ13aOEi035f67BtFizAyEE6Jr8SSRJrZ6vY7UdDGZPTqm3DUhTkKgxE5qbWzVqXW5hXjb2o4IubPHEg1qlKwik1Cl6eqoi2EP6GMmoOwsHX3EkxYVzNJDcmdp+9DxIq6UCL+Codqq5H7KgIp9BdlKTFladvTIUdff3tO3Ej29BNLaTZtsQv+V/EzeoJLbrWjRdoGspAhuLoOiWp36lc37dAkRH/bDdlsyE6Yy15ZI8XQRap4PS6wv7Yb3plk/fD0Djo9bxqlScrdmuiftZNG2PePUocnMqDhmJ+k5cCuV775+bTRyUKCfdpHTJpDFjClW5KRR1f7JIstWSQDzv5fP5GI77hXgn15d7JydWBEAhRiqAhcGrovt3BjQByu70ch5RdvwSdcBOmhhGzI7rV2a+TmnCvJFTfPN91UOCalX875k47N6qXZj7Jt6SXhBGocKnRDZoJkZxYADi7bShXb0nU6Zim13pr5/tL2wTb+SJlZXza9PLCnq8fRtcvSF9chtgef6Gb60zPS9mZUcXpo0INqSv0ZuGticiX9Ug==";
// //   const key = "690QIDCX1WU1";
  
// //   console.log('\n🧪 Testing Decryption with Sample Data...\n');
  
// //   try {
// //     const result = decryptAndDecompress(sampleData, key);
// //     console.log('\n✅ SUCCESS!');
// //     console.log('Result length:', result.length);
// //     console.log('First 200 chars:', result.substring(0, 200));
    
// //     // Try parsing as JSON
// //     try {
// //       const json = JSON.parse(result);
// //       console.log('\n✅ Valid JSON!');
// //       console.log('Type:', Array.isArray(json) ? 'Array' : 'Object');
// //       if (Array.isArray(json)) {
// //         console.log('Items:', json.length);
// //       }
// //     } catch {
// //       console.log('\n⚠ Result is not JSON');
// //     }
// //   } catch (error: any) {
// //     console.error('\n❌ TEST FAILED:', error.message);
// //   }
// // }


// import CryptoJS from 'crypto-js';
// import pako from 'pako';

// /**
//  * Decrypts and Decompresses data from MargERP
//  * Matches C# implementation:
//  * - AES-128-CBC with PKCS7 padding
//  * - Key and IV are the same (first 16 bytes of UTF8-encoded secret)
//  * - Result is DeflateStream compressed data (raw deflate, no zlib wrapper)
//  */
// export function decryptAndDecompress(
//   encryptedData: string,
//   secretKey: string
// ): string {
//   if (!encryptedData || !secretKey) {
//     throw new Error('Missing encrypted data or secret key');
//   }

//   try {
//     console.log('🔐 Starting decryption process...');
    
//     // STEP 1: Create Key and IV (same as C# logic)
//     const keyBytes = CryptoJS.enc.Utf8.parse(secretKey);
//     const key = CryptoJS.lib.WordArray.create(keyBytes.words.slice(0, 4), 16);
//     const iv = key;
    
//     console.log('   ✓ Key and IV created (16 bytes each)');

//     // STEP 2: Clean and decode base64
//     const cleanedData = encryptedData.replace(/\s+/g, '');
//     console.log('   ✓ Base64 data cleaned');

//     // STEP 3: Decrypt using AES-128-CBC
//     const decrypted = CryptoJS.AES.decrypt(
//       cleanedData,
//       key,
//       {
//         iv: iv,
//         mode: CryptoJS.mode.CBC,
//         padding: CryptoJS.pad.Pkcs7,
//         keySize: 128 / 32,
//       }
//     );

//     console.log('   ✓ AES decryption completed');

//     // STEP 4: Convert decrypted WordArray to Uint8Array
//     const decryptedBytes = wordArrayToUint8Array(decrypted);
    
//     if (decryptedBytes.length === 0) {
//       throw new Error('Decryption produced empty result');
//     }
    
//     console.log('   ✓ Converted to bytes:', decryptedBytes.length, 'bytes');
    
//     // Inspect the first few bytes to check compression format
//     const hexHeader = Array.from(decryptedBytes.slice(0, 16))
//       .map(b => b.toString(16).padStart(2, '0'))
//       .join(' ');
//     console.log('   📋 First 16 bytes (hex):', hexHeader);
    
//     // Check for common compression headers
//     if (decryptedBytes[0] === 0x1f && decryptedBytes[1] === 0x8b) {
//       console.log('   🔍 Detected: GZIP format');
//     } else if (decryptedBytes[0] === 0x78) {
//       console.log('   🔍 Detected: ZLIB format (0x78)');
//     } else {
//       console.log('   🔍 Detected: Likely RAW DEFLATE (no header)');
//     }

//     // STEP 5: Decompress
//     let decompressed: Uint8Array;
//     let decompMethod = '';
    
//     try {
//       // Try raw inflate first (C# DeflateStream = raw deflate)
//       decompressed = pako.inflateRaw(decryptedBytes);
//       decompMethod = 'inflateRaw';
//       console.log('   ✓ Decompressed with inflateRaw');
//     } catch (rawError: any) {
//       console.log('   ⚠ inflateRaw failed:', rawError?.message || String(rawError));
      
//       try {
//         // Try standard inflate (with zlib header)
//         decompressed = pako.inflate(decryptedBytes);
//         decompMethod = 'inflate';
//         console.log('   ✓ Decompressed with inflate');
//       } catch (inflateError: any) {
//         console.log('   ⚠ inflate failed:', inflateError?.message || String(inflateError));
        
//         try {
//           // Try ungzip
//           decompressed = pako.ungzip(decryptedBytes);
//           decompMethod = 'ungzip';
//           console.log('   ✓ Decompressed with ungzip');
//         } catch (gzipError: any) {
//           console.log('   ⚠ ungzip failed:', gzipError?.message || String(gzipError));
          
//           // All methods failed - provide detailed error
//           throw new Error(
//             `All decompression methods failed. ` +
//             `Raw: ${rawError?.message || 'unknown'}, ` +
//             `Inflate: ${inflateError?.message || 'unknown'}, ` +
//             `Gzip: ${gzipError?.message || 'unknown'}`
//           );
//         }
//       }
//     }

//     console.log('   ✓ Decompression method used:', decompMethod);
//     console.log('   ✓ Decompressed size:', decompressed.length, 'bytes');

//     // STEP 6: Convert to UTF8 string
//     const result = new TextDecoder('utf-8').decode(decompressed);
    
//     console.log('   ✓ Final result length:', result.length, 'chars');
//     console.log('   ✓ First 100 chars:', result.substring(0, 100));
    
//     return result;

//   } catch (error: any) {
//     console.error('❌ Decryption/Decompression Error:', error.message || String(error));
//     console.error('   Stack:', error.stack);
//     throw error;
//   }
// }

// /**
//  * Convert CryptoJS WordArray to Uint8Array
//  */
// function wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
//   const words = wordArray.words;
//   const sigBytes = wordArray.sigBytes;
//   const bytes = new Uint8Array(sigBytes);
  
//   for (let i = 0; i < sigBytes; i++) {
//     const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
//     bytes[i] = byte;
//   }
  
//   return bytes;
// }

// /**
//  * Alternative decryption approach - try Latin1 encoding
//  */
// export function decryptAndDecompressAlt(
//   encryptedData: string,
//   secretKey: string
// ): string {
//   try {
//     console.log('🔐 [ALT] Starting alternative decryption...');
    
//     // Create key/IV
//     const keyBytes = CryptoJS.enc.Utf8.parse(secretKey);
//     const key = CryptoJS.lib.WordArray.create(keyBytes.words.slice(0, 4), 16);
//     const iv = key;
    
//     // Decrypt
//     const decrypted = CryptoJS.AES.decrypt(
//       encryptedData.replace(/\s+/g, ''),
//       key,
//       {
//         iv: iv,
//         mode: CryptoJS.mode.CBC,
//         padding: CryptoJS.pad.Pkcs7,
//       }
//     );

//     // Try getting as Latin1 string (binary string)
//     const decryptedLatin1 = decrypted.toString(CryptoJS.enc.Latin1);
//     console.log('   ✓ Got Latin1 string:', decryptedLatin1.length, 'chars');
    
//     // Convert Latin1 string to Uint8Array
//     const bytes = new Uint8Array(decryptedLatin1.length);
//     for (let i = 0; i < decryptedLatin1.length; i++) {
//       bytes[i] = decryptedLatin1.charCodeAt(i) & 0xff;
//     }
    
//     console.log('   ✓ Converted to bytes:', bytes.length);
    
//     // Try decompression
//     const decompressed = pako.inflateRaw(bytes);
//     const result = new TextDecoder('utf-8').decode(decompressed);
    
//     console.log('   ✓ [ALT] Success!');
//     return result;
    
//   } catch (error: any) {
//     console.error('   ❌ [ALT] Failed:', error.message);
//     throw error;
//   }
// }

// /**
//  * Test with sample data
//  */
// export function testDecryption(): void {
//   const sampleData = "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";
//   const key = "690QIDCX1WU1";
  
//   console.log('\n🧪 Testing Decryption with Sample Data...\n');
  
//   try {
//     const result = decryptAndDecompress(sampleData, key);
//     console.log('\n✅ PRIMARY METHOD SUCCESS!');
//     console.log('Result length:', result.length);
//     console.log('First 200 chars:', result.substring(0, 200));
//   } catch (error: any) {
//     console.error('\n❌ PRIMARY METHOD FAILED:', error.message);
    
//     console.log('\n🔄 Trying alternative method...');
//     try {
//       const result = decryptAndDecompressAlt(sampleData, key);
//       console.log('\n✅ ALTERNATIVE METHOD SUCCESS!');
//       console.log('Result length:', result.length);
//       console.log('First 200 chars:', result.substring(0, 200));
//     } catch (altError: any) {
//       console.error('\n❌ ALTERNATIVE METHOD ALSO FAILED:', altError.message);
//     }
//   }
// }


import CryptoJS from 'crypto-js';
import pako from 'pako';

/**
 * Decrypts and Decompresses data from MargERP
 * Matches C# implementation:
 * - AES-128-CBC with PKCS7 padding
 * - Key and IV are the same (first 16 bytes of UTF8-encoded secret)
 * - Result is DeflateStream compressed data (raw deflate, no zlib wrapper)
 */
export function decryptAndDecompress(
  encryptedData: string,
  secretKey: string
): string {
  if (!encryptedData || !secretKey) {
    throw new Error('Missing encrypted data or secret key');
  }

  try {
    console.log('🔐 Starting decryption process...');
    
    // STEP 1: Create Key and IV (EXACTLY matching C# logic)
    // C# does:
    // byte[] pwdBytes = Encoding.UTF8.GetBytes(key);
    // byte[] keyBytes = new byte[0x10]; // 16 zeros
    // Array.Copy(pwdBytes, keyBytes, len); // Copy up to 16 bytes
    
    const secretBytes = CryptoJS.enc.Utf8.parse(secretKey); // Parse UTF8
    const keyArray = new Array(16).fill(0); // Create 16-byte array filled with zeros
    
    // Copy the secret bytes into the key array
    for (let i = 0; i < Math.min(secretBytes.sigBytes, 16); i++) {
      keyArray[i] = (secretBytes.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    
    // Create WordArray from the padded array
    const key = CryptoJS.lib.WordArray.create(keyArray as any, 16);
    const iv = key; // IV = Key (same as C#)
    
    console.log('   ✓ Key and IV created (16 bytes each, zero-padded)');

    // STEP 2: Clean and decode base64
    const cleanedData = encryptedData.replace(/\s+/g, '');
    console.log('   ✓ Base64 data cleaned');

    // STEP 3: Decrypt using AES-128-CBC
    const decrypted = CryptoJS.AES.decrypt(
      cleanedData,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
        keySize: 128 / 32,
      }
    );

    console.log('   ✓ AES decryption completed');

    // STEP 4: Convert decrypted WordArray to Uint8Array
    const decryptedBytes = wordArrayToUint8Array(decrypted);
    
    if (decryptedBytes.length === 0) {
      throw new Error('Decryption produced empty result');
    }
    
    console.log('   ✓ Converted to bytes:', decryptedBytes.length, 'bytes');
    
    // Inspect the first few bytes to check compression format
    const hexHeader = Array.from(decryptedBytes.slice(0, 16))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    console.log('   📋 First 16 bytes (hex):', hexHeader);
    
    // Check for common compression headers
    if (decryptedBytes[0] === 0x1f && decryptedBytes[1] === 0x8b) {
      console.log('   🔍 Detected: GZIP format');
    } else if (decryptedBytes[0] === 0x78) {
      console.log('   🔍 Detected: ZLIB format (0x78)');
    } else {
      console.log('   🔍 Detected: Likely RAW DEFLATE (no header)');
    }

    // STEP 5: Decompress
    let decompressed: Uint8Array;
    let decompMethod = '';
    
    try {
      // Try raw inflate first (C# DeflateStream = raw deflate)
      decompressed = pako.inflateRaw(decryptedBytes);
      decompMethod = 'inflateRaw';
      console.log('   ✓ Decompressed with inflateRaw');
    } catch (rawError: any) {
      console.log('   ⚠ inflateRaw failed:', rawError?.message || String(rawError));
      
      try {
        // Try standard inflate (with zlib header)
        decompressed = pako.inflate(decryptedBytes);
        decompMethod = 'inflate';
        console.log('   ✓ Decompressed with inflate');
      } catch (inflateError: any) {
        console.log('   ⚠ inflate failed:', inflateError?.message || String(inflateError));
        
        try {
          // Try ungzip
          decompressed = pako.ungzip(decryptedBytes);
          decompMethod = 'ungzip';
          console.log('   ✓ Decompressed with ungzip');
        } catch (gzipError: any) {
          console.log('   ⚠ ungzip failed:', gzipError?.message || String(gzipError));
          
          // All methods failed - provide detailed error
          throw new Error(
            `All decompression methods failed. ` +
            `Raw: ${rawError?.message || 'unknown'}, ` +
            `Inflate: ${inflateError?.message || 'unknown'}, ` +
            `Gzip: ${gzipError?.message || 'unknown'}`
          );
        }
      }
    }

    console.log('   ✓ Decompression method used:', decompMethod);
    console.log('   ✓ Decompressed size:', decompressed.length, 'bytes');

    // STEP 6: Convert to UTF8 string
    const result = new TextDecoder('utf-8').decode(decompressed);
    
    console.log('   ✓ Final result length:', result.length, 'chars');
    console.log('   ✓ First 100 chars:', result.substring(0, 100));
    
    return result;

  } catch (error: any) {
    console.error('❌ Decryption/Decompression Error:', error.message || String(error));
    console.error('   Stack:', error.stack);
    throw error;
  }
}

/**
 * Convert CryptoJS WordArray to Uint8Array
 */
function wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const bytes = new Uint8Array(sigBytes);
  
  for (let i = 0; i < sigBytes; i++) {
    const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    bytes[i] = byte;
  }
  
  return bytes;
}

/**
 * Alternative decryption approach - try Latin1 encoding
 */
export function decryptAndDecompressAlt(
  encryptedData: string,
  secretKey: string
): string {
  try {
    console.log('🔐 [ALT] Starting alternative decryption...');
    
    // Create key/IV EXACTLY like C# with zero-padding
    const secretBytes = CryptoJS.enc.Utf8.parse(secretKey);
    const keyArray = new Array(16).fill(0);
    
    for (let i = 0; i < Math.min(secretBytes.sigBytes, 16); i++) {
      keyArray[i] = (secretBytes.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    
    const key = CryptoJS.lib.WordArray.create(keyArray as any, 16);
    const iv = key;
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData.replace(/\s+/g, ''),
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    // Try getting as Latin1 string (binary string)
    const decryptedLatin1 = decrypted.toString(CryptoJS.enc.Latin1);
    console.log('   ✓ Got Latin1 string:', decryptedLatin1.length, 'chars');
    
    // Convert Latin1 string to Uint8Array
    const bytes = new Uint8Array(decryptedLatin1.length);
    for (let i = 0; i < decryptedLatin1.length; i++) {
      bytes[i] = decryptedLatin1.charCodeAt(i) & 0xff;
    }
    
    console.log('   ✓ Converted to bytes:', bytes.length);
    
    // Try decompression
    const decompressed = pako.inflateRaw(bytes);
    const result = new TextDecoder('utf-8').decode(decompressed);
    
    console.log('   ✓ [ALT] Success!');
    return result;
    
  } catch (error: any) {
    console.error('   ❌ [ALT] Failed:', error.message);
    throw error;
  }
}

/**
 * Test with sample data
 */
export function testDecryption(): void {
  const sampleData = "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";
  const key = "690QIDCX1WU1";
  
  console.log('\n🧪 Testing Decryption with Sample Data...\n');
  
  try {
    const result = decryptAndDecompress(sampleData, key);
    console.log('\n✅ PRIMARY METHOD SUCCESS!');
    console.log('Result length:', result.length);
    console.log('First 200 chars:', result.substring(0, 200));
  } catch (error: any) {
    console.error('\n❌ PRIMARY METHOD FAILED:', error.message);
    
    console.log('\n🔄 Trying alternative method...');
    try {
      const result = decryptAndDecompressAlt(sampleData, key);
      console.log('\n✅ ALTERNATIVE METHOD SUCCESS!');
      console.log('Result length:', result.length);
      console.log('First 200 chars:', result.substring(0, 200));
    } catch (altError: any) {
      console.error('\n❌ ALTERNATIVE METHOD ALSO FAILED:', altError.message);
    }
  }
}
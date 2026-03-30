// Google Cloud Speech-to-Text API Configuration
// Get your API key from: https://console.cloud.google.com/apis/credentials

export const SPEECH_TO_TEXT_CONFIG = {
  // Google Cloud Speech-to-Text API Key
  // Replace with your actual API key from Google Cloud Console
  API_KEY: process.env.EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY || 'YOUR_GOOGLE_CLOUD_SPEECH_API_KEY',
  
  // API Endpoint
  API_URL: 'https://speech.googleapis.com/v1/speech:recognize',
  
  // Language code (en-IN for Indian English, en-US for US English)
  LANGUAGE_CODE: 'en-IN',
  
  // Audio configuration
  AUDIO_CONFIG: {
    encoding: 'LINEAR16' as const, // For WAV/PCM audio
    sampleRateHertz: 16000, // Standard for voice recognition
    languageCode: 'en-IN',
    alternativeLanguageCodes: ['en-US'], // Fallback languages
    enableAutomaticPunctuation: true,
    enableWordTimeOffsets: false,
    model: 'default', // Use 'command_and_search' for better short phrases
  },
  
  // Recognition config
  RECOGNITION_CONFIG: {
    enableAutomaticPunctuation: true,
    enableWordConfidence: false,
    enableWordTimeOffsets: false,
    model: 'default',
    useEnhanced: false, // Set to true for better accuracy (requires enhanced model)
  },
};

// Helper function to get API key
export const getSpeechApiKey = (): string => {
  const apiKey = SPEECH_TO_TEXT_CONFIG.API_KEY;
  if (!apiKey || apiKey === 'YOUR_GOOGLE_CLOUD_SPEECH_API_KEY') {
    console.warn('⚠️ Google Cloud Speech-to-Text API key not configured. Please set EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY environment variable.');
  }
  return apiKey;
};

export default SPEECH_TO_TEXT_CONFIG;



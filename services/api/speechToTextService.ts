// Google Cloud Speech-to-Text Service
import axios from 'axios';
import { SPEECH_TO_TEXT_CONFIG, getSpeechApiKey } from './speechToTextConfig';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  alternatives?: string[];
}

export interface SpeechRecognitionResponse {
  success: boolean;
  result?: SpeechRecognitionResult;
  error?: string;
}

class SpeechToTextService {
  private apiKey: string;

  constructor() {
    this.apiKey = getSpeechApiKey();
  }

  /**
   * Convert audio data (base64) to text using Google Cloud Speech-to-Text API
   * @param audioBase64 - Base64 encoded audio data (WAV/FLAC format)
   * @param sampleRateHertz - Audio sample rate (default: 16000)
   * @returns Promise with transcription result
   */
  async recognizeAudio(
    audioBase64: string,
    sampleRateHertz: number = 16000
  ): Promise<SpeechRecognitionResponse> {
    try {
      if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_CLOUD_SPEECH_API_KEY') {
        return {
          success: false,
          error: 'Google Cloud Speech-to-Text API key not configured. Please set EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY environment variable.',
        };
      }

      // Remove data URI prefix if present (e.g., "data:audio/wav;base64,")
      const base64Audio = audioBase64.includes(',')
        ? audioBase64.split(',')[1]
        : audioBase64;

      const requestBody = {
        config: {
          encoding: SPEECH_TO_TEXT_CONFIG.AUDIO_CONFIG.encoding,
          sampleRateHertz: sampleRateHertz,
          languageCode: SPEECH_TO_TEXT_CONFIG.AUDIO_CONFIG.languageCode,
          alternativeLanguageCodes: SPEECH_TO_TEXT_CONFIG.AUDIO_CONFIG.alternativeLanguageCodes,
          enableAutomaticPunctuation: SPEECH_TO_TEXT_CONFIG.AUDIO_CONFIG.enableAutomaticPunctuation,
          model: SPEECH_TO_TEXT_CONFIG.AUDIO_CONFIG.model,
        },
        audio: {
          content: base64Audio,
        },
      };

      const url = `${SPEECH_TO_TEXT_CONFIG.API_URL}?key=${this.apiKey}`;

      console.log('🎤 Sending audio to Google Cloud Speech-to-Text API...');
      
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const alternative = result.alternatives?.[0];

        if (alternative && alternative.transcript) {
          const transcript = alternative.transcript.trim();
          const confidence = alternative.confidence || 0;

          console.log('✅ Speech recognition successful:', transcript);
          console.log('📊 Confidence:', confidence);

          return {
            success: true,
            result: {
              transcript,
              confidence,
              alternatives: alternative.alternatives?.map((alt: any) => alt.transcript) || [],
            },
          };
        }
      }

      return {
        success: false,
        error: 'No speech detected in audio',
      };
    } catch (error: any) {
      console.error('❌ Speech recognition error:', error);
      
      let errorMessage = 'Failed to recognize speech';
      
      if (error.response) {
        // API error response
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.error?.message || 'Invalid audio format or configuration';
        } else if (status === 401) {
          errorMessage = 'Invalid API key. Please check your Google Cloud Speech-to-Text API key.';
        } else if (status === 403) {
          errorMessage = 'API key does not have permission to use Speech-to-Text API. Please enable the API in Google Cloud Console.';
        } else if (status === 429) {
          errorMessage = 'API quota exceeded. Please check your Google Cloud quota limits.';
        } else {
          errorMessage = data?.error?.message || `API error: ${status}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'YOUR_GOOGLE_CLOUD_SPEECH_API_KEY';
  }
}

// Export singleton instance
export const speechToTextService = new SpeechToTextService();
export default speechToTextService;



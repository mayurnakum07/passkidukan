import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// Direct import of Voice module - This is the correct way
let Voice: any = null;

try {
  if (Platform.OS !== 'web') {
    const VoiceModule = require('@react-native-voice/voice');
    Voice = VoiceModule.default || VoiceModule;
  }
} catch (e) {
  // Module not available (Expo Go or not built)
  Voice = null;
}

// Fallback loader if direct import fails
const getVoiceModule = (): any => {
  if (Platform.OS === 'web') {
    return null;
  }

  // Return directly imported Voice if available
  if (Voice && typeof Voice === 'object') {
    return Voice;
  }

  // Try require again
  try {
    const VoiceModule = require('@react-native-voice/voice');
    const V = VoiceModule.default || VoiceModule;
    if (V && typeof V === 'object') {
      Voice = V;
      return V;
    }
  } catch (e) {
    // Module not found
  }

  // Try NativeModules
  try {
    const VoiceModule = (NativeModules as any).Voice || 
                       (NativeModules as any).RCTVoice;
    if (VoiceModule && typeof VoiceModule === 'object') {
      return VoiceModule;
    }
  } catch (e) {
    // Not available
  }

  return null;
};

// Helper to check if Voice is available
const isVoiceAvailable = (): boolean => {
  const Voice = getVoiceModule();
  return Voice !== null && Voice !== undefined && typeof Voice === 'object';
};

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState(''); // Real-time partial results (like Cursor)
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [status, setStatus] = useState<string>('');
  
  const isMountedRef = useRef(true);
  const listenersSetupRef = useRef(false);
  const voiceModuleRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPartialResultRef = useRef<string>('');
  const SILENCE_TIMEOUT = 8000; // Auto-stop after 8 seconds of silence (longer for continuous speech)

  useEffect(() => {
    isMountedRef.current = true;
    initVoice();
    
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  const initVoice = async () => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsAvailable(!!SpeechRecognition);
      return;
    }

    // Check if running in Expo Go (which doesn't support native modules)
    const isExpoGo = Constants.executionEnvironment === 'storeClient' && 
                     !Constants.appOwnership && 
                     !Constants.isDevice;
    
    // More reliable check: if expo-dev-client is installed but we're in Expo Go
    const isRunningInExpoGo = !Constants.appOwnership || 
                              (Constants.executionEnvironment === 'storeClient' && 
                               !(NativeModules as any).ExpoDevClient);

    if (isRunningInExpoGo) {
      const errorMsg = 'Voice recognition requires a development build or EAS build. Expo Go does not support native modules. Please build the app using: npx expo run:android or npx eas build';
      setError(errorMsg);
      setIsAvailable(false);
      Alert.alert(
        '⚠️ Expo Go Not Supported',
        'Voice recognition requires native modules that are not available in Expo Go.\n\nPlease use:\n• Development Build: npx expo run:android\n• EAS Build: npx eas build --platform android',
        [{ text: 'OK' }]
      );
      return;
    }

    // Get Voice module dynamically
    const Voice = getVoiceModule();
    voiceModuleRef.current = Voice;

    if (!Voice) {
      const errorMsg = 'Voice module not available. Please ensure you are using a development build or EAS build, not Expo Go.';
      console.warn('⚠️', errorMsg);
      setError(errorMsg);
      setIsAvailable(false);
      Alert.alert(
        'Voice Module Unavailable',
        'Voice recognition requires native modules. Please build the app using:\n• npx expo run:android\n• npx eas build --platform android',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Check if Voice is available - handle different method names
      let isAvailableMethod = null;
      if (Voice.isAvailable && typeof Voice.isAvailable === 'function') {
        isAvailableMethod = Voice.isAvailable;
      } else if (Voice.isSpeechAvailable && typeof Voice.isSpeechAvailable === 'function') {
        isAvailableMethod = Voice.isSpeechAvailable;
      }

      if (isAvailableMethod) {
        try {
          const available = await isAvailableMethod();
          console.log('🎤 Voice recognition available:', available);
          
          if (available) {
            setupListeners(Voice);
            setIsAvailable(true);
            console.log('✅ Voice recognition ready');
          } else {
            console.warn('⚠️ Voice recognition not available on this device');
            setIsAvailable(false);
            setError('Voice recognition not available on this device');
          }
        } catch (checkError: any) {
          // If check fails, still try to setup (some devices don't support isAvailable)
          console.log('⚠️ Availability check failed, setting up anyway:', checkError?.message);
          setupListeners(Voice);
          setIsAvailable(true);
        }
      } else {
        // If isAvailable method doesn't exist, setup anyway
        console.log('🎤 Voice module found, setting up listeners...');
        setupListeners(Voice);
        setIsAvailable(true);
        console.log('✅ Voice recognition ready (availability check skipped)');
      }
    } catch (err: any) {
      console.error('❌ Init error:', err);
      setError(err?.message || 'Failed to initialize voice recognition');
      // Still enable the button - let user try
      setIsAvailable(true);
    }
  };

  const handleAutoStop = useCallback(async () => {
    const Voice = voiceModuleRef.current || getVoiceModule();
    if (Voice) {
      const stopMethod = Voice.stop || Voice.stopSpeech || Voice.stopListening;
      if (stopMethod && typeof stopMethod === 'function') {
        try {
          await stopMethod.call(Voice);
        } catch (e) {
          // Ignore
        }
      }
    }
    if (isMountedRef.current) {
      setIsListening(false);
      setStatus('');
      // Use last partial result as final transcript if no final result yet
      if (!transcript && lastPartialResultRef.current) {
        setTranscript(lastPartialResultRef.current);
      }
    }
  }, [transcript]);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        handleAutoStop();
      }
    }, SILENCE_TIMEOUT);
  }, [handleAutoStop]);

  const setupListeners = (Voice: any) => {
    if (listenersSetupRef.current) {
      return;
    }

    if (!Voice || typeof Voice !== 'object') {
      return;
    }

    try {
      // Remove all existing listeners first
      if (Voice.removeAllListeners && typeof Voice.removeAllListeners === 'function') {
        Voice.removeAllListeners();
      }

      // Setup event listeners
      Voice.onSpeechStart = () => {
        if (isMountedRef.current) {
          setIsListening(true);
          setError(null);
          setTranscript(''); // Keep previous transcript, don't clear
          setPartialTranscript(''); // Clear partial transcript
          setStatus('Listening...');
          lastPartialResultRef.current = '';
          resetSilenceTimer();
        }
      };

      Voice.onSpeechEnd = () => {
        if (isMountedRef.current) {
          clearSilenceTimer();
          setIsListening(false);
          setStatus('');
        }
      };

      Voice.onSpeechResults = (e: any) => {
        const text = e?.value?.[0] || e?.value || '';
        if (text && isMountedRef.current) {
          setTranscript(text);
          setPartialTranscript(''); // Clear partial when final result comes
          // Don't stop listening - let user continue speaking (like Cursor)
          // setIsListening(false);
          setStatus('');
          clearSilenceTimer();
        }
      };

      Voice.onSpeechPartialResults = (e: any) => {
        const text = e?.value?.[0] || e?.value || '';
        if (text && isMountedRef.current) {
          // Update partial transcript for real-time display (like Cursor)
          setPartialTranscript(text);
          lastPartialResultRef.current = text;
          resetSilenceTimer();
        }
      };

      Voice.onSpeechError = (e: any) => {
        const msg = e?.error?.message || e?.message || e?.error || 'Speech recognition error';
        if (isMountedRef.current) {
          setError(msg);
          setIsListening(false);
          setStatus('');
          clearSilenceTimer();
        }
      };

      Voice.onSpeechVolumeChanged = (e: any) => {
        // Optional: can use this for visual feedback
        console.log('🎤 Volume changed:', e?.value);
      };

      listenersSetupRef.current = true;
    } catch (err: any) {
      listenersSetupRef.current = false;
    }
  };

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions automatically
    }

    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      if (hasPermission) {
        return true;
      }

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs microphone access for voice search.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }
      );

      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      console.error('Permission error:', e);
      return false;
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      console.log('🎤 Starting voice recognition...');
      setError(null);
      setTranscript('');
      setStatus('');

      if (Platform.OS === 'web') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setError('Speech recognition not supported');
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onerror = (e: any) => {
          setError(e?.error || 'Speech error');
          setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e: any) => {
          const text = e.results?.[e.resultIndex]?.[0]?.transcript || '';
          if (text) {
            setTranscript(text);
          }
          setIsListening(false);
        };

        recognition.start();
        return;
      }

      // Mobile (Android/iOS) - Get Voice module
      let VoiceModule = voiceModuleRef.current || getVoiceModule();
      
      // If still null, try to get it again
      if (!VoiceModule) {
        console.log('🔄 Retrying to get Voice module...');
        VoiceModule = getVoiceModule();
        voiceModuleRef.current = VoiceModule;
      }

      if (!VoiceModule || typeof VoiceModule !== 'object') {
        const errorMsg = 'Voice recognition module is not available. Please build the app using EAS build or development client, not Expo Go.';
        console.error('❌ Voice module is null or invalid');
        console.error('❌ VoiceModule:', VoiceModule);
        setError(errorMsg);
        Alert.alert(
          'Voice Recognition Unavailable',
          'Voice recognition requires native modules.\n\nPlease use:\n• npx expo run:android\n• npx eas build --platform android',
          [{ text: 'OK' }]
        );
        return;
      }

      // Use the module
      const Voice = VoiceModule;

      // Request permission FIRST
      const hasPermission = await requestMicPermission();
      if (!hasPermission) {
        setError('Microphone permission required');
        Alert.alert(
          'Permission Required',
          'Please allow microphone permission in settings to use voice search.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Setup listeners if not already done (after permission)
      if (!listenersSetupRef.current) {
        setupListeners(Voice);
      }

      // @react-native-voice/voice uses Voice.start(locale) method
      if (!Voice || !Voice.start || typeof Voice.start !== 'function') {
        const availableMethods = Voice ? Object.keys(Voice).filter(key => typeof Voice[key] === 'function') : [];
        const errorMsg = `Voice.start method not found. Voice module: ${Voice ? 'exists' : 'null'}. Available methods: ${availableMethods.join(', ') || 'none'}`;
        console.error('❌', errorMsg);
        console.error('Voice module:', Voice);
        setError(errorMsg);
        Alert.alert(
          'Voice Recognition Error',
          'Voice.start method not available. Please rebuild the app with EAS build or development client.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Start listening with locale 'en-IN' - This is the correct API
      try {
        console.log('🎤 Starting voice recognition with locale: en-IN');
        console.log('🎤 Voice module exists:', !!Voice);
        console.log('🎤 Voice.start exists:', !!Voice.start);
        
        // Call Voice.start(locale) - this is the correct method from @react-native-voice/voice
        const startResult = Voice.start('en-IN');

        // Handle promise if it returns one
        if (startResult && typeof startResult.then === 'function') {
          await startResult;
        }

        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 500));

        // Set listening state - the onSpeechStart event will also set this
        if (isMountedRef.current) {
          setIsListening(true);
          setIsAvailable(true);
          setStatus('Listening...');
          console.log('✅ Voice recognition started successfully');
        }
      } catch (startError: any) {
        console.error('❌ Start error:', startError);
        const errorMsg = startError?.message || 'Failed to start voice recognition';
        setError(errorMsg);
        setIsListening(false);
        Alert.alert(
          'Voice Recognition Error',
          errorMsg,
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.error('❌ Start error:', err);
      const errorMsg = err?.message || 'Failed to start voice recognition';
      setError(errorMsg);
      setIsListening(false);
      setStatus('');
      
      Alert.alert(
        'Voice Recognition Error',
        errorMsg,
        [{ text: 'OK' }]
      );
    }
  }, [requestMicPermission]);

  const stopListening = useCallback(async () => {
    try {
      clearSilenceTimer();

      if (Platform.OS === 'web') {
        setIsListening(false);
        setStatus('');
        return;
      }

      const Voice = voiceModuleRef.current || getVoiceModule();
      
      if (!Voice) {
        setIsListening(false);
        setStatus('');
        return;
      }

      const stopMethod = Voice.stop || Voice.stopSpeech || Voice.stopListening;
      
      if (stopMethod && typeof stopMethod === 'function') {
        await stopMethod.call(Voice);
      }

      setIsListening(false);
      setStatus('');
      
      // Use last partial result as final transcript if no final result yet
      if (!transcript && lastPartialResultRef.current) {
        setTranscript(lastPartialResultRef.current);
      }
    } catch (err: any) {
      setIsListening(false);
      setStatus('');
    }
  }, [transcript]);

  const cleanup = useCallback(() => {
    clearSilenceTimer();
    
    if (Platform.OS !== 'web') {
      const Voice = voiceModuleRef.current || getVoiceModule();
      
      if (Voice) {
        try {
          if (isListening) {
            const stopMethod = Voice.stop || Voice.stopSpeech || Voice.stopListening;
            if (stopMethod && typeof stopMethod === 'function') {
              stopMethod.call(Voice).catch(() => {});
            }
          }
          if (Voice.removeAllListeners && typeof Voice.removeAllListeners === 'function') {
            Voice.removeAllListeners();
          }
          listenersSetupRef.current = false;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
    
    setIsListening(false);
    setStatus('');
  }, [isListening]);

  return {
    isListening,
    transcript,
    partialTranscript, // Real-time partial results (like Cursor)
    error,
    startListening,
    stopListening,
    isAvailable,
    status,
  };
};

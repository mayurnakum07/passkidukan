import { useEffect, useRef, useState } from 'react';
import { Platform, NativeModules, Alert } from 'react-native';

// For Android SMS Retriever API
let SmsRetriever: any = null;

if (Platform.OS === 'android') {
  try {
    // Try to get the SMS Retriever module
    const { NativeEventEmitter } = require('react-native');
    SmsRetriever = NativeModules.SmsRetriever || null;
  } catch (e) {
    console.log('SMS Retriever module not available');
  }
}

export const useSMSRetriever = (onOTPReceived: (otp: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const startListening = async () => {
      try {
        // Show user-facing explanation BEFORE starting SMS retriever
        Alert.alert(
          'Auto-fill OTP from SMS',
          'We can automatically read only your OTP SMS from Paas Ki Dukaan to fill the code for you. We will NOT read or store any other messages. Do you want to enable this?',
          [
            {
              text: 'No, I will enter manually',
              style: 'cancel',
              onPress: () => {
                console.log('📱 User opted out of SMS auto-fill');
                // Still allow manual entry + TextInput browser autofill
                setIsListening(false);
              },
            },
            {
              text: 'Yes, enable',
              onPress: async () => {
                try {
                  // Start SMS retriever if available (no READ_SMS permission used)
                  if (SmsRetriever && typeof SmsRetriever.startSmsRetriever === 'function') {
                    await SmsRetriever.startSmsRetriever();
                    console.log('📱 SMS Retriever started');
                    setIsListening(true);
                  } else {
                    // Fallback: Use TextInput autofill (already configured in OTP screen)
                    console.log('📱 SMS Retriever not available, using TextInput autofill only');
                    setIsListening(true);
                  }
                } catch (innerErr: any) {
                  console.error('Error starting SMS retriever:', innerErr);
                  setError(innerErr?.message || 'Failed to start SMS retriever');
                  setIsListening(true);
                }
              },
            },
          ]
        );
      } catch (err: any) {
        console.error('Error starting SMS retriever:', err);
        setError(err?.message || 'Failed to start SMS retriever');
        // Fallback to TextInput autofill
        setIsListening(true);
      }
    };

    startListening();

    return () => {
      if (SmsRetriever && typeof SmsRetriever.stopSmsRetriever === 'function') {
        try {
          SmsRetriever.stopSmsRetriever();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      setIsListening(false);
    };
  }, []);

  // Listen for SMS events if native module is available
  useEffect(() => {
    if (Platform.OS !== 'android' || !SmsRetriever) {
      return;
    }

    try {
      const { NativeEventEmitter } = require('react-native');
      const eventEmitter = new NativeEventEmitter(SmsRetriever);

      listenerRef.current = eventEmitter.addListener('onSmsReceived', (event: any) => {
        console.log('📱 SMS received:', event);
        if (event.message) {
          // Extract OTP from SMS message
          const otpMatch = event.message.match(/\b\d{4,8}\b/);
          if (otpMatch) {
            const otp = otpMatch[0];
            console.log('🔢 OTP extracted:', otp);
            onOTPReceived(otp);
          }
        }
      });

      return () => {
        if (listenerRef.current) {
          listenerRef.current.remove();
        }
      };
    } catch (err) {
      console.log('SMS event listener not available, using autofill fallback');
    }
  }, [onOTPReceived]);

  return { isListening, error };
};





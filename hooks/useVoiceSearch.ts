import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;

try {
  const mod = require("expo-speech-recognition");
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {
  // Native module not available (e.g. running in Expo Go)
}

const noopEventHook = (_event: string, _cb: any) => {};
const useEvent = useSpeechRecognitionEvent || noopEventHook;

interface UseVoiceSearchReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  isAvailable: boolean;
}

export const useVoiceSearch = (): UseVoiceSearchReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    try {
      if (ExpoSpeechRecognitionModule?.isRecognitionAvailable) {
        setIsAvailable(
          ExpoSpeechRecognitionModule.isRecognitionAvailable(),
        );
      }
    } catch {
      setIsAvailable(false);
    }
    return () => {
      isMountedRef.current = false;
      try {
        ExpoSpeechRecognitionModule?.abort?.();
      } catch {
        // ignore
      }
    };
  }, []);

  useEvent("start", () => {
    if (isMountedRef.current) setIsListening(true);
  });

  useEvent("end", () => {
    if (isMountedRef.current) setIsListening(false);
  });

  useEvent("result", (event: any) => {
    if (!isMountedRef.current) return;
    const text = event.results?.[0]?.transcript ?? "";
    if (text) setTranscript(text);
  });

  useEvent("error", (event: any) => {
    if (!isMountedRef.current) return;
    if (event.error === "no-speech") {
      setError(null);
    } else {
      setError(event.message || "Speech recognition failed");
    }
    setIsListening(false);
  });

  const startListening = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) {
      Alert.alert(
        "Voice Search Unavailable",
        "Voice search requires a development build. Please rebuild the app with `npx expo run:android` or `npx expo run:ios`.",
      );
      return;
    }

    try {
      setError(null);
      setTranscript("");

      const result =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        setError("Microphone permission is required for voice search");
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: "en-IN",
        interimResults: true,
        continuous: false,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to start voice recognition");
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule?.stop?.();
    } catch {
      // ignore
    }
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isAvailable,
  };
};

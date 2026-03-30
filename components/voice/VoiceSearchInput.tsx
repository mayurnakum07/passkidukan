import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';

interface VoiceSearchInputProps {
  onSearch: (text: string) => void;
  placeholder?: string;
  value?: string;
  autoFocus?: boolean;
  onInputFocus?: () => void;
}

/**
 * VoiceSearchInput Component
 * 
 * A complete voice search input component with:
 * - Text input for search
 * - Mic button to toggle listening
 * - Loading animation while listening
 * - Real-time transcription
 * - Auto-stop after 5 seconds of silence
 * - Proper error handling
 */
export const VoiceSearchInput: React.FC<VoiceSearchInputProps> = ({
  onSearch,
  placeholder = 'Search or speak...',
  value,
  autoFocus = false,
  onInputFocus,
}) => {
  const { createStyles, colors } = useAppTheme();
  const [searchText, setSearchText] = useState(value || '');
  const { 
    isListening, 
    error, 
    result, 
    partialResult, 
    startListening, 
    stopListening, 
    isAvailable 
  } = useVoiceSearch();
  
  const [animation] = useState(new Animated.Value(0));
  const lastResultRef = useRef('');

  // Update search text when voice result is ready
  useEffect(() => {
    if (result && result !== lastResultRef.current) {
      setSearchText(result);
      onSearch(result);
      lastResultRef.current = result;
    }
  }, [result, onSearch]);

  // Show partial results in real-time
  useEffect(() => {
    if (partialResult && isListening) {
      setSearchText(partialResult);
    }
  }, [partialResult, isListening]);

  // Sync with external value prop
  useEffect(() => {
    if (value !== undefined) {
      setSearchText(value);
    }
  }, [value]);

  // Pulse animation while listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      animation.setValue(0);
    }
  }, [isListening]);

  const styles = createStyles(theme => ({
    container: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      height: 48,
      borderWidth: 1,
      borderColor: isListening ? theme.colors.primary : theme.colors.border,
    },
    input: {
      flex: 1,
      ...theme.typography.body1,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    },
    rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    iconButton: {
      padding: theme.spacing.xs,
      minWidth: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingIndicator: {
      marginRight: theme.spacing.xs,
    },
  }));

  const handleVoicePress = async () => {
    try {
      if (isListening) {
        await stopListening();
      } else {
        setSearchText(''); // Clear current search when starting voice
        await startListening();
      }
    } catch (error: any) {
      // Error is handled by hook and shown via error state
    }
  };

  const handleClear = () => {
    setSearchText('');
    onSearch('');
  };

  const pulseStyle = {
    opacity: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }),
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.1],
        }),
      },
    ],
  };

  const displayText = isListening && partialResult ? partialResult : searchText;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons 
          name="magnify" 
          size={22} 
          color={isListening ? colors.primary : colors.text} 
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={`${colors.text}80`}
          value={displayText}
          onChangeText={(text) => {
            setSearchText(text);
            onSearch(text);
          }}
          autoFocus={autoFocus}
          returnKeyType="search"
          onSubmitEditing={() => {
            onSearch(searchText);
          }}
          onFocus={onInputFocus}
          editable={!isListening} // Disable editing while listening
        />
        <View style={styles.rightContainer}>
          {isListening && (
            <ActivityIndicator 
              size="small" 
              color={colors.primary} 
              style={styles.loadingIndicator}
            />
          )}
          {searchText.length > 0 && !isListening && (
            <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
              <MaterialCommunityIcons name="close-circle" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleVoicePress}
            style={styles.iconButton}
            disabled={!isAvailable && !isListening}
          >
            <Animated.View style={isListening ? pulseStyle : undefined}>
              <MaterialCommunityIcons
                name={isListening ? 'microphone' : 'microphone-outline'}
                size={24}
                color={
                  !isAvailable && !isListening
                    ? `${colors.text}40`
                    : isListening
                    ? colors.primary
                    : error
                    ? colors.error
                    : colors.text
                }
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
      {error && (
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <Text style={{ color: colors.error, fontSize: 12 }}>
            {error}
          </Text>
        </View>
      )}
      {isListening && (
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontStyle: 'italic' }}>
            Listening... {partialResult ? '(speaking)' : '(waiting for speech)'}
          </Text>
        </View>
      )}
    </View>
  );
};

export default VoiceSearchInput;


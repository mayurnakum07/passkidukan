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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSubmit?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onInputFocus?: () => void;
  value?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onSubmit,
  placeholder = 'Search products...',
  autoFocus = false,
  onInputFocus,
  value,
}) => {
  const { createStyles, colors } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [animation] = useState(new Animated.Value(0));
  
  // Voice search hook with Google Cloud Speech-to-Text
  const { 
    isListening, 
    error: voiceError, 
    result: voiceResult, 
    partialResult, 
    startListening, 
    stopListening, 
    isAvailable 
  } = useVoiceSearch();

  useEffect(() => {
    if (value !== undefined) {
      setSearchQuery(value);
    }
  }, [value]);

  // Update search query when voice result is ready
  useEffect(() => {
    if (voiceResult && voiceResult.trim().length > 0) {
      setSearchQuery(voiceResult);
      onSearch(voiceResult);
    }
  }, [voiceResult, onSearch]);

  // Show partial results in real-time
  useEffect(() => {
    if (partialResult && isListening) {
      setSearchQuery(partialResult);
    }
  }, [partialResult, isListening]);

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
      borderColor: isListening ? colors.primary : theme.colors.border,
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
    },
  }));

  const handleVoicePress = async () => {
    try {
      if (isListening) {
        await stopListening();
      } else {
        setSearchQuery(''); // Clear current search when starting voice
        await startListening();
      }
    } catch (error: any) {
      // Error is handled by hook and shown via error state
      console.error('Voice search error:', error);
    }
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

  const displayText = isListening && partialResult ? partialResult : searchQuery;

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={22} color={colors.text} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={`${colors.text}80`}
          value={displayText}
          onChangeText={(text) => {
            setSearchQuery(text);
            onSearch(text);
          }}
          autoFocus={autoFocus}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (onSubmit) {
              onSubmit(searchQuery);
            } else {
              onSearch(searchQuery);
            }
          }}
          onFocus={onInputFocus}
          editable={!isListening} // Disable editing while listening
        />
        <View style={styles.rightContainer}>
          {isListening && (
            <ActivityIndicator 
              size="small" 
              color={colors.primary} 
              style={{ marginRight: 4 }}
            />
          )}
          {searchQuery.length > 0 && !isListening && (
            <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
              <Ionicons name="close-circle" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleVoicePress}
            style={styles.iconButton}
            // Always enabled - will show error message if API key not configured
          >
            <Animated.View style={isListening ? pulseStyle : undefined}>
              <MaterialCommunityIcons
                name={isListening ? 'microphone' : 'microphone-outline'}
                size={24}
                color={
                  isListening
                    ? colors.primary
                    : voiceError
                    ? colors.error
                    : colors.text
                }
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
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

export default SearchBar; 
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
} from 'react-native';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';

interface VoiceSearchProps {
  onResult?: (text: string) => void;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({ onResult }) => {
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isAvailable,
    status,
  } = useVoiceRecognition();

  // Avoid emitting the same transcript multiple times
  const lastEmittedRef = useRef('');

  useEffect(() => {
    if (!onResult) return;
    if (!transcript || transcript.trim().length === 0) return;
    if (transcript === lastEmittedRef.current) return;

    console.log('🎤 VoiceSearch onResult transcript:', transcript);
    lastEmittedRef.current = transcript;
    onResult(transcript);
  }, [transcript, onResult]);

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Voice Search</Text>
        <Text style={styles.disabledText}>
          Voice search is not available on this device or build. You can still search by typing.
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Search</Text>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status: </Text>
        <Text style={styles.statusValue}>
          {status || (isListening ? 'Listening…' : 'Idle')}
        </Text>
      </View>
      <View style={styles.buttonsRow}>
        <Button
          title={isListening ? 'Listening…' : 'Start'}
          onPress={startListening}
          disabled={isListening}
        />
        <View style={{ width: 12 }} />
        <Button title="Stop" onPress={stopListening} disabled={!isListening} />
      </View>
      <Text style={styles.resultsLabel}>Heard:</Text>
      <Text style={styles.resultsText}>{transcript || '—'}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default VoiceSearch;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  disabledText: {
    fontSize: 13,
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 13,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultsLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  resultsText: {
    fontSize: 14,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: 'red',
  },
});



import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationHeaderProps {
  location: string;
  onPress: () => void;
}

const LocationHeader: React.FC<LocationHeaderProps> = ({ location, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Ionicons name="location" size={20} color="#FF4500" />
      <Text style={styles.locationText}>{location}</Text>
      <Ionicons name="chevron-down" size={20} color="#FF4500" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  locationText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#FF4500',
  },
});

export default LocationHeader; 
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { generateStoreQRCode } from '../../utils/storeDeepLinkGenerator';

interface StoreQRCodeProps {
  storeId: string;
  storeName?: string;
  storeType?: 'grocery' | 'pharma';
  showDetails?: boolean;
}

const StoreQRCode: React.FC<StoreQRCodeProps> = ({
  storeId,
  storeName,
  storeType,
  showDetails = true
}) => {
  const { theme } = useTheme();

  const handleShareQRCode = async () => {
    try {
      const qrData = generateStoreQRCode(storeId, {
        storeName,
        storeType,
        size: 512,
        format: 'png'
      });

      await Share.share({
        message: `Check out ${storeName || 'this store'} on E-Comm!\n\n${qrData.deepLinkUrl}`,
        url: qrData.deepLinkUrl,
        title: `${storeName || 'Store'} QR Code`
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handleCopyLink = () => {
    const qrData = generateStoreQRCode(storeId, {
      storeName,
      storeType
    });
    
    Alert.alert(
      'Deep Link Generated',
      `Store Link: ${qrData.deepLinkUrl}\n\nThis link will open the store directly in the app!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Copy Link', 
          onPress: () => {
            // In a real app, you'd copy to clipboard here
            console.log('Copy to clipboard:', qrData.deepLinkUrl);
            Alert.alert('Copied!', 'Deep link copied to clipboard');
          }
        }
      ]
    );
  };

  const qrData = generateStoreQRCode(storeId, {
    storeName,
    storeType,
    size: 256
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {showDetails && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {storeName || 'Store'} QR Code
          </Text>
          {storeType && (
            <Text style={[styles.type, { color: theme.colors.secondary }]}>
              {storeType.charAt(0).toUpperCase() + storeType.slice(1)} Store
            </Text>
          )}
        </View>
      )}

      <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF', borderColor: theme.colors.border }]}>
        {/* In a real app, you'd display the actual QR code image here */}
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>QR Code</Text>
          <Text style={styles.qrSubtext}>{storeId}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleCopyLink}
        >
          <Text style={styles.buttonText}>Copy Deep Link</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={handleShareQRCode}
        >
          <Text style={styles.buttonText}>Share QR Code</Text>
        </TouchableOpacity>
      </View>

      {showDetails && (
        <View style={styles.info}>
          <Text style={[styles.infoText, { color: theme.colors.secondary }]}>
            Scan this QR code to open the store directly in the app!
          </Text>
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>
            {qrData.deepLinkUrl}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    margin: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  qrText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  qrSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  info: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});

export default StoreQRCode;

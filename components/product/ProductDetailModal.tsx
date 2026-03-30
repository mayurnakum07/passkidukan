// components/ProductDetailModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import Toast from 'react-native-toast-message';

interface ProductDetailModalProps {
  visible: boolean;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
    productDescription?: string;
  } | null;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ visible, product, onClose }) => {
  const { theme } = useTheme();
  const { addToGroceryCart } = useCart();

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '85%',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 20,
      elevation: 5,
    },
    productImage: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      marginBottom: 16,
    },
    productName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    productPrice: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 12,
    },
    productDescription: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 20,
      lineHeight: 22,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    actionButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    addToCartButton: {
      backgroundColor: theme.colors.primary,
    },
    closeButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    buttonText: {
      fontWeight: 'bold',
      fontSize: 16,
    },
    addToCartText: {
      color: '#fff',
    },
    closeText: {
      color: theme.colors.primary,
    },
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    };
    addToGroceryCart(cartItem);
    onClose();
  };

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
          <Text style={styles.productDescription}>
            {product.description || product.productDescription || 'No description available'}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.addToCartButton]}
              onPress={handleAddToCart}
            >
              <Text style={[styles.buttonText, styles.addToCartText]}>Add to Cart</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.closeText]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProductDetailModal;
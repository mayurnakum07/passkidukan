import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  ImageURISource,
} from "react-native";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import PriceBlock from "../ui/PriceBlock";
import PrescriptionRequiredTag from "../ui/PrescriptionRequiredTag";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string | ImageURISource;
  rating?: number;
  isNew?: boolean;
  isOnSale?: boolean;
  category?: "grocery" | "pharma";
  perUnit?: string;
  prescriptionRequired?: boolean;
}

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  hideCartButton?: boolean;
  hidePercentOff?: boolean;
  hideWishlist?: boolean;
  showFullName?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  style,
  compact,
  hideCartButton,
  hidePercentOff,
  hideWishlist,
  showFullName,
}) => {
  const {
    addToGroceryCart,
    addToPharmacyCart,
    groceryItems,
    pharmacyItems,
    updateQuantity,
  } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const inWishlist = isInWishlist(product.id);

  const imageSource =
    typeof product.image === "string" ? { uri: product.image } : product.image;

  // Helper function to validate price
  const isValidPrice = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") {
      const num = parseFloat(value);
      return !isNaN(num) && num > 0 && isFinite(num);
    }
    if (typeof value === "number") {
      return value > 0 && isFinite(value);
    }
    return false;
  };

  // Helper function to validate quantity (stricter - must be a valid integer, not extracted from string)
  const isValidQuantity = (value: any): boolean => {
    if (value === null || value === undefined || value === "") return false;
    // If it's a number, check if it's a valid positive integer
    if (typeof value === "number") {
      return Number.isInteger(value) && value > 0 && isFinite(value);
    }
    // If it's a string, check if it's a pure number (no letters or units)
    if (typeof value === "string") {
      // Remove whitespace and check if it's a pure number
      const trimmed = value.trim();
      // Check if string is a valid integer (no decimal, no letters, no units)
      const num = parseInt(trimmed, 10);
      // Only valid if the parsed number equals the original string (no extra characters)
      return !isNaN(num) && num > 0 && String(num) === trimmed;
    }
    return false;
  };

  // Get valid price
  const getValidPrice = (): number => {
    const price = product.price || (product as any).sp || 0;
    if (typeof price === "string") {
      const num = parseFloat(price);
      return !isNaN(num) && num > 0 ? num : 0;
    }
    return price > 0 ? price : 0;
  };

  // Get valid quantity/stock (stricter validation)
  const getValidQuantity = (): number => {
    const qty =
      (product as any).availableQty ||
      (product as any).quantity ||
      (product as any).stock ||
      0;
    // Use strict validation - only accept if it's a valid integer
    if (isValidQuantity(qty)) {
      if (typeof qty === "number") {
        return qty;
      }
      if (typeof qty === "string") {
        return parseInt(qty.trim(), 10);
      }
    }
    return 0;
  };

  // Check if product can be added to cart
  const canAddToCart = (): boolean => {
    const price = getValidPrice();
    const qty = getValidQuantity();
    return price > 0 && qty > 0;
  };

  const getCategory = (): "grocery" | "pharma" => {
    return product.category === "pharma" ? "pharma" : "grocery";
  };

  const getCartQuantity = (): number => {
    const category = getCategory();
    const items = category === "pharma" ? pharmacyItems : groceryItems;
    const existing = items.find((item) => item.id === product.id);
    return existing?.quantity || 0;
  };

  const currentQuantity = getCartQuantity();

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    if (!canAddToCart()) return;

    const category = getCategory();
    const items = category === "pharma" ? pharmacyItems : groceryItems;
    const existing = items.find((item) => item.id === product.id);

    if (existing) {
      // If item already exists in cart, just increment its quantity
      updateQuantity(product.id, existing.quantity + 1, category);
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      price: getValidPrice(),
      image:
        typeof product.image === "string"
          ? product.image
          : "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
      originalPrice: product.originalPrice,
      productId: (product as any).productId || product.id,
      prescriptionRequired: product.prescriptionRequired || false,
    };
    if (category === "pharma") {
      addToPharmacyCart(cartItem);
    } else {
      addToGroceryCart(cartItem);
    }
  };

  const handleIncrement = (e: any) => {
    e.stopPropagation();
    if (!canAddToCart()) return;

    const category = getCategory();
    const newQuantity = currentQuantity + 1;
    updateQuantity(product.id, newQuantity, category);
  };

  const handleDecrement = (e: any) => {
    e.stopPropagation();
    const category = getCategory();
    const newQuantity = currentQuantity - 1;
    updateQuantity(product.id, newQuantity, category);
  };

  const percentOff =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : null;

  // In the ProductCard component, before rendering:
  // For demonstration, if product.id === '1', set originalPrice to 199
  const displayOriginalPrice = product.id === "1" ? 199 : product.originalPrice;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        style,
        {
          backgroundColor: theme.dark ? "#4B3F1D" : "white",
          borderColor: theme.colors.border,
          borderWidth: 1,
          margin: 8,
          padding: 10,
          borderRadius: 12,
          shadowColor: theme.gradientEnd,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.imageContainer,
          compact && styles.compactImageContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {product.image && (
          <Image
            source={imageSource}
            style={[
              styles.image,
              compact && styles.compactImage,
              { borderRadius: 12 },
            ]}
            resizeMode="cover"
          />
        )}
        <View style={styles.badgeContainer}>
          {product.isNew && (
            <View style={[styles.badge, styles.newBadge]}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          )}
          {product.isOnSale && (
            <View style={[styles.badge, styles.saleBadge]}>
              <Text style={styles.badgeText}>Sale</Text>
            </View>
          )}
          {!hidePercentOff && percentOff && (
            <View
              style={[
                styles.badge,
                { backgroundColor: "#FF9800", marginLeft: 4 },
              ]}
            >
              <Text style={styles.badgeText}>{percentOff}% off</Text>
            </View>
          )}
        </View>
        {/* Wishlist heart - inside card, top-right, responsive */}
        {!hideWishlist && (
          <TouchableOpacity
            style={styles.wishlistIconBtn}
            onPress={(e) => {
              e.stopPropagation();
              if (inWishlist) removeFromWishlist(product.id);
              else
                addToWishlist({
                  id: product.id,
                  name: product.name,
                  price: getValidPrice(),
                  image:
                    typeof product.image === "string"
                      ? product.image
                      : undefined,
                  originalPrice: product.originalPrice,
                });
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={inWishlist ? "heart" : "heart-outline"}
              size={20}
              color={
                inWishlist
                  ? theme.colors.primary || "#e91e63"
                  : theme.colors.text
              }
            />
          </TouchableOpacity>
        )}
        {!hideCartButton &&
          (currentQuantity === 0 ? (
            <TouchableOpacity
              style={[
                styles.addButton,
                !canAddToCart() && {
                  opacity: 1,
                  borderColor: "#dc3545",
                  backgroundColor: "#dc3545",
                },
              ]}
              onPress={handleAddToCart}
              activeOpacity={0.85}
              disabled={!canAddToCart()}
            >
              <Text
                style={[
                  styles.addButtonText,
                  !canAddToCart() && { color: "#fff" },
                ]}
              >
                {canAddToCart() ? "ADD" : "OUT OF STOCK"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.counterContainer}>
              <TouchableOpacity
                onPress={handleDecrement}
                style={styles.counterBtn}
              >
                <Text style={styles.counterBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{currentQuantity}</Text>
              <TouchableOpacity
                onPress={handleIncrement}
                style={[styles.counterBtn, !canAddToCart() && { opacity: 0.5 }]}
                disabled={!canAddToCart()}
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ))}
      </View>
      <View
        style={[
          styles.infoContainer,
          compact && styles.compactInfoContainer,
          showFullName && { paddingHorizontal: 4 },
        ]}
      >
        <Text
          style={[
            styles.name,
            compact && styles.compactName,
            showFullName && styles.nameFull,
            { color: theme.colors.text },
          ]}
          numberOfLines={showFullName ? undefined : 2}
        >
          {product.name}
        </Text>
        {product.prescriptionRequired && (
          <View style={styles.prescriptionContainer}>
            <PrescriptionRequiredTag compact={compact} />
            <Text style={styles.prescriptionText}>Prescription Required</Text>
          </View>
        )}
        <PriceBlock
          price={product.price}
          originalPrice={displayOriginalPrice}
          perUnit={product.perUnit || ""}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    minHeight: 220,
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 1,
    overflow: "hidden",
  },
  wishlistIconBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  compactImageContainer: {
    width: 56,
    height: 56,
    aspectRatio: undefined,
    borderRadius: 8,
    marginRight: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  compactImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  badgeContainer: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    gap: 4,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadge: {
    backgroundColor: "#4CAF50",
  },
  saleBadge: {
    backgroundColor: "#F44336",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  cartButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButton: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    minHeight: 30,
    maxWidth: "80%",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#27ae60",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "rgba(39, 174, 96, 0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    alignSelf: "center",
  },
  addButtonText: {
    color: "#27ae60",
    fontWeight: "bold",
    fontSize: 10,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  counterContainer: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#27ae60",
    height: 30,
    minWidth: 70,
    paddingHorizontal: 8,
    maxWidth: "100%",
    alignSelf: "center",
  },
  counterBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  counterBtnText: {
    color: "#27ae60",
    fontWeight: "bold",
    fontSize: 18,
  },
  counterValue: {
    width: 24,
    textAlign: "center",
    color: "#27ae60",
    fontWeight: "bold",
    fontSize: 16,
  },
  infoContainer: {
    padding: 12,
  },
  compactInfoContainer: {
    flex: 1,
    padding: 0,
    marginLeft: 8,
    justifyContent: "center",
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    height: 36,
  },
  nameFull: {
    height: undefined,
    marginRight: 0,
  },
  compactName: {
    fontSize: 13,
    height: undefined,
    marginBottom: 2,
  },
  ratingContainer: {
    marginBottom: 6,
  },
  rating: {
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
  },
  compactPrice: {
    fontSize: 14,
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  compactOriginalPrice: {
    fontSize: 12,
  },
  prescriptionContainer: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#ffe5e5",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 4,
    marginTop: 2,
  },
  prescriptionText: {
    color: "#d9534f",
    fontSize: 10,
    fontWeight: "600",
  },
});
export default ProductCard;

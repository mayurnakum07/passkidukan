import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageURISource,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppContext } from "../../contexts/AppContext";
import { useCart } from "../../contexts/CartContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RootStackParamList } from "../../navigation/types";
import { formatPriceWithCurrency } from "../../utils/priceFormatter";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;

// Fallback data
const groceryRecentlyBoughtItems = [
  { id: "1", name: "Fresh Organic Apples", price: 3.99, image: "" },
  { id: "2", name: "Organic Carrots", price: 1.29, image: "" },
  { id: "3", name: "Whole Wheat Bread", price: 2.49, image: "" },
  { id: "4", name: "Free-Range Eggs", price: 4.99, image: "" },
];

const groceryGrandOffersItems = [
  { id: "1", name: "Family Snack Pack", price: 9.99, image: "" },
  { id: "2", name: "Breakfast Essentials Combo", price: 15.99, image: "" },
  { id: "3", name: "Organic Veggie Box", price: 22.49, image: "" },
  { id: "4", name: "Gourmet Cheese Platter", price: 18.99, image: "" },
];

const pharmacyRecentlyBoughtItems = [
  { id: "1", name: "Ibuprofen 400mg", price: 5.99, image: "" },
  { id: "2", name: "Vitamin C Tablets", price: 8.99, image: "" },
  { id: "3", name: "Cold Syrup", price: 12.49, image: "" },
  { id: "4", name: "Blood Pressure Monitor", price: 45.99, image: "" },
];

const pharmacyGrandOffersItems = [
  { id: "1", name: "First Aid Kit", price: 25.99, image: "" },
  { id: "2", name: "Health Supplements Pack", price: 35.99, image: "" },
  { id: "3", name: "Diabetes Care Kit", price: 42.49, image: "" },
  { id: "4", name: "Heart Health Supplements", price: 28.99, image: "" },
];

interface Item {
  id: string;
  productmasterERPID: string;
  name: string;
  price: number;
  image?: string;
  prescriptionRequired?: boolean;
  availableQty?: number;
  quantity?: number;
  stock?: number;
  isAvailable?: boolean;
  perUnit?: string;
  unit?: string;
  category?: "grocery" | "pharma";
}

interface HorizontallyScrollableSectionProps {
  title: string;
  itemsOverride?: Item[];
  hidePercentOff?: boolean;
  hideWishlist?: boolean;
  showFullName?: boolean;
  cardWidth?: number;
  orientation?: "horizontal" | "vertical";
  numColumns?: number;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.42, 180);
const IMAGE_HEIGHT = scale(100);

function isOutOfStock(item: Item): boolean {
  const price =
    typeof item.price === "number"
      ? item.price
      : parseFloat(String(item.price)) || 0;
  return price <= 0;
}

function getVariantLine(item: Item): string {
  const perUnit = (item as any).perUnit || item.perUnit;
  const unit = (item as any).unit || item.unit;
  if (perUnit && String(perUnit).trim()) return String(perUnit).trim();
  if (unit && String(unit).trim()) return String(unit).trim();
  return "";
}

// Product card matching the reference image: image, name, variant, Rx tag, price, Add to Cart / Notify Me / +/- counter
const ProductCardHorizontal = React.memo(
  ({
    item,
    cartQuantity,
    onPress,
    onAddToCart,
    onIncrement,
    onDecrement,
    onNotifyMe,
    cardWidth = DEFAULT_CARD_WIDTH,
    isVertical = false,
  }: {
    item: Item;
    cartQuantity: number;
    onPress: () => void;
    onAddToCart: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
    onNotifyMe: () => void;
    cardWidth?: number;
    isVertical?: boolean;
  }) => {
    const inStock = !isOutOfStock(item);
    const variantLine = getVariantLine(item);
    const priceNum =
      typeof item.price === "number"
        ? item.price
        : parseFloat(String(item.price)) || 0;
    const imageSource =
      item.image && String(item.image).trim()
        ? { uri: String(item.image) }
        : undefined;
    const showCounter = inStock && cartQuantity > 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          !isVertical && styles.cardHorizontal,
          { width: cardWidth },
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Image section */}
        <View style={styles.imageWrapper}>
          {imageSource ? (
            <Image
              source={imageSource as ImageURISource}
              style={styles.cardImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons
                name="image-outline"
                size={scale(32)}
                color="#BDBDBD"
              />
            </View>
          )}
          {!inStock && (
            <View style={styles.outOfStockBadge}>
              <MaterialCommunityIcons
                name="close"
                size={scale(14)}
                color="#FFFFFF"
              />
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Name + variant */}
        <Text
          style={styles.productName}
          numberOfLines={item.prescriptionRequired ? 1 : 2}
        >
          {item.name}
        </Text>
        {variantLine ? (
          <Text style={styles.variantLine} numberOfLines={1}>
            {variantLine}
          </Text>
        ) : null}

        {/* Rx Required tag */}
        {item.prescriptionRequired && (
          <View style={[styles.rxTag, !inStock && styles.rxTagOutOfStock]}>
            <Text
              style={[styles.rxTagText, !inStock && styles.rxTagTextOutOfStock]}
            >
              Rx Required
            </Text>
          </View>
        )}

        {/* Price */}
        <View
          style={[
            item.prescriptionRequired ? styles.priceRow : styles.priceColumn,
          ]}
        >
          <Text
            style={[
              styles.priceText,
              inStock ? styles.priceInStock : styles.priceOutOfStock,
            ]}
          >
            {formatPriceWithCurrency(priceNum)}
          </Text>
          {!inStock && (
            <Text style={styles.unavailableText}> Currently unavailable</Text>
          )}
        </View>

        {/* CTA: Add to Cart | +/- counter | Notify Me */}
        {inStock ? (
          showCounter ? (
            <View style={styles.counterWrap}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  onDecrement();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{cartQuantity}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  onIncrement();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButtonWrap}
              onPress={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#5B7CFA", "#8FA2FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Text style={styles.addButtonText}>Add to Cart</Text>
              </LinearGradient>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity
            style={styles.notifyButton}
            onPress={(e) => {
              e.stopPropagation();
              onNotifyMe();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.notifyButtonText}>Notify Me</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  },
);

const HorizontallyScrollableSection: React.FC<
  HorizontallyScrollableSectionProps
> = ({
  title,
  itemsOverride,
  hidePercentOff,
  hideWishlist,
  showFullName,
  cardWidth,
  orientation,
  numColumns,
}) => {
  const { theme, section } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { selectedStore } = useAppContext();
  const {
    addToPharmacyCart,
    addToGroceryCart,
    updateQuantity,
    pharmacyItems,
    groceryItems,
  } = useCart();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (itemsOverride && Array.isArray(itemsOverride)) {
      setItems(itemsOverride);
      return;
    }

    const fallbackItems =
      section === "pharma"
        ? title === "Recently Bought"
          ? pharmacyRecentlyBoughtItems
          : pharmacyGrandOffersItems
        : title === "Recently Bought"
          ? groceryRecentlyBoughtItems
          : groceryGrandOffersItems;

    setItems(fallbackItems as Item[]);
  }, [section, title, itemsOverride, selectedStore?.id]);

  const isVertical = orientation === "vertical";
  const effectiveNumColumns = isVertical ? numColumns || 2 : 1;

  const CARD_WIDTH = (() => {
    const desiredWidth = cardWidth || DEFAULT_CARD_WIDTH;
    if (!isVertical) {
      return desiredWidth;
    }
    // For vertical grid, ensure cards always fit within available width on all devices
    const maxWidthForGrid =
      (SCREEN_WIDTH - scale(48)) / Math.max(effectiveNumColumns, 1);
    return Math.min(desiredWidth, maxWidthForGrid);
  })();

  const handleProductPress = (product: Item) => {
    navigation.navigate("ProductDetail", { product });
  };

  const getCategory = (item: Item): "grocery" | "pharma" =>
    item.category === "pharma" ? "pharma" : "grocery";

  const handleAddToCart = (item: Item) => {
    const category = getCategory(item);
    const items = category === "pharma" ? pharmacyItems : groceryItems;
    const existing = items.find((i) => i.id === item.id);
    const priceNum =
      typeof item.price === "number"
        ? item.price
        : parseFloat(String(item.price)) || 0;

    if (existing) {
      updateQuantity(item.id, existing.quantity + 1, category);
      return;
    }

    const cartItem = {
      id: item.id,
      name: item.name,
      price: priceNum,
      image:
        item.image && String(item.image).trim()
          ? item.image
          : "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
      originalPrice: (item as any).originalPrice,
      productId: (item as any).productId || item.id || item.productmasterERPID,
      prescriptionRequired: item.prescriptionRequired || false,
    };

    if (category === "pharma") {
      addToPharmacyCart(cartItem);
    } else {
      addToGroceryCart(cartItem);
    }
  };

  const handleNotifyMe = (item: Item) => {
    navigation.navigate("ProductDetail", { product: item });
  };

  const getCartQuantity = (item: Item): number => {
    const category = getCategory(item);
    const cartItems = category === "pharma" ? pharmacyItems : groceryItems;
    const existing = cartItems.find((i) => i.id === item.id);
    return existing?.quantity ?? 0;
  };

  const handleIncrement = (item: Item) => {
    const category = getCategory(item);
    const cartItems = category === "pharma" ? pharmacyItems : groceryItems;
    const existing = cartItems.find((i) => i.id === item.id);
    if (existing) {
      updateQuantity(item.id, existing.quantity + 1, category);
    } else {
      handleAddToCart(item);
    }
  };

  const handleDecrement = (item: Item) => {
    const category = getCategory(item);
    const cartItems = category === "pharma" ? pharmacyItems : groceryItems;
    const existing = cartItems.find((i) => i.id === item.id);
    if (existing) {
      updateQuantity(item.id, existing.quantity - 1, category);
    }
  };

  const renderItem = ({ item }: { item: Item }) => (
    <ProductCardHorizontal
      item={item}
      cartQuantity={getCartQuantity(item)}
      onPress={() => handleProductPress(item)}
      onAddToCart={() => handleAddToCart(item)}
      onIncrement={() => handleIncrement(item)}
      onDecrement={() => handleDecrement(item)}
      onNotifyMe={() => handleNotifyMe(item)}
      cardWidth={CARD_WIDTH}
      isVertical={isVertical}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal={!isVertical}
        numColumns={effectiveNumColumns}
        scrollEnabled={!isVertical}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          cardWidth && cardWidth < DEFAULT_CARD_WIDTH
            ? { paddingRight: scale(8) }
            : { paddingRight: scale(12) },
          { paddingHorizontal: isVertical ? scale(0) : scale(12) },
        ]}
        columnWrapperStyle={
          isVertical
            ? {
                paddingHorizontal: scale(8),
                paddingBottom: scale(6),
                columnGap: scale(8),
                justifyContent: "space-between",
              }
            : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  list: {
    // paddingHorizontal: scale(12),
    paddingVertical: scale(4),
    gap: 0,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  cardHorizontal: {
    marginRight: scale(12),
  },
  imageWrapper: {
    width: "100%",
    height: IMAGE_HEIGHT,
  },
  cardImage: {
    width: "50%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "50%",
    height: "100%",
  },
  outOfStockBadge: {
    position: "absolute",
    top: scale(0),
    right: scale(0),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0827A",
    paddingVertical: scale(4),
    paddingHorizontal: scale(8),
    borderRadius: scale(20),
    gap: scale(2),
  },
  outOfStockText: {
    color: "#FFFFFF",
    fontSize: scale(8),
    fontWeight: "600",
  },
  productName: {
    fontSize: scale(10),
    fontWeight: "700",
    color: "#1E1E1E",
    marginBottom: scale(2),
  },
  variantLine: {
    fontSize: scale(10),
    fontWeight: "600",
    color: "#424242",
    marginBottom: scale(6),
  },
  rxTag: {
    alignSelf: "flex-start",
    backgroundColor: "#72A3F2",
    paddingVertical: scale(4),
    paddingHorizontal: scale(10),
    borderRadius: scale(20),
    marginBottom: scale(6),
  },
  rxTagOutOfStock: {
    backgroundColor: "#F5D5D5",
  },
  rxTagText: {
    color: "#FFFFFF",
    fontSize: scale(8),
    fontWeight: "600",
  },
  rxTagTextOutOfStock: {
    color: "#A17303",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: scale(10),
  },
  priceColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginBottom: scale(10),
  },
  priceText: {
    fontSize: scale(10),
    fontWeight: "700",
  },
  priceInStock: {
    color: "#00897B",
  },
  priceOutOfStock: {
    color: "#9E9E9E",
  },
  unavailableText: {
    fontSize: scale(8),
    color: "#9E9E9E",
    fontWeight: "500",
  },
  addButtonWrap: {
    borderRadius: scale(10),
    overflow: "hidden",
    minHeight: scale(20),
    justifyContent: "center",
  },
  addButtonGradient: {
    paddingVertical: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: scale(12),
    fontWeight: "700",
  },
  notifyButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#90CAF9",
    borderRadius: scale(10),
    paddingVertical: scale(6),
  },
  notifyButtonText: {
    color: "#5B7CFA",
    fontSize: scale(13),
    fontWeight: "700",
  },
  counterWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(10),
    borderWidth: 1.5,
    borderColor: "#5B7CFA",
    minHeight: scale(42),
    paddingHorizontal: scale(4),
  },
  counterBtn: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(50),
    backgroundColor: "#5B7CFA",
    justifyContent: "center",
    alignItems: "center",
  },
  counterBtnDisabled: {
    backgroundColor: "#BDBDBD",
    opacity: 0.7,
  },
  counterBtnText: {
    color: "#FFFFFF",
    fontSize: scale(10),
    fontWeight: "700",
  },
  counterValue: {
    minWidth: scale(28),
    textAlign: "center",
    fontSize: scale(12),
    fontWeight: "700",
    color: "#1E1E1E",
  },
});

export default HorizontallyScrollableSection;

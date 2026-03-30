import { MaterialIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import PrescriptionRequiredTag from "../../components/ui/PrescriptionRequiredTag";
import { RXRequiredNewTag } from "../../components/ui/RXRequiredTag";
import HorizontallyScrollableSection from "../../components/layout/HorizontallyScrollableSection";
import { useAppContext } from "../../contexts/AppContext";
import { useCart } from "../../contexts/CartContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import { HomeStackParamList, RootStackParamList } from "../../navigation/types";
import { storeProductService } from "../../services/api/storeProductService";

type ProductDetailRouteProp = RouteProp<HomeStackParamList, "ProductDetail">;

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface ExtendedProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  productDescription?: string;
  brand?: string;
  images?: string[];
  availableQty?: number;
  prescriptionRequired?: boolean;
  fullName?: string;
  // productMasterId?: string;
  productId?: string; // For grocery products to enable ID-based fetching
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 24;

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const { product } = route.params;
  const extendedProduct = product as ExtendedProduct & {
    images?: string[];
    availableQty?: number;
  };
  const { theme, section } = useTheme();
  const {
    addToGroceryCart,
    addToPharmacyCart,
    removeFromCart,
    updateQuantity,
    groceryItems,
    pharmacyItems,
  } = useCart();
  const { showToast } = useToast();
  const { selectedStore } = useAppContext();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = new Animated.Value(0);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Helper to ensure image URLs are full URLs (in case they're relative paths)
  const ensureFullImageUrl = (imgPath: string | undefined | null): string => {
    if (!imgPath)
      return "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg";
    if (imgPath.startsWith("http://") || imgPath.startsWith("https://"))
      return imgPath;
    if (imgPath.startsWith("/")) {
      // Prepend base URL for relative paths
      return `https://passkidukaanapi.margerp.com${imgPath}`;
    }
    return imgPath;
  };

  // Ensure initial product has full image URLs
  const initialProduct = {
    ...extendedProduct,
    image: extendedProduct.image
      ? ensureFullImageUrl(extendedProduct.image)
      : undefined,
    images: extendedProduct.images
      ? extendedProduct.images.map(ensureFullImageUrl)
      : undefined,
  };

  const [productDetails, setProductDetails] = useState<any>(initialProduct);
  console.log('productDetails', productDetails)

  // Use original product ID for cart operations (consistent with ProductCard)
  const originalProductId = extendedProduct.id;

  const [loading, setLoading] = useState(false);

  // Fetch product details from API if store is selected
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!selectedStore?.id) {
        return;
      }

      try {
        setLoading(true);
        if (section === "pharma") {
          const response = await storeProductService.getPharmaProductDetails(
            selectedStore.id,
            extendedProduct.id,
          );
          if (response.success && response.data) {
            setProductDetails(response.data);
          } else {
          }
        } else {
          const response = await storeProductService.getGroceryProductDetails(
            selectedStore.id,
            extendedProduct.id,
          );
          if (response.success && response.data) {
            setProductDetails(response.data);
          } else {
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [selectedStore?.id, section, extendedProduct.id]);

  // Use images array with priority: signedImages > images > single image
  // signedImages have pre-signed URLs that work for both pharmacy and grocery
  let images: string[] = [];

  // Priority 1: Use signedImages array (preferred - has full signed URLs)
  if (productDetails.signedImages && productDetails.signedImages.length > 0) {
    images = productDetails.signedImages.map(ensureFullImageUrl);
  }
  // Priority 2: Use images array
  else if (productDetails.images && productDetails.images.length > 0) {
    images = productDetails.images.map(ensureFullImageUrl);
  }
  // Priority 3: Use single image field
  else if (productDetails.image) {
    images = [ensureFullImageUrl(productDetails.image)];
  }
  // Priority 4: Fall back to extended product images if API response has none
  else if (extendedProduct.images && extendedProduct.images.length > 0) {
    images = extendedProduct.images.map(ensureFullImageUrl);
  }
  // Priority 5: Fall back to extended product single image
  else if (extendedProduct.image) {
    images = [ensureFullImageUrl(extendedProduct.image)];
  }

  // If no images at all, use placeholder
  if (images.length === 0) {
    images = [
      "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
    ];
  }

  // If only one image, add dummy images for demo (but keep the real one first)
  // if (images.length === 1) {
  //   images = [
  //     images[0],
  //     "https://images.pexels.com/photos/42059/orange-fruit-vitamins-healthy-eating-42059.jpeg",
  //     "https://images.pexels.com/photos/162806/lemon-yellow-citrus-fruit-162806.jpeg",
  //   ];
  // }

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

  // Get valid price from product details
  const getValidPrice = (): number => {
    const price = selectedVariant
      ? selectedVariant.price
      : productDetails.price || productDetails.sp || 0;
    if (typeof price === "string") {
      const num = parseFloat(price);
      return !isNaN(num) && num > 0 ? num : 0;
    }
    return price > 0 ? price : 0;
  };

  // Get valid quantity/stock (stricter validation). Prefer availableQty when set (including 0) so list and detail stay in sync
  const getValidQuantity = (): number => {
    const aq = productDetails.availableQty;
    const qty =
      aq !== undefined && aq !== null
        ? aq
        : productDetails.quantity || productDetails.stock || 0;
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

  const canAddToCart = (): boolean => {
    return getValidPrice() > 0;
  };

  // Variants - check if API provides variants, otherwise use empty array
  const variants: ProductVariant[] =
    productDetails.variants &&
    Array.isArray(productDetails.variants) &&
    productDetails.variants.length > 0
      ? productDetails.variants.map((v: any, idx: number) => ({
          id: v.id || v.variantId || String(idx),
          name: v.name || v.packing || v.quantity || "Default",
          price: isValidPrice(v.price || v.sp)
            ? typeof (v.price || v.sp) === "string"
              ? parseFloat(v.price || v.sp)
              : v.price || v.sp
            : 0,
          stock: isValidQuantity(v.stock || v.availableQty || v.quantity)
            ? typeof (v.stock || v.availableQty || v.quantity) === "string"
              ? parseInt(
                  String(v.stock || v.availableQty || v.quantity).trim(),
                  10,
                )
              : v.stock || v.availableQty || v.quantity
            : 0,
        }))
      : [];

  // Set first variant as default when component loads (only if variants exist)
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    } else if (variants.length === 0) {
      setSelectedVariant(null);
    }
  }, [variants.length]);

  const addToCorrectCart = (itemToAdd: any) => {
    // Add to appropriate cart based on product category
    if (productDetails.category === "pharma") {
      addToPharmacyCart(itemToAdd);
    } else {
      addToGroceryCart(itemToAdd);
    }
  };

  // Get actual cart quantity for a product/variant
  const getCartQuantity = (productId: string, variantId?: string) => {
    const itemId = variantId ? `${productId}-${variantId}` : productId;
    const category = productDetails.category || "grocery";
    const cartItems = category === "pharma" ? pharmacyItems : groceryItems;
    const cartItem = cartItems.find((item) => item.id === itemId);
    const quantity = cartItem ? cartItem.quantity : 0;
    return quantity;
  };

  // Get current cart quantity for the product (without variant)
  const getCurrentCartQuantity = () => {
    return getCartQuantity(originalProductId);
  };

  const handleAddToCart = () => {
    // Ensure we have product name
    const productName =
      productDetails.name ||
      extendedProduct.name ||
      extendedProduct.fullName ||
      productDetails.fullName ||
      extendedProduct.fullName ||
      "Unknown Product";
    const productImage = productDetails.image || extendedProduct.image;

    // For grocery items, include productMasterId for ID-based fetching
    const itemToAdd = {
      id: selectedVariant
        ? `${originalProductId}-${selectedVariant.id}`
        : originalProductId,
      name: productName, // Ensure name is always set
      price: selectedVariant ? selectedVariant.price : getValidPrice(),
      image: productImage,
      variant: selectedVariant
        ? {
            name: selectedVariant.name,
            unit:
              selectedVariant.name.split(" ")[1]?.replace(/[()]/g, "") || "",
          }
        : undefined,
      // Store the actual product ID that the API expects
      // Use the productId from API response if available, otherwise use originalProductId
      productId: productDetails.productId || originalProductId,
      originalPrice: productDetails.originalPrice,
      prescriptionRequired: productDetails.prescriptionRequired || false,
    };

    addToCorrectCart(itemToAdd);
  };

  const percentOff =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;

  const productName =
    productDetails.name ||
    extendedProduct.name ||
    extendedProduct.fullName ||
    productDetails.fullName ||
    "Product";

  const basePrice = getValidPrice();
  const lowerPriceAlternatives = [
    {
      id: `${originalProductId}-alt-1`,
      name: `${productName} Generic 10mg`,
      price: Math.max(1, basePrice * 0.85),
      tagLine: "Same salt",
    },
    {
      id: `${originalProductId}-alt-2`,
      name: `${productName} Same Salt`,
      price: Math.max(1, basePrice * 0.8),
      tagLine: "Same salt",
    },
    {
      id: `${originalProductId}-alt-3`,
      name: `${productName} Pack of 15`,
      price: Math.max(1, basePrice * 0.9),
      tagLine: "Same brand",
    },
  ].map((item) => {
    const mrp = Math.round(item.price / 0.75);
    const savings = Math.max(1, mrp - item.price);
    return { ...item, mrp, savings };
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F6F7FF",
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 48,
    },
    imageContainer: {
      width: width,
      height: width,
      backgroundColor: theme.colors.surface,
    },
    image: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },
    content: {
      padding: theme.spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    brand: {
      fontSize: 16,
      color: theme.colors.secondary,
      marginBottom: theme.spacing.md,
    },
    price: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.colors.primary,
      marginBottom: theme.spacing.lg,
    },
    description: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: theme.spacing.xl,
    },
    productDescription: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    variantsContainer: {
      marginBottom: theme.spacing.xl,
    },
    variantList: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -theme.spacing.xs,
    },
    variantButton: {
      margin: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectedVariant: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + "10",
    },
    variantText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    selectedVariantText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    quantityContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.xl,
    },
    quantityButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    quantityText: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
      marginHorizontal: theme.spacing.lg,
    },
    bottomContainer: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    imageSliderContainer: {
      width: "100%",
      height: width * 0.7,
      backgroundColor: "#f7f7f7",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    sliderImage: {
      width: width,
      height: width * 0.7,
      resizeMode: "contain",
    },
    paginationContainer: {
      flexDirection: "row",
      position: "absolute",
      bottom: 10,
      alignSelf: "center",
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "rgba(0,0,0,0.2)",
      marginHorizontal: 4,
    },
    paginationDotActive: {
      backgroundColor: theme.colors.primary,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      marginBottom: 6,
    },
    productName: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.text,
      flex: 1,
      marginRight: 10,
    },
    productPrice: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.primary,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      marginBottom: 12,
      gap: 16,
    },
    brandName: {
      fontSize: 15,
      color: theme.colors.secondary,
      marginRight: 12,
    },
    availableQty: {
      fontSize: 15,
      color: theme.colors.text,
    },
  });
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header: back arrow + product name */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: "#F6F7FF",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ marginRight: 12 }}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: "600",
            color: theme.colors.text,
          }}
        >
          {productName}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Gradient card: swiper + info + actions */}
        <LinearGradient
          colors={["#D9E6FF", "#E9F0FF", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            width: CARD_WIDTH,
            alignSelf: "center",
            marginVertical: 18,
            borderRadius: 22,
            overflow: "hidden",
            ...Platform.select({
              ios: {
                shadowColor: "#4A6DD9",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.18,
                shadowRadius: 18,
              },
              android: { elevation: 10 },
            }),
          }}
        >
          {/* Swiper with Rx tag on top-right */}
          <View
            style={{
              width: CARD_WIDTH,
              height: CARD_WIDTH * 0.75,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, idx) => idx.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={1}
                  style={{
                    width: CARD_WIDTH,
                    height: CARD_WIDTH * 0.75,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() =>
                    navigation.navigate("ImageViewer", {
                      imageUrl: item,
                      title: extendedProduct.name,
                    })
                  }
                >
                  <Image
                    source={{ uri: item }}
                    style={{
                      width: CARD_WIDTH * 0.85,
                      height: CARD_WIDTH * 0.65,
                      resizeMode: "contain",
                    }}
                  />
                </TouchableOpacity>
              )}
              onScroll={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / CARD_WIDTH,
                );
                setCurrentImageIndex(index);
              }}
              scrollEventThrottle={16}
            />
            {/* Pagination Dots */}
            <View
              style={{
                flexDirection: "row",
                position: "absolute",
                bottom: 12,
                alignSelf: "center",
              }}
            >
              {images.map((_: any, idx: number) => (
                <View
                  key={idx}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      idx === currentImageIndex
                        ? theme.colors.primary
                        : "rgba(255,255,255,0.6)",
                    marginHorizontal: 4,
                  }}
                />
              ))}
            </View>
            {productDetails.prescriptionRequired && (
              <View
                style={{
                  position: "absolute",
                  top: 16,
                  right: 18,
                }}
              >
                <RXRequiredNewTag size={14} />
              </View>
            )}
          </View>

          {/* Name, price, content, available, add/counter - inside same card (match reference layout) */}
          <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
            {/* Row 1: Product name */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: "#1E1E1E",
                marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {productDetails.name || productName}
            </Text>

            {/* Row 2: Pack/content line */}
            <Text
              style={{
                fontSize: 14,
                color: "#757575",
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {selectedVariant ? selectedVariant.name : variants[0]?.name || ""}
            </Text>

            {/* Row 3: Available quantity (simple text, above price) */}
            {/* {getValidQuantity() > 0 && (
              <Text
                style={{
                  fontSize: 13,
                  color: "#757575",
                  marginBottom: 8,
                }}
              >
                Available qty:{" "}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#1E1E1E",
                  }}
                >
                  {getValidQuantity()}
                </Text>
              </Text>
            )} */}

            {/* Row 4: Price + % OFF | ADD / counter */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#1E1E1E",
                  }}
                >
                  ₹{getValidPrice().toFixed(2)}
                </Text>
                {getValidPrice() > 0 && percentOff > 0 && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#757575",
                    }}
                  >
                    {percentOff}% OFF
                  </Text>
                )}
              </View>
              {/* Right: Counter or primary CTA */}
              {(
                selectedVariant
                  ? getCartQuantity(originalProductId, selectedVariant.id) > 0
                  : variants.length === 0 && getCurrentCartQuantity() > 0
              ) ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#E0E0E0",
                    height: 40,
                    overflow: "hidden",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedVariant) {
                        const id = `${originalProductId}-${selectedVariant.id}`;
                        updateQuantity(
                          id,
                          Math.max(
                            0,
                            getCartQuantity(
                              originalProductId,
                              selectedVariant.id,
                            ) - 1,
                          ),
                          productDetails.category || "grocery",
                        );
                      } else {
                        updateQuantity(
                          originalProductId,
                          Math.max(0, getCurrentCartQuantity() - 1),
                          productDetails.category || "grocery",
                        );
                      }
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: "#F0F0F0",
                      justifyContent: "center",
                      alignItems: "center",
                      borderLeftWidth: 1,
                      borderLeftColor: "#E0E0E0",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "600",
                        color: "#4285F4",
                      }}
                    >
                      -
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={{
                      minWidth: 36,
                      height: 40,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#fff",
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#1E1E1E",
                      }}
                    >
                      {selectedVariant
                        ? getCartQuantity(originalProductId, selectedVariant.id)
                        : getCurrentCartQuantity()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedVariant) {
                        const id = `${originalProductId}-${selectedVariant.id}`;
                        const cat = productDetails.category || "grocery";
                        const items =
                          cat === "pharma" ? pharmacyItems : groceryItems;
                        const ex = items.find((item) => item.id === id);
                        if (ex) updateQuantity(id, ex.quantity + 1, cat);
                        else
                          addToCorrectCart({
                            id,
                            name: productDetails.name,
                            price: selectedVariant.price,
                            image:
                              productDetails.image ||
                              "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
                            variant: {
                              name: selectedVariant.name,
                              unit:
                                selectedVariant.name
                                  .split(" ")[1]
                                  ?.replace(/[()]/g, "") || "",
                            },
                            productId:
                              productDetails.productId || originalProductId,
                            originalPrice: productDetails.originalPrice,
                          });
                      } else {
                        const cat = productDetails.category || "grocery";
                        const items =
                          cat === "pharma" ? pharmacyItems : groceryItems;
                        const ex = items.find(
                          (item) => item.id === originalProductId,
                        );
                        if (ex)
                          updateQuantity(
                            originalProductId,
                            ex.quantity + 1,
                            cat,
                          );
                        else
                          addToCorrectCart({
                            id: originalProductId,
                            name: productDetails.name,
                            price: getValidPrice(),
                            image:
                              productDetails.image ||
                              "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
                            productId:
                              productDetails.productId || originalProductId,
                            originalPrice: productDetails.originalPrice,
                          });
                      }
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: "#F0F0F0",
                      justifyContent: "center",
                      alignItems: "center",
                      borderLeftWidth: 1,
                      borderLeftColor: "#E0E0E0",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "600",
                        color: "#4285F4",
                      }}
                    >
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : variants.length !== 0 && !selectedVariant ? (
                <Text style={{ fontSize: 14, color: "#757575" }}>
                  Select a variant
                </Text>
              ) : (
                canAddToCart() && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#4285F4",
                      borderRadius: 18,
                      paddingHorizontal: width * 0.1,
                      paddingVertical: 10,
                      ...(Platform.OS === "ios" && {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.15,
                        shadowRadius: 3,
                      }),
                      ...(Platform.OS === "android" && { elevation: 2 }),
                    }}
                    onPress={() => {
                      if (!canAddToCart()) return;
                      if (selectedVariant) {
                        addToCorrectCart({
                          id: `${originalProductId}-${selectedVariant.id}`,
                          name: productDetails.name,
                          price: selectedVariant.price,
                          image:
                            productDetails.image ||
                            "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
                          variant: {
                            name: selectedVariant.name,
                            unit:
                              selectedVariant.name
                                .split(" ")[1]
                                ?.replace(/[()]/g, "") || "",
                          },
                          productId:
                            productDetails.productId || originalProductId,
                          originalPrice: productDetails.originalPrice,
                        });
                      } else handleAddToCart();
                    }}
                    disabled={!canAddToCart()}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      ADD
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
            {/* Brand Section - Only show if brand exists in API data */}
            {(productDetails.brand || productDetails.manufacturer) && (
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                  marginTop: 2,
                  backgroundColor: "#F7F7F7",
                  borderRadius: 8,
                  padding: 8,
                }}
                onPress={() =>
                  navigation.navigate("BrandDetail", {
                    brand:
                      productDetails.brand || productDetails.manufacturer || "",
                  })
                }
              >
                <Image
                  source={{
                    uri: "https://seeklogo.com/images/A/amul-logo-7E6B2B7B2B-seeklogo.com.png",
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    marginRight: 10,
                    backgroundColor: "#f0f0f0",
                  }}
                />
                <View>
                  <Text
                    style={{
                      fontSize: 15,
                      color: theme.colors.text,
                      fontWeight: "bold",
                    }}
                  >
                    {productDetails.brand || productDetails.manufacturer}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.colors.primary }}>
                    Explore all products
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Talk to a Certified Pharmacist card */}
        {/* {productDetails.prescriptionRequired && (
          <TouchableOpacity
            style={{
              marginHorizontal: 12,
              marginBottom: 18,
              borderRadius: 16,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#FFFFFF", "#D9E6FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 16,
              }}
            >
              <Image
                source={require("../../assets/productDetailPageVector.png")}
                style={{
                  width: 64,
                  height: 64,
                  resizeMode: "contain",
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: theme.colors.text,
                    marginBottom: 2,
                  }}
                >
                  Talk to a Certified Pharmacist
                </Text>
                <Text style={{ fontSize: 13, color: "#666" }}>
                  Free medicine guidance before purchase
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={22}
                color="#9E9E9E"
              />
            </LinearGradient>
          </TouchableOpacity>
        )} */}

        {/* Description section */}
        <View
          style={{
            marginHorizontal: 12,
            marginBottom: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingTop: 12,
            paddingBottom: 14,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: theme.colors.text,
              marginBottom: 6,
            }}
          >
            Description
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text,
              lineHeight: 22,
            }}
            numberOfLines={showFullDescription ? undefined : 5}
          >
            {productDetails.productDescription ||
              productDetails.description ||
              "No additional details available for this product."}
          </Text>
          {(productDetails.productDescription ||
            productDetails.description) && (
            <TouchableOpacity
              onPress={() => setShowFullDescription((prev) => !prev)}
              activeOpacity={0.8}
              style={{ marginTop: 6 }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#3B6EF5",
                }}
              >
                {showFullDescription ? "Show less" : "Load more"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lower Price Alternatives - styled like reference */}
        {/* <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              fontSize: 16,
              fontWeight: "600",
              color: theme.colors.text,
            }}
          >
            Lower Price Alternatives
          </Text>
          <FlatList
            data={lowerPriceAlternatives}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: 16,
              paddingRight: 12,
            }}
            renderItem={({ item }) => (
              <View
                style={{
                  marginRight: 12,
                  borderRadius: 18,
                  padding: 2,
                  backgroundColor: "#E4ECFF",
                }}
              >
                <LinearGradient
                  colors={["#F5F7FF", "#FFFFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: CARD_WIDTH - 64,
                    borderRadius: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 10,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={{ uri: images[0] }}
                      style={{
                        width: 60,
                        height: 48,
                        borderRadius: 10,
                        marginRight: 10,
                        resizeMode: "contain",
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#1E1E1E",
                          marginBottom: 2,
                        }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "700",
                            color: "#1E1E1E",
                          }}
                        >
                          ₹{item.price.toFixed(0)}
                        </Text>
                        <Text
                          style={{
                            marginLeft: 6,
                            fontSize: 13,
                            color: "#9E9E9E",
                            textDecorationLine: "line-through",
                          }}
                        >
                          ₹{item.mrp.toFixed(0)}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#757575",
                          marginBottom: 2,
                        }}
                      >
                        Save ₹{item.savings.toFixed(0)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#757575",
                        }}
                        numberOfLines={1}
                      >
                        {item.tagLine}
                      </Text>
                    </View>
                    <View
                      style={{
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        height: 56,
                        marginLeft: 8,
                      }}
                    >
                      <TouchableOpacity activeOpacity={0.9}>
                        <LinearGradient
                          colors={["#5B7CFA", "#8FA2FF"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            borderRadius: 14,
                            paddingHorizontal: 14,
                            paddingVertical: 5,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "600",
                              color: "#FFFFFF",
                            }}
                          >
                            Switch
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <View
                        style={{
                          marginTop: 6,
                          backgroundColor: "#E3F7E9",
                          borderRadius: 14,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: "#2E7D32",
                          }}
                        >
                          Save ₹{item.savings.toFixed(0)}
                        </Text>
                        <MaterialIcons
                          name="chevron-right"
                          size={16}
                          color="#2E7D32"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          />
        </View> */}
        {/* Available Variants - Only show if variants exist */}
        {variants.length > 0 && (
          <View
            style={{
              marginBottom: 18,
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 14,
              marginHorizontal: 12,
              elevation: 2,
              shadowColor: "#000",
              shadowOpacity: 0.04,
              shadowRadius: 8,
              zIndex: 1,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: theme.colors.text,
                marginBottom: 10,
              }}
            >
              Available Variants
            </Text>
            {variants.map((variant, idx) => {
              const variantCanAdd = isValidPrice(variant.price);
              return (
                <TouchableOpacity
                  key={variant.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedVariant(variant)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor:
                      selectedVariant?.id === variant.id
                        ? "#E6FFF2"
                        : idx === 0
                          ? "#F7FFF7"
                          : "#F7F7F7",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: idx === variants.length - 1 ? 0 : 10,
                    borderWidth:
                      selectedVariant?.id === variant.id
                        ? 2
                        : idx === 0
                          ? 1.5
                          : 1,
                    borderColor:
                      selectedVariant?.id === variant.id
                        ? theme.colors.primary
                        : idx === 0
                          ? "#27ae60"
                          : "#eee",
                    shadowColor:
                      selectedVariant?.id === variant.id
                        ? theme.colors.primary
                        : idx === 0
                          ? "#27ae60"
                          : "#000",
                    shadowOpacity:
                      selectedVariant?.id === variant.id
                        ? 0.12
                        : idx === 0
                          ? 0.08
                          : 0.03,
                    shadowRadius: 4,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "bold",
                          color: theme.colors.text,
                        }}
                      >
                        {variant.name}
                      </Text>
                      {idx === 0 && (
                        <View
                          style={{
                            backgroundColor: "#27ae60",
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            marginLeft: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: "bold",
                            }}
                          >
                            Best Seller
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        color: theme.colors.primary,
                        fontWeight: "bold",
                      }}
                    >
                      {isValidPrice(variant.price)
                        ? `₹${variant.price.toFixed(2)}`
                        : "Price not available"}
                    </Text>
                  </View>
                  {variantCanAdd ? (
                    getCartQuantity(originalProductId, variant.id) > 0 ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#fff",
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: "#27ae60",
                          height: 34,
                          minWidth: 80,
                          paddingHorizontal: 6,
                          margin: 0,
                          shadowColor: "#27ae60",
                          shadowOpacity: 0.08,
                          shadowRadius: 4,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            const currentQty = getCartQuantity(
                              originalProductId,
                              variant.id,
                            );
                            const newQty = Math.max(0, currentQty - 1);
                            const itemId = `${originalProductId}-${variant.id}`;
                            const category =
                              productDetails.category || "grocery";
                            updateQuantity(itemId, newQty, category);
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#27ae60",
                              fontWeight: "bold",
                              fontSize: 22,
                            }}
                          >
                            -
                          </Text>
                        </TouchableOpacity>
                        <Text
                          style={{
                            width: 28,
                            textAlign: "center",
                            color: "#27ae60",
                            fontWeight: "bold",
                            fontSize: 18,
                          }}
                        >
                          {getCartQuantity(originalProductId, variant.id)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            const itemId = `${originalProductId}-${variant.id}`;
                            const category =
                              productDetails.category || "grocery";
                            const items =
                              category === "pharma"
                                ? pharmacyItems
                                : groceryItems;
                            const existing = items.find(
                              (item) => item.id === itemId,
                            );

                            if (existing) {
                              updateQuantity(
                                itemId,
                                existing.quantity + 1,
                                category,
                              );
                            } else {
                              addToCorrectCart({
                                id: itemId,
                                name: productDetails.name,
                                price: variant.price,
                                image:
                                  productDetails.image ||
                                  "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
                                variant: {
                                  name: variant.name,
                                  unit:
                                    variant.name
                                      .split(" ")[1]
                                      ?.replace(/[()]/g, "") || "",
                                },
                                productId:
                                  extendedProduct.productId ||
                                  originalProductId,
                                // Include productMasterId for grocery items
                                // productMasterId: category === 'grocery' ? (productDetails.productMasterId || extendedProduct.productMasterId) : undefined,
                                originalPrice: productDetails.originalPrice,
                              });
                            }
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#27ae60",
                              fontWeight: "bold",
                              fontSize: 22,
                            }}
                          >
                            +
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null
                  ) : (
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: "#fee",
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#dc3545",
                          fontStyle: "italic",
                          fontWeight: "500",
                        }}
                      >
                        Out of stock
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductDetailScreen;

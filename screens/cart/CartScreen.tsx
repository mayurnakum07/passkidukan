// screens/CartScreen.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Box, Button, Card, Divider, IconButton, Text } from "native-base";
import {
  Image,
  ScrollView as RNScrollView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "../../components/product/ProductCard";
import { RXRequiredNewTag } from "../../components/ui/RXRequiredTag";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RootStackParamList } from "../../navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Cart">;

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const CartScreen = () => {
  const {
    groceryItems,
    pharmacyItems,
    removeFromCart,
    updateQuantity,
    groceryTotal,
    pharmacyTotal,
    addToGroceryCart,
    addToPharmacyCart,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();

  // Separate totals
  const hasGroceryItems = groceryItems.length > 0;
  const hasPharmacyItems = pharmacyItems.length > 0;
  const allItems = [...groceryItems, ...pharmacyItems];
  const totalAmount = groceryTotal + pharmacyTotal;

  const prescriptionItemsCount = allItems.filter(
    (item) => item.prescriptionRequired,
  ).length;

  const itemsTotal = totalAmount;
  const taxes = 0;
  const youSaved = allItems.reduce((sum, item) => {
    const original = toNumber((item as any).originalPrice);
    const price = toNumber(item.price);
    if (!original || original <= price) return sum;
    const qty = toNumber((item as any).quantity || 1);
    return sum + (original - price) * qty;
  }, 0);
  const grandTotal = itemsTotal + taxes;

  const formatAmount = (value: unknown): string => {
    const n = toNumber(value);
    return n.toFixed(2);
  };

  const handleCheckout = () => {
    // Navigate to payment methods/checkout screen
    navigation.navigate("PaymentMethods", {});
  };

  const formatNameTwoLines = (text: string, limit = 20) => {
    if (!text) return "Unnamed";

    if (text.length <= limit) return text;

    const firstLine = text.slice(0, limit);
    const remaining = text.slice(limit);

    if (remaining.length <= limit) {
      return `${firstLine}\n${remaining}`;
    }

    return `${firstLine}\n${remaining.slice(0, limit - 3)}...`;
  };

  const renderRecommendations = (
    items: any[],
    title: string,
    addToCart: (item: any) => void,
  ) => (
    <View style={{ marginTop: 12, marginBottom: 18 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginLeft: 16,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <RNScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 12, paddingRight: 8 }}
      >
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => navigation.navigate("ProductDetail", { product })}
            style={{ width: 140, marginRight: 12 }}
          />
        ))}
      </RNScrollView>
    </View>
  );

  const renderCartSection = (
    items: any[],
    title: string,
    total: number,
    addToCart: (item: any) => void,
  ) => {
    // Only show items with quantity > 0
    const activeItems = items.filter((item) => item.quantity > 0);
    if (activeItems.length === 0) return null;

    return (
      <View style={styles.cartSection}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {activeItems.map((item) => (
          <Card key={item.id} style={styles.cartItem}>
            <View style={styles.cartItemInner}>
              {/* LEFT SIDE: Image, Name, Offer/Strike Price, RX Tag */}
              <View style={styles.leftSection}>
                {/* Product Image */}
                {item.image && (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.productImage}
                  />
                )}

                <View style={styles.leftContent}>
                  {/* Product Name */}
                  <Text style={styles.itemName} numberOfLines={2}>
                    {formatNameTwoLines(item?.name, 28)}
                  </Text>

                  {/* Variant Info */}
                  {item.variant && (
                    <Text style={styles.variantText} numberOfLines={1}>
                      {item.variant.name}: {item.variant.unit}
                    </Text>
                  )}

                  {/* Offer/Strike Price - LEFT SIDE */}
                  {toNumber(item.originalPrice) > toNumber(item.price) && (
                    <View style={styles.offerPriceContainer}>
                      <Text style={styles.originalPriceText}>
                        ₹{formatAmount(item.originalPrice)}
                      </Text>
                      <Text style={styles.discountPercentText}>
                        {Math.round(
                          ((toNumber(item.originalPrice) -
                            toNumber(item.price)) /
                            toNumber(item.originalPrice)) *
                            100,
                        )}
                        % off
                      </Text>
                    </View>
                  )}

                  {/* RX Required Tag */}
                  {item.prescriptionRequired && (
                    <View style={styles.rxTagWrapper}>
                      <RXRequiredNewTag size={11} />
                    </View>
                  )}
                </View>
              </View>

              {/* RIGHT SIDE: Price, Counter, Remove */}
              <View style={styles.rightSection}>
                {/* Current Price */}
                <Text style={styles.itemPrice}>
                  ₹{formatAmount(item.price)}
                </Text>

                {/* Quantity Counter */}
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    style={[
                      styles.counterBtnSmall,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    onPress={() =>
                      updateQuantity(item.id, item.quantity - 1, item.category)
                    }
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                  <Text style={styles.counterValueSmall}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[
                      styles.counterBtnSmall,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() =>
                      updateQuantity(item.id, item.quantity + 1, item.category)
                    }
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={18}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                  onPress={() => removeFromCart(item.id, item.category)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}
        <View style={styles.sectionTotal}>
          <Text style={styles.sectionTotalText}>
            {title} Total: ₹{formatAmount(total)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Box px={4} py={2} flexDirection="row" alignItems="center">
        <IconButton
          icon={
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.text}
            />
          }
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="sm"
        />
        <Text
          color={theme.colors.text}
          fontSize="lg"
          fontWeight="bold"
          flex={1}
          textAlign="center"
        >
          My Cart
        </Text>
      </Box>

      {allItems.length > 0 && (
        <View style={styles.cartMetaContainer}>
          <Text style={styles.cartMetaText}>
            {allItems.length} {allItems.length === 1 ? "Item" : "Items"}
            {/* ·{"  "}
            Delivery in 20–25 mins */}
          </Text>
        </View>
      )}

      {allItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <View style={styles.emptyCartContent}>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              Your cart is empty
            </Text>
            <Text
              style={[styles.emptySubtext, { color: theme.colors.secondary }]}
            >
              Add some items to get started
            </Text>
          </View>

          {/* Recommended for You section - HIDDEN */}
          {/* <View style={styles.recommendationsContainer}>
            <Text style={[styles.recommendationsTitle, { color: theme.colors.text }]}>
              Recommended for you
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendationsScroll}
            >
              {groceryRecommendations.map(product => (
                <View key={product.id} style={[styles.recommendationCard, { backgroundColor: theme.colors.surface }]}>
                  <Image source={{ uri: product.image }} style={styles.recommendationImage} />
                  <Text style={[styles.recommendationName, { color: theme.colors.text }]} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={[styles.recommendationPrice, { color: theme.colors.primary }]}>₹{formatAmount(product.price)}</Text>
                  {toNumber(product.originalPrice) > toNumber(product.price) && (
                    <Text style={[styles.recommendationPrice, { textDecorationLine: 'line-through', color: theme.colors.secondary, marginLeft: 6 }]}>₹{formatAmount(product.originalPrice)}</Text>
                  )}
                  {toNumber(product.originalPrice) > toNumber(product.price) && (
                    <Text style={[styles.recommendationPrice, { color: '#FF9800', marginLeft: 6 }]}>{Math.round(((toNumber(product.originalPrice) - toNumber(product.price)) / toNumber(product.originalPrice)) * 100)}% off</Text>
                  )}
                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => {
                      const cartItem = {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        prescriptionRequired: product.prescriptionRequired || false,
                      };
                      addToGroceryCart(cartItem);
                    }}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View> */}

          <Button
            onPress={() =>
              navigation.navigate("Main", {
                screen: "Home",
                params: {
                  screen: "HomeRoot",
                  params: { storeId: "", pincode: "" },
                },
              })
            }
            style={{ marginTop: 32, borderRadius: 24, paddingHorizontal: 24 }}
            colorScheme="primary"
            size="lg"
          >
            Continue Shopping
          </Button>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.cartList}
            contentContainerStyle={styles.cartListContent}
            showsVerticalScrollIndicator={false}
          >
            {allItems.map((item) => (
              <Card key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemInner}>
                  {/* LEFT SIDE: Image, Name, Offer/Strike Price, RX Tag */}
                  <View style={styles.leftSection}>
                    {/* Product Image */}
                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.productImage}
                      />
                    )}

                    <View style={styles.leftContent}>
                      {/* Product Name */}
                      <Text style={styles.itemName} numberOfLines={2}>
                        {formatNameTwoLines(item?.name, 28)}
                      </Text>

                      {/* Variant Info */}
                      {item.variant && (
                        <Text style={styles.variantText} numberOfLines={1}>
                          {item.variant.name}: {item.variant.unit}
                        </Text>
                      )}

                      {/* Offer/Strike Price - LEFT SIDE */}
                      {toNumber((item as any).originalPrice) >
                        toNumber(item.price) && (
                        <View style={styles.offerPriceContainer}>
                          <Text style={styles.originalPriceText}>
                            ₹{formatAmount((item as any).originalPrice)}
                          </Text>
                          <Text style={styles.discountPercentText}>
                            {Math.round(
                              ((toNumber((item as any).originalPrice) -
                                toNumber(item.price)) /
                                toNumber((item as any).originalPrice)) *
                                100,
                            )}
                            % off
                          </Text>
                        </View>
                      )}

                      {/* RX Required Tag */}
                      {item.prescriptionRequired && (
                        <View style={styles.rxTagWrapper}>
                          <RXRequiredNewTag size={11} />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* RIGHT SIDE: Price, Counter, Remove */}
                  <View style={styles.rightSection}>
                    {/* Current Price */}
                    <Text style={styles.itemPrice}>
                      ₹{formatAmount(item.price)}
                    </Text>

                    {/* Quantity Counter */}
                    <View
                      style={[
                        styles.counterRow,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.counterBtnSmall}
                        onPress={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1,
                            item.category,
                          )
                        }
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name="minus"
                          size={18}
                          style={[
                            styles.counterBtnTextSmall,
                            { color: theme.colors.primary },
                          ]}
                        />
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.counterValueSmall,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {item.quantity}
                      </Text>
                      <TouchableOpacity
                        style={styles.counterBtnSmall}
                        onPress={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1,
                            item.category,
                          )
                        }
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name="plus"
                          size={18}
                          style={[
                            styles.counterBtnTextSmall,
                            { color: theme.colors.primary },
                          ]}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Remove Button */}
                  </View>
                </View>
                {/* <Divider
                  style={{
                    marginVertical: 10,
                    backgroundColor: "#E3E6F5",
                  }}
                />
                <View style={styles.removeButton}>
                  <Text
                    onPress={() => removeFromCart(item.id, item.category)}
                    style={styles.removeText}
                  >
                    Remove
                  </Text>
                </View> */}
              </Card>
            ))}

            {prescriptionItemsCount > 0 && (
              <View style={styles.prescriptionBanner}>
                <View style={styles.prescriptionIconCircle}>
                  <MaterialCommunityIcons
                    name="stethoscope"
                    size={18}
                    color="#F2A100"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prescriptionTitle}>
                    Prescription required for {prescriptionItemsCount}{" "}
                    {prescriptionItemsCount === 1 ? "item" : "items"}.
                  </Text>
                  <Text style={styles.prescriptionSubtitle}>
                    You&apos;ll be asked to upload it during checkout.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.totalContainer}>
              <View style={styles.orderSummaryCard}>
                <Text style={styles.orderSummaryTitle}>Order Summary</Text>

                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryLabel}>Items Total</Text>
                  <Text style={styles.orderSummaryValue}>
                    ₹{formatAmount(itemsTotal)}
                  </Text>
                </View>

                {/* <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryLabel}>Taxes</Text>
                  <Text style={styles.orderSummaryValue}>
                    ₹{formatAmount(taxes)}
                  </Text>
                </View> */}

                {youSaved > 0 && (
                  <View style={styles.orderSummaryRow}>
                    <Text style={styles.orderSummarySavingsLabel}>
                      You Saved
                    </Text>
                    <Text style={styles.orderSummarySavingsValue}>
                      ₹{formatAmount(youSaved)}
                    </Text>
                  </View>
                )}

                <View style={styles.orderSummaryDivider} />

                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryTotalLabel}>To Pay</Text>
                  <Text style={styles.orderSummaryTotalValue}>
                    ₹{formatAmount(grandTotal)}
                  </Text>
                </View>
              </View>
              <Button
                onPress={handleCheckout}
                isDisabled={allItems.length === 0 || grandTotal <= 0}
                size="lg"
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: 12,
                }}
              >
                Proceed to Checkout
              </Button>
            </View>
          </ScrollView>

          {/* Recommendation sections - HIDDEN */}
          {/* {hasGroceryItems && renderRecommendations(groceryRecommendations, 'You Might Also Like', addToGroceryCart)}
          {hasPharmacyItems && renderRecommendations(pharmacyRecommendations, 'Recommended Medicines', addToPharmacyCart)} */}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FF",
  },
  cartList: {
    flex: 1,
    marginTop: 12,
  },
  cartListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
  },
  cartItem: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E3E6F5",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  cartItemInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 12,
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  // LEFT SIDE STYLES
  leftSection: {
    flexDirection: "row",
    flex: 1,
    alignItems: "flex-start",
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: "#E8ECFF",
  },
  leftContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E1E1E",
    marginBottom: 4,
    lineHeight: 20,
  },
  variantText: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 4,
    color: "#6B6F82",
  },
  offerPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
    gap: 8,
  },
  // RIGHT SIDE STYLES
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    marginLeft: 12,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E1E1E",
    marginBottom: 8,
    textAlign: "right",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    paddingHorizontal: 6,
    marginVertical: 12,
  },
  counterBtnSmall: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnTextSmall: {
    fontSize: 16,
    fontWeight: "600",
  },
  counterValueSmall: {
    width: 24,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#1E40AF",
  },
  removeButton: {
    marginRight: 12,
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  totalContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  totalSubText: {
    fontSize: 13,
    color: "#6B6F82",
  },
  emptyCart: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  emptyCartContent: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  recommendationsContainer: {
    width: "100%",
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  recommendationsScroll: {
    paddingHorizontal: 16,
  },
  recommendationCard: {
    width: 150,
    marginRight: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendationName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    lineHeight: 18,
  },
  recommendationPrice: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  cartSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    marginLeft: 16,
  },
  sectionTotal: {
    marginTop: 16,
    marginBottom: 16,
    marginLeft: 16,
  },
  sectionTotalText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  rxTagWrapper: {
    marginTop: 6,
  },
  originalPriceText: {
    fontSize: 12,
    color: "#9EA0B3",
    textDecorationLine: "line-through",
  },
  discountPercentText: {
    fontSize: 11,
    color: "#27ae60",
    fontWeight: "600",
  },
  removeText: {
    fontSize: 14,
    color: "#F26A6A",
    fontWeight: "600",
    textAlign: "center",
  },
  prescriptionBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFF7E5",
    marginTop: 4,
    marginBottom: 16,
  },
  prescriptionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFE3B5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  prescriptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8A5A00",
    marginBottom: 2,
  },
  prescriptionSubtitle: {
    fontSize: 13,
    color: "#A68126",
  },
  orderSummaryCard: {
    backgroundColor: "transparent",
    padding: 0,
    marginBottom: 12,
  },
  orderSummaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  orderSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  orderSummaryLabel: {
    fontSize: 14,
    color: "#6B6F82",
  },
  orderSummaryValue: {
    fontSize: 14,
    color: "#1E1E1E",
    fontWeight: "500",
  },
  orderSummarySavingsLabel: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "600",
  },
  orderSummarySavingsValue: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "600",
  },
  orderSummaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  orderSummaryTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  orderSummaryTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E1E1E",
  },
  cartMetaContainer: {
    paddingHorizontal: 16,
  },
  cartMetaText: {
    fontSize: 13,
    color: "#6B6F82",
    textAlign: "center",
  },
  storeHeader: {
    marginBottom: 12,
  },
  storeNameText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B6F82",
  },
});

export default CartScreen;

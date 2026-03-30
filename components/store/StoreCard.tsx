// components/store/StoreCard.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// const COLORS = {
//   cardBg: "#FFFFFF",
//   storeName: "#333333",
//   distance: "#666666",
//   badgeBg: "#E0F2FF",
//   badgeText: "#3B82F6",
//   offerBg: "#FFEECF",
//   offerText: "#FF7700",
//   openNow: "#10B981",
//   openNowText: "#666666",
//   gradientStart: "#6A82FB",
//   gradientEnd: "#8998FF",
//   shadow: "#000",
//   white: "#FFFFFF",
// };

const StoreCard = ({
  store,
  onPress,
  isGrocery,
  style,
}: {
  store: any;
  onPress: () => void;
  style?: any;
  isGrocery?: boolean;
}) => {
  const themeColors = {
    gradient: isGrocery ? ["#3FA34D", "#C4D600"] : ["#6A82FB", "#8998FF"],
    gradientStart: isGrocery ? "#3FA34D" : "#6A82FB",
    gradientEnd: isGrocery ? "#C4D600" : "#8998FF",
    badgeBg: isGrocery ? "#FFEECF" : "#E0F2FF",
    badgeText: isGrocery ? "#666666" : "#3B82F6",

    offerBg: isGrocery ? "#FFF8D6" : "#FFEECF",
    offerText: isGrocery ? "#8A9A00" : "#FF7700",

    openDot: "#10B981",
    cardBg: "#FFFFFF",
    storeName: "#333333",
    distance: "#666666",
    shadow: "#000000",
    white: "#FFFFFF",
    neutral_white: "#FFFFFF",
    flatCheckColor: "#FF7700",
  };

  // Dummy/fallback values when not from API
  const deliveryTime =
    store.deliveryTime || store.delivery_time || "20–25 mins";
  const certifiedPharmacist =
    store.certifiedPharmacist ?? store.certified ?? true;
  const open24Hours = store.open24Hours ?? store.open24 ?? true;
  const isOpen = store.isOpen ?? true;
  const offer = store.offer ?? store.discount ?? "Up to 25% Off";
  const distanceText = store.distance
    ? typeof store.distance === "string"
      ? store.distance
      : `${Number(store.distance).toFixed(1)} km away`
    : "1.2 km away";
  const storeName = store.name || "Unnamed Pharmacy";

  const styles = StyleSheet.create({
    card: {
      backgroundColor: themeColors.cardBg,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    storeName: {
      fontSize: 18,
      fontWeight: "700",
      color: themeColors.storeName,
      flex: 1,
      marginRight: 30,
    },
    timeBadge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      paddingHorizontal: 22,
      paddingVertical: 6,
    },
    timeText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600",
    },
    tagsContainer: {
      flexDirection: "column",
      flexWrap: "wrap",
      marginTop: 10,
      gap: 8,
    },
    tagsContainer2: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 10,
      gap: 8,
    },
    tag: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: themeColors.badgeBg,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    tagText: {
      marginLeft: 6,
      fontSize: 13,
      color: themeColors.badgeText,
      fontWeight: "500",
    },
    offerTextContainer: {
      backgroundColor: themeColors.offerBg,
      borderRadius: 50,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    bottomRow: {
      marginTop: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
    },
    distanceText: {
      fontSize: 14,
      color: themeColors.distance,
    },
    offerText: {
      fontSize: 11,
      color: themeColors.offerText,
      fontWeight: "500",
    },
    openNow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      justifyContent: "flex-end",
    },
    openDot: {
      width: 12,
      height: 12,
      borderRadius: 50,
      backgroundColor: themeColors.openDot,
      marginRight: 6,
    },
    openText: {
      fontSize: 13,
      color: themeColors.distance,
    },
  });

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <Text style={styles.storeName} numberOfLines={2}>
          {storeName}
        </Text>

        {/* <LinearGradient
          colors={themeColors.gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.timeBadge}
        >
          <Text style={styles.timeText}>{deliveryTime}</Text>
          {isGrocery && (
            <MaterialCommunityIcons
              name="flash"
              size={14}
              color={themeColors.neutral_white}
              style={{ marginLeft: 4 }}
            />
          )}
        </LinearGradient> */}
      </View>

      {/* GROCERY MODE */}
      {isGrocery ? (
        <>
          {/* <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color={themeColors.flatCheckColor}
              />
              <Text style={styles.tagText}>Flat ₹50 Off</Text>
            </View>

            <View style={styles.tag}>
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color={themeColors.offerText}
              />
              <Text style={styles.tagText}>Trusted Local Store</Text>
            </View>
          </View> */}
        </>
      ) : (
        <>
          {/* PHARMACY MODE */}
          {/* <View style={styles.tagsContainer}>
            {certifiedPharmacist && (
              <View style={styles.tag}>
                <MaterialCommunityIcons
                  name="checkbox-marked"
                  size={16}
                  color={themeColors.badgeText}
                />
                <Text style={styles.tagText}>Certified Pharmacist</Text>
              </View>
            )}
          </View>

          <View style={styles.tagsContainer2}>
            {open24Hours && (
              <View style={styles.tag}>
                <MaterialCommunityIcons
                  name="checkbox-marked"
                  size={16}
                  color={themeColors.badgeText}
                />
                <Text style={styles.tagText}>Open 24 Hours</Text>
              </View>
            )}

            {offer && (
              <View style={styles.offerTextContainer}>
                <Text style={styles.offerText}>{offer}</Text>
              </View>
            )}
          </View> */}
        </>
      )}

      {/* Bottom Row */}
      <View style={styles.bottomRow}>
        <Text style={styles.distanceText}>{distanceText}</Text>

        {/* {isOpen && (
          <View style={styles.openNow}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>Open Now</Text>
          </View>
        )} */}
      </View>
    </TouchableOpacity>
  );
};

export default StoreCard;

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useAppContext } from "../../contexts/AppContext";
import { storeProductService } from "../../services/api/storeProductService";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get("window");
// Calculate card width: screen width - section padding (32) - row padding (32) - margins (24) = screenWidth - 88
// Then divide by 4 for 4 columns
const CARD_WIDTH = Math.floor((screenWidth - 88) / 4);

const CategoryGrid = () => {
  const { theme, section } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const {
    selectedStore,
    lastVisitedStore,
    lastVisitedGroceryStore,
    lastVisitedPharmacyStore,
  } = useAppContext();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tapLoadingId, setTapLoadingId] = useState<string | null>(null);

  // Always show first 8 categories on home screen
  const displayedCategories = categories.slice(0, 8);
  const hasMoreCategories = categories.length > 8;

  // Get the effective store to use (selectedStore or fallback to last visited stores)
  const effectiveStore =
    selectedStore ||
    lastVisitedStore ||
    (section === "grocery"
      ? lastVisitedGroceryStore
      : lastVisitedPharmacyStore);

  // Fetch categories from API only - no hardcoded data
  useEffect(() => {
    const fetchCategories = async () => {
      if (!effectiveStore?.id) {
        console.log("   No store available, showing empty categories");
        setCategories([]);
        return;
      }

      if (section === "pharma" && effectiveStore?.type !== "pharma") {
        console.log("🚫 Skipping pharma categories — store is not pharma");
        return;
      }

      if (section === "grocery" && effectiveStore?.type !== "grocery") {
        console.log("🚫 Skipping grocery categories — store is not grocery");
        return;
      }

      try {
        setLoading(true);
        console.log(
          `🔄 Fetching ${section} categories for store:`,
          effectiveStore.id,
        );

        if (section === "pharma") {
          const response = await storeProductService.getPharmaCategories(
            effectiveStore.id,
          );
          if (response.success && response.data) {
            console.log("Pharma categories loaded from API");
            setCategories(response.data);
          } else {
            console.log("   Pharma API failed, showing empty categories");
            setCategories([]);
          }
        } else {
          const response = await storeProductService.getGroceryCategories(
            effectiveStore.id,
          );
          if (response.success && response.data) {
            console.log("Grocery categories loaded from API");
            setCategories(response.data);
          } else {
            console.log("   Grocery API failed, showing empty categories");
            setCategories([]);
          }
        }
      } catch (error) {
        console.log(`  Error fetching ${section} categories:`, error);
        console.log("   Showing empty categories");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [effectiveStore?.id, section]);

  const renderItem = ({ item }: { item: (typeof categories)[0] }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.borderRadius.md,
          marginRight: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
          shadowColor: theme.gradientEnd,
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 2,
        },
      ]}
      onPress={async () => {
        if (tapLoadingId) return;
        if (section === "pharma") {
          try {
            setTapLoadingId(item.id);
            // Fetch subcategories and map them into the category param
            if (effectiveStore?.id) {
              const subRes = await storeProductService.getPharmaSubcategories(
                effectiveStore.id,
              );
              const subCats =
                subRes.success && Array.isArray(subRes.data)
                  ? subRes.data.filter(
                      (sc: any) =>
                        (sc.parentCategoryId ||
                          sc.categoryId ||
                          sc.category?.categoryId) === item.id,
                    )
                  : [];
              navigation.navigate("CategoryDetail", {
                category: { ...item, subCategories: subCats },
              });
            } else {
              navigation.navigate("CategoryDetail", { category: item as any });
            }
          } catch (e) {
            navigation.navigate("CategoryDetail", { category: item as any });
          } finally {
            setTapLoadingId(null);
          }
        } else {
          navigation.navigate("CategoryDetail", { category: item as any });
        }
      }}
    >
      <Image
        source={{
          uri:
            item.image ||
            "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
        }}
        style={styles.image}
      />
      <Text
        style={[styles.name, { color: theme.colors.text }]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <FlatList
        data={displayedCategories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={4}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 8,
  },
  name: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
    width: "100%",
    overflow: "hidden",
    flexWrap: "wrap",
    paddingHorizontal: 0,
  },
  viewMoreButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default CategoryGrid;

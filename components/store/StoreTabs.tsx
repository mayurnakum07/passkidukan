import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PILL_RADIUS = 999;

interface Props {
  active: "grocery" | "pharma";
  onChange: (val: "grocery" | "pharma") => void;
  isGrocery: boolean;
}

const StoreTabs: React.FC<Props> = ({ active, onChange, isGrocery }) => {
  const tabs: { id: "grocery" | "pharma"; label: string }[] = [
    { id: "pharma", label: "Pharmacy" },
    { id: "grocery", label: "Grocery" },
  ];

  const CONTAINER_BG = isGrocery ? "#E9E6EA" : "#ECEBFF";

  const INACTIVE_TEXT = "#5F5F6A";

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: CONTAINER_BG }]}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onChange(tab.id)}
              activeOpacity={0.9}
            >
              {isActive ? (
                <LinearGradient
                  colors={
                    isGrocery ? ["#3FA34D", "#C4D600"] : ["#5B7CFA", "#8FA2FF"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeTab}
                >
                  <Text style={styles.textActive}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={[styles.textInactive, { color: INACTIVE_TEXT }]}>
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default StoreTabs;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginBottom: 20,
  },

  container: {
    flexDirection: "row",
    borderRadius: PILL_RADIUS,
    padding: 4,
    width: "100%",
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  activeTab: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: PILL_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },

  textInactive: {
    fontSize: 15,
    fontWeight: "600",
  },

  textActive: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

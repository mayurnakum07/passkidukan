import { StyleSheet, Text, View } from "react-native";

export const RXRequiredNewTag = ({ size }: { size: number }) => (
  <View style={[styles.rxTag]}>
    <Text style={[styles.rxTagText, { fontSize: size }]}>Rx Required</Text>
  </View>
);

const styles = StyleSheet.create({
  rxTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F5D5D5",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  rxTagText: {
    color: "#A17303",
    fontWeight: "600",
  },
});

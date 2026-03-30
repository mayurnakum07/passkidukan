import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Divider } from "native-base";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { RootStackParamList } from "../../navigation/types";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PhoneAuth"
>;
type PhoneAuthRouteProp = RouteProp<RootStackParamList, "PhoneAuth">;

const PhoneAuthScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PhoneAuthRouteProp>();
  const { cartType } = route.params;
  const { sendOTP } = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    // Clean mobile number - remove +91 if present
    let cleanNumber = mobileNumber.replace(/^\+91/, "").replace(/\D/g, "");

    // Validate mobile number - allow 10 to 13 digits
    if (cleanNumber.length < 10 || cleanNumber.length > 13) {
      Alert.alert(
        "Invalid Mobile Number",
        "Please enter a valid mobile number (10-13 digits)",
      );
      return;
    }

    // Use the cleaned number
    const finalMobileNumber = cleanNumber;

    setIsLoading(true);

    try {
      // First, try to send OTP to check if user exists
      const response = await sendOTP(finalMobileNumber);

      if (response.success) {
        // Extract otpKey from response
        const otpKey = response.data?.otpKey || "";
        console.log("OTP Key received:", otpKey);
        navigation.replace("OTPVerification", {
          phoneNumber: finalMobileNumber,
          cartType,
          isRegistration: false,
          otpKey: otpKey, // Pass otpKey to OTP verification screen
        });
      } else {
        // Check if error indicates customer not found
        if (
          response.error &&
          (response.error.toLowerCase().includes("customer not found") ||
            response.error.toLowerCase().includes("user not found") ||
            response.error.toLowerCase().includes("not registered"))
        ) {
          // Customer not found, redirect to registration
          navigation.push("Register", {
            phoneNumber: finalMobileNumber,
            cartType,
          });
        } else {
          Alert.alert(
            "Error",
            response.error || "Failed to send OTP. Please try again.",
          );
        }
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      // On any error, assume user doesn't exist and go to registration
      navigation.push("Register", {
        phoneNumber: mobileNumber,
        cartType,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Illustration */}
          <View style={styles.imageWrapper}>
            <Image
              source={require("../../assets/loginPageVector.png")}
              style={styles.heroImage}
            />
          </View>

          {/* Welcome Text */}
          <Text style={styles.welcomeTitle}>Welcome to Paas Ki Dukaan</Text>
          <Text style={styles.welcomeSubtitle}>
            Your trusted app for medicines and groceries.
          </Text>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Login / Sign Up</Text>
            <Text style={styles.cardSubtitle}>
              Enter your mobile number to continue{"\n"}
              We’ll send you a secure OTP for verification.
            </Text>

            {/* Phone Input */}
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryText}>+91</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Enter your mobile number"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={setMobileNumber}
              />
            </View>

            {/* Gradient Button */}
            <TouchableOpacity
              disabled={mobileNumber.length !== 10 || isLoading}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#79B8FF", "#4A90E2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.button,
                  mobileNumber.length !== 10 || isLoading
                    ? { opacity: 0.5 }
                    : {},
                ]}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Security Points */}
            <View style={styles.securityWrapper}>
              {[
                "Secure Login",
                "Your data is encrypted",
                "Verified services only",
              ].map((item, index) => (
                <View key={index} style={styles.securityItem}>
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color="#2ECC71"
                  />
                  <Text style={styles.securityText}>{item}</Text>
                </View>
              ))}
            </View>

            <Divider style={{ marginTop: 10, backgroundColor: "#DDE3ED" }} />

            <Text style={styles.termsText}>
              By continuing, you agree to our{" "}
              <Text style={styles.linkText}>Terms of Service</Text> and{" "}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PhoneAuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 20,
  },

  scrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
    justifyContent: "center",
  },

  imageWrapper: {
    alignItems: "center",
  },

  heroImage: {
    width: 350,
    height: 220,
    resizeMode: "cover",
  },

  welcomeTitle: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },

  welcomeSubtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    marginBottom: 22,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 36,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  cardSubtitle: {
    textAlign: "center",
    fontSize: 13,
    color: "#777",
    marginVertical: 10,
    lineHeight: 18,
  },

  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDE3ED",
    borderRadius: 16,
    paddingHorizontal: 10,
    marginTop: 15,
    backgroundColor: "#F9FBFF",
  },

  countryCode: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderColor: "#E0E0E0",
  },

  countryText: {
    fontSize: 16,
    fontWeight: "500",
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#FFF",
  },

  button: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 18,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },

  securityWrapper: {
    marginTop: 20,
  },

  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  securityText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#555",
  },

  termsText: {
    marginTop: 10,
    fontSize: 11,
    color: "#999",
    textAlign: "center",
  },

  linkText: {
    color: "#4A90E2",
  },
});

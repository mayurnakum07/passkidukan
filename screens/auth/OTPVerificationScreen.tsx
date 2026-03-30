import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import { useSMSRetriever } from "../../hooks/useSMSRetriever";
import { RootStackParamList } from "../../navigation/types";
import authService from "../../services/api/authService";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "OTPVerification"
>;
type OTPVerificationRouteProp = RouteProp<
  RootStackParamList,
  "OTPVerification"
>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const OTP_LENGTH = 6;
const RESEND_OTP_COOLDOWN = 30;

// Responsive scaling helpers
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const OTPVerificationScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OTPVerificationRouteProp>();
  const insets = useSafeAreaInsets();
  const {
    phoneNumber,
    cartType,
    isRegistration = false,
    otpKey: routeOtpKey,
  } = route.params;
  const { theme } = useTheme();
  const { login, user } = useAuth();
  const { showToast } = useToast();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [otpKey, setOtpKey] = useState<string>(routeOtpKey || "");
  const [autoVerifyAttempted, setAutoVerifyAttempted] = useState(false);
  const [resendTimer, setResendTimer] = useState<number>(RESEND_OTP_COOLDOWN);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const hasTriggeredAutofillFocus = useRef(false);

  const actualPhoneNumber = phoneNumber || user?.mobile || "";
  const displayPhoneNumber = actualPhoneNumber
    ? actualPhoneNumber.startsWith("+")
      ? actualPhoneNumber
      : `+91 ${actualPhoneNumber}`
    : "";

  const otpString = otp.join("");
  const isOtpComplete = otpString.length === OTP_LENGTH;

  // ── SMS Retriever callback ──────────────────────────────────────────
  const handleOTPReceived = useCallback(
    (receivedOtp: string) => {
      console.log("📱 OTP received from SMS:", receivedOtp);
      if (receivedOtp && receivedOtp.length >= 4 && receivedOtp.length <= 8) {
        // Extract exactly 6 digits if available
        const otpMatch = receivedOtp.match(/\d{6}/);
        if (otpMatch) {
          const otpArray = otpMatch[0].split("");
          setOtp(otpArray);
          console.log("✅ Auto-filled OTP from SMS");

          // Auto-verify after a short delay
          setTimeout(() => {
            const currentOtp = otpArray.join("");
            if (!autoVerifyAttempted && currentOtp.length === 6) {
              setAutoVerifyAttempted(true);
              // Call handleVerifyOTP directly
              const verifyOTP = async () => {
                const otpString = otpArray.join("");
                if (otpString.length !== 6) return;
                setIsLoading(true);
                try {
                  if (!otpKey) {
                    Alert.alert(
                      "Error",
                      "OTP key not found. Please try again.",
                    );
                    setIsLoading(false);
                    return;
                  }
                  const loginResult = await login(
                    actualPhoneNumber,
                    otpString,
                    otpKey,
                  );
                  if (loginResult.success) {
                    navigation.replace("Main", undefined as any);
                  } else {
                    setAutoVerifyAttempted(false);
                  }
                } catch (error) {
                  console.error("Error verifying OTP:", error);
                  setAutoVerifyAttempted(false);
                } finally {
                  setIsLoading(false);
                }
              };
              verifyOTP();
            }
          }, 500);
        }
      }
    },
    [autoVerifyAttempted, otpKey, actualPhoneNumber, login, navigation],
  );

  const { isListening: isSMSListening, error: smsError } =
    useSMSRetriever(handleOTPReceived);

  // ── SMS Retriever logging ───────────────────────────────────────────
  useEffect(() => {
    if (smsError) console.log("⚠️ SMS Retriever error:", smsError);
  }, [isSMSListening, smsError]);

  // ── Focus first OTP input on mount so keyboard shows and autofill pill appears ──
  useEffect(() => {
    if (hasTriggeredAutofillFocus.current) return;
    const t = setTimeout(() => {
      hasTriggeredAutofillFocus.current = true;
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  // ── OTP input handlers ─────────────────────────────────────────────
  const handleOtpChange = (value: string, index: number) => {
    console.log(`🔍 OTP Input ${index}: "${value}" (length: ${value.length})`);

    // Handle paste/autofill - if value is longer than 1, it's likely a paste
    if (value.length > 1) {
      console.log("📋 Paste/autofill detected:", value);

      // Extract alphanumeric characters and limit to 6
      const characters = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
      console.log("🔤 Extracted characters:", characters);

      const newOtp = ["", "", "", "", "", ""];

      // Fill all characters
      for (let i = 0; i < characters.length; i++) {
        newOtp[i] = characters[i];
      }

      console.log("📝 New OTP array:", newOtp);
      setOtp(newOtp);

      // Focus the last filled input
      const lastFilledIndex = Math.min(characters.length - 1, 5);
      setTimeout(() => {
        inputRefs.current[lastFilledIndex]?.focus();
      }, 100);

      // Auto-verify when all 6 characters are filled
      if (characters.length === 6) {
        setTimeout(() => {
          if (!autoVerifyAttempted) {
            setAutoVerifyAttempted(true);
            handleVerifyOTP();
          }
        }, 500);
      }
      return;
    }

    // Single character input - allow digits and characters
    if (value.length === 1) {
      console.log(`✅ Valid input: ${value} at index ${index}`);
      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        newOtp[index] = value;
        console.log("📝 Updated OTP array:", newOtp);
        return newOtp;
      });

      // Auto-focus next input
      if (index < 5) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 50);
      }

      // Auto-verify when all characters are filled
      setTimeout(() => {
        setOtp((currentOtp) => {
          if (currentOtp.every((char) => char !== "") && index === 5) {
            if (!autoVerifyAttempted) {
              setAutoVerifyAttempted(true);
              handleVerifyOTP();
            }
          }
          return currentOtp;
        });
      }, 100);
    } else if (value.length === 0) {
      // Handle backspace/clear
      console.log(`🗑️ Clearing input at index ${index}`);
      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        newOtp[index] = "";
        console.log("📝 Cleared OTP array:", newOtp);
        return newOtp;
      });
    } else {
      // Invalid input - ignore
      console.log(`❌ Invalid input: "${value}" at index ${index}`);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      console.log("❌ OTP length is not 6:", otpString.length);
      return;
    }
    setIsLoading(true);

    try {
      console.log("🔐 Starting OTP verification...");
      console.log("📱 Phone Number:", actualPhoneNumber);
      console.log("  OTP Key:", otpKey);
      console.log("🔢 OTP Entered:", otpString);
      console.log("📝 Is Registration:", isRegistration);
      console.log("  Route OTP Key:", routeOtpKey);

      // Check if otpKey looks like it's from login or registration
      if (otpKey && otpKey.includes("-login")) {
        console.log(
          "⚠️  WARNING: OTP Key appears to be from login flow but isRegistration is:",
          isRegistration,
        );
      }

      if (!otpKey) {
        Alert.alert("Error", "OTP key not found. Please try again.");
        setIsLoading(false);
        return;
      }

      // Use AuthContext login method which handles everything automatically
      console.log("🔐 Using AuthContext login method...");
      const loginResult = await login(actualPhoneNumber, otpString, otpKey);

      if (loginResult.success) {
        console.log(" Login successful, redirecting to home screen...");

        // Auto-navigate without showing alert
        navigation.replace("Main", undefined as any);
      } else {
        console.log("  Login failed:", loginResult.error);
        const errorMsg =
          loginResult.error || "Failed to verify OTP. Please try again.";
        const lowerErrorMsg = errorMsg.toLowerCase();

        // Check if error is about invalid OTP
        const isInvalidOTP =
          lowerErrorMsg.includes("invalid") &&
          (lowerErrorMsg.includes("otp") || lowerErrorMsg.includes("code"));

        if (isInvalidOTP) {
          // Always show toast for invalid OTP
          showToast("INVALID OTP");
        } else {
          // Only show alert if not auto-verifying
          if (!autoVerifyAttempted) {
            Alert.alert("Error", errorMsg);
          }
        }
      }
    } catch (error) {
      console.error("💥 Error verifying OTP:", error);
      Alert.alert("Error", "Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      console.log("  Resending OTP...");
      console.log("📱 Phone Number:", actualPhoneNumber);
      console.log("📝 Is Registration:", isRegistration);

      // For both registration and login flows, use sendOTP endpoint
      // This endpoint works for both new and existing users
      console.log("  Calling sendOTP API to resend OTP...");
      const response = await authService.sendOTP(actualPhoneNumber);

      console.log("📡 Resend OTP Response:", JSON.stringify(response, null, 2));

      if (response.success && response.data?.otpKey) {
        const newOtpKey = response.data.otpKey;
        console.log(" New OTP Key received:", newOtpKey);
        setOtpKey(newOtpKey);
        Alert.alert("Success", "OTP has been resent successfully!");
      } else {
        console.log("  Resend OTP failed:", response.error);
        Alert.alert(
          "Error",
          response.error || "Failed to resend OTP. Please try again.",
        );
      }
    } catch (error) {
      console.error("💥 Error resending OTP:", error);
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const INFO_ITEMS = [
    "Secure Verification",
    "OTP auto-fills when received",
    "Quick & Easy",
  ];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop:
                Platform.OS === "android"
                  ? (StatusBar.currentHeight ?? 0) + verticalScale(8)
                  : insets.top + verticalScale(8),
              paddingBottom: insets.bottom + verticalScale(24),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View>
            {/* Back button */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() =>
                  navigation.replace("PhoneAuth", {
                    cartType: cartType || "grocery",
                  })
                }
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={moderateScale(26)}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>
                Sent to{" "}
                <Text style={styles.phoneText}>{displayPhoneNumber}</Text>
              </Text>
            </View>

            {/* OTP Inputs – first input is the autofill target so keyboard shows OTP pill when screen opens */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="default"
                  maxLength={index === 0 ? 6 : 1}
                  selectTextOnFocus
                  autoComplete={index === 0 ? "sms-otp" : "off"}
                  textContentType={index === 0 ? "oneTimeCode" : "none"}
                  autoCapitalize="none"
                  autoCorrect={false}
                  importantForAutofill={index === 0 ? "yes" : "no"}
                  autoFocus={index === 0}
                  returnKeyType="next"
                  contextMenuHidden={false}
                  dataDetectorTypes="none"
                />
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerifyOTP}
              disabled={isLoading || !isOtpComplete}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#79B8FF", "#4A90E2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.verifyButton,
                  (isLoading || !isOtpComplete) && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.verifyButtonText}>
                  {isRegistration
                    ? "Complete Registration"
                    : "Verify & Continue"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                {resendTimer > 0
                  ? `Resend OTP in ${resendTimer}s`
                  : "Didn't receive the code?"}
              </Text>
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOTP}
                disabled={resendTimer > 0 || isLoading}
                hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
              >
                <Text
                  style={[
                    styles.resendButtonText,
                    (resendTimer > 0 || isLoading) && styles.textDisabled,
                  ]}
                >
                  Resend Now
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info List */}
            <View style={styles.infoList}>
              {INFO_ITEMS.map((item, index) => (
                <View key={index} style={styles.infoItem}>
                  <MaterialCommunityIcons
                    name="check"
                    size={moderateScale(20)}
                    color="#2ECC71"
                  />
                  <Text style={styles.infoText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Hero Image */}
          <View style={styles.imageWrapper}>
            <Image
              source={require("../../assets/OTPPageVector.png")}
              style={styles.heroImage}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay
        visible={isLoading}
        message={
          isRegistration ? "Completing registration..." : "Verifying OTP..."
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    marginTop: verticalScale(10),
  },
  hiddenInput: {
    position: "absolute",
    left: -9999,
    opacity: 0,
    height: 0,
    width: 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  backButton: {
    padding: scale(4),
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: verticalScale(28),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "600",
    color: "#222B45",
    marginBottom: verticalScale(6),
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: "#8F9BB3",
    textAlign: "center",
  },
  phoneText: {
    fontSize: moderateScale(14),
    color: "#666666",
    fontWeight: "500",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: scale(8),
    marginBottom: verticalScale(28),
  },
  otpInput: {
    width: scale(48),
    height: verticalScale(56),
    borderRadius: moderateScale(12),
    textAlign: "center" as const,
    fontSize: moderateScale(20),
    fontWeight: "bold" as const,
    color: "#222B45",
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  otpInputFilled: {
    borderWidth: 1.5,
    borderColor: "#4A90E2",
  },
  verifyButton: {
    paddingVertical: verticalScale(14),
    borderRadius: 16,
    alignItems: "center" as const,
    marginBottom: verticalScale(20),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: moderateScale(15),
    fontWeight: "600",
  },
  resendContainer: {
    alignItems: "center" as const,
    marginBottom: verticalScale(16),
  },
  resendText: {
    fontSize: moderateScale(13),
    color: "#B0B4C3",
    marginBottom: verticalScale(4),
  },
  resendButton: {
    paddingVertical: verticalScale(4),
  },
  resendButtonText: {
    color: "#4A90E2",
    fontSize: moderateScale(13),
    fontWeight: "500",
  },
  textDisabled: {
    opacity: 0.5,
  },
  changeMobileButton: {
    paddingVertical: verticalScale(4),
    marginTop: verticalScale(8),
  },
  changeMobileButtonText: {
    color: "#8F9BB3",
    fontSize: moderateScale(11),
    textAlign: "center" as const,
  },
  infoList: {
    marginTop: verticalScale(12),
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  infoText: {
    marginLeft: scale(8),
    fontSize: moderateScale(14),
    color: "#666666",
  },
  imageWrapper: {
    alignItems: "center",
  },
  heroImage: {
    width: scale(300),
    height: verticalScale(180),
    resizeMode: "contain" as const,
  },
});

export default OTPVerificationScreen;

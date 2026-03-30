import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { CameraOptions, launchCamera } from "react-native-image-picker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { RootStackParamList } from "../../navigation/types";
import orderService from "../../services/api/orderService";

// UI colors matching the design (light gray bg, white card, green gradient, blue accent)
const UPLOAD_UI = {
  background: "#F8F8F8",
  card: "#FFFFFF",
  textPrimary: "#333333",
  textSecondary: "#666666",
  textMuted: "#999999",
  greenStart: "#4CAF50",
  greenEnd: "#6BCB77",
  blueAccent: "#2196F3",
  borderLight: "#EEEEEE",
};

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UploadPrescription"
>;
type RouteProp = { params: { orderId: string; storeId?: string } };

const UploadPrescriptionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute() as unknown as RouteProp;
  const orderId = route.params?.orderId;
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name?: string;
    mimeType?: string | null;
    isImage?: boolean;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingDots, setUploadingDots] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [instructionsExpanded, setInstructionsExpanded] = useState(true);

  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmallScreen = screenWidth < 375;
  const horizontalPadding = Math.max(20, Math.min(24, screenWidth * 0.06));
  const cardRadius = 24;
  const scale = Math.min(1, screenWidth / 400);
  const bottomInset = Math.max(insets.bottom, 16);

  useEffect(() => {
    if (!isUploading) {
      setUploadingDots("");
      return;
    }
    const frames = [".", "..", "..."];
    let i = 0;
    const id = setInterval(() => {
      setUploadingDots(frames[i % 3]);
      i++;
    }, 400);
    return () => clearInterval(id);
  }, [isUploading]);

  useFocusEffect(
    useCallback(() => {
      console.log("📋 UploadPrescription screen focused");
    }, []),
  );

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          "Permissions Required",
          "Camera permission is required to take prescription photos.",
          [{ text: "OK" }],
        );
        return false;
      }
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const options: CameraOptions = {
        mediaType: "photo",
        quality: 0.8,
        cameraType: "back",
        saveToPhotos: false,
      };

      const result: any = await new Promise((resolve) =>
        launchCamera(options, resolve),
      );

      if (result && !result.didCancel && result.assets && result.assets[0]) {
        setProcessingImage(true);
        setSelectedFile(null);

        const asset = result.assets[0];
        const uriParts = asset.uri.split("/");
        const rawFileName =
          asset.fileName ||
          uriParts[uriParts.length - 1] ||
          `prescription_${Date.now()}`;

        let mimeType: string | null = null;
        let finalFileName = rawFileName;

        if (/\.(jpg|jpeg)$/i.test(rawFileName)) {
          mimeType = "image/jpeg";
        } else if (/\.(png)$/i.test(rawFileName)) {
          mimeType = "image/png";
        } else if (/\.(gif)$/i.test(rawFileName)) {
          mimeType = "image/gif";
        } else if (/\.(webp)$/i.test(rawFileName)) {
          mimeType = "image/webp";
        } else {
          finalFileName = `${rawFileName}.jpg`;
          mimeType = "image/jpeg";
        }

        if (!mimeType) mimeType = "image/jpeg";

        const newFile = {
          uri: asset.uri,
          name: finalFileName,
          mimeType: mimeType,
          isImage: true,
        };
        setSelectedFile(newFile);
        setImageLoading(true);
      }
    } catch (error) {
      setProcessingImage(false);
      setImageLoading(false);
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const handleChooseFromDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = (result as any).assets?.[0] || (result as any);
      if (asset && asset.uri) {
        const mimeType: string | null = asset.mimeType || asset.type || null;
        const isImage =
          mimeType?.startsWith("image/") ||
          /\.(jpg|jpeg|png|gif|webp)$/i.test(asset.name || asset.uri);

        if (isImage) {
          setProcessingImage(true);
          setImageLoading(true);
        }

        setSelectedFile({
          uri: asset.uri,
          name:
            asset.name ||
            (isImage ? "Prescription image" : "Prescription document"),
          mimeType,
          isImage,
        });

        if (!isImage) {
          setProcessingImage(false);
          setImageLoading(false);
        }
      }
    } catch (error) {
      setProcessingImage(false);
      setImageLoading(false);
      console.error("Error choosing from documents:", error);
      Alert.alert(
        "Error",
        "Failed to select file from documents. Please try again.",
      );
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setProcessingImage(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setProcessingImage(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImageLoading(false);
    setProcessingImage(false);
  };

  const handleUpload = async () => {
    if (!selectedFile?.uri) {
      Alert.alert(
        "No File",
        "Please select a prescription file or image before uploading",
      );
      return;
    }
    if (!orderId) {
      Alert.alert(
        "Missing Order",
        "Order ID is missing. Open this screen from an order context.",
      );
      return;
    }

    setIsUploading(true);
    try {
      const res = await orderService.uploadPrescription(
        orderId,
        selectedFile.uri,
        selectedFile.mimeType,
      );

      if (!res.success) {
        throw new Error(res.error || "Upload failed");
      }

      const signedUrl =
        (res.data as any)?.signedPresciptionUrl ||
        (res.data as any)?.signedPrescriptionUrl;

      Alert.alert("Upload Successful", "Prescription uploaded successfully.", [
        {
          text: "View Order",
          onPress: () => navigation.navigate("OrderDetail", { orderId }),
        },
      ]);
    } catch (error: any) {
      const message =
        (error?.message as string) ||
        "Failed to upload prescription. Please try again.";
      console.error("📄 Upload error:", message, error);
      Alert.alert("Upload Failed", message);
    } finally {
      setIsUploading(false);
    }
  };

  const instructionItems = [
    "Ensure it is clear and readable",
    "Doctor's signature must be visible",
    "Include patient name",
    "Do not crop important details",
  ];

  const cardShadow =
    Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        }
      : { elevation: 4 };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: UPLOAD_UI.background }]}
      edges={["top"]}
    >
      {/* Header: back + centered title & subtitle */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={26} color={UPLOAD_UI.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              {
                fontSize: isSmallScreen ? 20 : 22,
                color: UPLOAD_UI.textPrimary,
              },
            ]}
          >
            Upload Prescription
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              {
                fontSize: isSmallScreen ? 13 : 14,
                color: UPLOAD_UI.textSecondary,
                marginTop: 4,
              },
            ]}
          >
            Upload a valid doctor prescription to order medicines.
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: 80 + bottomInset,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main card */}
        <View
          style={[
            styles.card,
            {
              borderRadius: cardRadius,
              paddingHorizontal: horizontalPadding * 1.2,
              paddingVertical: 24 * scale,
              ...cardShadow,
            },
          ]}
        >
          <Image
            source={require("../../assets/prescriptionPageVector.png")}
            style={styles.cardImage}
          />
          <Text
            style={[
              styles.cardHeading,
              {
                fontSize: 17,
                color: UPLOAD_UI.textPrimary,
                marginBottom: 8,
              },
            ]}
          >
            Upload your doctor's prescription
          </Text>
          <Text
            style={[
              styles.cardDescription,
              {
                fontSize: isSmallScreen ? 13 : 14,
                color: UPLOAD_UI.textSecondary,
                marginBottom: 20,
              },
            ]}
          >
            Our certified pharmacist will review it securely.
          </Text>

          {/* Take Photo - green gradient */}
          <TouchableOpacity
            style={[styles.primaryButtonWrap, { marginBottom: 12 }]}
            onPress={handleTakePhoto}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[UPLOAD_UI.greenStart, UPLOAD_UI.greenEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.primaryButton,
                {
                  borderRadius: 12,
                  paddingVertical: 14,
                  ...(Platform.OS === "ios"
                    ? {
                        shadowColor: UPLOAD_UI.greenStart,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                      }
                    : { elevation: 3 }),
                },
              ]}
            >
              <MaterialIcons name="camera-alt" size={22} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Take Photo</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Choose from Gallery - outlined */}
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                borderRadius: 12,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: UPLOAD_UI.borderLight,
              },
            ]}
            onPress={handleChooseFromDocuments}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="photo-library"
              size={22}
              color={UPLOAD_UI.blueAccent}
            />
            <Text
              style={[
                styles.secondaryButtonText,
                {
                  fontSize: isSmallScreen ? 14 : 15,
                  color: UPLOAD_UI.textPrimary,
                },
              ]}
            >
              Choose from Gallery
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected file preview */}
        {selectedFile ? (
          <View
            style={[
              styles.previewCard,
              {
                borderRadius: 12,
                marginTop: 20,
                overflow: "hidden",
                backgroundColor: UPLOAD_UI.card,
                borderWidth: 1,
                borderColor: UPLOAD_UI.borderLight,
                minHeight: 200,
                ...cardShadow,
              },
            ]}
          >
            {processingImage && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={UPLOAD_UI.greenStart} />
                <Text style={styles.loaderText}>Processing image...</Text>
              </View>
            )}
            {imageLoading && !processingImage && selectedFile.isImage && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={UPLOAD_UI.greenStart} />
                <Text style={styles.loaderText}>Loading preview...</Text>
              </View>
            )}
            {!selectedFile.isImage && (
              <View style={styles.pdfPreview}>
                <MaterialIcons
                  name="picture-as-pdf"
                  size={48}
                  color={UPLOAD_UI.blueAccent}
                />
                <Text
                  style={[
                    styles.pdfPreviewText,
                    { color: UPLOAD_UI.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {selectedFile.name || "Selected document"}
                </Text>
              </View>
            )}
            {selectedFile.isImage && (
              <Image
                source={{ uri: selectedFile.uri }}
                style={styles.previewImage}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={handleRemoveFile}
            >
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Collapsible: How to upload a valid prescription? */}
        <View style={[styles.instructionsSection, { marginTop: 24 }]}>
          <TouchableOpacity
            style={styles.instructionsHeader}
            onPress={() => setInstructionsExpanded(!instructionsExpanded)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.instructionsTitle,
                {
                  fontSize: isSmallScreen ? 15 : 16,
                  color: UPLOAD_UI.textPrimary,
                },
              ]}
            >
              How to upload a valid prescription?
            </Text>
            <Ionicons
              name={instructionsExpanded ? "chevron-up" : "chevron-down"}
              size={22}
              color={UPLOAD_UI.textSecondary}
            />
          </TouchableOpacity>
          {instructionsExpanded && (
            <View style={styles.bulletList}>
              {instructionItems.map((item, index) => (
                <View key={index} style={styles.bulletRow}>
                  <View
                    style={[
                      styles.bullet,
                      { backgroundColor: UPLOAD_UI.textPrimary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.bulletText,
                      {
                        fontSize: isSmallScreen ? 13 : 14,
                        color: UPLOAD_UI.textSecondary,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Upload button when file selected */}
        {selectedFile && (
          <TouchableOpacity
            style={[
              styles.uploadButtonWrap,
              {
                marginTop: 24,
                borderRadius: 12,
                overflow: "hidden",
              },
            ]}
            onPress={handleUpload}
            disabled={isUploading || processingImage || imageLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[UPLOAD_UI.greenStart, UPLOAD_UI.greenEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.uploadButton,
                {
                  paddingVertical: 16,
                  opacity:
                    isUploading || processingImage || imageLoading ? 0.8 : 1,
                },
              ]}
            >
              {isUploading ? (
                <View style={styles.uploadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>
                    Uploading{uploadingDots}
                  </Text>
                </View>
              ) : (
                <Text style={styles.uploadButtonText}>Upload Prescription</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Security footer */}
      <View
        style={[
          styles.securityFooter,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: bottomInset,
          },
        ]}
      >
        <Ionicons
          name="lock-closed"
          size={18}
          color={UPLOAD_UI.greenStart}
          style={{ marginRight: 8 }}
        />
        <Text
          style={[
            styles.securityText,
            {
              fontSize: isSmallScreen ? 12 : 13,
              color: UPLOAD_UI.textMuted,
            },
          ]}
        >
          Your prescription is encrypted and securely stored.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cardImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
    resizeMode: "cover",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 42,
  },
  headerTitle: {
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubtitle: {
    textAlign: "center",
    paddingHorizontal: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: UPLOAD_UI.card,
    alignItems: "center",
  },
  illustrationWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  prescriptionPaper: {
    position: "absolute",
    width: "75%",
    height: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UPLOAD_UI.borderLight,
    left: 0,
    top: 0,
    padding: 10,
  },
  prescriptionPaperInner: {
    flex: 1,
  },
  rxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  greenCross: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  crossIcon: {
    position: "absolute",
  },
  rxText: {
    fontSize: 14,
    fontWeight: "700",
    color: UPLOAD_UI.textPrimary,
  },
  paperLines: {
    height: 2,
    backgroundColor: UPLOAD_UI.borderLight,
    marginBottom: 6,
  },
  medicalIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  pillGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pill: {
    borderRadius: 4,
  },
  bottleWrap: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 36,
    alignItems: "center",
  },
  bottle: {
    position: "absolute",
    bottom: 6,
    width: 20,
    height: 24,
    backgroundColor: "#C8E6C9",
    borderRadius: 2,
  },
  bottleCap: {
    position: "absolute",
    top: 0,
    width: 14,
    height: 8,
    backgroundColor: "#9E9E9E",
    borderRadius: 2,
  },
  cardHeading: {
    fontWeight: "700",
    textAlign: "center",
  },
  cardDescription: {
    textAlign: "center",
  },
  primaryButtonWrap: {
    width: "100%",
    alignSelf: "stretch",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: UPLOAD_UI.card,
    width: "100%",
    alignSelf: "stretch",
  },
  secondaryButtonText: {
    fontWeight: "600",
  },
  previewCard: {
    position: "relative",
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: UPLOAD_UI.textSecondary,
  },
  pdfPreview: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  pdfPreviewText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  removeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  instructionsSection: {},
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  instructionsTitle: {
    fontWeight: "600",
    flex: 1,
  },
  bulletList: {
    marginTop: 12,
    paddingLeft: 4,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
  },
  uploadButtonWrap: {
    width: "100%",
  },
  uploadButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  securityFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    backgroundColor: UPLOAD_UI.background,
  },
  securityText: {
    flex: 1,
  },
});

export default UploadPrescriptionScreen;

import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { matchBuildingType } from "../services/vision/buildingMatcher";
import { detectImageWithYolo } from "../services/vision/yoloService";
import { BuildingMatchResult, YoloPrediction } from "../services/vision/types";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "BuildingRecognition">;

export function BuildingRecognitionScreen(_: Props) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<YoloPrediction[]>([]);
  const [matchResult, setMatchResult] = useState<BuildingMatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runRecognition(base64: string, uri: string) {
    setLoading(true);
    setError(null);
    setPreviewUri(uri);

    try {
      const result = await detectImageWithYolo(base64);
      setPredictions(result);
      setMatchResult(matchBuildingType(result));
    } catch (recognitionError) {
      const message = recognitionError instanceof Error ? recognitionError.message : "识别失败";
      setPredictions([]);
      setMatchResult(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("未获得相册权限，无法选择图片");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      base64: true,
      allowsEditing: false
    });

    if (result.canceled || !result.assets[0]?.base64 || !result.assets[0]?.uri) {
      return;
    }

    await runRecognition(result.assets[0].base64, result.assets[0].uri);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError("未获得相机权限，无法拍照识别");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      base64: true,
      allowsEditing: false
    });

    if (result.canceled || !result.assets[0]?.base64 || !result.assets[0]?.uri) {
      return;
    }

    await runRecognition(result.assets[0].base64, result.assets[0].uri);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>智能建筑识别</Text>
      <Text style={styles.desc}>上传建筑图片后，系统会使用 YOLO 检测并匹配建筑类型。</Text>

      <View style={styles.actionsRow}>
        <Pressable style={styles.buttonPrimary} onPress={pickFromLibrary} disabled={loading}>
          <Text style={styles.buttonPrimaryText}>从相册选择</Text>
        </Pressable>
        <Pressable style={styles.buttonSecondary} onPress={takePhoto} disabled={loading}>
          <Text style={styles.buttonSecondaryText}>拍照识别</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>正在调用 YOLO 模型识别...</Text>
        </View>
      ) : null}

      {previewUri ? <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" /> : null}

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>识别失败</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {matchResult ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>识别结果</Text>
          <Text style={styles.resultItem}>建筑类型：{matchResult.buildingType}</Text>
          <Text style={styles.resultItem}>匹配置信度：{(matchResult.confidence * 100).toFixed(1)}%</Text>
          <Text style={styles.resultReason}>{matchResult.reason}</Text>
          <Text style={styles.resultLabels}>标签：{matchResult.sourceLabels.join(", ") || "无"}</Text>
        </View>
      ) : null}

      {predictions.length > 0 ? (
        <View style={styles.predictionCard}>
          <Text style={styles.resultTitle}>YOLO 检测目标</Text>
          {predictions
            .slice()
            .sort((a, b) => b.confidence - a.confidence)
            .map((prediction, index) => (
              <Text key={`${prediction.className}-${index}`} style={styles.predictionItem}>
                {prediction.className}：{(prediction.confidence * 100).toFixed(1)}%
              </Text>
            ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary
  },
  desc: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10
  },
  buttonPrimary: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    alignItems: "center"
  },
  buttonPrimaryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700"
  },
  buttonSecondary: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 13,
    alignItems: "center"
  },
  buttonSecondaryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600"
  },
  loadingWrap: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary
  },
  preview: {
    marginTop: 14,
    width: "100%",
    aspectRatio: 1.3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#d8dff0"
  },
  errorCard: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ef9ca3",
    backgroundColor: "#fff1f2",
    padding: 12
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9f1d2f"
  },
  errorText: {
    marginTop: 4,
    fontSize: 13,
    color: "#9f1d2f"
  },
  resultCard: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12
  },
  predictionCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary
  },
  resultItem: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textPrimary
  },
  resultReason: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary
  },
  resultLabels: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary
  },
  predictionItem: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textPrimary
  }
});

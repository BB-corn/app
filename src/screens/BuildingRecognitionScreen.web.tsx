import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    setCameraOpen(false);
  }

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

  async function openWebCamera() {
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("当前浏览器不支持摄像头访问，请使用 HTTPS 或新版浏览器");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });

      streamRef.current = stream;
      setCameraOpen(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current
            .play()
            .then(() => setCameraReady(true))
            .catch(() => {
              setError("摄像头启动失败，请检查浏览器权限设置");
              stopCamera();
            });
        }
      });
    } catch (cameraError) {
      const message = cameraError instanceof Error ? cameraError.message : "无法访问摄像头";
      setError(`无法访问摄像头: ${message}`);
      stopCamera();
    }
  }

  async function takePhoto() {
    await openWebCamera();
  }

  async function captureFromCamera() {
    if (!videoRef.current) {
      setError("摄像头未就绪");
      return;
    }

    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setError("无法读取摄像头画面，请稍后重试");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      setError("浏览器不支持画面采集");
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    stopCamera();
    await runRecognition(dataUrl, dataUrl);
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

      {previewUri ? (
        <View style={styles.previewFrame}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
        </View>
      ) : null}

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

      <Modal transparent visible={cameraOpen} animationType="fade" onRequestClose={stopCamera}>
        <View style={styles.modalMask}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>摄像头拍照</Text>
            <View style={styles.videoWrap}>
              <video
                ref={videoRef as any}
                playsInline
                muted
                style={{ width: "100%", display: "block", backgroundColor: "#000" } as any}
              />
              {!cameraReady ? <Text style={styles.cameraLoadingText}>摄像头启动中...</Text> : null}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondary} onPress={stopCamera}>
                <Text style={styles.modalSecondaryText}>取消</Text>
              </Pressable>
              <Pressable style={styles.modalPrimary} onPress={captureFromCamera} disabled={!cameraReady}>
                <Text style={styles.modalPrimaryText}>拍照并识别</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  previewFrame: {
    marginTop: 14,
    width: "100%",
    aspectRatio: 1.3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#d8dff0",
    overflow: "hidden"
  },
  previewImage: {
    width: "100%",
    height: "100%"
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
  },
  modalMask: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  modalCard: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 14
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary
  },
  videoWrap: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#111",
    minHeight: 220,
    justifyContent: "center",
    alignItems: "center"
  },
  cameraLoadingText: {
    position: "absolute",
    color: "#ffffff",
    fontSize: 13
  },
  modalActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10
  },
  modalSecondary: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 11,
    alignItems: "center"
  },
  modalSecondaryText: {
    color: colors.textPrimary,
    fontWeight: "600"
  },
  modalPrimary: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    alignItems: "center"
  },
  modalPrimaryText: {
    color: "#ffffff",
    fontWeight: "700"
  }
});

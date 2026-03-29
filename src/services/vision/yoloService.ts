import { YoloPrediction } from "./types";

interface RawPrediction {
  class?: string;
  class_name?: string;
  name?: string;
  confidence?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface RawYoloResponse {
  predictions?: RawPrediction[];
  detections?: RawPrediction[];
}

const endpoint = process.env.EXPO_PUBLIC_YOLO_ENDPOINT;
const apiKey = process.env.EXPO_PUBLIC_YOLO_API_KEY;

function stripDataUriPrefix(base64: string): string {
  const marker = "base64,";
  const markerIndex = base64.indexOf(marker);

  if (markerIndex < 0) {
    return base64;
  }

  return base64.slice(markerIndex + marker.length);
}

function parsePredictions(response: RawYoloResponse): YoloPrediction[] {
  const rawList = response.predictions ?? response.detections ?? [];

  return rawList
    .map((item) => {
      const className = item.class ?? item.class_name ?? item.name ?? "unknown";
      const confidence = typeof item.confidence === "number" ? item.confidence : 0;

      return {
        className,
        confidence,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height
      };
    })
    .filter((item) => item.className && item.confidence > 0);
}

export async function detectImageWithYolo(base64Image: string): Promise<YoloPrediction[]> {
  if (!endpoint) {
    throw new Error("缺少 EXPO_PUBLIC_YOLO_ENDPOINT，无法调用 YOLO 识别接口");
  }

  const body = {
    image: stripDataUriPrefix(base64Image),
    confidence: 0.2,
    overlap: 0.45,
    api_key: apiKey
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YOLO 接口返回异常(${response.status}): ${text || "empty response"}`);
  }

  const payload = (await response.json()) as RawYoloResponse;
  return parsePredictions(payload);
}

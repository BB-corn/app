import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { getCurrentPosition } from "../services/location/locationService";
import { getMapProvider } from "../services/map/mapProvider";
import { loadAmapWebSdk } from "../services/map/providers/amapWebLoader";
import { Coordinate } from "../services/map/types";
import { colors } from "../theme/colors";

const fallbackPoint: Coordinate = {
  latitude: 39.9042,
  longitude: 116.4074
};

export function MapScreen() {
  const [loading, setLoading] = useState(true);
  const [point, setPoint] = useState<Coordinate>(fallbackPoint);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const provider = useMemo(() => getMapProvider(), []);
  const mapContainerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const amapWebKey = process.env.EXPO_PUBLIC_AMAP_WEB_KEY;
  const amapSecurityJsCode = process.env.EXPO_PUBLIC_AMAP_SECURITY_JS_CODE;
  const amapWebStyle = process.env.EXPO_PUBLIC_AMAP_WEB_STYLE;

  useEffect(() => {
    let active = true;

    async function loadCurrentPosition() {
      try {
        const current = await getCurrentPosition();

        if (active && current) {
          setPoint(provider.normalizeCoordinate(current));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCurrentPosition();

    return () => {
      active = false;
    };
  }, [provider]);

  useEffect(() => {
    let active = true;

    async function initWebMap() {
      if (!amapWebKey) {
        setMapError("缺少 EXPO_PUBLIC_AMAP_WEB_KEY，无法加载高德地图");
        return;
      }

      try {
        const AMap = await loadAmapWebSdk({
          apiKey: amapWebKey,
          securityJsCode: amapSecurityJsCode
        });
        if (!active) {
          return;
        }

        const container = mapContainerRef.current;
        if (!container) {
          setMapError("地图容器初始化失败");
          return;
        }

        const map = new AMap.Map(container, {
          zoom: 13,
          center: [point.longitude, point.latitude],
          resizeEnable: true,
          ...(amapWebStyle ? { mapStyle: amapWebStyle } : {})
        });

        const marker = new AMap.Marker({
          position: [point.longitude, point.latitude],
          title: "当前位置"
        });

        marker.setMap(map);

        mapRef.current = map;
        markerRef.current = marker;
        setMapReady(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "加载高德地图失败";
        setMapError(message);
      }
    }

    initWebMap();

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      markerRef.current = null;
      setMapReady(false);
    };
  }, [amapWebKey, amapSecurityJsCode, amapWebStyle]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) {
      return;
    }

    const lngLat = [point.longitude, point.latitude];
    mapRef.current.setCenter(lngLat);
    markerRef.current.setPosition(lngLat);
  }, [point]);

  return (
    <View style={styles.page}>
      <View style={styles.mapCanvas} ref={mapContainerRef}>
        {!mapReady ? (
          <View style={styles.overlay}>
            <Text style={styles.mapFallbackTitle}>正在加载高德地图...</Text>
            <Text style={styles.mapFallbackDesc}>
              {mapError ?? "请确认网络与 Key 配置后等待加载完成"}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomCard}>
        <Text style={styles.cardTitle}>地图状态</Text>
        <Text style={styles.cardDesc}>当前 Provider: {provider.name}</Text>
        <Text style={styles.cardDesc}>纬度: {point.latitude.toFixed(6)}</Text>
        <Text style={styles.cardDesc}>经度: {point.longitude.toFixed(6)}</Text>
        {loading ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16
  },
  mapCanvas: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: "#dbe8ff"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(245, 247, 251, 0.82)"
  },
  mapFallbackTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary
  },
  mapFallbackDesc: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20
  },
  bottomCard: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary
  },
  cardDesc: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary
  },
  loader: {
    marginTop: 10
  }
});
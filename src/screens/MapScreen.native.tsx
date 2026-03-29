import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { MapViewContainer } from "../components/MapViewContainer";
import { getCurrentPosition } from "../services/location/locationService";
import { getMapProvider } from "../services/map/mapProvider";
import { Coordinate } from "../services/map/types";
import { colors } from "../theme/colors";

const fallbackPoint: Coordinate = {
  latitude: 39.9042,
  longitude: 116.4074
};

function toRegion(point: Coordinate): Region {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06
  };
}

export function MapScreen() {
  const [loading, setLoading] = useState(true);
  const [point, setPoint] = useState<Coordinate>(fallbackPoint);

  const provider = useMemo(() => getMapProvider(), []);

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

  return (
    <View style={styles.page}>
      <MapViewContainer>
        <MapView style={StyleSheet.absoluteFill} initialRegion={toRegion(point)}>
          <Marker coordinate={point} title="当前位置" description={`Provider: ${provider.name}`} />
        </MapView>
      </MapViewContainer>

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
    backgroundColor: colors.background
  },
  bottomCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
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
import * as Location from "expo-location";
import { Coordinate } from "../map/types";

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function getCurrentPosition(): Promise<Coordinate | null> {
  const hasPermission = await requestLocationPermission();

  if (!hasPermission) {
    return null;
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude
  };
}

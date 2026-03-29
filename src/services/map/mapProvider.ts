import Constants from "expo-constants";
import { gaodeProvider } from "./providers/gaodeProvider";
import { MapProvider, MapProviderType } from "./types";

function resolveProviderType(): MapProviderType {
  const configured = Constants.expoConfig?.extra?.mapProvider;

  if (configured === "google" || configured === "osm" || configured === "gaode") {
    return configured;
  }

  return "gaode";
}

export function getMapProvider(): MapProvider {
  const type = resolveProviderType();

  switch (type) {
    case "google":
    case "osm":
      return gaodeProvider;
    case "gaode":
    default:
      return gaodeProvider;
  }
}

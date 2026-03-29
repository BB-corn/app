export type MapProviderType = "gaode" | "google" | "osm";

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface MapProvider {
  name: string;
  normalizeCoordinate: (point: Coordinate) => Coordinate;
}

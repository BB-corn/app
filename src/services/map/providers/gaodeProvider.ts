import { Coordinate, MapProvider } from "../types";

function normalizeCoordinate(point: Coordinate): Coordinate {
  return {
    latitude: point.latitude,
    longitude: point.longitude
  };
}

export const gaodeProvider: MapProvider = {
  name: "Gaode",
  normalizeCoordinate
};

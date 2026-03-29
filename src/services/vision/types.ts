export interface YoloPrediction {
  className: string;
  confidence: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface BuildingMatchResult {
  buildingType: string;
  confidence: number;
  reason: string;
  sourceLabels: string[];
}

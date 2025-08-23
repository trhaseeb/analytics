// Minimal type definitions for clean map application

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

// Basic GeoJSON support if needed in the future
export interface BasicFeature {
  id: string;
  type: 'point' | 'line' | 'polygon';
  geometry: GeoJSON.Geometry;
  properties: Record<string, any>;
}

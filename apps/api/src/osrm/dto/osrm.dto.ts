export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteResult {
  duration: number; // seconds
  distance: number; // meters
  geometry?: string; // encoded polyline
}

export interface MatrixResult {
  durations: number[][]; // NxN matrix of durations in seconds
  distances?: number[][]; // NxN matrix of distances in meters
}

export interface TripResult {
  waypoints: Array<{
    originalIndex: number;
    location: [number, number];
  }>;
  trips: Array<{
    duration: number;
    distance: number;
    geometry?: string;
  }>;
}

export interface OsrmRouteResponse {
  code: string;
  routes: Array<{
    duration: number;
    distance: number;
    geometry?: string;
    legs: Array<{
      duration: number;
      distance: number;
    }>;
  }>;
}

export interface OsrmTableResponse {
  code: string;
  durations: number[][];
  distances?: number[][];
}

export interface OsrmTripResponse {
  code: string;
  waypoints: Array<{
    waypoint_index: number;
    location: [number, number];
  }>;
  trips: Array<{
    duration: number;
    distance: number;
    geometry?: string;
  }>;
}

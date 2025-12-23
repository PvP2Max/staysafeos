import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Coordinate,
  RouteResult,
  MatrixResult,
  TripResult,
  OsrmRouteResponse,
  OsrmTableResponse,
  OsrmTripResponse,
} from "./dto/osrm.dto";

const DEFAULT_OSRM_URL = "https://osrm.pvp2max.com";
const DEFAULT_TIMEOUT_MS = 5000;
const ESTIMATED_SPEED_MPH = 25; // Fallback speed for Haversine

@Injectable()
export class OsrmService {
  private readonly logger = new Logger(OsrmService.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>("OSRM_BASE_URL", DEFAULT_OSRM_URL);
    this.timeoutMs = this.configService.get<number>("OSRM_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
  }

  /**
   * Get drive time and distance between two points
   */
  async getDriveTime(from: Coordinate, to: Coordinate): Promise<RouteResult> {
    try {
      const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
      const url = `${this.baseUrl}/route/v1/driving/${coords}?overview=false`;

      const response = await this.fetchWithTimeout(url);
      const data = (await response.json()) as OsrmRouteResponse;

      if (data.code !== "Ok" || !data.routes?.[0]) {
        throw new Error(`OSRM route failed: ${data.code}`);
      }

      return {
        duration: data.routes[0].duration,
        distance: data.routes[0].distance,
      };
    } catch (error) {
      this.logger.warn(`OSRM getDriveTime failed, using fallback: ${error}`);
      return this.fallbackDriveTime(from, to);
    }
  }

  /**
   * Get NxN drive time matrix for multiple locations
   * First location is typically the van, rest are waypoints
   */
  async getDriveMatrix(locations: Coordinate[]): Promise<MatrixResult> {
    if (locations.length < 2) {
      return { durations: [[0]] };
    }

    try {
      const coords = locations.map((l) => `${l.lng},${l.lat}`).join(";");
      const url = `${this.baseUrl}/table/v1/driving/${coords}?annotations=duration,distance`;

      const response = await this.fetchWithTimeout(url);
      const data = (await response.json()) as OsrmTableResponse;

      if (data.code !== "Ok" || !data.durations) {
        throw new Error(`OSRM table failed: ${data.code}`);
      }

      return {
        durations: data.durations,
        distances: data.distances,
      };
    } catch (error) {
      this.logger.warn(`OSRM getDriveMatrix failed, using fallback: ${error}`);
      return this.fallbackDriveMatrix(locations);
    }
  }

  /**
   * Get TSP-optimized route ordering
   * source=first keeps the first point (van location) as the start
   */
  async getOptimalRoute(
    origin: Coordinate,
    waypoints: Coordinate[]
  ): Promise<TripResult> {
    if (waypoints.length === 0) {
      return { waypoints: [], trips: [] };
    }

    try {
      const allPoints = [origin, ...waypoints];
      const coords = allPoints.map((l) => `${l.lng},${l.lat}`).join(";");
      const url = `${this.baseUrl}/trip/v1/driving/${coords}?source=first&roundtrip=false`;

      const response = await this.fetchWithTimeout(url);
      const data = (await response.json()) as OsrmTripResponse;

      if (data.code !== "Ok" || !data.waypoints) {
        throw new Error(`OSRM trip failed: ${data.code}`);
      }

      return {
        waypoints: data.waypoints.map((wp) => ({
          originalIndex: wp.waypoint_index,
          location: wp.location,
        })),
        trips: data.trips,
      };
    } catch (error) {
      this.logger.warn(`OSRM getOptimalRoute failed, using original order: ${error}`);
      // Return original order as fallback
      return {
        waypoints: waypoints.map((_, i) => ({
          originalIndex: i + 1,
          location: [waypoints[i].lng, waypoints[i].lat],
        })),
        trips: [],
      };
    }
  }

  /**
   * Get route with full geometry for display
   */
  async getRouteWithGeometry(
    origin: Coordinate,
    destination: Coordinate,
    waypoints: Coordinate[] = []
  ): Promise<RouteResult & { geometry: string }> {
    try {
      const allPoints = [origin, ...waypoints, destination];
      const coords = allPoints.map((l) => `${l.lng},${l.lat}`).join(";");
      const url = `${this.baseUrl}/route/v1/driving/${coords}?overview=full&geometries=polyline`;

      const response = await this.fetchWithTimeout(url);
      const data = (await response.json()) as OsrmRouteResponse;

      if (data.code !== "Ok" || !data.routes?.[0]) {
        throw new Error(`OSRM route with geometry failed: ${data.code}`);
      }

      return {
        duration: data.routes[0].duration,
        distance: data.routes[0].distance,
        geometry: data.routes[0].geometry || "",
      };
    } catch (error) {
      this.logger.warn(`OSRM getRouteWithGeometry failed: ${error}`);
      const fallback = this.fallbackDriveTime(origin, destination);
      return { ...fallback, geometry: "" };
    }
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fallback: Calculate drive time using Haversine distance
   */
  private fallbackDriveTime(from: Coordinate, to: Coordinate): RouteResult {
    const distanceMiles = this.calculateHaversineDistance(from, to);
    const distanceMeters = distanceMiles * 1609.34;
    const durationSeconds = (distanceMiles / ESTIMATED_SPEED_MPH) * 3600;

    return {
      duration: durationSeconds,
      distance: distanceMeters,
    };
  }

  /**
   * Fallback: Calculate drive matrix using Haversine distances
   */
  private fallbackDriveMatrix(locations: Coordinate[]): MatrixResult {
    const n = locations.length;
    const durations: number[][] = [];
    const distances: number[][] = [];

    for (let i = 0; i < n; i++) {
      durations[i] = [];
      distances[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          durations[i][j] = 0;
          distances[i][j] = 0;
        } else {
          const result = this.fallbackDriveTime(locations[i], locations[j]);
          durations[i][j] = result.duration;
          distances[i][j] = result.distance;
        }
      }
    }

    return { durations, distances };
  }

  /**
   * Haversine formula for distance between two points
   */
  private calculateHaversineDistance(from: Coordinate, to: Coordinate): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) *
        Math.cos(this.toRad(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

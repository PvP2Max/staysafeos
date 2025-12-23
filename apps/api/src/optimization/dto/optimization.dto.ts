export interface VanInput {
  id: string;
  currentLat: number | null;
  currentLng: number | null;
  capacity: number;
  passengerCount: number;
  pendingTasks: Array<{
    id: string;
    rideId: string | null;
    type: "PICKUP" | "DROPOFF";
    position: number;
    lat: number | null;
    lng: number | null;
    passengerDelta?: number; // +passengers for pickup, -passengers for dropoff
  }>;
}

export interface RideInput {
  id: string;
  priority: number;
  passengerCount: number;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
}

export interface OptimizationInput {
  vans: VanInput[];
  pendingRides: RideInput[];
}

export interface TaskOrder {
  taskId?: string;
  rideId?: string;
  type: "PICKUP" | "DROPOFF";
  position: number;
  lat: number;
  lng: number;
  estimatedArrival?: Date;
  passengerDelta: number;
}

export interface VanTaskOrder {
  vanId: string;
  taskOrder: TaskOrder[];
}

export interface RideAssignment {
  rideId: string;
  vanId: string;
  pickupPosition: number;
  dropoffPosition: number;
  addedDuration: number;
}

export interface OptimizationResult {
  assignments: RideAssignment[];
  vanTaskOrders: VanTaskOrder[];
  totalDuration: number;
  optimizedAt: Date;
}

export interface InsertionCandidate {
  vanId: string;
  pickupPos: number;
  dropoffPos: number;
  addedDuration: number;
  valid: boolean;
}

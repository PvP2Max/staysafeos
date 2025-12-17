/**
 * API Types for Operations Dashboard
 */

// Ride types
export type RideStatus = "PENDING" | "ASSIGNED" | "EN_ROUTE" | "PICKED_UP" | "COMPLETED" | "CANCELLED";
export type RideSource = "REQUEST" | "MANUAL" | "WALK_ON";

export interface Ride {
  id: string;
  tenantId: string;
  riderName: string;
  riderPhone: string;
  passengerCount: number;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffAddress: string;
  dropoffLat?: number;
  dropoffLng?: number;
  notes?: string;
  priority: number;
  status: RideStatus;
  source: RideSource;
  vanId?: string;
  driverId?: string;
  tcId?: string;
  dispatcherId?: string;
  assignedAt?: string;
  enRouteAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  van?: Van;
  review?: RideReview;
}

export interface RideReview {
  id: string;
  rideId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Van types
export type VanStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OFFLINE";

export interface Van {
  id: string;
  tenantId: string;
  name: string;
  capacity: number;
  licensePlate?: string;
  status: VanStatus;
  driverId?: string;
  tcId?: string;
  lat?: number;
  lng?: number;
  lastPing?: string;
  driver?: Membership;
  tc?: Membership;
  tasks?: VanTask[];
}

export interface VanTask {
  id: string;
  vanId: string;
  type: "PICKUP" | "DROPOFF" | "CUSTOM";
  address: string;
  lat?: number;
  lng?: number;
  notes?: string;
  sortOrder: number;
  rideId?: string;
  ride?: Ride;
  completedAt?: string;
}

// Membership/Account types
export type MemberRole = "EXECUTIVE" | "ADMIN" | "DISPATCHER" | "TC" | "DRIVER" | "SAFETY" | "RIDER";

export interface Account {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Membership {
  id: string;
  accountId: string;
  tenantId: string;
  role: MemberRole;
  overrideRole?: MemberRole;
  active: boolean;
  account?: Account;
}

// Training types
export type TrainingCategory = "ORIENTATION" | "SAFETY" | "DRIVER" | "TC" | "DISPATCHER";

export interface TrainingModule {
  id: string;
  title: string;
  description?: string;
  category: TrainingCategory;
  videoUrl?: string;
  videoId?: string;
  videoDuration?: number;
  quizQuestions?: QuizQuestion[];
  passingPercent: number;
  requiredRoles: string[];
  sortOrder: number;
  active: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TrainingProgress {
  moduleId: string;
  videoWatched: boolean;
  quizPassed: boolean;
  quizScore?: number;
  completedAt?: string;
}

// Shift types
export type ShiftRole = "DRIVER" | "TC" | "DISPATCHER" | "SAFETY";

export interface Shift {
  id: string;
  title: string;
  description?: string;
  role: ShiftRole;
  startTime: string;
  endTime: string;
  slotsNeeded: number;
  location?: string;
  notes?: string;
  signups?: ShiftSignup[];
  signedUp?: boolean;
  slotsRemaining?: number;
}

export interface ShiftSignup {
  id: string;
  shiftId: string;
  membershipId: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  membership?: Membership;
}

// Transfer types
export type TransferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";

export interface VanTransfer {
  id: string;
  vanId: string;
  fromMembershipId: string;
  toMembershipId: string;
  status: TransferStatus;
  van?: Van;
  fromMembership?: Membership;
  toMembership?: Membership;
  createdAt: string;
  resolvedAt?: string;
}

// Analytics types
export interface AnalyticsSummary {
  totalRides: number;
  activeRides: number;
  pendingRides: number;
  completedRides: number;
  cancelledRides: number;
  totalDrivers: number;
  onlineDrivers: number;
  totalVans: number;
  availableVans: number;
  avgWaitTime?: number;
  avgRating?: number;
}

// SSE Event types
export interface SSEEvent {
  type: string;
  data: unknown;
  timestamp: string;
}

export interface RideEvent extends SSEEvent {
  type: "ride.created" | "ride.updated" | "ride.cancelled" | "ride.completed" | "ride.reviewed";
  data: Ride;
}

export interface VanEvent extends SSEEvent {
  type: "van.updated" | "van.online" | "van.offline";
  data: Van;
}

export interface TransferEvent extends SSEEvent {
  type: "van.transfer.requested" | "van.transfer.accepted" | "van.transfer.declined";
  data: VanTransfer;
}

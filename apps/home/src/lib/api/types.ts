/**
 * API Types for Home Dashboard
 */

// Account / Profile
export interface Account {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  rank?: string;
  unit?: string;
  createdAt: string;
  updatedAt: string;
}

// Tenant / Organization
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  features: Record<string, boolean>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Membership
export type MemberRole = "EXECUTIVE" | "ADMIN" | "DISPATCHER" | "TC" | "DRIVER" | "SAFETY" | "RIDER";

export interface Membership {
  id: string;
  accountId: string;
  tenantId: string;
  role: MemberRole;
  overrideRole?: MemberRole;
  active: boolean;
  account?: Account;
  tenant?: Tenant;
  createdAt: string;
  updatedAt: string;
}

// Page
export interface Page {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  content?: unknown;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Van
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
  createdAt: string;
  updatedAt: string;
}

// Ride
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
}

// Analytics
export interface AnalyticsSummary {
  totalRides: number;
  activeRides: number;
  completedRides: number;
  cancelledRides: number;
  totalDrivers: number;
  onlineDrivers: number;
  totalVolunteers: number;
  totalVans: number;
  availableVans: number;
  avgWaitTime?: number;
  avgRating?: number;
}

export interface RidesByDay {
  date: string;
  count: number;
  completed: number;
  cancelled: number;
}

// Shift
export type ShiftRole = "DRIVER" | "TC" | "DISPATCHER" | "SAFETY";

export interface Shift {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  role: ShiftRole;
  startTime: string;
  endTime: string;
  slotsNeeded: number;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  signups?: ShiftSignup[];
}

export interface ShiftSignup {
  id: string;
  shiftId: string;
  membershipId: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  membership?: Membership;
}

// Training
export type TrainingCategory = "ORIENTATION" | "SAFETY" | "DRIVER" | "TC" | "DISPATCHER";

export interface TrainingModule {
  id: string;
  tenantId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TrainingCompletion {
  id: string;
  moduleId: string;
  membershipId: string;
  videoWatched: boolean;
  quizPassed: boolean;
  quizScore?: number;
  completedAt?: string;
}

// Support Code
export type SupportCodeType = "ROLE_ELEVATION" | "STAFF_ACCESS" | "INVITE";

export interface SupportCode {
  id: string;
  tenantId: string;
  code: string;
  type: SupportCodeType;
  grantedRole?: string;
  expiresAt: string;
  maxUses?: number;
  usedCount: number;
  active: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// API Response wrappers
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  take: number;
  skip: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export type UserRole = 'PASSENGER' | 'ADMIN';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  loyaltyPoints: number;
}

export type AcType = 'AC' | 'NON_AC';
export type SeatCategory = 'SEATER' | 'SLEEPER' | 'SEATER_SLEEPER';
export type BusStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED';

export interface Bus {
  id: number;
  routeId: number | null;
  busName: string;
  registrationNumber: string;
  originDistrict: string;
  destinationDistrict: string;
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  acType: AcType;
  seatCategory: SeatCategory;
  totalSeats: number;
  availableSeats: number;
  fare: number;
  rating: number;
  status: BusStatus;
}

export interface RouteItem {
  id: number;
  originDistrict: string;
  destinationDistrict: string;
  distanceKm: number;
  estimatedDuration: string;
  baseFare: number;
  active: boolean;
  scheduleCount?: number;
}

export type SeatDeck = 'LOWER' | 'UPPER';
export type SeatType = 'SEATER' | 'SLEEPER';
export type SeatStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export interface Seat {
  id: number;
  busId: number;
  seatNumber: string;
  deck: SeatDeck;
  seatType: SeatType;
  status: SeatStatus;
  price: number;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface PassengerDetailInput {
  seatId: number;
  seatNumber: string;
  passengerName: string;
  age: number | '';
  gender: Gender;
  contactPhone: string;
}

export type PaymentMethod = 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING';

export interface PaymentInfo {
  transactionReference: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  gatewayNote: string;
  paidAt: string;
}

export interface RefundPolicyPreview {
  refundPercentage: number;
  refundAmount: number;
  policyLabel: string;
}

export interface CancellationSummary {
  id: number;
  refundAmount: number;
  refundStatus: string;
  cancellationStatus: string;
  cancelledAt: string;
  reason: string;
}

export interface Booking {
  id: number;
  bookingReference: string;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  busId: number;
  busName: string;
  registrationNumber: string;
  originDistrict: string;
  destinationDistrict: string;
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  acType: AcType;
  seatCategory: SeatCategory;
  totalFare: number;
  passengerCount: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  bookingDate: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  refundPolicy: RefundPolicyPreview;
  payment: PaymentInfo | null;
  cancellation: CancellationSummary | null;
  passengers: Array<{
    id: number;
    seatId: number;
    seatNumber: string;
    passengerName: string;
    age: number;
    gender: Gender;
    contactPhone: string;
  }>;
}

export interface CancellationHistoryItem {
  id: number;
  bookingId: number;
  userId: number;
  bookingReference: string;
  busName: string;
  registrationNumber: string;
  originDistrict: string;
  destinationDistrict: string;
  journeyDate: string;
  passengerCount: number;
  totalFare: number;
  reason: string;
  refundAmount: number;
  refundStatus: string;
  cancellationStatus: string;
  cancelledAt: string;
}

export interface AdminStats {
  totalBuses: number;
  totalRoutes: number;
  totalPassengers: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
  routeRevenue: Array<{
    routeLabel: string;
    bookingCount: number;
    revenue: number;
  }>;
}

export interface AdminPassengerSummary {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  totalBookings: number;
  totalSpent: number;
  createdAt: string;
}

export interface AdminBookingRow {
  id: number;
  bookingReference: string;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  busId: number;
  busName: string;
  registrationNumber: string;
  originDistrict: string;
  destinationDistrict: string;
  journeyDate: string;
  departureTime: string;
  totalFare: number;
  passengerCount: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  bookingDate: string;
  transactionReference?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: string;
  refundAmount?: number;
  cancellationReason?: string;
}

export interface SearchParamsState {
  origin: string;
  destination: string;
  date: string;
  acType: 'ALL' | AcType;
  seatCategory: 'ALL' | SeatCategory;
}

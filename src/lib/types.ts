
import type { Timestamp } from 'firebase/firestore';

// Main User Roles
export type UserRole = 'administrateur' | 'escorte' | 'client' | 'partenaire' | 'founder' | 'moderator';

// Partner Types
export type PartnerType = 'establishment' | 'producer';

// User status
export type UserStatus = 'active' | 'suspended' | 'pending';
export type OnlineStatus = 'online' | 'offline';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type VerificationType = 'selfie' | 'complete';

// Moderation Status for content
export type ModerationStatus = 'approved' | 'pending_review' | 'rejected';


// --- Subscription ---
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number; // monthly
  description: string;
  isActive: boolean;
  discounts?: {
    quarterly?: number; // 3 months
    semiAnnual?: number; // 6 months
    annual?: number; // 12 months
  }
}

export interface SubscriptionSettings {
  enabled: boolean;
  tiers: {
    [tierId: string]: SubscriptionTier;
  }
}

export type PlatformSubscriptionType = 'gratuit' | 'essential' | 'advanced' | 'premium' | 'elite';

export interface UserSubscription {
    type: PlatformSubscriptionType;
    status: "active" | "inactive" | "cancelled";
    startDate: Timestamp;
    endDate: Timestamp;
}
// --------------------

// --- Post ---
export type PostType = 'text' | 'image' | 'video' | 'audio' | 'poll';

export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorImage: string;
    content: string;
    type: PostType;
    mediaUrl?: string; // For image, video, audio
    pollOptions?: { text: string; votes: number }[];
    likes: string[]; // Array of userIds
    commentsCount: number;
    createdAt: Timestamp;
    moderationStatus: ModerationStatus;
    moderationReason?: string;
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorImage: string;
    content: string;
    createdAt: Timestamp;
}
// ------------

// Pricing settings
export interface EstablishmentPricing {
  basePricePerHour: number;
  roomTypes: {
    standard: { supplement: 0; enabled: true };
    comfort: { supplement: number; enabled: boolean };
    luxe: { supplement: number; enabled: boolean };
  };
}

export interface CreatorRates {
    videoCallPerMinute?: number;
    voiceCallPerMinute?: number;
    escortPerHour?: number;
    escortOvernight?: number;
}

export interface BankDetails {
  accountType: 'bank' | 'mobile_money';
  accountNumber: string;
  bankCode: string; // Bank code for bank, network for mobile money
  accountName?: string;
  country?: string; // ISO 3166-1 alpha-2 code
}


// Base User structure
export interface User {
  id: string; // Corresponds to Firebase Auth UID
  displayName: string;
  fullName?: string;
  email: string;
  phone?: string;
  pseudo?: string;
  role: UserRole;
  partnerType?: PartnerType;
  status: UserStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  rewardPoints: number;
  referralCode: string;
  referredBy?: string;
  referralsCount: number;
  profileImage?: string;
  bannerImage?: string;
  bio?: string;
  isVerified: boolean;
  onlineStatus: OnlineStatus;
  lastLogin?: Timestamp;
  favorites?: string[]; // Array of creator UIDs
  location?: string;
  galleryImages?: string[];
  dateOfBirth?: string;
  country?: string;
  city?: string;
  gender?: string;
  verificationStatus?: VerificationStatus;
  verificationType?: VerificationType;
  subscriptionSettings?: SubscriptionSettings; // For creators
  subscription?: UserSubscription; // For platform-level subscriptions
  establishmentSettings?: { // For establishment partners
    pricing: EstablishmentPricing;
  };
  // Rates for creators
  rates?: CreatorRates;
  // Quotas for clients
  dailyVoiceCallQuota?: {
    minutesUsed: number;
    lastReset: Timestamp;
  };
  unlockedContacts?: string[]; // Array of seller UIDs for which contact has been purchased
  creatorSubscriptions?: { // For members subscribing to creators
    [creatorId: string]: {
      tierId: string;
      tierName: string;
      status: SubscriptionStatus;
      startDate: Timestamp;
      endDate: Timestamp;
    }
  };
  hasMadeFirstDeposit?: boolean;
  bankDetails?: BankDetails;
}

// Wallet
export interface Wallet {
  id: string; // Same as user UID
  balance: number;
  currency: 'XOF' | 'EUR' | 'USD';
  totalEarned: number;
  totalSpent: number;
  status: 'active';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Transaction (subcollection of Wallet)
export type TransactionType = 'deposit' | 'withdrawal' | 'reward' | 'purchase' | 'credit' | 'debit' | 'call_fee' | 'platform_fee' | 'commission' | 'points_conversion' | 'subscription_fee' | 'contact_pass' | 'article_purchase' | 'live_ticket';

export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface Transaction {
  id: string;
  path: string;
  userId?: string;
  amount: number;
  type: TransactionType;
  createdAt: Timestamp;
  description: string;
  status: TransactionStatus;
  reference: string;
}

// Service (Annonce)
export type ServiceStatus = 'active' | 'hidden';

export interface Annonce {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageHint?: string;
  createdBy: string; // UID of creator
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: ServiceStatus;
  location: string;
  rating: number;
  ratingCount?: number;
  views: number;
  isSponsored?: boolean;
  sponsorshipExpiresAt?: Timestamp;
  availableNowUntil?: Timestamp;
  moderationStatus: ModerationStatus;
  moderationReason?: string;
}

// Review (subcollection of Annonce)
export interface Review {
  id: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

// Reservation
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type ConfirmationStatus = 'pending' | 'confirmed' | 'declined';

export interface EscortConfirmation {
  status: ConfirmationStatus;
  confirmedAt?: Timestamp;
  presenceConfirmed?: boolean;
  presenceConfirmedAt?: Timestamp;
}

export interface Reservation {
    id: string;
    memberId: string; // Client making the reservation
    creatorId: string; // Creator providing the service (escort or establishment)
    annonceId: string;
    annonceTitle: string;
    amount: number;
    fee?: number;
    status: ReservationStatus;
    createdAt: Timestamp;
    reservationDate: Timestamp; // The date for which the service is booked
    durationHours?: number | null; // Duration of the stay/service in hours
    location?: string;
    notes?: string;
    
    // For establishment reservations
    escorts?: { id: string; name: string, profileImage?: string, rate: number }[];
    establishmentConfirmed?: boolean;
    establishmentConfirmedAt?: Timestamp;

    escortConfirmations: {
      [escortId: string]: EscortConfirmation;
    };
    // On-site presence confirmation
    memberPresenceConfirmed: boolean;
    establishmentPresenceConfirmed: boolean; // Final confirmation by establishment for their bookings
}

// Purchase
export type PurchaseContentType = 'product' | 'article' | 'live_ticket';
export type PurchaseStatus = 'completed' | 'refunded';

export interface Purchase {
  id: string;
  memberId: string;
  sellerId: string;
  contentId: string;
  contentType: PurchaseContentType;
  contentTitle: string;
  amount: number;
  status: PurchaseStatus;
  createdAt: Timestamp;
}


// Message
export type MessageType = 'text' | 'image' | 'audio';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  type: MessageType;
  createdAt: Timestamp;
  isRead: boolean;
}

// Call (for WebRTC signaling)
export type CallStatus = 'pending' | 'ongoing' | 'ended' | 'missed' | 'declined';
export type CallType = 'video' | 'voice';

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  callerName: string;
  type: CallType;
  offer?: Record<string, unknown>;
  answer?: Record<string, unknown>;
  status: CallStatus;
  createdAt: Timestamp;
  // Billing fields
  pricePerMinute?: number;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  billedDuration?: number; // in seconds
  isFreeCall?: boolean;
}

// Live Session
export type LiveStatus = 'live' | 'ended' | 'scheduled';
export type LiveType = 'ai' | 'creator';


export interface LiveSession {
    id: string;
    hostId: string;
    title: string;
    description: string;
    streamUrl?: string;
    isPublic: boolean;
    startTime: Timestamp;
    endTime?: Timestamp;
    viewersCount: number;
    likes: number;
    status: LiveStatus;
    liveType: LiveType;
    imageUrl: string;
    imageHint?: string;
    creatorName?: string;
    ticketPrice?: number;
    moderationStatus: ModerationStatus;
    moderationReason?: string;
}

// Reward
export type RewardType = 'goal' | 'referral' | 'sale';

export interface Reward {
    id: string;
    userId: string;
    type: RewardType;
    points: number;
    description: string;
    createdAt: Timestamp;
}

// Referral
export interface Referral {
    id: string;
    referrerId: string;
    referredUserId: string;
    date: Timestamp;
    rewardPoints: number;
}

// Support Ticket
export type SupportTicketStatus = 'open' | 'resolved' | 'closed';

export interface SupportTicket {
    id: string;
    userId: string;
    subject: string;
    message: string;
    status: SupportTicketStatus;
    createdAt: Timestamp;
    adminResponse?: string;
}

// Global Settings
export interface Settings {
    id: 'global';
    appName?: string;
    version?: string;
    maintenanceMode?: boolean;
    supportEmail?: string;
    contactNumber?: string;
    privacyPolicyUrl?: string;
    termsUrl?: string;
    callRates?: {
        voicePerMinute: number;
        videoToProducerPerMinute: number;
    };
    passContact?: {
        price: number;
    };
    platformCommissionRate?: number;
    platformFee?: number; // Fixed service fee for bookings
    rewardPointsConversionRate?: number; // e.g., 100 points = 1 EUR
    withdrawalMinAmount?: number;
    withdrawalMaxAmount?: number;
    welcomeBonusAmount?: number;
}

// AI Assistant Log
export interface AIAssistant {
    id: string;
    userId: string;
    prompt: string;
    response: string;
    createdAt: Timestamp;
}


// --- Compatibility Types for existing components ---
export type ProductType = 'digital' | 'physique';

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    imageHint?: string;
    createdBy: string; // creator or partner UID
    createdAt: Timestamp;
    productType: ProductType;
    isSponsored?: boolean;
    sponsorshipExpiresAt?: Timestamp;
    moderationStatus: ModerationStatus;
    moderationReason?: string;
    isCollaborative?: boolean;
    revenueShares?: {
        userId: string;
        displayName: string;
        percentage: number;
    }[];
}

export interface BlogArticle {
    id: string;
    title: string;
    content: string;
    imageUrl: string;
    imageHint?: string;
    date: Timestamp;
    updatedAt?: Timestamp;
    authorId: string;
    authorName?: string;
    isPremium?: boolean;
    price?: number;
    moderationStatus: ModerationStatus;
    moderationReason?: string;
}


export type CreatorStats = {
    monthlyRevenue?: { value: number; change: number };
    newSubscribers?: { value: number; change: number };
    profileViews?: { value: number; change: number };
    engagementRate?: { value: number; change: number };
    rewardPoints?: { value: number; change: number };
}

export type MonthlyRevenue = {
    month: string;
    revenue: number;
}

export interface PartnerRequest {
    id: string;
    type: PartnerType;
    companyName: string;
    registerNumber?: string;
    country?: string;
    city?: string;
    address?: string;
    companyEmail: string;
    phone: string;
    website?: string;
    description?: string;
    managerName?: string;
    managerEmail?: string;
    managerPhone?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string | null;
    createdAt: Timestamp;
}

// API Payloads
export type ContentType = 'service' | 'product';

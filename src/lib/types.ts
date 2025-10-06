
import type { Timestamp } from 'firebase/firestore';

// Main User Roles
export type UserRole = 'administrateur' | 'escorte' | 'client' | 'partenaire';

// User status
export type UserStatus = 'active' | 'suspended';
export type OnlineStatus = 'online' | 'offline';

// Base User structure
export interface User {
  id: string; // Corresponds to Firebase Auth UID
  displayName: string;
  email: string;
  phone?: string;
  pseudo?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  rewardPoints: number;
  referralCode: string;
  referredBy?: string;
  referralsCount: number;
  profileImage?: string;
  bio?: string;
  isVerified: boolean;
  onlineStatus: OnlineStatus;
  lastLogin: Timestamp;
  // Compatibility fields
  avatar?: string;
}

// Wallet
export interface Wallet {
  id: string; // Same as user UID
  balance: number;
  currency: 'XOF';
  totalEarned: number;
  totalSpent: number;
  status: 'active';
}

// Transaction (subcollection of Wallet)
export type TransactionType = 'deposit' | 'withdrawal' | 'reward' | 'purchase' | 'credit' | 'debit' | 'withdraw';

export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface Transaction {
  id: string;
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
  views: number;
}

// Message
export type MessageType = 'text' | 'image' | 'audio';
export type CallType = 'none' | 'voice' | 'video';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  type: MessageType;
  createdAt: Timestamp;
  isRead: boolean;
  callType: CallType;
}

// Call (for WebRTC signaling)
export type CallStatus = 'ongoing' | 'ended' | 'missed';

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  type: 'voice' | 'video';
  offer: Record<string, unknown>;
  answer: Record<string, unknown>;
  status: CallStatus;
  timestamp: Timestamp;
}

// Live Session
export type LiveStatus = 'ongoing' | 'ended';

export interface LiveSession {
    id: string;
    hostId: string;
    title: string;
    description: string;
    streamUrl: string;
    isPublic: boolean;
    startTime: Timestamp;
    endTime: Timestamp;
    viewersCount: number;
    likes: number;
    status: LiveStatus;
    imageUrl: string;
    imageHint: string;
    creatorName: string;
    price_per_minute: number;
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
    appName: string;
    version: string;
    maintenanceMode: boolean;
    supportEmail: string;
    contactNumber: string;
    privacyPolicyUrl: string;
    termsUrl: string;
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

export type Product = { id: string, name: string, imageUrl: string, imageHint: string, title: string, description: string, price: number };
export type BlogArticle = { id: string, title: string, content: string, imageUrl: string, imageHint: string, date: string };
export type Creator = User & { imageUrl: string; imageHint: string; name: string };


export type CreatorStats = {
    id: string;
    monthlyRevenue: { value: number; change: number };
    newSubscribers: { value: number; change: number };
    profileViews: { value: number; change: number };
    engagementRate: { value: number; change: number };
}

export type MonthlyRevenue = {
    month: string;
    revenue: number;
}

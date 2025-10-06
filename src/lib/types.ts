import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'creator' | 'member' | 'partner';

export interface User {
  id: string; // Corresponds to Firebase Auth UID
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'suspended';
  avatarUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  bio?: string;
  language: string;
  walletBalance: number;
  verified: boolean;
  referralCode: string;
  referredBy?: string;
  rewardPoints: number;
  totalVideoCalls: number;
  totalPremiumSales: number;
  totalReferredUsers: number;
}

export interface Annonce {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  tags: string[];
  location: string;
  duration: string;
  images: string[];
  imageHints?: string[];
  status: 'active' | 'pending' | 'archived';
  rating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  imageUrl?: string; // for carousels
  imageHint?: string; // for carousels
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  name?: string; // for compatibility with existing components
  description: string;
  price: number;
  currency: string;
  stock: number;
  images: string[];
  imageHints?: string[];
  type: 'digital' | 'physical';
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  imageUrl?: string; // for carousels
  imageHint?: string; // for carousels
}

export interface Reward {
  id: string;
  userId: string;
  type: 'video_call' | 'premium_sale' | 'goal_reached';
  pointsAwarded: number;
  description: string;
  createdAt: Timestamp;
  status: 'granted' | 'pending';
}

export interface Referral {
    id: string;
    referrerId: string;
    referredId: string;
    bonusGiven: boolean;
    createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'purchase' | 'subscription';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  createdAt: Timestamp;
  description?: string; // Keep for compatibility if needed
  date?: string; // Keep for compatibility if needed
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'video';
  read: boolean;
  createdAt: Timestamp;
}

export interface Wallet {
  id: string; // same as userId
  balance: number;
  transactions: string[]; // array of transaction IDs
  updatedAt: Timestamp;
}

export interface Analytics {
    id: string;
    userId: string;
    views: number;
    clicks: number;
    earnings: number;
    engagementScore: number;
    updatedAt: Timestamp;
}


// These are kept for compatibility with existing components
// They can be removed once components are updated
export type Creator = {
  id: string;
  name: string;
  bio: string;
  imageUrl: string;
  imageHint: string;
}

export type Service = {
    id: string;
    title: string;
    description: string;
    price?: number;
    imageUrl: string;
    imageHint: string;
}

export type BlogArticle = {
    id: string;
    title: string;
    content: string;
    imageUrl: string;
    imageHint: string;
    date: string;
}

export type LiveSession = {
    id: string;
    title: string;
    price_per_minute: number;
    status: 'scheduled' | 'live' | 'ended';
    imageUrl: string;
    imageHint: string;
    creatorName: string;
    creatorId: string;
}

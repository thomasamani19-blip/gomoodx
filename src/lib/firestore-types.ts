import type { Timestamp } from 'firebase/firestore';

export type UserRole = "admin" | "creator" | "member" | "partner";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: "active" | "suspended";
  verified: boolean;
  premium: boolean;
  walletBalance: number;
  about: string;
  gender?: string;
  country?: string;
  city?: string;
  avatarUrl?: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  sponsorship?: "none" | "active";
}

export interface Service {
  serviceId: string;
  creatorId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  duration: number; // in minutes
  images: string[];
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Product {
  productId: string;
  creatorId: string; // Can be creator or partner
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
  createdAt: Timestamp;
}

export interface LiveSession {
  sessionId: string;
  creatorId: string;
  title: string;
  description: string;
  pricePerMinute: number;
  isLive: boolean;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  thumbnailUrl?: string;
}

export interface BlogArticle {
  articleId: string;
  authorId: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  tags: string[];
  createdAt: Timestamp;
  isPremium: boolean;
}

export interface WalletTransaction {
    transactionId: string;
    type: "credit" | "debit";
    amount: number;
    source: string; // e.g., "flutterwave", "kkiapay", "service_purchase"
    description: string;
    timestamp: Timestamp;
}

export interface Message {
    messageId: string;
    fromId: string;
    toId: string;
    content: string;
    type: "text" | "image" | "video" | "voice";
    createdAt: Timestamp;
    read: boolean;
}

export interface Partner {
    partnerId: string;
    name: string;
    type: "hotel" | "club" | "studio" | "producer";
    email: string;
    city: string;
    country: string;
    description: string;
    rating: number;
    verified: boolean;
    createdAt: Timestamp;
}

export interface AITask {
    taskId: string;
    userId: string;
    type: "bio" | "article" | "image" | "audio" | "video";
    input: any;
    output?: any;
    status: "pending" | "processing" | "done" | "failed";
    createdAt: Timestamp;
    outputUrl?: string; // Link to file in Storage
}

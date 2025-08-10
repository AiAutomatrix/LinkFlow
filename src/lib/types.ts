import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  photoURL: string;
  plan: 'free' | 'pro';
  theme?: string;
  animatedBackground?: boolean;
  socialLinks?: {
    email?: string;
    instagram?: string;
    facebook?: string;
    github?: string;
  };
  // Allow string for serialized data from server components
  createdAt: Timestamp | string; 
}

export interface Link {
  id: string;
  title: string;
  url: string;
  order: number;
  active: boolean;
  clicks: number;
  // Allow string for serialized data from server components
  createdAt?: Timestamp | Date | string;
  startDate?: Timestamp | Date | string;
  endDate?: Timestamp | Date | string;
}


import type { FieldValue, Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  photoURL: string;
  plan: 'free' | 'pro';
  theme: string;
  animatedBackground: boolean;
  bot: {
    embedScript: string;
  };
  createdAt: Timestamp | FieldValue; 
}

export interface Link {
  id: string;
  title: string;
  url: string;
  order: number;
  active: boolean;
  clicks: number;
  isSocial: boolean;
  isSupport?: boolean;
  createdAt?: Timestamp | Date | string;
  startDate?: Timestamp | Date | string;
  endDate?: Timestamp | Date | string;
}

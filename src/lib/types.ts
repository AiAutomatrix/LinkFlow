import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  photoURL: string;
  plan: 'free' | 'pro';
  createdAt: Timestamp;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  order: number;
  active: boolean;
  clicks: number;
  startDate?: Timestamp;
  endDate?: Timestamp;
}

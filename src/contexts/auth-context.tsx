
"use client";

import { createContext, useContext, Dispatch, SetStateAction } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfilePhoto: (uid: string, photoURL: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  signInWithEmail: async () => { throw new Error('signInWithEmail must be used within an AuthProvider'); },
  signInWithGoogle: async () => { throw new Error('signInWithGoogle must be used within an AuthProvider'); },
  signUpWithEmail: async () => { throw new Error('signUpWithEmail must be used within an AuthProvider'); },
  signOut: async () => { throw new Error('signOut must be used within an AuthProvider'); },
  updateUserProfilePhoto: async () => { throw new Error('updateUserProfilePhoto must be used within an AuthProvider'); },
});

export const useAuth = () => useContext(AuthContext);

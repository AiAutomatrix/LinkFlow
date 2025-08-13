
"use client";

import { createContext, useContext, Dispatch, SetStateAction } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  setUser: Dispatch<SetStateAction<UserProfile | null>>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  uploadProfilePicture: (userId: string, file: File) => Promise<string>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  firebaseUser: null,
  loading: true,
  setUser: () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  uploadProfilePicture: async () => '',
});

export const useAuth = () => useContext(AuthContext);


"use client";

import { createContext, useContext, Dispatch, SetStateAction } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null; // Alias for user for component convenience
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  setUser: Dispatch<SetStateAction<UserProfile | null>>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  uploadProfilePicture: (userId: string, file: File) => Promise<string>;
}

// The default values are placeholders and will be replaced by the AuthProvider.
export const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  firebaseUser: null,
  loading: true,
  setUser: () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  uploadProfilePicture: async () => '',
});

export const useAuth = () => useContext(AuthContext);

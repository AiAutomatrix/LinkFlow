"use client";

import { createContext, useContext, Dispatch, SetStateAction } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  setUser: Dispatch<SetStateAction<UserProfile | null>>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);
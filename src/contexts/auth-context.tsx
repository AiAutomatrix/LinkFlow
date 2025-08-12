
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getOrCreateUserProfile } from '@/lib/auth';
import type { UserProfile } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import LoadingScreen from '@/app/loading';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start as true
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthProvider: onAuthStateChanged event fired.");
      if (firebaseUser) {
        console.log("AuthProvider: User is signed in with UID:", firebaseUser.uid);
        // Fetch profile only if it's not already the current user's profile
        if (userProfile?.uid !== firebaseUser.uid) {
            const profile = await getOrCreateUserProfile(firebaseUser);
            console.log("AuthProvider: User profile fetched/created:", profile.username);
            setUser(firebaseUser);
            setUserProfile(profile);
        }
      } else {
        console.log("AuthProvider: User is signed out.");
        setUser(null);
        setUserProfile(null);
      }
      // Finished initial auth check, set loading to false.
      setLoading(false);
    });

    return () => {
      console.log("AuthProvider: Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isDashboardPage = pathname.startsWith('/dashboard');

    if (user) {
      // If user is logged in and tries to access login/signup, redirect to dashboard
      if (isAuthPage) {
        console.log("AuthProvider: User is logged in, redirecting from auth page to dashboard.");
        router.replace('/dashboard');
      }
    } else {
      // If user is not logged in and tries to access a dashboard page, redirect to login
      if (isDashboardPage) {
        console.log("AuthProvider: User is not logged in, redirecting from dashboard to login.");
        router.replace('/login');
      }
    }
    
  }, [user, loading, pathname, router]);

  if (loading) {
     return <LoadingScreen />;
  }
  
  const value = {
    user,
    userProfile,
    loading,
    isLoggedIn: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

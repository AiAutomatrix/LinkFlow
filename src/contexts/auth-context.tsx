
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
      setLoading(true); // Set loading to true whenever auth state might be changing
      if (firebaseUser) {
        // Fetch profile and wait for it to complete
        const profile = await getOrCreateUserProfile(firebaseUser);
        setUser(firebaseUser);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      // Finished all auth checks and data fetching, set loading to false.
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Do not run routing logic until the initial loading is complete
    if (loading) return;

    const isLoggedIn = !!user;
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isDashboardPage = pathname.startsWith('/dashboard');

    if (isLoggedIn && isAuthPage) {
      router.replace('/dashboard');
    } else if (!isLoggedIn && isDashboardPage) {
      router.replace('/login');
    }
    
  }, [user, loading, pathname, router]);

  // While initial authentication is in progress, show a loading screen.
  // This prevents the app from rendering in a temporary, incorrect state.
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

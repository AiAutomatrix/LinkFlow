
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getOrCreateUserProfile } from '@/lib/auth';
import type { UserProfile } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function LoadingScreen() {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading…
      </div>
    );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // This function will handle all authentication logic
    const handleAuth = async () => {
      setLoading(true);
      
      try {
        // First, check for a redirect result from Google
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const profile = await getOrCreateUserProfile(result.user);
          setUser(result.user);
          setUserProfile(profile);
          setLoading(false);
          // The user has just logged in, so we can stop here.
          // The navigation logic below will handle redirecting them.
          return;
        }
      } catch (error) {
        console.error("Error processing redirect result:", error);
      }
      
      // If no redirect, set up the normal auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // If a user is found, ensure we have their profile
          const profile = await getOrCreateUserProfile(firebaseUser);
          setUser(firebaseUser);
          setUserProfile(profile);
        } else {
          // No user is logged in
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    handleAuth();
  }, [mounted]);

  useEffect(() => {
    if (loading || !mounted) return;

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isPublicProfile = pathname.startsWith('/u/');
    
    if (user && userProfile) {
        // If user is logged in, redirect away from auth pages
        if (isAuthPage) {
            router.replace('/dashboard');
        }
    } else if (!user && !isAuthPage && !isPublicProfile && pathname !== '/') {
        // If user is not logged in and not on a public page, redirect to login
        router.replace('/login');
    }
  }, [user, userProfile, loading, pathname, router, mounted]);

  // While the initial mount or auth state is resolving, show a loading screen.
  if (loading || !mounted) {
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


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
    // This effect runs once on component mount to signal that
    // the client has loaded and we can now safely perform checks.
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // This function will handle all authentication logic
    const handleAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          // User has just signed in via redirect.
          // The onAuthStateChanged listener below will handle them.
          // We can set loading to true to show loading screen while profile is fetched.
          setLoading(true);
        }
      } catch (error) {
        console.error("Error processing redirect result:", error);
      }
      
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const profile = await getOrCreateUserProfile(firebaseUser);
          setUser(firebaseUser);
          setUserProfile(profile);
        } else {
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
        if (isAuthPage) {
            router.replace('/dashboard');
        }
    } else if (!isAuthPage && !isPublicProfile && pathname !== '/') {
        router.replace('/login');
    }
  }, [user, userProfile, loading, pathname, router, mounted]);

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

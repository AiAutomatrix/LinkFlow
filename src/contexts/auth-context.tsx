
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
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
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
        </div>
      </div>
    );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start as true
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("AuthProvider: Subscribing to onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthProvider: onAuthStateChanged event fired.");
      if (firebaseUser) {
        console.log("AuthProvider: User is signed in, UID:", firebaseUser.uid);
        try {
          const profile = await getOrCreateUserProfile(firebaseUser);
          console.log("AuthProvider: User profile fetched/created:", profile.username);
          setUser(firebaseUser);
          setUserProfile(profile);
        } catch (error) {
            console.error("AuthProvider: Error getting user profile:", error);
            setUser(null);
            setUserProfile(null);
        } finally {
            console.log("AuthProvider: Finished auth flow, setting loading to false.");
            setLoading(false);
        }
      } else {
        console.log("AuthProvider: No user is signed in.");
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      console.log("AuthProvider: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    }
  }, []);

  useEffect(() => {
    // This effect now ONLY runs when loading is finished.
    if (loading) return;
    
    console.log("AuthProvider: Auth state loaded. Running routing logic.");
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isPublicPage = pathname.startsWith('/u/') || pathname === '/';
    
    // If we have a user and they are on an auth page, redirect them.
    if (user) { // user is sufficient here since userProfile loading is handled above.
        if (isAuthPage) {
            console.log("AuthProvider: User is on auth page, redirecting to /dashboard.");
            router.replace('/dashboard');
        }
    } else { // If we don't have a user...
        // and they are on a protected page, redirect them to login.
        if (!isAuthPage && !isPublicPage) {
            console.log("AuthProvider: User not logged in and on protected page, redirecting to /login.");
            router.replace('/login');
        }
    }
    
  }, [user, loading, pathname, router]);

  // While loading is true, we show a full screen loader.
  // This prevents any rendering of the app until we have a definitive auth state.
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


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
    // This effect runs once on mount to handle the redirect result.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("AuthProvider: Handled redirect result. User:", result.user.displayName);
          // The onAuthStateChanged listener below will handle the profile creation
          // and state updates. This just confirms the redirect was processed.
        }
      })
      .catch((error) => {
        console.error("AuthProvider: Error from getRedirectResult:", error);
      });
      
    console.log("AuthProvider: Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthProvider: onAuthStateChanged event fired.");
      if (firebaseUser) {
        console.log("AuthProvider: User is signed in with UID:", firebaseUser.uid);
        try {
          // Check if profile is already loaded to avoid redundant fetches
          if (userProfile?.uid !== firebaseUser.uid) {
            const profile = await getOrCreateUserProfile(firebaseUser);
            console.log("AuthProvider: User profile fetched/created:", profile.username);
            setUser(firebaseUser);
            setUserProfile(profile);
          }
        } catch (error) {
            console.error("AuthProvider: Error getting user profile:", error);
            setUser(null);
            setUserProfile(null);
        } finally {
            console.log("AuthProvider: Loading state set to false (user is present).");
            setLoading(false);
        }
      } else {
        console.log("AuthProvider: User is signed out.");
        setUser(null);
        setUserProfile(null);
        console.log("AuthProvider: Loading state set to false (no user).");
        setLoading(false);
      }
    });

    return () => {
      console.log("AuthProvider: Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    }
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

  // While loading is true, show a loader to prevent UI flashes or incorrect redirects.
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

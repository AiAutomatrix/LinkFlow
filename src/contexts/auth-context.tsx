
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
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("[AuthProvider] Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[onAuthStateChanged] Listener triggered.");
      if (firebaseUser) {
        console.log(`[onAuthStateChanged] User detected: ${firebaseUser.uid}, email: ${firebaseUser.email}`);
        // User is signed in.
        try {
          console.log("[onAuthStateChanged] Fetching or creating user profile...");
          const profile = await getOrCreateUserProfile(firebaseUser);
          console.log("[onAuthStateChanged] Profile successfully fetched/created:", profile);
          setUser(firebaseUser);
          setUserProfile(profile);
        } catch (error) {
            console.error("[onAuthStateChanged] Error getting user profile:", error);
            // Handle error, maybe sign out the user
            setUser(null);
            setUserProfile(null);
        } finally {
            console.log("[onAuthStateChanged] Setting loading to false after user processing.");
            setLoading(false);
        }
      } else {
        // User is signed out.
        console.log("[onAuthStateChanged] No user detected. Clearing state.");
        setUser(null);
        setUserProfile(null);
        console.log("[onAuthStateChanged] Setting loading to false as no user is signed in.");
        setLoading(false);
      }
    });

    return () => {
        console.log("[AuthProvider] Cleaning up onAuthStateChanged listener.");
        unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (loading) {
        console.log("[RoutingEffect] Skipping, auth is loading.");
        return;
    };
    console.log(`[RoutingEffect] Running. Path: ${pathname}, User: ${!!user}, Profile: ${!!userProfile}`);

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isPublicPage = pathname.startsWith('/u/') || pathname === '/';
    
    if (user && userProfile) { // Ensure profile is also loaded
        if (isAuthPage) {
            console.log("[RoutingEffect] User is logged in and on an auth page, redirecting to /dashboard.");
            router.replace('/dashboard');
        }
    } else { // No user
        if (!isAuthPage && !isPublicPage) {
            console.log("[RoutingEffect] User is not logged in and on a protected page, redirecting to /login.");
            router.replace('/login');
        }
    }
    
  }, [user, userProfile, loading, pathname, router]);

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


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
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true); // To handle redirect checks
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This effect runs once on initial mount to check for a redirect result.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          // A user has just signed in via redirect.
          // The onAuthStateChanged listener below will handle setting the user state.
          // We just need to ensure we don't mark loading as false prematurely.
        }
      })
      .catch((error) => {
        console.error("Error processing redirect result:", error);
      })
      .finally(() => {
        // This indicates the redirect check is complete.
        setInitialLoad(false); 
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in. Fetch their profile.
        const profile = await getOrCreateUserProfile(firebaseUser);
        setUser(firebaseUser);
        setUserProfile(profile);
      } else {
        // User is signed out.
        setUser(null);
        setUserProfile(null);
      }
      // Defer setting loading to false until the initial redirect check is also done.
      if (!initialLoad) {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [initialLoad]); // Dependency on initialLoad ensures correct sequencing

  useEffect(() => {
    if (loading || initialLoad) return; // Don't run navigation logic until auth state is fully resolved.

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isPublicPage = pathname.startsWith('/u/') || pathname === '/';
    
    if (user && userProfile) { 
        // User is logged in.
        if (isAuthPage) {
            router.replace('/dashboard/links');
        }
    } else if (!isAuthPage && !isPublicPage) {
        // User is not logged in and is trying to access a protected page.
        router.replace('/login');
    }
  }, [user, userProfile, loading, initialLoad, pathname, router]);

  if (loading || initialLoad) {
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

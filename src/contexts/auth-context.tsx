
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
    // This effect runs once on mount to signal that the client is ready.
    // This is crucial for preventing hydration errors.
    setMounted(true);
  }, []);

  useEffect(() => {
    // This effect should only run once the component is mounted on the client.
    if (!mounted) return;

    // This handles the redirect result from Google Sign-In.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          // User signed in via redirect.
          // The onAuthStateChanged listener below will handle profile creation/fetching.
          // We set loading to true to show the loading screen while that happens.
          setLoading(true);
        }
      })
      .catch((error) => {
        console.error("Error processing redirect result:", error);
      })
      .finally(() => {
        // Now, set up the onAuthStateChanged listener.
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
      });

  }, [mounted]);

  useEffect(() => {
    // This effect handles navigation based on auth state.
    // It only runs when auth state is not loading and the component is mounted.
    if (loading || !mounted) return;

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isPublicProfile = pathname.startsWith('/u/');
    const isHomePage = pathname === '/';
    
    if (user && userProfile) { // User is logged in
        if (isAuthPage) {
            router.replace('/dashboard/links');
        }
    } else if (!isAuthPage && !isPublicProfile && !isHomePage) { // User is not logged in and not on a public page
        router.replace('/login');
    }
  }, [user, userProfile, loading, pathname, router, mounted]);

  // While the initial mount or auth state check is happening, show a loading screen.
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

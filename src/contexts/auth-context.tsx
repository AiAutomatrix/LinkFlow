
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthFlow = async () => {
      // Check for redirect result first
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // This means a user has just signed in via redirect.
          const firebaseUser = result.user;
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            // Create profile for new user
            const newProfile: Omit<UserProfile, 'createdAt'> & { createdAt: object } = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'New User',
              username: firebaseUser.uid.slice(0, 8),
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              bio: '',
              theme: 'light',
              animatedBackground: false,
              socialLinks: {},
              plan: 'free',
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile({ ...newProfile, createdAt: new Date().toISOString() } as UserProfile);
          }
          // The onAuthStateChanged listener below will handle setting the user state.
        }
      } catch (error) {
        console.error("Error processing redirect result:", error);
      }

      // Now, set up the regular auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserProfile(userSnap.data() as UserProfile);
          } else {
             // This case might happen if DB entry fails after auth success.
             // We can attempt to create it again.
            const newProfile: Omit<UserProfile, 'createdAt'> & { createdAt: object } = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'New User',
              username: firebaseUser.uid.slice(0, 8),
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              bio: '',
              theme: 'light',
              animatedBackground: false,
              socialLinks: {},
              plan: 'free',
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile({ ...newProfile, createdAt: new Date().toISOString() } as UserProfile);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribePromise = handleAuthFlow();

    // Cleanup subscription on unmount
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    isLoggedIn: !!user,
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
            <p className="text-lg font-semibold">Authenticating...</p>
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-10 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

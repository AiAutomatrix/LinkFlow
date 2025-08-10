
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';

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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleAuthFlow = async () => {
      setLoading(true);
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const firebaseUser = result.user;
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            const newProfileData: Omit<UserProfile, 'createdAt'> = {
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
            };
            await setDoc(userRef, { ...newProfileData, createdAt: serverTimestamp() });
            setUserProfile({ ...newProfileData, createdAt: new Date().toISOString() } as UserProfile);
          }
          setUser(firebaseUser);
          router.replace('/dashboard');
          setLoading(false);
          return; 
        }
      } catch (error) {
        console.error("Error processing redirect result:", error);
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserProfile(userSnap.data() as UserProfile);
          } else {
            console.log("User document doesn't exist, likely just signed up.");
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

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [router]);

  const value = {
    user,
    userProfile,
    loading,
    isLoggedIn: !!user,
  };
  
  if (loading) {
     return <div style={{ textAlign: "center", marginTop: "2rem", minHeight: "100vh", display:"flex", alignItems:"center",justifyContent:"center" }}>Loading…</div>;
  }

  // Route protection
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  if (!loading && !user && !isAuthPage) {
    router.replace('/login');
    return <div style={{ textAlign: "center", marginTop: "2rem", minHeight: "100vh", display:"flex", alignItems:"center",justifyContent:"center" }}>Redirecting to login...</div>;
  }

  if (!loading && user && isAuthPage) {
    router.replace('/dashboard');
    return <div style={{ textAlign: "center", marginTop: "2rem", minHeight: "100vh", display:"flex", alignItems:"center",justifyContent:"center" }}>Redirecting to dashboard...</div>;
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

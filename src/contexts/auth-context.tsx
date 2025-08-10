
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

function LoadingScreen() {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading…
      </div>
    );
}

async function createProfileForNewUser(user: User): Promise<UserProfile> {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        const username = (user.displayName?.replace(/\s+/g, '').toLowerCase() || 'user') + Math.random().toString(36).substring(2, 6);
        const newProfileData: Omit<UserProfile, 'createdAt'> = {
            uid: user.uid,
            displayName: user.displayName || 'New User',
            username: username,
            email: user.email || '',
            photoURL: user.photoURL || '',
            bio: '',
            theme: 'light',
            animatedBackground: false,
            socialLinks: {
              email: '',
              instagram: '',
              facebook: '',
              github: ''
            },
            plan: 'free',
        };
        await setDoc(userRef, { ...newProfileData, createdAt: serverTimestamp() });
        const userDoc = await getDoc(userRef);
        return userDoc.data() as UserProfile;
    }
    const data = userSnap.data();
    if (!data.socialLinks) {
        data.socialLinks = {};
    }
    return data as UserProfile;
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

    const processAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const profile = await createProfileForNewUser(result.user);
          setUser(result.user);
          setUserProfile(profile);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error processing redirect result:", error);
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          const profile = await createProfileForNewUser(firebaseUser);
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    processAuth();
  }, [mounted]);

  useEffect(() => {
    if (loading) return; 

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isPublicProfile = pathname.startsWith('/u/');

    if (user && userProfile) {
        if (isAuthPage) {
            router.replace('/dashboard/links');
        }
    } else if (!user && !isAuthPage && !isPublicProfile && pathname !== '/') {
        router.replace('/login');
    }
  }, [user, userProfile, loading, pathname, router]);

  if (!mounted || loading) {
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

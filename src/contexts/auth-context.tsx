
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

async function createProfileForNewUser(user: User): Promise<UserProfile> {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        const newProfileData: Omit<UserProfile, 'createdAt'> = {
            uid: user.uid,
            displayName: user.displayName || 'New User',
            username: (user.displayName?.replace(/\s+/g, '').toLowerCase() || 'user') + Math.random().toString(36).substring(2, 6),
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
        return { ...newProfileData, createdAt: new Date().toISOString() } as UserProfile;
    }
    const data = userSnap.data();
    // Ensure socialLinks is always an object
    if (!data.socialLinks) {
        data.socialLinks = {};
    }
    return data as UserProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleAuth = async () => {
        // First, check for redirect result
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                // User signed in or signed up via redirect.
                const firebaseUser = result.user;
                const profile = await createProfileForNewUser(firebaseUser);
                setUser(firebaseUser);
                setUserProfile(profile);
                setLoading(false);
                // Redirect handled in the second useEffect
                return; 
            }
        } catch (error) {
            console.error("Error processing redirect result:", error);
        }

        // If no redirect result, set up the normal auth state listener.
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userRef = doc(db, 'users', firebaseUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                     if (!data.socialLinks) {
                        data.socialLinks = {};
                    }
                    setUserProfile(data as UserProfile);
                } else {
                    // This can happen if the user exists in Auth but not Firestore.
                    // Let's create their profile.
                    const profile = await createProfileForNewUser(firebaseUser);
                    setUserProfile(profile);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    };
    
    handleAuth();

  }, []); // Run only once on mount


  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

    if (user && userProfile) {
        if (isAuthPage) {
            router.replace('/dashboard/links');
        }
    } else if (!user && !isAuthPage) {
        router.replace('/login');
    }
  }, [user, userProfile, loading, pathname, router]);

  if (loading) {
     return <div style={{ minHeight: "100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>Loading…</div>;
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

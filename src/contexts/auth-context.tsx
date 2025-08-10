
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
            username: (user.displayName?.split(' ')[0] || 'user') + Math.random().toString(36).substring(2, 6).toLowerCase(),
            email: user.email || '',
            photoURL: user.photoURL || '',
            bio: '',
            theme: 'light',
            animatedBackground: false,
            socialLinks: {},
            plan: 'free',
        };
        await setDoc(userRef, { ...newProfileData, createdAt: serverTimestamp() });
        return { ...newProfileData, createdAt: new Date().toISOString() } as UserProfile;
    }
    return userSnap.data() as UserProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    (async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                const firebaseUser = result.user;
                setUser(firebaseUser);
                const profile = await createProfileForNewUser(firebaseUser);
                setUserProfile(profile);
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error("Error processing redirect result:", error);
        }
        
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userRef = doc(db, 'users', firebaseUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserProfile(userSnap.data() as UserProfile);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });
    })();

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
}, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

    if (!user && !isAuthPage) {
        router.replace('/login');
    } else if (user && isAuthPage) {
        router.replace('/dashboard/links');
    }
  }, [user, loading, pathname, router]);


  if (loading) {
     return <div style={{ textAlign: "center", marginTop: "2rem", minHeight: "100vh", display:"flex", alignItems:"center",justifyContent:"center" }}>Loading…</div>;
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

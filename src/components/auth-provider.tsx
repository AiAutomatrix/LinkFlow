
"use client";

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const createProfileForNewUser = async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        return {
            uid: firebaseUser.uid,
            ...data,
            createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
        } as UserProfile;
    }

    const username = (firebaseUser.email?.split('@')[0] || `user_${Date.now()}`).replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 20);
    const usernameDocRef = doc(firestore, 'usernames', username);
    const existingUsernameSnap = await getDoc(usernameDocRef);
    const finalUsername = existingUsernameSnap.exists() ? `${username}_${Date.now()}` : username;

    const newUserProfileData = {
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "New User",
        photoURL: firebaseUser.photoURL || "",
        bio: "",
        username: finalUsername,
        plan: "free",
        theme: "light",
        animatedBackground: false,
        socialLinks: {
            email: "",
            instagram: "",
            facebook: "",
            github: "",
        },
        createdAt: serverTimestamp(),
    };

    const batch = writeBatch(firestore);
    batch.set(userDocRef, newUserProfileData);
    
    const newUsernameDoc = doc(firestore, "usernames", finalUsername);
    batch.set(newUsernameDoc, { uid: firebaseUser.uid });
    
    await batch.commit();

    return { 
        uid: firebaseUser.uid,
        ...newUserProfileData, 
        createdAt: new Date().toISOString()
    } as UserProfile;
};

const AuthProvider = ({ children }: { children: React.ReactNode; }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [authReady, setAuthReady] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let unsub: (() => void) | undefined;

        (async () => {
          setAuthReady(false);
          try {
            // 1) First, check redirect result
            const redirectResult = await getRedirectResult(auth);
            if (redirectResult?.user) {
              const profile = await createProfileForNewUser(redirectResult.user);
              setUser(profile);
              setFirebaseUser(redirectResult.user);
              setAuthReady(true);
              const target = `/dashboard`;
              router.replace(target);
              return; 
            }
          } catch (err) {
            console.warn("getRedirectResult error (non-fatal):", err);
          }
    
          // 2) If no redirect, set up regular auth listener
          unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                // To avoid race conditions, re-fetch profile here too
                const userDocRef = doc(firestore, 'users', fbUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    setUser({
                       uid: fbUser.uid,
                       ...data,
                       createdAt: data.createdAt instanceof Timestamp
                           ? data.createdAt.toDate().toISOString()
                           : new Date().toISOString(),
                   } as UserProfile);
                } else {
                    // This can happen if user exists in Auth but not Firestore
                    const profile = await createProfileForNewUser(fbUser);
                    setUser(profile);
                }
                setFirebaseUser(fbUser);
            } else {
              setUser(null);
              setFirebaseUser(null);
            }
            setAuthReady(true);
          });
        })();
    
        return () => {
          if (unsub) unsub();
        };
      }, [router]);

    const value = { user, firebaseUser, authReady, setUser };
    
    if (!authReady) {
        return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

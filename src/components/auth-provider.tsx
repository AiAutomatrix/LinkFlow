
"use client";

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';

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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                setFirebaseUser(fbUser);
                const profile = await createProfileForNewUser(fbUser);
                setUser(profile);
            } else {
                setUser(null);
                setFirebaseUser(null);
            }
            setAuthReady(true);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const value = { user, firebaseUser, authReady, setUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

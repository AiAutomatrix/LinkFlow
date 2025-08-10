
"use client";

import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';

const createProfileForNewUser = async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        return userDocSnap.data();
    }

    // New user, create profile
    const username = (firebaseUser.email || firebaseUser.uid).split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 20) || `user_${Date.now()}`;
    const usernameDocRef = doc(firestore, 'usernames', username);

    const newUserProfileData = {
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "New User",
        photoURL: firebaseUser.photoURL || "",
        bio: "",
        username: username,
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
    batch.set(usernameDocRef, { uid: firebaseUser.uid });
    await batch.commit();

    return { ...newUserProfileData, createdAt: new Date() }; // return with placeholder date
};


const AuthProvider = ({ children }: { children: React.ReactNode; }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                const profileData = await createProfileForNewUser(fbUser);
                const userDocRef = doc(firestore, 'users', fbUser.uid);
                const userDoc = await getDoc(userDocRef);
                const finalProfileData = userDoc.data();

                if (finalProfileData) {
                    const processedUser = {
                        uid: fbUser.uid,
                        ...finalProfileData,
                        createdAt: finalProfileData.createdAt instanceof Timestamp
                            ? finalProfileData.createdAt.toDate().toISOString()
                            : new Date().toISOString(),
                    } as UserProfile;
                    setUser(processedUser);
                }
                setFirebaseUser(fbUser);
            } else {
                setUser(null);
                setFirebaseUser(null);
            }
            setAuthReady(true);
        });

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

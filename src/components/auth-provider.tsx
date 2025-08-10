
"use client";

import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';

const createProfileForNewUser = async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        // Return existing profile data
        return userDocSnap.data();
    }

    // New user, create profile
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
    if (!existingUsernameSnap.exists()) {
        batch.set(doc(firestore, "usernames", finalUsername), { uid: firebaseUser.uid });
    }
    
    await batch.commit();

    return { ...newUserProfileData, createdAt: new Date() }; // return with placeholder date
};

const AuthProvider = ({ children }: { children: React.ReactNode; }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        // This flag prevents the onAuthStateChanged listener from running
        // before we've had a chance to process the redirect result.
        let isProcessingRedirect = true;

        // First, check for the result of a redirect login
        getRedirectResult(auth)
            .then(async (credential) => {
                if (credential) {
                    // This means the user has just signed in via redirect
                    const fbUser = credential.user;
                    // The createProfileForNewUser function will either create or get the profile
                    await createProfileForNewUser(fbUser);
                    // The onAuthStateChanged listener will handle setting the user state
                }
            })
            .catch((error) => {
                console.error("Error getting redirect result:", error);
            })
            .finally(() => {
                // Now that we've processed the redirect, we can safely listen for auth changes.
                isProcessingRedirect = false;
                
                // Set up the primary auth state listener
                const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
                    // Don't do anything if we are still processing the redirect
                    if (isProcessingRedirect) return;

                    if (fbUser) {
                        setFirebaseUser(fbUser);
                        const userDocRef = doc(firestore, 'users', fbUser.uid);
                        const userDoc = await getDoc(userDocRef);
                        if (userDoc.exists()) {
                            const finalProfileData = userDoc.data();
                            const processedUser = {
                                uid: fbUser.uid,
                                ...finalProfileData,
                                createdAt: finalProfileData.createdAt instanceof Timestamp
                                    ? finalProfileData.createdAt.toDate().toISOString()
                                    : new Date().toISOString(),
                            } as UserProfile;
                            setUser(processedUser);
                        } else {
                          // This can happen if the profile creation failed or is slow.
                          // We attempt to create it again just in case.
                          await createProfileForNewUser(fbUser);
                          const newUserDoc = await getDoc(userDocRef);
                          if(newUserDoc.exists()) {
                            const finalProfileData = newUserDoc.data();
                             const processedUser = {
                                uid: fbUser.uid,
                                ...finalProfileData,
                                createdAt: finalProfileData.createdAt instanceof Timestamp
                                    ? finalProfileData.createdAt.toDate().toISOString()
                                    : new Date().toISOString(),
                            } as UserProfile;
                            setUser(processedUser);
                          }
                        }
                    } else {
                        setUser(null);
                        setFirebaseUser(null);
                    }
                    setAuthReady(true);
                });

                return () => unsubscribe();
            });

    }, []);

    const value = { user, firebaseUser, authReady, setUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;


"use client";

import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult, Unsubscribe } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';

const createProfileForNewUser = async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        // Return existing profile data
        const data = userDocSnap.data();
        return {
            uid: firebaseUser.uid,
            ...data,
            createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
        } as UserProfile;
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

    return { 
        uid: firebaseUser.uid,
        ...newUserProfileData, 
        createdAt: new Date().toISOString() // return with placeholder date
    } as UserProfile;
};

const AuthProvider = ({ children }: { children: React.ReactNode; }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        let unsubscribe: Unsubscribe | null = null;
        
        const initializeAuth = async () => {
            try {
                // First, check for the result of a redirect login. This handles the case
                // where the user was redirected to Google and is now returning to the app.
                const credential = await getRedirectResult(auth);
                if (credential) {
                    // A user was found from the redirect.
                    // We can now create their profile if it doesn't exist.
                    const profile = await createProfileForNewUser(credential.user);
                    setUser(profile);
                    setFirebaseUser(credential.user);
                    setAuthReady(true);
                    // The main navigation logic in pages will handle redirecting to the dashboard.
                    // Since we have a user, we can skip setting up the listener for now.
                    return; 
                }
            } catch (error) {
                console.error("Error processing redirect result:", error);
            }

            // If no redirect result, set up the normal auth state listener.
            // This handles direct email/password logins and existing sessions.
            unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
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
                        // This can happen on first sign-up with email/password
                        const profile = await createProfileForNewUser(fbUser);
                        setUser(profile);
                    }
                } else {
                    setUser(null);
                    setFirebaseUser(null);
                }
                setAuthReady(true);
            });
        };

        initializeAuth();

        // Cleanup subscription on unmount
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    const value = { user, firebaseUser, authReady, setUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

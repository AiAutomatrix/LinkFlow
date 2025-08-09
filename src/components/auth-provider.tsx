
"use client";

import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';

type AuthProviderProps = {
  children: React.ReactNode;
};

const processUserData = (uid: string, data: any): UserProfile => {
    const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate().toISOString()
        : data.createdAt;

    return { 
      uid, 
      ...data,
      createdAt,
    } as UserProfile;
}

const createProfileForNewUser = async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data();
    }

    // This is a new user, create their profile documents
    const username = (firebaseUser.email || firebaseUser.uid).split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const usernameDocRef = doc(firestore, 'usernames', username);
    const createdAt = serverTimestamp();

    const newUserProfile: Omit<UserProfile, 'uid' | 'createdAt'> = {
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName || "New User",
      bio: "Welcome to my LinkFlow profile!",
      photoURL: firebaseUser.photoURL || "",
      username: username,
      plan: "free",
      theme: "light",
      animatedBackground: false,
    };

    const batch = writeBatch(firestore);
    batch.set(userDocRef, { ...newUserProfile, createdAt });
    batch.set(usernameDocRef, { uid: firebaseUser.uid });
    await batch.commit();

    // Return the newly created profile data (with a placeholder for the timestamp)
    return { ...newUserProfile, createdAt: new Date().toISOString() };
};


const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
            const userDocRef = doc(firestore, 'users', fbUser.uid);
            let userDoc = await getDoc(userDocRef);

            // If user exists in Auth but not Firestore (e.g., first Google login)
            if (!userDoc.exists()) {
                await createProfileForNewUser(fbUser);
                userDoc = await getDoc(userDocRef); // Re-fetch the newly created doc
            }

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const processedUser = processUserData(fbUser.uid, userData);
                setUser(processedUser);
            } else {
                // This case should be rare after the change above
                console.error("Failed to create or find user document after login.");
                auth.signOut();
                setUser(null);
            }
        } catch (error) {
            console.error("Error during authentication process:", error);
            auth.signOut();
            setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, authReady, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

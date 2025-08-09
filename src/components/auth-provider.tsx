
"use client";

import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';

type AuthProviderProps = {
  children: React.ReactNode;
};

// Helper function to safely process user data
const processUserData = (uid: string, data: any): UserProfile => {
    // Ensure timestamps are converted to serializable strings to prevent hydration errors
    const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate().toISOString()
        : data.createdAt;

    return { 
      uid, 
      ...data,
      createdAt,
    } as UserProfile;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
            const userDocRef = doc(firestore, 'users', fbUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const processedUser = processUserData(fbUser.uid, userData);
              setUser(processedUser);
            } else {
              console.error("User exists in Auth but not in Firestore. Logging out.");
              auth.signOut();
              setUser(null);
            }
        } catch (error) {
            console.error("Error fetching user document:", error);
            auth.signOut();
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

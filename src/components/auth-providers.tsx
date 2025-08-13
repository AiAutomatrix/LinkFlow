"use client";
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    await updateProfile(fbUser, {
      displayName: displayName,
    });

    const userDocRef = doc(firestore, 'users', fbUser.uid);
    const username = fbUser.uid; // Default to UID, user can change it later
    const newUserProfile: Omit<UserProfile, 'createdAt'> & { createdAt: any } = {
      uid: fbUser.uid,
      email: fbUser.email!,
      displayName: displayName,
      bio: 'Welcome to my LinkFlow profile!',
      photoURL: fbUser.photoURL || '',
      username: username,
      plan: 'free',
      createdAt: serverTimestamp(),
    };

    const usernameDocRef = doc(firestore, 'usernames', username);

    const batch = writeBatch(firestore);
    batch.set(userDocRef, newUserProfile);
    batch.set(usernameDocRef, { uid: fbUser.uid });
    await batch.commit();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(firestore, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUser({ uid: fbUser.uid, ...userDoc.data() } as UserProfile);
        } else {
          // This case handles the first-time sign-in via a social provider
          // where the profile might not have been created yet.
          const username = fbUser.uid; // Default to UID, user can change it later
          const newUserProfile: Omit<UserProfile, 'createdAt'> & { createdAt: any } = {
            uid: fbUser.uid,
            email: fbUser.email!,
            displayName: fbUser.displayName || 'New User',
            bio: 'Welcome to my LinkFlow profile!',
            photoURL: fbUser.photoURL || '',
            username: username,
            plan: 'free',
            createdAt: serverTimestamp(),
          };

          const usernameDocRef = doc(firestore, 'usernames', username);

          try {
            const batch = writeBatch(firestore);
            batch.set(userDocRef, newUserProfile);
            batch.set(usernameDocRef, { uid: fbUser.uid });
            await batch.commit();

            // Fetch the newly created doc to get the server-resolved timestamp
            const newUserDoc = await getDoc(userDocRef);
            setUser({ uid: fbUser.uid, ...newUserDoc.data() } as UserProfile);

          } catch (error) {
            console.error("Error creating user profile:", error);
            // Handle error case, maybe sign the user out
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, setUser, signInWithEmail, signInWithGoogle, signUpWithEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

"use client";

import React, { useState, useEffect, useContext } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, firestore, storage } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type AuthProviderProps = {
  children: React.ReactNode;
};

const googleProvider = new GoogleAuthProvider();

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(firestore, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUser({ uid: fbUser.uid, ...userDoc.data() } as UserProfile);
        } else {
          // New user, create profile
          const username = fbUser.email?.split('@')[0] || fbUser.uid;
          const newUserProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email!,
            displayName: fbUser.displayName || 'New User',
            bio: '',
            photoURL: fbUser.photoURL || '',
            username: username,
            plan: 'free',
            theme: 'light',
            createdAt: serverTimestamp(),
          };

          try {
            await setDoc(userDocRef, newUserProfile);
            const newUserSnap = await getDoc(userDocRef);
            setUser({ uid: fbUser.uid, ...newUserSnap.data() } as UserProfile);
          } catch (error) {
            console.error("Error creating user profile:", error);
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

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName });
    // AuthProvider's onAuthStateChanged will handle profile creation
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            return;
        }
        throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
  };
  
  const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
    if (!file) throw new Error("No file provided for upload.");
    if (!file.type.startsWith("image/")) throw new Error("File is not an image.");

    const storageRef = ref(storage, `profile_pictures/${userId}/profile.jpg`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update user profile in firestore
    const userRef = doc(firestore, "users", userId);
    await updateDoc(userRef, { photoURL: downloadURL });
    
    // Update local user state
    if(user && user.uid === userId) {
      setUser({...user, photoURL: downloadURL });
    }

    return downloadURL;
  };


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

  const value = {
      user,
      firebaseUser,
      loading,
      setUser,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      uploadProfilePicture,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
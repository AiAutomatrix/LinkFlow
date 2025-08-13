
"use client";

import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import Loading from '@/app/loading';

// Helper function to fetch or create a user profile
const getOrCreateUserProfile = async (fbUser: FirebaseUser): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    } else {
        const username = fbUser.email?.split('@')[0] || fbUser.uid;
        const newUserProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email!,
            displayName: fbUser.displayName || 'New User',
            bio: 'Welcome to my LinkFlow profile!',
            photoURL: fbUser.photoURL || '',
            username: username,
            plan: 'free',
            theme: 'light',
            animatedBackground: false,
            socialLinks: {},
            createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUserProfile);
        return newUserProfile;
    }
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setLoading(true);
        if (fbUser) {
            const userProfile = await getOrCreateUserProfile(fbUser);
            setFirebaseUser(fbUser);
            setUser(userProfile);
        } else {
            setFirebaseUser(null);
            setUser(null);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  // Handle routing
  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

    if (!user && !isAuthPage && !pathname.startsWith('/u/')) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    // The onAuthStateChanged listener will handle profile creation
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const updateUserProfilePhoto = async (uid: string, photoURL: string) => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, { photoURL });
    if (user) {
        setUser({ ...user, photoURL });
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    signOut,
    updateUserProfilePhoto,
  };

  if (loading && !pathname.startsWith('/u/')) {
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
      const isHomePage = pathname === '/';
      if (!isAuthPage && !isHomePage) {
        return <Loading />;
      }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;


"use client";

import React, { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';
import Loading from '@/app/loading';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { usePathname, useRouter } from 'next/navigation';

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUser({ uid: fbUser.uid, ...userDoc.data() } as UserProfile);
        } else {
          // New user via Google Sign-In or first-time email sign-up, create their profile.
          const username = (fbUser.email?.split('@')[0] || fbUser.uid).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
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
            animatedBackground: false,
          };

          try {
            await setDoc(userDocRef, newUserProfile);
            // Fetch the profile we just created to get all fields (like server timestamp)
            const newUserSnap = await getDoc(userDocRef);
            setUser({ uid: fbUser.uid, ...newUserSnap.data() } as UserProfile);
          } catch (error) {
            console.error("Error creating user profile:", error);
            setUser(null);
          }
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isPublicPage = pathname.startsWith('/u/');
    const isHomePage = pathname === '/';

    if (isPublicPage || isHomePage) return;

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);


  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    await updateProfile(fbUser, { displayName });

    const username = (email.split('@')[0] || fbUser.uid).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
    const userDocRef = doc(db, 'users', fbUser.uid);
    const newUserProfile: Omit<UserProfile, 'uid'> = {
      email: fbUser.email!,
      displayName: displayName,
      bio: '',
      photoURL: '',
      username: username,
      plan: 'free',
      theme: 'light',
      createdAt: serverTimestamp(),
      animatedBackground: false,
    };
    // The onAuthStateChanged listener will handle creating the profile doc
    await setDoc(userDocRef, newUserProfile);
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
    setUser(null);
    router.push('/login');
  };
  
  const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
    if (!file) throw new Error("No file provided for upload.");
    if (!file.type.startsWith("image/")) throw new Error("File is not an image.");

    const storageRef = ref(storage, `profile_pictures/${userId}/profile.jpg`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { photoURL: downloadURL });
    
    if(user && user.uid === userId) {
      setUser((prevUser) => prevUser ? {...prevUser, photoURL: downloadURL } : null);
    }

    return downloadURL;
  };

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isPublicFlow = pathname.startsWith('/u/') || pathname === '/';
  
  // Show a full-page loading screen to prevent UI flashes
  if (loading || (!isPublicFlow && !user && !isAuthPage) || (!isPublicFlow && user && isAuthPage)) {
    return <Loading />;
  }

  const value = {
      user,
      userProfile: user, // userProfile is an alias for user
      firebaseUser,
      loading,
      setUser,
      signInWithEmail,
      signUpWithEmail,
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

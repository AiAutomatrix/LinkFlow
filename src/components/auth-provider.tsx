
"use client";

import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';
import Loading from '@/app/loading';
import { usePathname, useRouter } from 'next/navigation';

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
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const userProfile = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
              setFirebaseUser(fbUser);
              setUser(userProfile);
            } else {
              const username = fbUser.email?.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || fbUser.uid;
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
    
              const usernameDocRef = doc(db, 'usernames', username);
    
              try {
                const batch = writeBatch(db);
                batch.set(userDocRef, newUserProfile);
                batch.set(usernameDocRef, { uid: fbUser.uid });
                await batch.commit();
    
                setUser(newUserProfile);
                setFirebaseUser(fbUser);

              } catch (error) {
                console.error("Error creating user profile:", error);
                setUser(null);
                setFirebaseUser(null);
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
    const isPublicPage = pathname.startsWith('/u/') || pathname === '/';

    if (!user && !isAuthPage && !isPublicPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);


  if (loading && !pathname.startsWith('/u/') && pathname !== '/') {
    return <Loading />;
  }

  const value = {
    user,
    userProfile: user,
    firebaseUser,
    loading,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

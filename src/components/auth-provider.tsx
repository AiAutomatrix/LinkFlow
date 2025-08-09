"use client";

import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs once on mount to handle the redirect result.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // User successfully signed in with Google.
          const fbUser = result.user;
          const userDocRef = doc(firestore, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // This is a new user, create their profile.
            const username = fbUser.uid; // Default username
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
            const batch = writeBatch(firestore);
            batch.set(userDocRef, newUserProfile);
            batch.set(usernameDocRef, { uid: fbUser.uid });
            await batch.commit();
          }
           toast({
            title: "Success!",
            description: "You've been signed in with Google.",
          });
        }
      })
      .catch((error) => {
        console.error("Redirect Result Error:", error);
         toast({
          variant: "destructive",
          title: "Google Sign-In Failed",
          description: "Could not sign in with Google. Please try again.",
        });
      })
      // We don't setLoading(false) here because onAuthStateChanged will handle it.
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(firestore, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUser({ uid: fbUser.uid, ...userDoc.data() } as UserProfile);
        } else {
            // This case can happen if profile creation failed after redirect
            // or if a user exists in Auth but not Firestore. We log them out.
             console.error("User exists in Auth but not in Firestore. Logging out.");
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
    <AuthContext.Provider value={{ user, firebaseUser, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;


"use client";

import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';

type AuthProviderProps = {
  children: React.ReactNode;
};

// Define routes that are publicly accessible
const PUBLIC_ROUTES = ['/login', '/signup'];

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const processAuth = async () => {
      setLoading(true);
      try {
        // 1. Check for a redirect result from Google Sign-In
        const result = await getRedirectResult(auth);
        if (result) {
          toast({
            title: "Success!",
            description: "You've been signed in with Google.",
          });
          const fbUser = result.user;
          const userDocRef = doc(firestore, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // New user, create their profile
            const username = fbUser.uid; // Default username
            const newUserProfile = {
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
        }
      } catch (error: any) {
        console.error("Redirect Result Error:", error);
        toast({
          variant: "destructive",
          title: "Google Sign-In Failed",
          description: "Could not sign in with Google. Please try again.",
        });
      }

      // 2. Set up the onAuthStateChanged listener
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          const userDocRef = doc(firestore, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUser({ uid: fbUser.uid, ...userDoc.data() } as UserProfile);
          } else {
            console.error("User exists in Auth but not in Firestore. Logging out.");
            auth.signOut();
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false); // Auth state is now definitive
      });

      return () => unsubscribe();
    };

    processAuth();
  }, [toast]); // This effect should only run once on mount

  useEffect(() => {
    if (loading) return; // Don't perform routing actions until auth state is resolved

    const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/';
    const isProfilePage = pathname.startsWith('/u/');

    if (user && isPublic) {
        // User is logged in but on a public page (like login), redirect to dashboard
        router.push('/dashboard');
    } else if (!user && !isPublic && !isProfilePage) {
        // User is not logged in and trying to access a protected page
        router.push('/login');
    }
  }, [user, loading, pathname, router]);

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

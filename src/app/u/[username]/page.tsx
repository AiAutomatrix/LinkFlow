
"use client";

import { firestore } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc, orderBy, Timestamp } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


async function getUserData(username: string): Promise<UserProfile | null> {
    const usernamesCollection = collection(firestore, 'usernames');
    const q = query(usernamesCollection, where('__name__', '==', username));
    const usernameSnapshot = await getDocs(q);

    if (usernameSnapshot.empty) {
        return null;
    }

    const userData = usernameSnapshot.docs[0].data();
    const userDocRef = doc(firestore, 'users', userData.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        return null;
    }

    const profileData = userDoc.data();
    return { 
        uid: userDoc.id, 
        ...profileData,
        // Convert timestamp to a serializable format (ISO string)
        createdAt: profileData.createdAt ? (profileData.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString()
    } as unknown as UserProfile;
}

async function getUserLinks(uid: string): Promise<LinkType[]> {
    const linksCollection = collection(firestore, 'users', uid, 'links');
    const now = Timestamp.now();
    
    const q = query(linksCollection, orderBy('order', 'asc'));
      
    const linksSnapshot = await getDocs(q);
    const allLinks = linksSnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          startDate: data.startDate ? (data.startDate as Timestamp) : undefined,
          endDate: data.endDate ? (data.endDate as Timestamp) : undefined,
      } as LinkType
    });
  
    // Filter for active and scheduled links
    const activeLinks = allLinks.filter(link => {
      if (!link.active) return false;
  
      const hasStartDate = !!link.startDate;
      const hasEndDate = !!link.endDate;
      
      const startDate = link.startDate as Timestamp | undefined;
      const endDate = link.endDate as Timestamp | undefined;
  
      if (hasStartDate && startDate! > now) return false;
      if (hasEndDate && endDate! < now) return false;
  
      return true;
    });

    // Convert Timestamps to serializable format (ISO string)
    return activeLinks.map(link => ({
        ...link,
        startDate: link.startDate ? (link.startDate as Timestamp).toDate().toISOString() : undefined,
        endDate: link.endDate ? (link.endDate as Timestamp).toDate().toISOString() : undefined,
    })) as unknown as LinkType[];
}


export default function UserProfilePage({ params }: { params: { username: string } }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [links, setLinks] = useState<LinkType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const userData = await getUserData(params.username);
                if (!userData) {
                    setError(true);
                    return;
                }
                const linksData = await getUserLinks(userData.uid);
                setUser(userData);
                setLinks(linksData);
            } catch (e) {
                console.error("Failed to fetch user data:", e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [params.username]);

    if (loading) {
        return (
            <div className="flex flex-col items-center min-h-screen pt-12 px-4 bg-background">
                <div className="w-full max-w-md mx-auto">
                    <div className="flex flex-col items-center text-center">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-8 w-48 mt-4" />
                        <Skeleton className="h-6 w-32 mt-2" />
                        <Skeleton className="h-4 w-64 mt-4" />
                    </div>
                    <div className="mt-8 space-y-4">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        notFound();
    }

    const getInitials = (name: string = '') => {
        return name.split(' ').map(n => n[0]).join('')
    }

    const handleLinkClick = async (linkId: string, url: string) => {
        if (!user) return;
        try {
            // Fire and forget analytics POST
            fetch('/api/clicks', {
                method: 'POST',
                body: JSON.stringify({ userId: user.uid, linkId }),
                headers: { 'Content-Type': 'application/json' },
                // Keepalive is important for requests that might outlive the page
                keepalive: true,
            });
        } catch (error) {
            console.error("Failed to record click", error);
        }

        // Open link in a new tab
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    return (
        <div className="flex flex-col items-center min-h-screen pt-12 px-4 bg-background">
            <div className="w-full max-w-md mx-auto">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 border-2 border-white">
                        <AvatarImage src={user!.photoURL} alt={user!.displayName} />
                        <AvatarFallback>{getInitials(user!.displayName)}</AvatarFallback>
                    </Avatar>
                    <h1 className="text-2xl font-bold mt-4 text-foreground">{user!.displayName}</h1>
                    <p className="text-md text-muted-foreground">@{user!.username}</p>
                    <p className="mt-4 text-sm max-w-xs text-foreground/80">{user!.bio}</p>
                </div>

                <div className="mt-8 space-y-4">
                {links.map((link) => (
                    <Button 
                        key={link.id}
                        onClick={() => handleLinkClick(link.id, link.url)}
                        className="w-full h-14 text-md shadow-md transition-transform transform active:scale-[0.98]" 
                        variant="secondary"
                    >
                        {link.title}
                    </Button>
                ))}
                </div>
            </div>
            <footer className="mt-auto py-8">
                <Logo />
            </footer>
        </div>
    );
}

import { firestore } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc, orderBy, Timestamp, updateDoc, increment } from 'firebase/firestore';
import { notFound, redirect } from 'next/navigation';
import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';

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

  return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
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
        // Ensure Timestamps are converted for server component compatibility if needed later, though not strictly necessary here.
        startDate: data.startDate ? (data.startDate as Timestamp) : undefined,
        endDate: data.endDate ? (data.endDate as Timestamp) : undefined,
    } as LinkType
  });

  // Filter for active and scheduled links in the code
  return allLinks.filter(link => {
    if (!link.active) return false;

    const hasStartDate = !!link.startDate;
    const hasEndDate = !!link.endDate;
    
    // Note: Timestamps are compared directly
    const startDate = link.startDate as Timestamp | undefined;
    const endDate = link.endDate as Timestamp | undefined;

    if (hasStartDate && startDate! > now) return false;
    if (hasEndDate && endDate! < now) return false;

    return true;
  });
}

async function handleLinkClick(linkId: string, url: string, userId: string) {
    'use server';
    try {
      const linkRef = doc(firestore, 'users', userId, 'links', linkId);
      // Use Firestore's atomic increment operation for reliability
      await updateDoc(linkRef, { clicks: increment(1) });
    } catch (error) {
      // Don't block redirect if firestore update fails
      console.error("Failed to update click count", error);
    }
    // Redirect the user to the link's URL
    redirect(url);
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const user = await getUserData(params.username);

  if (!user) {
    notFound();
  }

  const links = await getUserLinks(user.uid);
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('')
  }

  return (
    <div className="flex flex-col items-center min-h-screen pt-12 px-4 bg-background">
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-2 border-white">
                <AvatarImage src={user.photoURL} alt={user.displayName} />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold mt-4 text-foreground">{user.displayName}</h1>
            <p className="text-md text-muted-foreground">@{user.username}</p>
            <p className="mt-4 text-sm max-w-xs text-foreground/80">{user.bio}</p>
        </div>

        <div className="mt-8 space-y-4">
          {links.map((link) => (
            <form key={link.id} action={handleLinkClick.bind(null, link.id, link.url, user.uid)}>
                <Button 
                    type="submit" 
                    className="w-full h-14 text-md shadow-md transition-transform transform active:scale-[0.98]" 
                    variant="secondary"
                >
                    {link.title}
                </Button>
            </form>
          ))}
        </div>
      </div>
      <footer className="mt-auto py-8">
        <Logo />
      </footer>
    </div>
  );
}

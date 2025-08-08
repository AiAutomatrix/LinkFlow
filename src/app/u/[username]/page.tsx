import { firestore } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc, orderBy, Timestamp } from 'firebase/firestore';
import { notFound, redirect } from 'next/navigation';
import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';

async function getUserData(username: string) {
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

async function getUserLinks(uid: string) {
  const linksCollection = collection(firestore, 'users', uid, 'links');
  const now = Timestamp.now();
  
  const q = query(
    linksCollection, 
    where('active', '==', true),
    orderBy('order', 'asc')
    );
    
  const linksSnapshot = await getDocs(q);
  const links = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkType));

  // Filter for scheduled links client-side for now, as Firestore requires composite indexes for this
  return links.filter(link => {
    const hasStartDate = !!link.startDate;
    const hasEndDate = !!link.endDate;
    
    if (hasStartDate && link.startDate! > now) return false;
    if (hasEndDate && link.endDate! < now) return false;

    return true;
  });
}

const handleLinkClick = async (uid: string, linkId: string, url: string) => {
    'use server';
    const linkRef = doc(firestore, 'users', uid, 'links', linkId);
    const linkDoc = await getDoc(linkRef);
    if(linkDoc.exists()){
        await getDoc(linkRef);
        const currentClicks = linkDoc.data().clicks || 0;
        await doc(linkRef).update({ clicks: currentClicks + 1 });
    }
    redirect(url);
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const user = await getUserData(params.username);

  if (!user) {
    notFound();
  }

  const links = await getUserLinks(user.uid);
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('')
  }

  return (
    <div className="flex flex-col items-center min-h-screen pt-12 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24">
                <AvatarImage src={user.photoURL} alt={user.displayName} />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold mt-4">{user.displayName}</h1>
            <p className="text-md text-muted-foreground">@{user.username}</p>
            <p className="mt-4 text-sm max-w-xs">{user.bio}</p>
        </div>

        <div className="mt-8 space-y-4">
          {links.map((link) => (
            <form action={async () => {
                'use server';
                const linkRef = doc(firestore, 'users', user.uid, 'links', link.id);
                const linkDoc = await getDoc(linkRef);
                if(linkDoc.exists()){
                    const currentClicks = linkDoc.data().clicks || 0;
                    await updateDoc(linkRef, { clicks: currentClicks + 1 });
                }
                redirect(link.url);
            }}>
                <Button type="submit" className="w-full h-14 text-md" variant="secondary">
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

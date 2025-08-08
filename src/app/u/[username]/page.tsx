
import { firestore } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc, orderBy, Timestamp } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import type { Link as LinkType, UserProfile } from '@/lib/types';
import ProfileClientPage from './profile-client-page';

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

    return activeLinks.map(link => ({
        ...link,
        createdAt: link.createdAt ? (link.createdAt as any).toDate().toISOString() : new Date().toISOString(),
        startDate: link.startDate ? (link.startDate as Timestamp).toDate().toISOString() : undefined,
        endDate: link.endDate ? (link.endDate as Timestamp).toDate().toISOString() : undefined,
    })) as unknown as LinkType[];
}


export default async function UserProfilePage({ params }: { params: { username: string } }) {
    const user = await getUserData(params.username);
    
    if (!user) {
        notFound();
    }

    const links = await getUserLinks(user.uid);

    return <ProfileClientPage user={user} links={links} />;
}

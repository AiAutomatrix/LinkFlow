
import { db } from '@/lib/firebase';
import { doc, increment, setDoc, updateDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, linkId } = await request.json();

    if (!userId || !linkId) {
      console.error('Click API Error: Missing userId or linkId in request body');
      return NextResponse.json({ error: 'Missing userId or linkId' }, { status: 400 });
    }
    
    // Check if it's a support link click
    if (typeof linkId === 'string' && linkId.startsWith('support_')) {
      const platform = linkId.replace('support_', '');
      const supportClicksRef = doc(db, `users/${userId}/clicks/support`);
      
      // Atomically increment the count for the specific support platform.
      // Using setDoc with merge: true to create the document if it doesn't exist.
      await setDoc(supportClicksRef, {
        [platform]: increment(1)
      }, { merge: true });

    } else {
      // It's a regular link click
      const linkRef = doc(db, `users/${userId}/links/${linkId}`);
      await updateDoc(linkRef, {
          clicks: increment(1)
      });
    }

    return NextResponse.json({ success: true, message: "Click tracked." }, { status: 200 });
  } catch (error: any) {
    console.error('Click API Error:', error);
    return NextResponse.json({ error: 'Failed to update clicks', details: error.message }, { status: 500 });
  }
}

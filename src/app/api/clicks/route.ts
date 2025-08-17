
import { db } from '@/lib/firebase';
import { doc, increment, updateDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const { userId, linkId } = JSON.parse(body);

    if (!userId || !linkId) {
      console.error('Click API Error: Missing userId or linkId in request body');
      return NextResponse.json({ error: 'Missing userId or linkId' }, { status: 400 });
    }
    
    const linkRef = doc(db, `users/${userId}/links/${linkId}`);
    await updateDoc(linkRef, {
        clicks: increment(1)
    });

    return NextResponse.json({ success: true, message: "Click tracked." }, { status: 200 });
  } catch (error: any) {
    console.error('Click API Error:', error);
    return NextResponse.json({ error: 'Failed to update clicks', details: error.message }, { status: 500 });
  }
}

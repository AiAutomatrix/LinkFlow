
import { NextResponse } from 'next/server';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const { userId, linkId } = await request.json();

    if (!userId || !linkId) {
      return NextResponse.json({ error: 'Missing userId or linkId' }, { status: 400 });
    }

    const linkRef = doc(firestore, "users", userId, "links", linkId);
    await updateDoc(linkRef, {
      clicks: increment(1),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating clicks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

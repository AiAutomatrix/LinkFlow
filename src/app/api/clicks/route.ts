
import { db } from '@/lib/firebase';
import { doc, increment, updateDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

// This API route is publicly accessible and does not require authentication.
// It receives the userId and linkId from the request body to know which document to update.
export async function POST(request: Request) {
  try {
    const { userId, linkId } = await request.json();

    // Validate that the required data is present.
    if (!userId || !linkId) {
      console.error('Click API Error: Missing userId or linkId in request body');
      return NextResponse.json({ error: 'Missing userId or linkId' }, { status: 400 });
    }
    
    // Construct the reference to the specific link document.
    const linkRef = doc(db, `users/${userId}/links/${linkId}`);
    
    // Atomically increment the 'clicks' field by 1.
    // This is a safe operation that doesn't overwrite other fields.
    await updateDoc(linkRef, {
        clicks: increment(1)
    });

    return NextResponse.json({ success: true, message: "Click tracked." }, { status: 200 });
  } catch (error: any) {
    // Log any errors that occur during the process for debugging.
    console.error('Click API Error:', error);
    return NextResponse.json({ error: 'Failed to update clicks', details: error.message }, { status: 500 });
  }
}

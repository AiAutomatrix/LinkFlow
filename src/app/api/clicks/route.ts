
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, linkId } = await request.json();

    if (!userId || !linkId) {
      return NextResponse.json({ error: 'Missing userId or linkId' }, { status: 400 });
    }
    
    console.log(`Received click for userId: ${userId}, linkId: ${linkId}. In a real app, this would be incremented in Firestore.`);

    return NextResponse.json({ success: true, message: "Click tracked (simulated)." }, { status: 200 });
  } catch (error: any) {
    console.error('Click API Error:', error);
    return NextResponse.json({ error: 'Failed to update clicks', details: error.message }, { status: 500 });
  }
}

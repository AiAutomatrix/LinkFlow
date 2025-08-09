
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const linkId = searchParams.get('linkId');
    const userId = searchParams.get('userId');
    const url = searchParams.get('url');

    useEffect(() => {
        if (!userId || !linkId || !url) {
            // If params are missing, go home.
            router.replace('/');
            return;
        };

        const sendClick = async () => {
          try {
            const res = await fetch('/api/clicks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, linkId }),
              keepalive: true,
            });
            if (!res.ok) {
                throw new Error(`API error: ${res.status} ${await res.text()}`);
            }
          } catch (error) {
            console.error('Click tracking failed:', error);
          } finally {
            router.replace(url);
          }
        };
    
        sendClick();
      }, [userId, linkId, url, router]);

    // Return null or a minimal loader as this page is transitional
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Redirecting...</h1>
                <p className="mt-2 text-muted-foreground">Please wait while we take you to your destination.</p>
            </div>
        </div>
    );
}

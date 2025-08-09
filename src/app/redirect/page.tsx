
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
        if (linkId && userId && url) {
            try {
                // Fire and forget the click tracking
                fetch('/api/clicks', {
                    method: 'POST',
                    body: JSON.stringify({ userId, linkId }),
                    headers: { 'Content-Type': 'application/json' },
                    keepalive: true,
                });
            } catch (error) {
                console.error("Failed to record click", error);
            } finally {
                // Redirect the user to the destination URL
                // Using router.replace to avoid adding the redirect page to browser history
                router.replace(url);
            }
        } else {
            // If parameters are missing, redirect to home
            router.replace('/');
        }
    }, [linkId, userId, url, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Redirecting...</h1>
                <p className="mt-2 text-muted-foreground">Please wait while we take you to your destination.</p>
            </div>
        </div>
    );
}

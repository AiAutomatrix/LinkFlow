
"use client";

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import GoogleAnalytics from '@/components/google-analytics';
import { Suspense } from 'react';
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { usePathname } from 'next/navigation';
import AuthLayout from './(auth)/layout';
import Loading from './loading';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isDashboardPage = pathname.startsWith('/dashboard');

  if (loading) {
    // Show a loading screen for auth-sensitive routes while we check the user's status.
    if (isDashboardPage || isAuthPage) {
      return <Loading />;
    }
  }
  
  // If the user is logged in, and we are on a dashboard page,
  // the dashboard layout is already applied by Next.js file-based routing.
  // So we just render the children.
  if (user && isDashboardPage) {
    return <>{children}</>;
  }
  
  // If the user is not logged in and not on a public page, we don't know what to do yet,
  // but auth provider will redirect.
  if(!user && !isAuthPage && pathname !== '/') {
    return <>{children}</>;
  }
  
  // For login/signup pages, wrap with the AuthLayout.
  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  // For all other pages (like the landing page), just render the children.
  return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>LinkFlow - All your links in one place.</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased min-h-screen')}>
        <AuthProvider>
            <Suspense>
              <GoogleAnalytics />
            </Suspense>
            <AppContent>
              {children}
            </AppContent>
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

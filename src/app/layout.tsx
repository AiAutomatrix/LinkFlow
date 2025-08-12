
"use client";

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import GoogleAnalytics from '@/components/google-analytics';
import { Suspense } from 'react';
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { usePathname } from 'next/navigation';
import DashboardLayout from './(dashboard)/dashboard/layout';
import AuthLayout from './(auth)/layout';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  if (loading) {
      // This is now handled by loading.tsx at the root level
      return null;
  }
  
  if (user && !isAuthPage) {
    return <DashboardLayout>{children}</DashboardLayout>
  }

  if(!user && !isAuthPage && pathname !== '/') {
    return <>{children}</>
  }
  
  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>
  }

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

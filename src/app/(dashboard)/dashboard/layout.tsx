
"use client";

import AuthProvider from "@/components/auth-provider";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}


"use client";

import { AuthProvider } from "@/contexts/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  // This component is no longer needed as AuthProvider is now in the root layout.
  // We keep it to avoid breaking imports, but it just passes children through.
  return <>{children}</>;
}

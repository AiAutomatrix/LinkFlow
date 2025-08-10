
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, authReady } = useAuth();

  useEffect(() => {
    if (authReady && user) {
      router.push('/dashboard');
    }
  }, [user, authReady, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        // The AuthProvider will handle the redirect to the dashboard
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Google Sign-In Failed",
            description: error.message,
        });
    } finally {
        setLoading(false);
    }
  };
  
  if (!authReady || user) {
    return <div className="flex min-h-screen flex-col items-center justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Sign in with your Google account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign in with Google
        </Button>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

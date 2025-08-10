
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { signInWithGoogleRedirect } from "@/lib/authHandlers";


export default function SignupPage() {
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
    try {
        await signInWithGoogleRedirect();
        // The browser will navigate to Google and then back.
        // The AuthProvider will handle the result.
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Google Sign-Up Failed",
            description: error.message,
        });
        setLoading(false);
    }
  };

  if (!authReady || user) {
    return <div className="flex min-h-screen flex-col items-center justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Create your LinkFlow account by signing up with Google.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
             {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign up with Google
        </Button>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

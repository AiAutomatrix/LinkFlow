
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { loginWithGoogle } from "@/lib/authMethods";

const formSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.84-4.58 1.84-3.57 0-6.46-2.9-6.46-6.46s2.89-6.46 6.46-6.46c2.05 0 3.44.82 4.24 1.6l2.48-2.48C18.67 1.96 15.98 1 12.48 1 7.23 1 3.06 4.96 3.06 10.12s4.17 9.12 9.42 9.12c2.8 0 4.96-1 6.5-2.64 1.6-1.6 2.24-4.04 2.24-6.3v-.35h-8.5z"
      />
    </svg>
  );

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      // The AuthProvider will handle creating the Firestore profile
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: values.displayName });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.code === 'auth/email-already-in-use' 
          ? 'This email is already registered. Please login.'
          : error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
        await loginWithGoogle();
        // The AuthProvider handles profile creation and redirect, both for
        // popup and redirect flows.
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: error.message,
        });
    } finally {
      // In a redirect flow, this component unmounts, so loading is reset.
      // In a popup flow, we need to reset loading state on error.
      setLoading(false);
    }
  };

  if (!authReady || user) {
    return <div className="flex min-h-screen flex-col items-center justify-center p-4"><p>Loading...</p></div>;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Create your LinkFlow account to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </Form>
        <Separator className="my-4" />
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
          <GoogleIcon className="mr-2 h-4 w-4" />
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

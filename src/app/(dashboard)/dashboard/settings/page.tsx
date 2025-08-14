
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";


export default function SettingsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const plan = userProfile?.plan || 'free';
  const username = userProfile?.username || "username";

  const handleUpgrade = () => {
    setLoading(true);
    toast({ title: "Redirecting to payment..."});
    setTimeout(() => {
        toast({ variant: "destructive", title: "Stripe not configured" });
        setLoading(false);
    }, 2000);
  }

  const handleDeleteAccount = () => {
    toast({ variant: "destructive", title: "This feature is not yet implemented." });
  }

  return (
    <div className="grid grid-cols-1 gap-6">
        <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
                Manage your account and plan settings.
            </p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Plan</CardTitle>
          <CardDescription>
            You are currently on the{" "}
            <Badge variant={plan === "pro" ? "default" : "secondary"}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </Badge>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            {plan === "pro"
              ? "You have access to all Pro features. Thank you for your support!"
              : "Upgrade to Pro to unlock custom domains, advanced analytics, and more."}
          </p>
        </CardContent>
        {plan !== "pro" && (
          <CardFooter>
            <Button onClick={handleUpgrade} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                Upgrade to Pro
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shareable URL</CardTitle>
          <CardDescription>
            Your public URL is based on your username. You can change your username on the Appearance page.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center space-x-2">
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                {`.../u/${username}`}
              </code>
            </div>
        </CardContent>
        <CardFooter>
            <Button asChild variant="secondary">
                <Link href="/dashboard/appearance">Customize your Profile and URL</Link>
            </Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive">
          <CardHeader>
              <CardTitle>Delete Account</CardTitle>
              <CardDescription>
                  Permanently delete your account and all of your data. This action cannot be undone.
              </CardDescription>
          </CardHeader>
          <CardFooter>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                        Continue
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
      </Card>
    </div>
  );
}

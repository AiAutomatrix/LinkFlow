
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Link as LinkIcon, Eye } from "lucide-react";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
} from "recharts";
import type { Link } from "@/lib/types";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };
    
    setLoading(true);
    const linksCollection = collection(db, `users/${user.uid}/links`);
    const q = query(linksCollection, orderBy("clicks", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const linksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Link));
        setLinks(linksData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching analytics data: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load link analytics."
        });
        setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, toast]);

  const totalClicks = links.reduce((acc, link) => acc + (link.clicks || 0), 0);
  const totalLinks = links.length;
  const avgClicks = totalLinks > 0 ? (totalClicks / totalLinks).toFixed(2) : "0";
  
  const chartData = links
    .filter(l => (l.clicks || 0) > 0)
    .sort((a,b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 10)
    .map(link => ({ name: link.title, clicks: link.clicks || 0 }));


  if (loading) {
    return (
      <>
         <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Understand how your audience engages with your links.
            </p>
          </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/4" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Links</CardTitle>
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/4" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Clicks/Link</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/4" />
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Top Links by Clicks</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <Skeleton className="h-full w-full" />
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
       <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Understand how your audience engages with all your links.
          </p>
        </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLinks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Clicks/Link</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClicks}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 grid-cols-1">
        <Card>
            <CardHeader>
                <CardTitle>Top 10 Links by Clicks</CardTitle>
                <CardDescription>This chart includes both custom and social links.</CardDescription>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                {chartData.length > 0 ? (
                    <RechartsBarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip
                        contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        }}
                    />
                    <Legend />
                    <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Clicks" />
                    </RechartsBarChart>
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center">
                        <p className="text-muted-foreground">No link data to display.</p>
                        <p className="text-sm text-muted-foreground">Click your links on the public page to see data here.</p>
                    </div>
                )}
            </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

    </>
  );
}

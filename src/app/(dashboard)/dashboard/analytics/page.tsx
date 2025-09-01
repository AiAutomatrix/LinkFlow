
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Link as LinkIcon, Eye, HandCoins } from "lucide-react";
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
import { useEffect, useState, useMemo } from "react";
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
    
    return () => {
        unsubscribe();
    }
  }, [user, toast]);

  const {
    totalClicks,
    totalLinks,
    avgClicks,
    top10ChartData,
    customLinksChartData,
    socialLinksChartData,
    supportLinksChartData,
    totalSupportClicks
  } = useMemo(() => {
    const allLinksWithClicks = links.filter(l => (l.clicks || 0) > 0);

    const customLinks = links.filter(l => !l.isSocial && !l.isSupport);
    const socialLinks = links.filter(l => l.isSocial);
    const supportLinks = links.filter(l => l.isSupport);
    
    const totalCustomClicks = customLinks.reduce((acc, link) => acc + (link.clicks || 0), 0);
    const totalSocialClicks = socialLinks.reduce((acc, link) => acc + (link.clicks || 0), 0);
    const totalSupportClicks = supportLinks.reduce((acc, link) => acc + (link.clicks || 0), 0);
    
    const totalClicks = totalCustomClicks + totalSocialClicks + totalSupportClicks;
    const totalLinks = links.length;
    const avgClicks = totalLinks > 0 ? (totalClicks / totalLinks).toFixed(2) : "0";

    const top10ChartData = allLinksWithClicks
        .sort((a,b) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 10)
        .map(link => ({ name: link.title, clicks: link.clicks || 0 }));
    
    const customLinksChartData = customLinks
        .filter(l => (l.clicks || 0) > 0)
        .map(link => ({ name: link.title, clicks: link.clicks || 0 }));
    
    const socialLinksChartData = socialLinks
        .filter(l => (l.clicks || 0) > 0)
        .map(link => ({ name: link.title, clicks: link.clicks || 0 }));
    
    const supportLinksChartData = supportLinks
        .filter(l => (l.clicks || 0) > 0)
        .map(link => ({ name: link.title, clicks: link.clicks || 0 }));

    return { totalClicks, totalLinks, avgClicks, top10ChartData, customLinksChartData, socialLinksChartData, supportLinksChartData, totalSupportClicks };
  }, [links]);


  if (loading) {
    return (
      <>
         <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Understand how your audience engages with your links.
            </p>
          </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-1/4" />
                    </CardContent>
                </Card>
            ))}
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

  const Chart = ({ data, title, description }: { data: {name: string, clicks: number}[], title: string, description: string }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
        <ResponsiveContainer width="100%" height={350}>
            {data.length > 0 ? (
                <RechartsBarChart data={data}>
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
                    <p className="text-sm text-muted-foreground">Clicks will appear here once you get some.</p>
                </div>
            )}
        </ResponsiveContainer>
        </CardContent>
    </Card>
  )

  return (
    <>
       <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Understand how your audience engages with all your links.
          </p>
        </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Clicks</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSupportClicks}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 grid-cols-1">
        <Chart data={top10ChartData} title="Top 10 Links by Clicks" description="This chart shows your most popular links, including custom and social links." />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Chart data={customLinksChartData} title="Custom Link Clicks" description="Performance of your custom-added links." />
        <Chart data={socialLinksChartData} title="Social Link Clicks" description="Performance of your social media icon links." />
        <Chart data={supportLinksChartData} title="Support Link Clicks" description="Performance of your donation and support links." />
      </div>

    </>
  );
}

    

    

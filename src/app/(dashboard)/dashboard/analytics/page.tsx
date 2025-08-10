
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AnalyticsPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Mock data fetching
    const timer = setTimeout(() => {
      const mockLinks: Link[] = [
        { id: '1', title: 'My Portfolio', url: 'https://a.com', order: 0, active: true, clicks: 101, isSocial: false },
        { id: '2', title: 'My Blog', url: 'https://b.com', order: 1, active: true, clicks: 256, isSocial: false },
        { id: 'social_instagram', title: 'Instagram', url: 'https://insta.com', order: -1, active: true, clicks: 50, isSocial: true },
        { id: 'social_github', title: 'Github', url: 'https://github.com', order: -1, active: true, clicks: 75, isSocial: true },
      ];
      setLinks(mockLinks);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const regularLinks = links.filter(l => !l.isSocial);
  const socialLinks = links.filter(l => l.isSocial);

  const totalClicks = links.reduce((acc, link) => acc + (link.clicks || 0), 0);
  const totalRegularLinks = regularLinks.length;
  const avgClicks = totalRegularLinks > 0 ? (totalClicks / totalRegularLinks).toFixed(2) : "0";
  
  const chartData = links.filter(l => (l.clicks || 0) > 0).slice(0, 10).map(link => ({ name: link.title, clicks: link.clicks || 0 }));


  if (loading) {
    return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Understand how your audience engages with your links.
            </p>
          </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Clicks (All Links)</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/4" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Custom Links</CardTitle>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Understand how your audience engages with your links.
          </p>
        </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks (All Links)</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegularLinks}</div>
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
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Top Links by Clicks</CardTitle>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                {links.length > 0 ? (
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
                    <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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

        {socialLinks.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Social Links</CardTitle>
                    <p className="text-sm text-muted-foreground pt-1">Click counts for your social media icons.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {socialLinks.map(link => (
                        <div key={link.id} className="flex items-center justify-between">
                            <span className="font-medium">{link.title}</span>
                            <span className="text-muted-foreground font-bold">{link.clicks || 0} Clicks</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )}
      </div>

    </div>
  );
}

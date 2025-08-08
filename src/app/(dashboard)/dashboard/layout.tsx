
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { BarChart2, Link as LinkIcon, Paintbrush, Settings, ExternalLink, Share2 } from "lucide-react";
import Logo from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';


function ShareButton() {
    const { user } = useAuth();
    const { toast } = useToast();

    const handleShare = () => {
        if (!user || typeof window === 'undefined') return;
        const shareUrl = `${window.location.origin}/u/${user.username}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            toast({ title: "Copied!", description: "Your profile URL has been copied to the clipboard." });
        }, (err) => {
            toast({ variant: 'destructive', title: "Failed to copy", description: "Could not copy URL to clipboard." });
            console.error('Could not copy text: ', err);
        });
    };

    if (!user) return null;

    return (
        <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
        </Button>
    )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // You can return a loading spinner here
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard/links", icon: LinkIcon, label: "Links" },
    { href: "/dashboard/appearance", icon: Paintbrush, label: "Appearance" },
    { href: "/dashboard/analytics", icon: BarChart2, label: "Analytics" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: "right", align: "center" }}
                  >
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <ShareButton />
              <Button variant="outline" asChild>
                  <Link href={`/u/${user.username}`} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Profile
                  </Link>
              </Button>
              <UserNav />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </DndProvider>
  );
}

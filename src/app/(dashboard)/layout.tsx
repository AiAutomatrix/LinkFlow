
"use client";

import { useAuth } from "@/contexts/auth-context";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import Logo from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { User, Palette, Link as LinkIcon, BarChart3, Settings, ExternalLink, Bot, MessageCircleQuestion, GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Loading from "@/app/loading";
import { Button } from "@/components/ui/button";

function DashboardMobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const menuItems = [
    { href: "/dashboard/links", label: "Links", icon: LinkIcon },
    { href: "/dashboard/appearance", label: "Appearance", icon: Palette },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/bot", label: "Bot", icon: Bot },
    { href: "/dashboard/agent-hub", label: "Agent Hub", icon: MessageCircleQuestion },
    { href: "/dashboard/instructions", label: "Instructions", icon: GraduationCap },
  ];
  
  if (!user) return null;

  return (
    <Sidebar>
        <SidebarHeader className="flex items-center justify-between">
          <Logo />
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} onClick={() => setOpenMobile(false)}>
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="flex-col !gap-1">
           <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/profile")} onClick={() => setOpenMobile(false)}>
                      <Link href="/dashboard/profile">
                          <User />
                          <span>Profile</span>
                      </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/settings")} onClick={() => setOpenMobile(false)}>
                      <Link href="/dashboard/settings">
                          <Settings />
                          <span>Settings</span>
                      </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
          <div className="flex items-center justify-between border-t border-sidebar-border pt-2 mt-1">
            <UserNav />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${user.username}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Public Page
              </Link>
            </Button>
          </div>
        </SidebarFooter>
    </Sidebar>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <Loading />;
  }

  return (
    <SidebarProvider>
      <DashboardMobileLayout>
        {children}
      </DashboardMobileLayout>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
          <Logo />
          <SidebarTrigger />
        </header>
        <main className="flex-grow p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col space-y-6">
                 {children}
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

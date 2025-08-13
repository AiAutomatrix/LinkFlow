
"use client";

import { useAuth } from "@/contexts/auth-context";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from "@/components/ui/sidebar";
import Logo from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { LayoutDashboard, Link as LinkIcon, BarChart3, Settings, ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Loading from "@/app/loading";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard/links", label: "Links", icon: LinkIcon },
    { href: "/dashboard/appearance", label: "Appearance", icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  ];

  if (loading || !user) {
    return <Loading />;
  }

  return (
    <SidebarProvider>
      <Sidebar>
          <SidebarHeader>
              <div className="flex items-center justify-between">
                <Logo />
                <SidebarTrigger />
              </div>
          </SidebarHeader>
          <SidebarContent>
              <SidebarMenu>
                  {menuItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
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
                    <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/settings")}>
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
                <Link href={`/u/${user.username}`} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Public Page
                </Link>
              </Button>
            </div>
          </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="p-4 sm:p-6 lg:p-8 flex-grow">
            <div className="flex flex-col space-y-6">
                 {children}
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

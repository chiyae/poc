'use client';

import type { ReactNode } from "react";
import Link from "next/link";
import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarInset,
    SidebarRail,
} from "@/components/ui/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import { useAppUser } from "@/hooks/use-app-user";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    tooltip: string;
}

interface DashboardLayoutProps {
    title: string;
    navItems: NavItem[];
    children: ReactNode;
}

export default function DashboardLayout({ title, navItems, children }: DashboardLayoutProps) {
    const { user, isLoading } = useAppUser();

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarRail />

                <SidebarContent>
                    <SidebarMenu>
                        {navItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild tooltip={item.tooltip}>
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    {/* Footer items can be added here if needed in the future */}
                </SidebarFooter>
            </Sidebar>
            <SidebarInset className="flex flex-col">
                <DashboardHeader title={title} user={user} isLoading={isLoading} />
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

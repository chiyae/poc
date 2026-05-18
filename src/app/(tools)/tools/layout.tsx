
'use client';

import type { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Home, ListChecks, ClipboardCheck } from "lucide-react";
import type { NavItem } from "@/components/dashboard-layout";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/tools/dashboard", icon: Home, tooltip: "Dashboard" },
  { label: "Procurement Sessions", href: "/tools/procurement-sessions", icon: ListChecks, tooltip: "Procurement Sessions" },
  { label: "LPOs", href: "/tools/local-purchase-orders", icon: ClipboardCheck, tooltip: "Local Purchase Orders" },
];

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout title="Tools" navItems={navItems}>
      {children}
    </DashboardLayout>
  );
}

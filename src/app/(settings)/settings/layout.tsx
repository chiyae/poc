
'use client';

import type { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Home, Users, Package, Truck, Settings, HandHeart, History, Monitor, Database } from "lucide-react";
import type { NavItem } from "@/components/dashboard-layout";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/settings/dashboard", icon: Home, tooltip: "Dashboard" },
  { label: "User Management", href: "/settings/user-management", icon: Users, tooltip: "User Management" },
  { label: "Active Sessions", href: "/settings/sessions", icon: Monitor, tooltip: "Active Sessions" },
  { label: "Suppliers", href: "/settings/supplier-management", icon: Truck, tooltip: "Suppliers" },
  { label: "Item Master", href: "/settings/item-master", icon: Package, tooltip: "Item Master" },
  { label: "Services", href: "/settings/service-management", icon: HandHeart, tooltip: "Services" },
  { label: "General Settings", href: "/settings/general", icon: Settings, tooltip: "General Settings" },
  { label: "Audit Log", href: "/settings/audit-log", icon: History, tooltip: "Audit Log" },
  { label: "Database Backups", href: "/settings/backups", icon: Database, tooltip: "Database Backups" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout title="Settings" navItems={navItems}>
      {children}
    </DashboardLayout>
  );
}

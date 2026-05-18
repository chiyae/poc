
'use client';

import type { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Home, Package, Truck, LineChart, ClipboardList, History } from "lucide-react";
import type { NavItem } from "@/components/dashboard-layout";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/bulk-store/dashboard", icon: Home, tooltip: "Dashboard" },
  { label: "Inventory", href: "/bulk-store/inventory", icon: Package, tooltip: "Inventory" },
  { label: "Internal Orders", href: "/bulk-store/internal-orders", icon: Truck, tooltip: "Internal Orders" },
  { label: "Stock Taking", href: "/bulk-store/stock-taking", icon: ClipboardList, tooltip: "Stock Taking" },
  { label: "Stock Take History", href: "/bulk-store/stock-take-history", icon: History, tooltip: "Stock Take History" },
  { label: "Reports", href: "/bulk-store/reports", icon: LineChart, tooltip: "Reports" },
];

export default function BulkStoreLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout title="Bulk Store" navItems={navItems}>
      {children}
    </DashboardLayout>
  );
}

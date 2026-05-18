
'use client';

import type { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Home, Package, LineChart, Pill, ClipboardList, History, Send } from "lucide-react";
import type { NavItem } from "@/components/dashboard-layout";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dispensary/dashboard", icon: Home, tooltip: "Dashboard" },
  { label: "Inventory", href: "/dispensary/inventory", icon: Package, tooltip: "Inventory" },
  { label: "Request Stock", href: "/dispensary/request-stock", icon: Send, tooltip: "Request Stock" },
  { label: "Internal Orders", href: "/dispensary/internal-orders", icon: History, tooltip: "Internal Orders" },
  { label: "Dispense", href: "/dispensary/dispense", icon: Pill, tooltip: "Dispense" },
  { label: "Stock Taking", href: "/dispensary/stock-taking", icon: ClipboardList, tooltip: "Stock Taking" },
  { label: "Stock Take History", href: "/dispensary/stock-take-history", icon: History, tooltip: "Stock Take History" },
  { label: "Reports", href: "/dispensary/reports", icon: LineChart, tooltip: "Reports" },
];

export default function DispensaryLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout title="Dispensary" navItems={navItems}>
      {children}
    </DashboardLayout>
  );
}

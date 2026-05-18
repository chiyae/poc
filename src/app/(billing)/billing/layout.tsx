
'use client';

import type { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Home, DollarSign, FileText, LineChart } from "lucide-react";
import type { NavItem } from "@/components/dashboard-layout";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/billing/dashboard", icon: Home, tooltip: "Dashboard" },
  { label: "Invoices", href: "/billing/invoices", icon: FileText, tooltip: "Invoices" },
  { label: "Reports", href: "/billing/reports", icon: LineChart, tooltip: "Reports" },
];

export default function BillingLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout title="Billing" navItems={navItems}>
      {children}
    </DashboardLayout>
  );
}

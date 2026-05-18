'use client';

import type { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Wallet, Receipt, Users, Clock } from "lucide-react";
import type { NavItem } from "@/components/dashboard-layout";

const navItems: NavItem[] = [
    { label: "Dashboard", href: "/finance/dashboard", icon: Wallet, tooltip: "Financial Overview" },
    { label: "Expenses", href: "/finance/expenses", icon: Receipt, tooltip: "Manage Expenditures" },
    { label: "Payroll", href: "/finance/payroll", icon: Users, tooltip: "Staff Payments" },
    { label: "Shift Reports", href: "/finance/shifts", icon: Clock, tooltip: "Shift Revenue Analysis" },
];

export default function FinanceLayout({ children }: { children: ReactNode }) {
    return (
        <DashboardLayout title="Finance Management" navItems={navItems}>
            {children}
        </DashboardLayout>
    );
}

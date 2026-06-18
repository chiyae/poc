'use client';

import type { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Home, CalendarDays } from "lucide-react";
import type { NavItem } from "@/components/dashboard-layout";

const navItems: NavItem[] = [
  { label: "Main Menu", href: "/", icon: Home, tooltip: "Main Menu" },
  { label: "Calculator", href: "/appointment-calculator", icon: CalendarDays, tooltip: "Appointment Calculator" },
];

export default function AppointmentCalculatorLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout title="Appointment Calculator" navItems={navItems}>
      {children}
    </DashboardLayout>
  );
}

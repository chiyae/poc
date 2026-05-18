
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PrintWrapperProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export function PrintWrapper({ children, title, className }: PrintWrapperProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={cn("print-container", className)}>
            {/* This header only shows during print */}
            <div className="hidden print:block mb-8 border-b pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-tight">MediTrack Pro</h1>
                        <p className="text-sm text-muted-foreground">Clinic Inventory & Management System</p>
                    </div>
                    <div className="text-right">
                        {title && <h2 className="text-xl font-semibold">{title}</h2>}
                        <p className="text-xs text-muted-foreground">
                            Generated on: {mounted ? new Date().toLocaleString() : "..."}
                        </p>
                    </div>
                </div>
            </div>

            {children}

            {/* This footer only shows during print */}
            <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
                <p>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> MediTrack Pro - Confidential Clinical Data</p>
            </div>
        </div>
    );
}

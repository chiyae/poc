'use client';

import * as React from 'react';
import { PayrollManager } from '@/components/finance/payroll-manager';

export default function PayrollPage() {
    return (
        <div className="space-y-6">
            <header className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight">Staff Payroll</h1>
                <p className="text-muted-foreground">Manage employee records and salary payments.</p>
            </header>
            <PayrollManager />
        </div>
    );
}

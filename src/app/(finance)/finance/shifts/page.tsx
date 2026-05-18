'use client';

import * as React from 'react';
import { ShiftReports } from '@/components/finance/shift-reports';

export default function ShiftReportsPage() {
    return (
        <div className="space-y-6">
            <header className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight">Shift Reports</h1>
                <p className="text-muted-foreground">Analyze income generated per shift period.</p>
            </header>
            <ShiftReports />
        </div>
    );
}

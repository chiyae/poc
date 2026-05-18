'use client';

import * as React from 'react';
import { useQuery } from '@/hooks/use-query';
import { getShiftIncomeReport } from '@/app/actions/index';
import { useSettings } from '@/context/settings-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sun, Moon, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export function ShiftReports() {
    const { formatCurrency } = useSettings();
    const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);

    const { data: report, isLoading } = useQuery<any>(
        () => getShiftIncomeReport(new Date(selectedDate)) as any,
        [selectedDate]
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 py-2">
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Select Date:</span>
                    <Input
                        type="date"
                        className="border-none h-8 w-[150px] text-sm font-bold p-0 focus-visible:ring-0"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Day Shift */}
                <Card className="border-orange-500/20 relative overflow-hidden h-44 flex flex-col justify-center">
                    <div className="absolute top-6 right-6 opacity-40">
                        <Sun className="h-5 w-5 text-orange-600" />
                    </div>
                    <CardHeader className="pb-1 pt-0">
                        <CardTitle className="text-xs font-black text-orange-600 uppercase tracking-[0.2em] opacity-80">Day Shift</CardTitle>
                        <CardDescription className="text-xs mt-0.5">07:30 — 17:30</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-0">
                        <div className="text-5xl font-black text-orange-600 tracking-tighter tabular-nums mb-1">
                            {isLoading ? '...' : formatCurrency(report?.dayShift.totalIncome || 0)}
                        </div>
                        <p className="text-xs text-orange-600/50 font-bold uppercase">
                            {isLoading ? '...' : report?.dayShift.billCount} transactions processed
                        </p>
                    </CardContent>
                </Card>

                {/* Night Shift */}
                <Card className="border-indigo-500/20 relative overflow-hidden h-44 flex flex-col justify-center">
                    <div className="absolute top-6 right-6 opacity-40">
                        <Moon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <CardHeader className="pb-1 pt-0">
                        <CardTitle className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] opacity-80">Night Shift</CardTitle>
                        <CardDescription className="text-xs mt-0.5">17:31 — 07:29 (Next Day)</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-0">
                        <div className="text-5xl font-black text-indigo-500 tracking-tighter tabular-nums mb-1">
                            {isLoading ? '...' : formatCurrency(report?.nightShift.totalIncome || 0)}
                        </div>
                        <p className="text-xs text-indigo-500/50 font-bold uppercase">
                            {isLoading ? '...' : report?.nightShift.billCount} transactions processed
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> Daily Combined Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Total Daily Revenue</span>
                            <p className="text-4xl font-black tracking-tighter tabular-nums">
                                {isLoading ? '...' : formatCurrency((report?.dayShift.totalIncome || 0) + (report?.nightShift.totalIncome || 0))}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Total Combined Invoices</span>
                            <p className="text-4xl font-black text-muted-foreground tracking-tighter tabular-nums">
                                {isLoading ? '...' : (report?.dayShift.billCount || 0) + (report?.nightShift.billCount || 0)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Shift Reconciliation Note</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    These figures are calculated automatically based on billing timestamps. Cashiers should perform manual cash counting at the end of each shift and compare with the "Actual Cash in Hand" expected for that period.
                </p>
            </div>
        </div>
    );
}

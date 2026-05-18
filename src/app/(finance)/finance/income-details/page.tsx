'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Save, Plus, ArrowUpRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getDailyIncomeAnalytics, upsertUnderFiveIncome } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import { useSettings } from '@/context/settings-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function IncomeDetailsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { formatCurrency } = useSettings();
    const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());

    // Under-five entry state
    const [ufDate, setUfDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
    const [ufAmount, setUfAmount] = React.useState('');
    const [isSavingUf, setIsSavingUf] = React.useState(false);

    const { data: dailyAnalytics, isLoading, refetch } = useQuery(
        () => getDailyIncomeAnalytics(selectedMonth, selectedYear),
        [selectedMonth, selectedYear]
    );

    const handleSaveUnderFive = async () => {
        if (!ufDate || !ufAmount) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a date and enter an amount.' });
            return;
        }
        setIsSavingUf(true);
        try {
            await upsertUnderFiveIncome(new Date(ufDate), parseFloat(ufAmount));
            toast({ title: 'Success', description: 'Under-five income updated successfully.' });
            setUfAmount('');
            refetch();
        } catch (error) {
            console.error('Error saving under-five income:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save under-five income.' });
        } finally {
            setIsSavingUf(false);
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Income Details</h1>
                        <p className="text-muted-foreground text-sm">Daily income breakdown by shift and category.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border rounded-md p-1">
                        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                            <SelectTrigger className="w-[130px] border-none h-8 text-xs font-medium">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m, i) => (
                                    <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                            <SelectTrigger className="w-[90px] border-none h-8 text-xs font-medium">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </header>

            {/* Shift Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-orange-500/20 relative overflow-hidden h-44 flex flex-col justify-center">
                    <div className="absolute top-6 right-6 opacity-40">
                        <Plus className="h-5 w-5 text-orange-600 rotate-45" />
                    </div>
                    <CardHeader className="pb-1 pt-0">
                        <CardTitle className="text-xs font-black text-orange-600 uppercase tracking-[0.2em] opacity-80">Day Shift</CardTitle>
                        <CardDescription className="text-xs mt-0.5">07:30 — 17:30</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-0">
                        <div className="text-5xl font-black text-orange-600 tracking-tighter tabular-nums mb-1">
                            {formatCurrency(dailyAnalytics?.find(d => d.date === ufDate)?.dayShift || 0)}
                        </div>
                        <p className="text-xs text-orange-600/50 font-bold uppercase">Selected date revenue</p>
                    </CardContent>
                </Card>

                <Card className="border-indigo-500/20 relative overflow-hidden h-44 flex flex-col justify-center">
                    <div className="absolute top-6 right-6 opacity-40">
                        <Calendar className="h-5 w-5 text-indigo-500" />
                    </div>
                    <CardHeader className="pb-1 pt-0">
                        <CardTitle className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] opacity-80">Night Shift</CardTitle>
                        <CardDescription className="text-xs mt-0.5">17:31 — 07:29 (Next Day)</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-0">
                        <div className="text-5xl font-black text-indigo-500 tracking-tighter tabular-nums mb-1">
                            {formatCurrency(dailyAnalytics?.find(d => d.date === ufDate)?.nightShift || 0)}
                        </div>
                        <p className="text-xs text-indigo-500/50 font-bold uppercase">Selected date revenue</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Under-five Entry Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Under-Five Entry</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Date</label>
                                <Input
                                    type="date"
                                    className="h-10"
                                    value={ufDate}
                                    onChange={(e) => setUfDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Daily Combined Total</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="h-14 text-2xl font-bold"
                                        value={ufAmount}
                                        onChange={(e) => setUfAmount(e.target.value)}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/20">
                                        <ArrowUpRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full" onClick={handleSaveUnderFive} disabled={isSavingUf}>
                                {isSavingUf ? 'Saving...' : 'Save Daily Total'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm">Monthly Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-5 pt-0">
                            <div className="flex justify-between items-baseline border-b pb-2">
                                <span className="text-xs text-muted-foreground">Daily Average</span>
                                <span className="text-xl font-bold tracking-tighter tabular-nums">
                                    {dailyAnalytics ? formatCurrency(dailyAnalytics.reduce((acc: number, d: any) => acc + d.total, 0) / dailyAnalytics.length) : '...'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Analytics Table */}
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ArrowUpRight className="h-4 w-4 text-primary" /> Combined Daily Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-center">Shift Total</TableHead>
                                        <TableHead className="text-center">Under-5</TableHead>
                                        <TableHead className="text-right">Gross Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 15 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-3 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-3 w-16 mx-auto" /></TableCell>
                                                <TableCell><Skeleton className="h-3 w-16 mx-auto" /></TableCell>
                                                <TableCell><Skeleton className="h-3 w-20 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        dailyAnalytics?.map((day: any) => (
                                            <TableRow key={day.date} className={`${day.date === ufDate ? 'bg-accent border-l-2 border-l-primary' : ''}`}>
                                                <TableCell className="font-medium text-xs py-4">
                                                    {format(new Date(day.date), 'dd MMM (EEE)')}
                                                </TableCell>
                                                <TableCell className="text-center text-xs tabular-nums">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-orange-600/80">{formatCurrency(day.dayShift)}</span>
                                                        <span className="text-muted-foreground/30">|</span>
                                                        <span className="text-indigo-500/80">{formatCurrency(day.nightShift)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center text-xs tabular-nums text-emerald-500/80">
                                                    {formatCurrency(day.underFive)}
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-bold tracking-tight tabular-nums">
                                                            {formatCurrency(day.total)}
                                                        </span>
                                                        <div className="flex gap-2 text-[9px] text-muted-foreground mt-0.5">
                                                            <span>M: {formatCurrency(day.categories.Medicines)}</span>
                                                            <span>L: {formatCurrency(day.categories.Laboratory)}</span>
                                                            <span>C: {formatCurrency(day.categories.Consultation)}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

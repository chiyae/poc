'use client';

import * as React from 'react';
import { useQuery } from '@/hooks/use-query';
import { getFinanceSummary, getExpenses, getPaySlips, getStockValueAnalytics } from '@/app/actions/index';
import { useSettings } from '@/context/settings-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Wallet, History, PieChart as PieChartIcon } from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c'];

export function FinanceDashboard() {
    const { formatCurrency } = useSettings();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const [month, setMonth] = React.useState(currentMonth);
    const [year, setYear] = React.useState(currentYear);

    const { data: summary, isLoading: loadingSummary } = useQuery<any>(
        () => getFinanceSummary(month, year) as any,
        [month, year]
    );

    const { data: recentExpenses } = useQuery<any[]>(() => getExpenses() as any, []);
    const { data: recentPayslips } = useQuery<any[]>(() => getPaySlips(month, year) as any, [month, year]);
    const { data: stockAnalytics, isLoading: loadingStock } = useQuery<any>(() => getStockValueAnalytics() as any, []);

    const recentTransactions = React.useMemo(() => {
        const transactions: any[] = [];

        recentExpenses?.slice(0, 5).forEach(e => {
            transactions.push({
                id: e.id,
                date: new Date(e.date),
                description: e.description,
                category: e.category,
                amount: e.amount,
                type: 'expense'
            });
        });

        recentPayslips?.slice(0, 5).forEach(({ payslip, employee }) => {
            transactions.push({
                id: payslip.id,
                date: new Date(payslip.paymentDate),
                description: `Salary: ${employee.firstName} ${employee.lastName}`,
                category: 'Personnel',
                amount: payslip.netPay,
                type: 'payroll'
            });
        });

        return transactions.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
    }, [recentExpenses, recentPayslips]);

    return (
        <div className="space-y-4">
            {/* Top Bar: Title + Period + Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Financial Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Period:</span>
                        <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                            <SelectTrigger className="w-[120px] h-7 text-xs font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>{Array.from({ length: 12 }).map((_, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>{format(new Date(2024, i, 1), 'MMMM')}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                            <SelectTrigger className="w-[85px] h-7 text-xs font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 flex-1 lg:max-w-2xl">
                    <Link href="/finance/income-details" className="block transition-all hover:scale-[1.01] active:scale-[0.99]">
                        <Card className="border-emerald-500/20 relative overflow-hidden h-20 flex flex-col justify-center px-3 group hover:border-emerald-500/40 transition-colors">
                            <CardTitle className="text-[9px] font-black text-emerald-500 uppercase tracking-wider opacity-70">Income</CardTitle>
                            <div className="text-lg font-black text-emerald-500 tracking-tighter tabular-nums truncate">
                                {loadingSummary ? '...' : formatCurrency(summary?.totalIncome || 0)}
                            </div>
                        </Card>
                    </Link>

                    <Card className="border-rose-500/20 relative overflow-hidden h-20 flex flex-col justify-center px-3 hover:border-rose-500/40 transition-colors">
                        <CardTitle className="text-[9px] font-black text-rose-500 uppercase tracking-wider opacity-70">Expenses</CardTitle>
                        <div className="text-lg font-black text-rose-500 tracking-tighter tabular-nums truncate">
                            {loadingSummary ? '...' : formatCurrency(summary?.totalExpenses || 0)}
                        </div>
                    </Card>

                    <Card className="border-border/50 relative overflow-hidden h-20 flex flex-col justify-center px-3">
                        <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-wider opacity-70">Net Profit</CardTitle>
                        <div className={`text-lg font-black tracking-tighter tabular-nums truncate ${(summary?.netProfit || 0) >= 0 ? 'text-foreground' : 'text-rose-500'}`}>
                            {loadingSummary ? '...' : formatCurrency(summary?.netProfit || 0)}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Stock Valuation Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Dispensary Stock Card */}
                <Card className="border-cyan-500/10 hover:border-cyan-500/30 transition-colors bg-cyan-500/[0.02]">
                    <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold text-cyan-500 tracking-wide uppercase">Dispensary Stock</CardTitle>
                        <div className="p-1 px-2 rounded-full bg-cyan-500/10 text-[9px] font-bold text-cyan-600 uppercase">Live</div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div><p className="text-[9px] font-bold text-muted-foreground uppercase">Buying Price</p><p className="text-sm font-black tracking-tight">{loadingStock ? '...' : formatCurrency(stockAnalytics?.dispensary?.buyingValue || 0)}</p></div>
                            <div><p className="text-[9px] font-bold text-muted-foreground uppercase">Selling Price</p><p className="text-sm font-black tracking-tight">{loadingStock ? '...' : formatCurrency(stockAnalytics?.dispensary?.sellingValue || 0)}</p></div>
                        </div>
                        <div className="pt-2 border-t border-border/40"><p className="text-[10px] font-black text-cyan-600 uppercase flex items-center justify-between">Potential Profit <span className="text-sm">{loadingStock ? '...' : formatCurrency(stockAnalytics?.dispensary?.potentialProfit || 0)}</span></p></div>
                    </CardContent>
                </Card>

                {/* Bulk Store Stock Card */}
                <Card className="border-amber-500/10 hover:border-amber-500/30 transition-colors bg-amber-500/[0.02]">
                    <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold text-amber-600 tracking-wide uppercase">Bulk Store Stock</CardTitle>
                        <div className="p-1 px-2 rounded-full bg-amber-500/10 text-[9px] font-bold text-amber-600 uppercase">Warehouse</div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0 space-y-3 flex flex-col justify-between">
                       <div className="grid grid-cols-2 gap-2">
                            <div><p className="text-[9px] font-bold text-muted-foreground uppercase">Value (Buy)</p><p className="text-sm font-black tracking-tight">{loadingStock ? '...' : formatCurrency(stockAnalytics?.bulkStore?.buyingValue || 0)}</p></div>
                            <div><p className="text-[9px] font-bold text-muted-foreground uppercase">Value (Sell)</p><p className="text-sm font-black tracking-tight">{loadingStock ? '...' : formatCurrency(stockAnalytics?.bulkStore?.sellingValue || 0)}</p></div>
                        </div>
                        <div className="pt-2 border-t border-border/40 opacity-0 h-4"></div>
                    </CardContent>
                </Card>

                {/* Total Overall Value Card */}
                <Card className="border-indigo-500/10 hover:border-indigo-500/30 transition-colors bg-indigo-500/[0.02]">
                   <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold text-indigo-600 tracking-wide uppercase">Total Inventory</CardTitle>
                        <div className="p-1 px-2 rounded-full bg-indigo-500/10 text-[9px] font-bold text-indigo-600 uppercase">Sum</div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0 space-y-3">
                        <div className="grid grid-cols-1 gap-2">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Grand Total Value</p>
                            <p className="text-2xl font-black tracking-tighter text-indigo-600">{loadingStock ? '...' : formatCurrency(stockAnalytics?.overall?.buyingValue || 0)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Area: Chart and Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <Card className="lg:col-span-3">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <PieChartIcon className="h-4 w-4 text-primary" /> Expense Breakdown
                            </CardTitle>
                            <CardDescription className="text-[10px]">Expenditure distribution by category</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[320px] pb-6">
                        {summary?.categoryBreakdown?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={summary.categoryBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {summary.categoryBreakdown.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                                No expenditure data for this period
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 flex flex-col min-h-[406px]">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <History className="h-4 w-4 text-primary" /> Recent Transactions
                        </CardTitle>
                        <CardDescription className="text-[10px]">Latest expenses and payroll</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto px-4 pb-4">
                        <div className="space-y-4">
                            {recentTransactions.length === 0 ? (
                                <div className="text-center py-20 text-xs text-muted-foreground font-medium">No recent activity detected</div>
                            ) : (
                                recentTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold leading-tight truncate max-w-[120px] md:max-w-none">{tx.description}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium">
                                                {format(tx.date, 'MMM dd')} • {tx.category}
                                            </p>
                                        </div>
                                        <div className="text-sm font-black text-rose-500 tracking-tighter tabular-nums">
                                            -{formatCurrency(tx.amount)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

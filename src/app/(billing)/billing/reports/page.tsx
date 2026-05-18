
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, FileWarning, CheckCircle, ArrowLeft, TrendingUp } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { subDays, isWithinInterval } from 'date-fns';
import { useSettings } from '@/context/settings-provider';
import { getBillings, getItems } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import type { Bill, Item } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';


export default function FinancialReportsPage() {
  const router = useRouter();
  const { formatCurrency } = useSettings();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const { data: billsData, isLoading: areBillsLoading } = useQuery<{ billings: Bill[]; totalCount: number }>(
    () => getBillings() as any,
    []
  );

  const { data: itemsData, isLoading: areItemsLoading } = useQuery<{ items: Item[]; totalCount: number }>(
    () => getItems() as any,
    []
  );

  const allBills = billsData?.billings || [];
  const allItems = itemsData?.items || [];


  const filteredBills = React.useMemo(() => {
    if (!allBills || !dateRange?.from || !dateRange?.to) {
      return [];
    }
    return allBills.filter(bill => isWithinInterval(new Date(bill.date), { start: dateRange.from!, end: dateRange.to! }));
  }, [allBills, dateRange]);


  const billsWithProfit = React.useMemo(() => {
    if (!filteredBills || !allItems) return [];
    return filteredBills.map(bill => {
      const profit = bill.items.reduce((currentBillProfit, billItem) => {
        // PRIORITIZE: Use the snapshot cost from the bill if it exists (Phase 3 improvements)
        // FALLBACK: Use current master item cost for legacy bills (pre-Phase 3)
        let buyingPrice = (billItem as any).buyingPrice;

        if (buyingPrice === undefined) {
          const masterItem = allItems.find(item => item.id === billItem.itemId);
          buyingPrice = masterItem?.buyingPrice ?? 0;
        }

        const lineItemProfit = (billItem.sellingPrice - buyingPrice) * billItem.quantity;
        return currentBillProfit + lineItemProfit;
      }, 0);
      return { ...bill, profit };
    })
  }, [filteredBills, allItems]);

  const { totalRevenue, paymentsReceived, outstandingAmount, totalProfit } = React.useMemo(() => {
    if (!billsWithProfit) return { totalRevenue: 0, paymentsReceived: 0, outstandingAmount: 0, totalProfit: 0 };

    const revenue = billsWithProfit.reduce((acc, bill) => acc + bill.grandTotal, 0);
    const received = billsWithProfit
      .filter(bill => bill.paymentDetails.status === 'Paid')
      .reduce((acc, bill) => acc + bill.grandTotal, 0);
    const profit = billsWithProfit.reduce((acc, bill) => acc + (bill.profit || 0), 0);

    return {
      totalRevenue: revenue,
      paymentsReceived: received,
      outstandingAmount: revenue - received,
      totalProfit: profit
    }
  }, [billsWithProfit]);

  const isLoading = areBillsLoading || areItemsLoading;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
            <p className="text-muted-foreground">Generate and review financial summaries for selected periods.</p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Select a date range to generate a financial summary for that period.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Money Made</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>}
            <p className="text-xs text-muted-foreground">
              Gross revenue (Total Billing).
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tentative Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</div>}
            <p className="text-xs text-muted-foreground">
              Earnings after cost deductions.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments Received</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(paymentsReceived)}</div>}
            <p className="text-xs text-muted-foreground">
              Total cash and digital payments received.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <FileWarning className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(outstandingAmount)}</div>}
            <p className="text-xs text-muted-foreground">
              Total amount on unpaid invoices.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Report</CardTitle>
          <CardDescription>A list of all bills within the selected date range.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))}
              {!isLoading && billsWithProfit.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No bills found in this date range.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && billsWithProfit.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-mono">{bill.id}</TableCell>
                  <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{bill.patientName}</TableCell>
                  <TableCell>
                    <Badge variant={bill.paymentDetails.status === 'Paid' ? 'default' : 'destructive'}>
                      {bill.paymentDetails.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(bill.profit)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(bill.grandTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

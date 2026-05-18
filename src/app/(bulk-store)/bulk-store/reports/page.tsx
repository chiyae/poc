
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { subDays, isWithinInterval } from 'date-fns';
import type { InternalOrder } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getInternalOrders, getItems } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';

export default function BulkStoreReportsPage() {
  const router = useRouter();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery<{ internalOrders: InternalOrder[]; totalCount: number }>(() => getInternalOrders() as any, []);
  const allOrders = ordersData?.internalOrders || [];
  const { data: itemsData, isLoading: isLoadingItems } = useQuery<{ items: any[]; totalCount: number }>(() => getItems() as any, []);
  const allItems = itemsData?.items || [];

  const stockMovementReport = React.useMemo(() => {
    if (!allOrders || !allItems || !dateRange?.from || !dateRange?.to) return [];

    // Only Issued orders represent movement out of bulk store
    const issuedOrders = allOrders.filter(o =>
      o.status === 'Issued' &&
      isWithinInterval(new Date(o.date), { start: dateRange.from!, end: dateRange.to! })
    );

    const movementCounts = issuedOrders.reduce((acc, order) => {
      order.items.forEach(item => {
        if (acc[item.itemId]) {
          acc[item.itemId].quantity += item.quantity;
        } else {
          const itemDetails = allItems.find(i => i.id === item.itemId);
          acc[item.itemId] = {
            itemName: itemDetails?.genericName || item.itemId,
            quantity: item.quantity
          }
        }
      });
      return acc;
    }, {} as Record<string, { itemName: string, quantity: number }>);

    return Object.entries(movementCounts)
      .map(([itemId, data]) => ({ ...data, itemId }))
      .sort((a, b) => b.quantity - a.quantity);

  }, [allOrders, allItems, dateRange]);


  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" /><span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bulk Store Reports</h1>
            <p className="text-muted-foreground">Analyze stock issuance and movement.</p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Issued Stock Summary</CardTitle>
          <CardDescription>Total quantities issued to dispensary within the selected period.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-3/4">Item Name</TableHead>
                <TableHead className="text-right">Total Quantity Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingOrders && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={2}><Skeleton className='h-8 w-full' /></TableCell></TableRow>
              ))}
              {!isLoadingOrders && stockMovementReport.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="h-24 text-center">No stock issued in this period.</TableCell></TableRow>
              ) : (
                stockMovementReport.map((item) => (
                  <TableRow key={item.itemId}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

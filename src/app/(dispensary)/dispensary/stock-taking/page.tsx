'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Item, Stock, StockTakeSession, StockTakeItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { formatItemName } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { getStockTakeItems, createStockTakeItem, updateStockTakeItem, getStocksByLocation, getItems, updateStockTakeSession, updateStock, getStockTakeSessions } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';

type EditableStockTakeItem = Omit<StockTakeItem, 'physicalQty'> & { physicalQty: number | '' };

function StockTakingContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  // We fetch sessions to get the current one
  const { data: sessionsData } = useQuery<{ sessions: StockTakeSession[]; totalCount: number }>(() => getStockTakeSessions() as any, []);
  const stockTakeSessions = sessionsData?.sessions || [];
  const sessionData = React.useMemo(() => stockTakeSessions.find(s => s.id === sessionId) || null, [stockTakeSessions, sessionId]);

  const { data: itemsData, isLoading: areItemsLoading, refetch: refetchItems } = useQuery<{ data: StockTakeItem[]; totalCount: number }>(
    () => sessionId ? getStockTakeItems(sessionId) as any : Promise.resolve({ data: [], totalCount: 0 }),
    [sessionId]
  );
  const stockTakeItems = itemsData?.data || [];

  const [editableItems, setEditableItems] = React.useState<EditableStockTakeItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const createStockTakeList = async () => {
      if (sessionData && stockTakeItems?.length === 0 && sessionData.status === 'Ongoing' && sessionId) {
        const [stocksData, itemsData] = await Promise.all([
          getStocksByLocation(sessionData.locationId) as any,
          getItems() as any,
        ]);
        const locationStocks = (stocksData as any).stocks || [];
        const allItems = (itemsData as any).items || [];

        for (const stock of locationStocks) {
          if (cancelled) return; // Stop if component unmounted
          const itemDetail = allItems.find((item: any) => item.id === stock.itemId);
          if (itemDetail) {
            const newItem: Omit<StockTakeItem, 'id'> = {
              sessionId: sessionId,
              itemId: stock.itemId,
              itemName: formatItemName(itemDetail),
              batchId: stock.batchId,
              expiryDate: (stock.expiryDate as any)?.toISOString?.() || String(stock.expiryDate),
              systemQty: stock.currentStockQuantity,
              physicalQty: stock.currentStockQuantity,
              variance: 0,
            };
            await createStockTakeItem(newItem as any);
          }
        }
        if (!cancelled) {
          toast({ title: 'Session Ready', description: 'Stock list has been loaded. You can start counting.' });
          refetchItems();
        }
      }
    };

    if (sessionData && !areItemsLoading && stockTakeItems?.length === 0) {
      createStockTakeList();
    }
    return () => { cancelled = true; };
  }, [sessionData, stockTakeItems, areItemsLoading, sessionId]);


  React.useEffect(() => {
    if (stockTakeItems) {
      setEditableItems(stockTakeItems.map(item => ({ ...item, physicalQty: item.physicalQty ?? '' })));
    }
  }, [stockTakeItems]);

  const handlePhysicalQtyChange = (itemId: string, value: string) => {
    setEditableItems(prevList =>
      prevList.map(item =>
        item.id === itemId ? { ...item, physicalQty: (value === '' ? '' : parseInt(value, 10)) as any } : item
      )
    );
  };

  const handleBlur = async (itemId: string, physicalQty: number | '') => {
    if (physicalQty === '') return;
    const originalItem = stockTakeItems?.find(i => i.id === itemId);
    if (!originalItem) return;
    const variance = physicalQty - originalItem.systemQty;
    await updateStockTakeItem(itemId, { physicalQty, variance });
  };

  const hasPendingChanges = editableItems.some(item => {
    const original = stockTakeItems?.find(i => i.id === item.id);
    if (!original) return false;
    return ((item.physicalQty as any) !== '' && item.physicalQty !== original.physicalQty);
  });

  const isLoading = !sessionData || areItemsLoading;

  const handleFinalizeStockTake = async () => {
    if (!stockTakeItems || !sessionData || !sessionId) return;

    const stocksData = await getStocksByLocation(sessionData.locationId) as any;
    const locationStocks = stocksData.stocks || [];

    for (const item of stockTakeItems) {
      if (item.variance !== 0) {
        const stockDoc = locationStocks.find(
          (s: any) => s.itemId === item.itemId && s.batchId === item.batchId
        );
        if (stockDoc) {
          await updateStock(stockDoc.id, { currentStockQuantity: item.physicalQty });
        }
      }
    }

    await updateStockTakeSession(sessionId, { status: 'Completed' });

    toast({ title: "Stock Take Finalized", description: "Inventory quantities have been updated successfully." });
    router.push('/dispensary/stock-take-history');
  };

  if (!sessionId) {
    return (
      <Card>
        <CardHeader><CardTitle>Error</CardTitle></CardHeader>
        <CardContent><p>No stock-take session ID provided. Please start a session from the inventory page.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Stock Taking Session</CardTitle>
            <CardDescription>
              {sessionData ? `Session for ${sessionData.locationId} started on ${format(new Date(sessionData.date), 'PPpp')}` : 'Loading session...'}
              {sessionData?.status === 'Completed' && <span className="text-destructive font-bold ml-2">(COMPLETED)</span>}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/5">Item Name (Batch)</TableHead>
                <TableHead className="text-center">System Qty</TableHead>
                <TableHead className="text-center">Physical Count</TableHead>
                <TableHead className="text-center">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={4}><Skeleton className='h-8 w-full' /></TableCell></TableRow>
              ))}
              {!isLoading && editableItems.map((item) => {
                const physicalQty = typeof item.physicalQty === 'string' ? null : Number(item.physicalQty);
                const variance = physicalQty === null ? null : physicalQty - item.systemQty;
                let varianceColor = '';
                if (variance !== null) {
                  if (variance < 0) varianceColor = 'text-destructive';
                  if (variance > 0) varianceColor = 'text-green-600';
                }
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.itemName} <span className="text-xs text-muted-foreground">({item.batchId})</span>
                    </TableCell>
                    <TableCell className="text-center">{item.systemQty}</TableCell>
                    <TableCell className="text-center">
                      <Input type="number" value={item.physicalQty} onChange={(e) => handlePhysicalQtyChange(item.id, e.target.value)} onBlur={(e) => handleBlur(item.id, e.target.value === '' ? '' : parseInt(e.target.value))} className="w-24 mx-auto text-center" min="0" disabled={sessionData?.status === 'Completed'} />
                    </TableCell>
                    <TableCell className={`text-center font-bold ${varianceColor}`}>
                      {variance !== null ? (variance > 0 ? `+${variance}` : variance) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && editableItems.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center h-48">Loading stock list for this session...</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {sessionData?.status === 'Ongoing' && (
        <CardFooter className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={hasPendingChanges || isLoading}>Finalize & Update Stock</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will update the system's stock quantities to match your physical counts. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinalizeStockTake}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}

export default function StockTakingPage() {
  return (
    <React.Suspense fallback={<Card><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>}>
      <StockTakingContent />
    </React.Suspense>
  );
}

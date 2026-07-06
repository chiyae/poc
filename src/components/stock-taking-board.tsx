'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Item, StockTakeSession, StockTakeItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { formatItemName } from '@/lib/utils';
import { ArrowLeft, Plus, Search, ClipboardList } from 'lucide-react';
import { getStockTakeItems, createStockTakeItem, createStockTakeItemsBulk, updateStockTakeItem, getStocksByLocation, getItems, commitStockTakeSession, approveStockTakeSession, getStockTakeSessionsByLocation, createStockTakeSession } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';

type EditableStockTakeItem = Omit<StockTakeItem, 'physicalQty'> & { physicalQty: number | '' };

interface StockTakingBoardProps {
  locationId: string;
  returnPath: string;
}

export function StockTakingBoardContent({ locationId, returnPath }: StockTakingBoardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const { data: sessionsData, isLoading: areSessionsLoading, refetch: refetchSessions } = useQuery<{ sessions: StockTakeSession[]; totalCount: number }>(() => getStockTakeSessionsByLocation(locationId) as any, [locationId]);
  const stockTakeSessions = sessionsData?.sessions || [];
  const sessionData = React.useMemo(() => stockTakeSessions.find(s => s.id === sessionId) || null, [stockTakeSessions, sessionId]);

  const { data: itemsData, isLoading: areItemsLoading, refetch: refetchItems } = useQuery<{ data: StockTakeItem[]; totalCount: number }>(
    () => sessionId ? getStockTakeItems(sessionId) as any : Promise.resolve({ data: [], totalCount: 0 }),
    [sessionId]
  );
  const stockTakeItems = itemsData?.data || [];
  const stockTakeItemsCount = stockTakeItems.length;

  const [editableItems, setEditableItems] = React.useState<EditableStockTakeItem[]>([]);
  
  // Search and Filter state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [variancesOnly, setVariancesOnly] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, variancesOnly]);

  // Add Unlisted Item State
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [unlistedItemId, setUnlistedItemId] = React.useState('');
  const [unlistedBatchId, setUnlistedBatchId] = React.useState('');
  const [unlistedExpiry, setUnlistedExpiry] = React.useState('');
  const [unlistedPhysicalQty, setUnlistedPhysicalQty] = React.useState<number | ''>('');
  const [isAddingItem, setIsAddingItem] = React.useState(false);

  const { data: allGlobalItemsData } = useQuery<{ items: Item[]; totalCount: number }>(() => getItems() as any, []);
  const allGlobalItems = allGlobalItemsData?.items || [];

  // Guard against re-running bulk creation multiple times while items are being saved
  const isInitializingRef = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;

    const createStockTakeList = async () => {
      // Only run when: session is loaded, it's Ongoing, items have been confirmed empty (not still loading), and not already running
      if (!sessionData || sessionData.status !== 'Ongoing' || !sessionId) return;
      if (areItemsLoading) return;
      if (stockTakeItemsCount > 0) return;
      if (isInitializingRef.current) return;

      isInitializingRef.current = true;
      try {
        const [stocksData, itemsDataResponse] = await Promise.all([
          getStocksByLocation(sessionData.locationId) as any,
          getItems() as any,
        ]);
        if (cancelled) return;

        const locationStocks = (stocksData as any).stocks || [];
        const allItems = (itemsDataResponse as any).items || [];

        const newItemsToCreate = [];
        for (const stock of locationStocks) {
          const itemDetail = allItems.find((item: any) => item.id === stock.itemId);
          if (itemDetail) {
            const newItem: Omit<StockTakeItem, 'id'> = {
              sessionId: sessionId,
              itemId: stock.itemId,
              itemName: formatItemName(itemDetail),
              batchId: stock.batchId,
              expiryDate: stock.expiryDate ? new Date(stock.expiryDate) : null,
              systemQty: stock.currentStockQuantity,
              physicalQty: stock.currentStockQuantity,
              variance: 0,
            };
            newItemsToCreate.push(newItem);
          }
        }

        if (!cancelled && newItemsToCreate.length > 0) {
          await createStockTakeItemsBulk(newItemsToCreate as any);
        }

        if (!cancelled) {
          toast({ title: 'Session Ready', description: 'Stock list has been loaded. You can start counting.' });
          refetchItems();
        }
      } finally {
        if (!cancelled) isInitializingRef.current = false;
      }
    };

    createStockTakeList();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData?.id, sessionData?.status, areItemsLoading, stockTakeItemsCount, sessionId, toast, refetchItems]);

  React.useEffect(() => {
    if (itemsData?.data) {
      setEditableItems(itemsData.data.map(item => ({ ...item, physicalQty: item.physicalQty ?? '' })));
    }
  }, [itemsData?.data]);

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

  const handleAddUnlistedItem = async () => {
    if (!unlistedItemId || unlistedPhysicalQty === '' || !sessionId) {
      toast({ variant: 'destructive', title: 'Missing Info', description: 'Please fill in all required fields.' });
      return;
    }
    
    setIsAddingItem(true);
    try {
      const itemDetail = allGlobalItems.find(i => i.id === unlistedItemId);
      if (!itemDetail) throw new Error("Item not found");

      const newItem: Omit<StockTakeItem, 'id'> = {
        sessionId: sessionId,
        itemId: unlistedItemId,
        itemName: formatItemName(itemDetail),
        batchId: unlistedBatchId || 'UNKNOWN',
        expiryDate: unlistedExpiry ? new Date(unlistedExpiry) : null,
        systemQty: 0,
        physicalQty: unlistedPhysicalQty as number,
        variance: unlistedPhysicalQty as number,
      };

      await createStockTakeItem(newItem as any);
      toast({ title: 'Item Added', description: 'Unlisted item has been added to the session.' });
      setIsAddDialogOpen(false);
      
      // Reset form
      setUnlistedItemId('');
      setUnlistedBatchId('');
      setUnlistedExpiry('');
      setUnlistedPhysicalQty('');
      
      refetchItems();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add unlisted item.' });
    } finally {
      setIsAddingItem(false);
    }
  };

  const hasPendingChanges = editableItems.some(item => {
    const original = stockTakeItems?.find(i => i.id === item.id);
    if (!original) return false;
    return ((item.physicalQty as any) !== '' && item.physicalQty !== original.physicalQty);
  });

  // Show loading when: items query is running, OR when we have a sessionId but sessions are still loading (so sessionData isn't resolved yet)
  const isLoading = areItemsLoading || (!!sessionId && areSessionsLoading && !sessionData);

  const handleSubmitForReview = async () => {
    if (!stockTakeItems || !sessionData || !sessionId) return;

    try {
      await commitStockTakeSession(sessionId);
      toast({ title: "Submitted for Review", description: "Stock take has been submitted to management for review." });
      router.push(returnPath);
    } catch (error) {
      console.error("Submission failed:", error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit stock take for review.' });
    }
  };

  const handleApproveStockTake = async () => {
    if (!stockTakeItems || !sessionData || !sessionId) return;

    try {
      await approveStockTakeSession(sessionId);
      toast({ title: "Session Approved", description: "Ledger updated successfully." });
      router.push(returnPath);
    } catch (error) {
      console.error("Approval failed:", error);
      toast({ variant: 'destructive', title: 'Approval Failed', description: 'Could not approve stock take. Check permissions.' });
    }
  };

  const ongoingSession = stockTakeSessions.find(s => s.status === 'Ongoing');
  const [isStartingSession, setIsStartingSession] = React.useState(false);

  const handleStartNewSession = async () => {
    setIsStartingSession(true);
    try {
      const newSession: any = {
        locationId,
        status: 'Ongoing'
      };
      const created = await createStockTakeSession(newSession);
      // Refetch sessions first so sessionData is populated when we navigate
      await refetchSessions();
      router.push(`?session=${created.id}`);
    } catch (error) {
      console.error("Failed to start stock take session:", error);
      toast({
        variant: 'destructive',
        title: 'Error Starting Session',
        description: 'Could not create a new stock-take session.',
      });
    } finally {
      setIsStartingSession(false);
    }
  };

  if (!sessionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Taking</CardTitle>
          <CardDescription>Manage your inventory stock counts for {locationId === 'dispensary' ? 'Dispensary' : 'Bulk Store'}.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <ClipboardList className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">No active session selected</h3>
            <p className="text-muted-foreground text-sm max-w-md mt-1">
              You can start a new stock-take session or resume an ongoing one to manage your inventory quantities.
            </p>
          </div>
          <div className="flex gap-4 mt-4">
            {ongoingSession ? (
              <Button onClick={() => router.push(`?session=${ongoingSession.id}`)}>
                Resume Ongoing Session
              </Button>
            ) : null}
            <Button variant={ongoingSession ? "outline" : "default"} onClick={handleStartNewSession} disabled={isStartingSession}>
              {isStartingSession ? "Starting..." : "Start New Stock Take"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter the items based on search and variance toggle
  const filteredItems = editableItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.batchId.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (variancesOnly) {
      const physicalQty = typeof item.physicalQty === 'string' ? null : Number(item.physicalQty);
      const variance = physicalQty === null ? null : physicalQty - item.systemQty;
      return variance !== 0 && variance !== null;
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      <CardContent className="space-y-4">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search items or batches..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="variance-mode" 
                checked={variancesOnly} 
                onCheckedChange={setVariancesOnly} 
              />
              <Label htmlFor="variance-mode">Variances Only</Label>
            </div>
          </div>
          
          {sessionData?.status === 'Ongoing' && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary"><Plus className="mr-2 h-4 w-4"/> Add Unlisted Item</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Unlisted Physical Item</DialogTitle>
                  <DialogDescription>
                    Add an item that is physically present but wasn't listed in the system's stock.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item" className="text-right">Item</Label>
                    <Select value={unlistedItemId} onValueChange={setUnlistedItemId}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                      <SelectContent>
                        {allGlobalItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>{formatItemName(item)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="batch" className="text-right">Batch ID</Label>
                    <Input id="batch" value={unlistedBatchId} onChange={(e) => setUnlistedBatchId(e.target.value)} placeholder="Optional" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expiry" className="text-right">Expiry</Label>
                    <Input id="expiry" type="date" value={unlistedExpiry} onChange={(e) => setUnlistedExpiry(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="qty" className="text-right">Count</Label>
                    <Input id="qty" type="number" min="0" value={unlistedPhysicalQty} onChange={(e) => setUnlistedPhysicalQty(e.target.value === '' ? '' : parseInt(e.target.value))} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddUnlistedItem} disabled={isAddingItem || !unlistedItemId || unlistedPhysicalQty === ''}>
                    {isAddingItem ? 'Adding...' : 'Add Item'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

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
              {!isLoading && paginatedItems.map((item) => {
                const physicalQty = typeof item.physicalQty === 'string' ? null : Number(item.physicalQty);
                const variance = physicalQty === null ? null : physicalQty - item.systemQty;
                let varianceColor = '';
                if (variance !== null) {
                  if (variance < 0) varianceColor = 'text-destructive';
                  if (variance > 0) varianceColor = 'text-green-600';
                }
                const isReadOnly = sessionData?.status === 'Completed' || sessionData?.status === 'Under Review';
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.itemName} <span className="text-xs text-muted-foreground">({item.batchId})</span>
                    </TableCell>
                    <TableCell className="text-center">{item.systemQty}</TableCell>
                    <TableCell className="text-center">
                      <Input type="number" value={item.physicalQty} onChange={(e) => handlePhysicalQtyChange(item.id, e.target.value)} onBlur={(e) => handleBlur(item.id, e.target.value === '' ? '' : parseInt(e.target.value))} className="w-24 mx-auto text-center" min="0" disabled={isReadOnly} />
                    </TableCell>
                    <TableCell className={`text-center font-bold ${varianceColor}`}>
                      {variance !== null ? (variance > 0 ? `+${variance}` : variance) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-48 text-muted-foreground">
                    {editableItems.length === 0 ? 'Loading stock list for this session...' : 'No items found matching your filters.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                Showing page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {sessionData?.status === 'Ongoing' && (
        <CardFooter className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={hasPendingChanges || isLoading}>Submit for Review</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Stock Take?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will submit your physical counts for management review. You will no longer be able to make changes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmitForReview}>Submit</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
      {sessionData?.status === 'Under Review' && (
        <CardFooter className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isLoading}>Approve & Update Ledger</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve Stock Take?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will apply the counted variances to the live inventory. Make sure you have thoroughly reviewed the discrepancies.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleApproveStockTake}>Approve & Update</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}

export default function StockTakingBoard(props: StockTakingBoardProps) {
  return (
    <React.Suspense fallback={<Card><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>}>
      <StockTakingBoardContent {...props} />
    </React.Suspense>
  );
}

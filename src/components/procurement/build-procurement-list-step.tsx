
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { Item, Stock } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ManuallyAddItemDialog } from './manually-add-item-dialog';
import { formatItemName } from '@/lib/utils';
import { getItems, getStocks } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';

interface BuildProcurementListStepProps {
  initialList: string[];
  onComplete: (procurementList: Item[]) => void;
}

export function BuildProcurementListStep({ initialList, onComplete }: BuildProcurementListStepProps) {
  const { data: itemsData, isLoading: areItemsLoading } = useQuery<{ items: Item[]; totalCount: number }>(() => getItems() as any, []);
  const { data: stocksData, isLoading: areStockLoading } = useQuery<{ stocks: Stock[]; items: any[]; totalCount: number }>(() => getStocks() as any, []);

  const allItems = React.useMemo(() => itemsData?.items || [], [itemsData?.items]);
  const allStock = React.useMemo(() => stocksData?.stocks || [], [stocksData?.stocks]);

  const [currentList, setCurrentList] = React.useState<Item[]>([]);
  const [isManualAddOpen, setIsManualAddOpen] = React.useState(false);

  React.useEffect(() => {
    if (allItems.length > 0 && initialList.length > 0) {
      const hydratedList = initialList
        .map(id => allItems.find(item => item.id === id))
        .filter((item): item is Item => !!item);
      
      setCurrentList(prev => {
        if (prev.length === hydratedList.length && prev.every((item, i) => item.id === hydratedList[i].id)) {
          return prev;
        }
        return hydratedList;
      });
    }
  }, [allItems, initialList]);

  const isLoading = areItemsLoading || areStockLoading;

  const lowStockItems = React.useMemo(() => {
    if (!allItems || !allStock) return [];

    return allItems.filter(item => {
      if (currentList.some(listItem => listItem.id === item.id)) {
        return false;
      }
      const totalStock = allStock
        .filter(s => s.itemId === item.id)
        .reduce((sum, s) => sum + s.currentStockQuantity, 0);
      return totalStock < item.bulkStoreReorderLevel;
    });
  }, [allItems, allStock, currentList]);

  const handleAddItem = (item: Item) => {
    if (!currentList.some(i => i.id === item.id)) {
      setCurrentList(prev => [...prev, item]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentList(prev => prev.filter(i => i.id !== itemId));
  };

  const itemsForManualAdd = React.useMemo(() => {
    if (!allItems) return [];
    return allItems.filter(item => !currentList.some(li => li.id === item.id));
  }, [allItems, currentList]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Build Procurement List</CardTitle>
          <CardDescription>Review items below minimum stock and manually add any other items needed.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Low Stock Items</h3>
            <ScrollArea className="h-96 rounded-md border">
              <Table>
                <TableBody>
                  {isLoading && Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-8 w-full" /></TableCell></TableRow>)}
                  {!isLoading && lowStockItems.length === 0 && <TableRow><TableCell className="h-96 text-center text-muted-foreground">No items are currently below reorder level.</TableCell></TableRow>}
                  {!isLoading && lowStockItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{formatItemName(item)}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleAddItem(item)}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center"><h3 className="text-lg font-semibold">Current List ({currentList.length})</h3><Button variant="outline" onClick={() => setIsManualAddOpen(true)}>Manually Add Item</Button></div>
            <ScrollArea className="h-96 rounded-md border">
              <Table>
                <TableBody>
                  {!isLoading && currentList.length === 0 && <TableRow><TableCell className="h-96 text-center text-muted-foreground">Add items using the low stock list or manually.</TableCell></TableRow>}
                  {currentList.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{formatItemName(item)}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 flex justify-end"><Button onClick={() => onComplete(currentList)} disabled={currentList.length === 0}>Next: Compare Prices</Button></div>
      <ManuallyAddItemDialog isOpen={isManualAddOpen} onOpenChange={setIsManualAddOpen} allItems={itemsForManualAdd} onItemSelected={handleAddItem} isLoading={isLoading} />
    </>
  );
}

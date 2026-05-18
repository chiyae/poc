
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReturnStockForm } from '@/components/return-stock-form';
import type { Item, InternalOrder, Stock } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ListPlus, ArrowLeft, RotateCcw } from 'lucide-react';
import { ManuallyAddItemDialog } from '@/components/procurement/manually-add-item-dialog';
import { formatItemName } from '@/lib/utils';
import { getItems, getStocksByLocation, createInternalOrder } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';

type ItemForReturn = { id: string; name: string; dispensaryQty: number };

export default function ReturnStockPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [returnItems, setReturnItems] = React.useState<ItemForReturn[]>([]);
    const [isFormVisible, setIsFormVisible] = React.useState(false);
    const [isManualAddOpen, setIsManualAddOpen] = React.useState(false);

    const { data: itemsData, isLoading: isLoadingItems } = useQuery<{ items: Item[]; totalCount: number }>(() => getItems() as any, []);
    const allItems = itemsData?.items || [];
    const { data: dispensaryStocksData, isLoading: isLoadingDispensaryStock } = useQuery<{ stocks: Stock[]; totalCount: number }>(() => getStocksByLocation('dispensary') as any, []);
    const dispensaryStocks = dispensaryStocksData?.stocks || [];

    const isLoading = isLoadingItems || isLoadingDispensaryStock;

    const getDispensaryStockForItem = React.useCallback((itemId: string): number => {
        if (!dispensaryStocks) return 0;
        return dispensaryStocks.filter(s => s.itemId === itemId).reduce((sum, s) => sum + s.currentStockQuantity, 0);
    }, [dispensaryStocks]);

    const handleManualAddItem = (item: Item) => {
        const qty = getDispensaryStockForItem(item.id);
        if (qty <= 0) {
            toast({ variant: 'destructive', title: "No Stock Available", description: `You don't have any ${formatItemName(item)} in the dispensary to return.` });
            return;
        }
        setReturnItems(prev => {
            if (prev.some(i => i.id === item.id)) return prev;
            return [...prev, { id: item.id, name: formatItemName(item), dispensaryQty: qty }];
        });
        setIsFormVisible(true);
    }

    const handleReturnStock = async (items: { itemId: string; quantity: number }[]) => {
        try {
            const newOrder: any = {
                requestingLocationId: 'bulk-store', // Requesting for bulk store (return source is dispensary)
                status: 'Pending',
                type: 'Return',
                items
            };
            await createInternalOrder(newOrder);
            toast({ title: "Stock Return Submitted", description: `Return request has been sent to the bulk store for acknowledgment.` });
            router.push('/dispensary/inventory');
        } catch (error) {
            console.error("Failed to submit stock return:", error);
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit the stock return." });
        }
    };

    if (isFormVisible) {
        return (
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div><CardTitle>Create Stock Return</CardTitle><CardDescription>Specify the quantities you are returning to the bulk store.</CardDescription></div>
                        <Button variant="outline" onClick={() => { setIsFormVisible(false); setReturnItems([]); }}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ReturnStockForm selectedItems={returnItems} onSubmit={handleReturnStock} onCancel={() => { setIsFormVisible(false); setReturnItems([]); }} onAddItem={() => setIsManualAddOpen(true)} />
                    <ManuallyAddItemDialog isOpen={isManualAddOpen} onOpenChange={setIsManualAddOpen} allItems={allItems || []} onItemSelected={handleManualAddItem} isLoading={isLoading} />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className='max-w-4xl mx-auto space-y-8'>
            <header className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /><span className="sr-only">Back</span></Button>
                <div><h1 className="text-3xl font-bold tracking-tight">Return Stock to Bulk Store</h1><p className="text-muted-foreground">Select items from your dispensary inventory to return to the bulk store.</p></div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsManualAddOpen(true)}>
                    <CardHeader><ListPlus className="h-8 w-8 text-primary mb-2" /><CardTitle>Select Items</CardTitle><CardDescription>Search and select items you want to return.</CardDescription></CardHeader>
                    <CardContent><Button variant="outline" className="w-full">{isLoading ? 'Loading master list...' : 'Search Inventory'}</Button></CardContent>
                </Card>
                <Card className="bg-muted/30 border-dashed">
                     <CardHeader><RotateCcw className="h-8 w-8 text-muted-foreground mb-2" /><CardTitle>Need to Correct Stock?</CardTitle><CardDescription>If you just need to correct a quantity mistake without moving items, use the "Stock Adjustment" tool in the inventory list.</CardDescription></CardHeader>
                </Card>
            </div>
            <ManuallyAddItemDialog isOpen={isManualAddOpen} onOpenChange={setIsManualAddOpen} allItems={allItems || []} onItemSelected={handleManualAddItem} isLoading={isLoading} />
        </div>
    );
}

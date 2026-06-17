
'use client';

import * as React from 'react';
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from '@radix-ui/react-icons';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Item, Vendor, Stock, StockTakeSession } from '@/lib/types';
import { format, differenceInDays } from 'date-fns';
import { ItemForm } from '@/components/item-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AdjustStockForm } from '@/components/adjust-stock-form';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { formatItemName } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ClipboardList, Printer, AlertTriangle } from 'lucide-react';
import { ItemDetails } from '@/components/item-details';
import { getItems, getStocksByLocation, getVendors, createItem, createStock, updateStock, createStockTakeSession, updateItem } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import { PrintWrapper } from '@/components/print-wrapper';
import { ItemInitializationForm } from '@/components/item-initialization-form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search } from 'lucide-react';

type BulkStoreInventoryItem = Item & {
  stock: Stock;
};

function BulkStoreInventoryContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: itemsData, isLoading: isItemsLoading, refetch: refetchItems } = useQuery<{ items: Item[]; totalCount: number }>(() => getItems() as any, []);
  const allItems = itemsData?.items || [];
  const { data: stocksData, isLoading: isStockLoading, refetch: refetchStock } = useQuery<{ stocks: Stock[]; totalCount: number }>(() => getStocksByLocation('bulk-store') as any, []);
  const allStock = stocksData?.stocks || [];
  const { data: vendors, isLoading: areVendorsLoading } = useQuery<Vendor[]>(() => getVendors() as any, []);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [showLowStockOnly, setShowLowStockOnly] = React.useState(false);

  // Read filter from URL on mount
  React.useEffect(() => {
    if (searchParams.get('filter') === 'low-stock') {
      setShowLowStockOnly(true);
    }
  }, [searchParams]);
  const [isAddItemFormOpen, setIsAddItemFormOpen] = React.useState(false);

  const [selectedItem, setSelectedItem] = React.useState<BulkStoreInventoryItem | null>(null);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const [isAddExistingOpen, setIsAddExistingOpen] = React.useState(false);
  const [selectedMasterItem, setSelectedMasterItem] = React.useState<Item | null>(null);
  const [isInitializeOpen, setIsInitializeOpen] = React.useState(false);

  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const [isPrintingAll, setIsPrintingAll] = React.useState(false);

  React.useEffect(() => {
    if (isPrintingAll) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrintingAll(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isPrintingAll]);

  const isLoading = isItemsLoading || isStockLoading || areVendorsLoading;

  const inventoryData: BulkStoreInventoryItem[] = React.useMemo(() => {
    if (!allItems || !allStock) return [];
    
    // Group stocks by itemId
    const itemMap = new Map<string, Stock[]>();
    allStock.forEach(s => {
      const existing = itemMap.get(s.itemId) || [];
      itemMap.set(s.itemId, [...existing, s]);
    });

    return allItems.map(item => {
      const itemStocks = itemMap.get(item.id) || [];
      if (itemStocks.length === 0) return null;
      
      // Use the first batch for basic row data
      return { ...item, stock: itemStocks[0] } as BulkStoreInventoryItem;
    }).filter((item): item is BulkStoreInventoryItem => item !== null);
  }, [allItems, allStock]);

  // Apply low-stock filter
  const filteredInventoryData = React.useMemo(() => {
    if (!showLowStockOnly) return inventoryData;
    return inventoryData.filter(item => {
      const totalStock = allStock
        .filter(s => s.itemId === item.id)
        .reduce((sum, s) => sum + s.currentStockQuantity, 0);
      return totalStock < item.bulkStoreReorderLevel;
    });
  }, [inventoryData, allStock, showLowStockOnly]);

  const handleCopyItemId = (itemId: string) => {
    navigator.clipboard.writeText(itemId);
    toast({ title: "Copied", description: `Item ID: ${itemId}` });
  }

  const handleOpenAdjustStock = (item: BulkStoreInventoryItem) => {
    setSelectedItem(item);
    setIsAdjustStockOpen(true);
  };

  const handleOpenDetails = (item: BulkStoreInventoryItem) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const handleAddItem = async (itemData: Omit<Item, 'id' | 'itemCode'>) => {
    setIsAddItemFormOpen(false);
    try {
      const codePrefix = itemData.genericName.substring(0, 3).toUpperCase();
      const codeSuffix = Math.floor(1000 + Math.random() * 9000);
      const itemCode = `${codePrefix}${codeSuffix}`;
      const newItem = { ...itemData, itemCode: itemCode };
      await createItem(newItem as any);
      toast({ title: "Item Added", description: `Successfully added ${formatItemName(newItem)}.` });
      refetchItems();
    } catch (error) {
      console.error("Error adding item:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add item.' });
    }
  };

  const handleStartStockTake = async () => {
    try {
      const newSession: any = {
        locationId: 'bulk-store',
        status: 'Ongoing'
      };

      const created = await createStockTakeSession(newSession);
      router.push(`/bulk-store/stock-taking?session=${created.id}`);
    } catch (error) {
      console.error("Failed to start stock take session:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create session.' });
    }
  };

  const handleAdjustStock = async (itemId: string, value: number, batchId?: string, expiryDate?: Date, isAbsolute?: boolean, originalStockId?: string) => {
    if (!selectedItem) return;
    setIsAdjustStockOpen(false);
    
    try {
      let stockToUpdate: Stock | undefined;
      const stockDoc = selectedItem.stock;

      if (originalStockId) {
        // If we have an ID, use it (best case)
        if (stockDoc && stockDoc.id === originalStockId) {
          stockToUpdate = stockDoc;
        }
      } else if (batchId) {
        // Fallback to batchId lookup
        if (stockDoc && stockDoc.batchId === batchId) {
          stockToUpdate = stockDoc;
        }
      }

      if (isAbsolute) {
        if (stockToUpdate) {
          await updateStock(stockToUpdate.id, { 
            currentStockQuantity: value,
            batchId: batchId,
            expiryDate: expiryDate ? expiryDate : new Date(stockToUpdate.expiryDate)
          } as any);
        } else {
          await createStock({
            itemId: itemId,
            locationId: 'bulk-store',
            currentStockQuantity: value,
            batchId: batchId || `B${Date.now()}`,
            expiryDate: expiryDate || new Date(),
          } as any);
        }
      } else {
        // Delta adjustment
        if (stockToUpdate) {
          await updateStock(stockToUpdate.id, { 
            currentStockQuantity: stockToUpdate.currentStockQuantity + value,
            batchId: batchId || stockToUpdate.batchId,
            expiryDate: expiryDate ? expiryDate : new Date(stockToUpdate.expiryDate)
          } as any);
        } else {
          await createStock({
            itemId: itemId,
            locationId: 'bulk-store',
            currentStockQuantity: value,
            batchId: batchId || `B${Date.now()}`,
            expiryDate: expiryDate || new Date(),
          } as any);
        }
      }
      
      toast({ title: "Stock Updated", description: `Successfully updated stock for ${itemId}.` });
      refetchStock();
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update stock.' });
    }
  };

  const handleInitializeSubmit = async (values: any) => {
    if (!selectedMasterItem) return;
    try {
      // 1. Update prices in Master List
      await updateItem(selectedMasterItem.id, {
        buyingPrice: values.buyingPrice,
        sellingPrice: values.sellingPrice,
        consultationPrice: values.consultationPrice,
      });

      // 2. Create the first batch in Bulk Store
      await createStock({
        itemId: selectedMasterItem.id,
        locationId: 'bulk-store',
        batchId: values.batchId,
        expiryDate: new Date(values.expiryDate),
        currentStockQuantity: values.initialQuantity,
      } as any);

      setIsInitializeOpen(false);
      setSelectedMasterItem(null);
      toast({ title: "Item Initialized", description: `${formatItemName(selectedMasterItem)} added to Bulk Store.` });
      refetchStock();
      refetchItems();
    } catch (error) {
      console.error("Error initializing item:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to initialize item.' });
    }
  };

  const columns: ColumnDef<BulkStoreInventoryItem>[] = [
    {
      id: 'select',
      header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} />,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} />,
      enableSorting: false, enableHiding: false,
    },
    {
      accessorKey: 'genericName',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Item Name<CaretSortIcon className="ml-2 h-4 w-4" /></Button>,
      cell: ({ row }) => (
        <div 
          className="capitalize font-medium cursor-pointer hover:text-primary transition-colors underline-offset-4 hover:underline"
          onClick={() => handleOpenDetails(row.original)}
        >
          {formatItemName(row.original)}
        </div>
      ),
    },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => <div className="capitalize">{row.getValue('category')}</div> },
    {
      id: 'nextExpiry',
      header: 'Soonest Expiry',
      cell: ({ row }) => {
        const itemStocks = allStock.filter(s => s.itemId === row.original.id);
        const soonest = itemStocks
          .filter(s => s.expiryDate)
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
        
        if (!soonest) return 'N/A';
        const expiryDate = new Date(soonest.expiryDate);
        const daysToExpiry = differenceInDays(expiryDate, new Date());
        
        let color = "";
        if (daysToExpiry < 30) color = "text-red-500 font-bold";
        else if (daysToExpiry < 90) color = "text-yellow-600 font-semibold";

        return <div className={color}>{format(expiryDate, "dd/MM/yyyy")}</div>;
      }
    },
    {
      id: 'totalInHand',
      header: () => <div className="text-right">Total Quantity</div>,
      cell: ({ row }) => {
        const totalStockForItem = allStock
          .filter(s => s.itemId === row.original.id)
          .reduce((sum, s) => sum + s.currentStockQuantity, 0);
        
        const isLowStock = totalStockForItem < row.original.bulkStoreReorderLevel;
        return <div className="text-right font-bold">{isLowStock ? <Badge variant="destructive">{totalStockForItem} (Low)</Badge> : totalStockForItem}</div>;
      },
    },
    {
      accessorKey: 'stock.expiryDate', header: 'Expiry Date', accessorFn: row => row.stock?.expiryDate,
      cell: ({ row }) => {
        const expiryDate = row.original.stock?.expiryDate;
        return <Badge variant={expiryDate ? 'secondary' : 'outline'}>{expiryDate ? format(new Date(expiryDate), 'dd/MM/yyyy') : 'N/A'}</Badge>;
      },
    },
    {
      id: 'actions', enableHiding: false,
      cell: ({ row }) => (<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><DotsHorizontalIcon className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem onClick={() => handleCopyItemId(row.original.id)}>Copy ID</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => handleOpenAdjustStock(row.original)}>Adjust stock</DropdownMenuItem></DropdownMenuContent></DropdownMenu>),
    },
  ];

  const table = useReactTable({ data: filteredInventoryData, columns, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), onColumnVisibilityChange: setColumnVisibility, onRowSelectionChange: setRowSelection, state: { sorting, columnFilters, columnVisibility, rowSelection } });

  return (
    <PrintWrapper title="Bulk Store Inventory Report">
      <div className={isPrintingAll ? "print:hidden w-full space-y-6" : "w-full space-y-6"}>
        <header className="flex items-start justify-between hide-on-print">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /><span className="sr-only">Back</span></Button>
            <div><h1 className="text-3xl font-bold tracking-tight">Bulk Store Inventory</h1><p className="text-muted-foreground">Manage stock levels for the main store.</p></div>
          </div>
        </header>

        {/* Filters and Search are hidden during print */}
        <div className="flex items-center justify-between py-4 hide-on-print">
          <div className="flex items-center gap-2">
            <Input placeholder="Filter items..." value={(table.getColumn('genericName')?.getFilterValue() as string) ?? ''} onChange={(event) => table.getColumn('genericName')?.setFilterValue(event.target.value)} className="max-w-sm" />
            <Button
              variant={showLowStockOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={showLowStockOnly ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
            >
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
              Low Stock {showLowStockOnly ? 'On' : 'Off'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Printer className="mr-2 h-4 w-4" /> Print...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="hide-on-print">
                <DropdownMenuItem onClick={() => window.print()}>
                  Print Current Page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsPrintingAll(true)}>
                  Print Entire List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleStartStockTake}><ClipboardList className="mr-2 h-4 w-4" />Start Stock Take</Button>
            <Button variant="outline" onClick={() => router.push('/tools/procurement-sessions')}>Procurement</Button>
            {isClient && (
              <>
                <Dialog open={isAddExistingOpen} onOpenChange={setIsAddExistingOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Search className="mr-2 h-4 w-4" />
                      Add Existing Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Search Master List</DialogTitle>
                      <DialogDescription>Search and select an existing item from the master list to add to the Bulk Store inventory.</DialogDescription>
                    </DialogHeader>
                    <Command className="rounded-lg border shadow-md">
                      <CommandInput placeholder="Search Master List..." />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No items found in Master List.</CommandEmpty>
                        <CommandGroup heading="Available Items">
                          {allItems
                            .filter(item => !inventoryData.some(inv => inv.id === item.id))
                            .map((item) => (
                            <CommandItem
                              key={item.id}
                              onSelect={() => {
                                setSelectedMasterItem(item);
                                setIsAddExistingOpen(false);
                                setIsInitializeOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{formatItemName(item)}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{item.itemCode} • {item.category}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAddItemFormOpen} onOpenChange={setIsAddItemFormOpen}>
                  <DialogTrigger asChild>
                    <Button>Add Item</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                      <DialogTitle>Add New Item</DialogTitle>
                    </DialogHeader>
                    <ItemForm onSubmit={handleAddItem} />
                  </DialogContent>
                </Dialog>
              </>
            )}
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="ml-auto">Columns</Button></DropdownMenuTrigger><DropdownMenuContent align="end">{table.getAllColumns().filter(c => c.getCanHide()).map(c => (<DropdownMenuCheckboxItem key={c.id} className="capitalize" checked={c.getIsVisible()} onCheckedChange={v => c.toggleVisibility(!!v)}>{c.id}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (<TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>))}
              {!isLoading && table.getRowModel().rows?.length ? (table.getRowModel().rows.map(row => (<TableRow key={row.id}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id} className="py-0.5 text-xs">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))) : !isLoading && (<TableRow><TableCell colSpan={6} className="h-24 text-center">No items.</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4 hide-on-print">
          <div className="flex-1 text-sm text-muted-foreground">{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.</div>
          <div className="space-x-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button></div>
        </div>
        {selectedItem && (<Dialog open={isAdjustStockOpen} onOpenChange={setIsAdjustStockOpen}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Adjust Stock: {formatItemName(selectedItem)}</DialogTitle></DialogHeader><AdjustStockForm item={selectedItem} onAdjustStock={handleAdjustStock} /></DialogContent></Dialog>)}
        {selectedItem && (
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#A0D2EB]">Item Details</DialogTitle>
              </DialogHeader>
              <ItemDetails item={selectedItem} locationId="bulk-store" />
            </DialogContent>
          </Dialog>
        )}

        {selectedMasterItem && (
          <Dialog open={isInitializeOpen} onOpenChange={setIsInitializeOpen}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-[#A0D2EB]">Initialize Item Stock</DialogTitle>
                <DialogDescription className="text-[11px]">
                  Setting up stock for this item in the Bulk Store. You can also update prices in the process.
                </DialogDescription>
              </DialogHeader>
              <ItemInitializationForm 
                item={selectedMasterItem} 
                onSubmit={handleInitializeSubmit} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      {isPrintingAll && filteredInventoryData && (
        <div className="hidden print:block w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-black border-b">Item Name</TableHead>
                <TableHead className="font-bold text-black border-b">Category</TableHead>
                <TableHead className="font-bold text-black border-b">Soonest Expiry</TableHead>
                <TableHead className="font-bold text-black border-b text-right">Total Quantity</TableHead>
                <TableHead className="font-bold text-black border-b">Expiry Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventoryData.map((item) => {
                const itemStocks = allStock.filter(s => s.itemId === item.id);
                const soonest = itemStocks
                  .filter(s => s.expiryDate)
                  .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
                
                let soonestExpiryText = 'N/A';
                if (soonest) {
                  soonestExpiryText = format(new Date(soonest.expiryDate), "dd/MM/yyyy");
                }

                const totalStockForItem = allStock
                  .filter(s => s.itemId === item.id)
                  .reduce((sum, s) => sum + s.currentStockQuantity, 0);

                const expiryDate = item.stock?.expiryDate;
                const expiryDateText = expiryDate ? format(new Date(expiryDate), 'dd/MM/yyyy') : 'N/A';

                return (
                  <TableRow key={item.id} className="border-b">
                    <TableCell className="py-2 capitalize font-medium">{formatItemName(item)}</TableCell>
                    <TableCell className="py-2 capitalize">{item.category}</TableCell>
                    <TableCell className="py-2">{soonestExpiryText}</TableCell>
                    <TableCell className="py-2 text-right">{totalStockForItem}</TableCell>
                    <TableCell className="py-2">{expiryDateText}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PrintWrapper>
  );
}

export default function BulkStoreInventoryPage() {
  return (
    <React.Suspense 
      fallback={
        <div className="w-full space-y-6 p-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex justify-between py-4">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="rounded-md border p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      }
    >
      <BulkStoreInventoryContent />
    </React.Suspense>
  );
}


'use client';

import { PaginationControls } from '@/components/pagination-controls';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CaretSortIcon,
  ChevronDownIcon,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
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
import type { Item, Stock, StockTakeSession } from '@/lib/types';
import { differenceInDays, parseISO, format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClipboardList, FilterX, Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemDetails } from '@/components/item-details';
import { formatItemName } from '@/lib/utils';
import { getItems, getInventoryItems, createStockTakeSession, createStock, updateItem, createPriceHistory } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, Plus, ArrowUpRight } from 'lucide-react';
import { ItemInitializationForm } from '@/components/item-initialization-form';
import { DialogDescription } from '@/components/ui/dialog';


type DispensaryStockItem = Item & {
  stockData: Stock;
};


function DispensaryInventoryContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const [selectedItem, setSelectedItem] = React.useState<DispensaryStockItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const [isAddExistingOpen, setIsAddExistingOpen] = React.useState(false);
  const [selectedMasterItem, setSelectedMasterItem] = React.useState<Item | null>(null);
  const [isInitializeOpen, setIsInitializeOpen] = React.useState(false);

  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const [isPrintingAll, setIsPrintingAll] = React.useState(false);
  const [printAllData, setPrintAllData] = React.useState<{ items: Item[]; stocks: Stock[] } | null>(null);
  const [isFetchingPrint, setIsFetchingPrint] = React.useState(false);

  const handlePrintAll = async () => {
    setIsFetchingPrint(true);
    try {
      const res = await getInventoryItems({ locationId: 'dispensary' }) as any;
      if (res) {
        setPrintAllData({ items: res.items ?? [], stocks: res.stocks ?? [] });
        setIsPrintingAll(true);
      }
    } catch (err) {
      console.error('Failed to fetch all inventory for print:', err);
    } finally {
      setIsFetchingPrint(false);
    }
  };

  React.useEffect(() => {
    if (isPrintingAll && printAllData) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrintingAll(false);
        setPrintAllData(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isPrintingAll, printAllData]);

  // --- Data Fetching ---
  const { data, isLoading: isLoadingStock, refetch } = useQuery<{ items: Item[]; stocks: Stock[]; totalCount: number }>(
    () => getInventoryItems({ 
      limit: pageSize, 
      offset: (page - 1) * pageSize,
      locationId: 'dispensary'
    }) as any,
    [page, pageSize]
  );

  const { data: itemsData, isLoading: isItemsLoading } = useQuery<{ items: Item[] }>(() => getItems() as any, []);
  const allMasterItems = itemsData?.items ?? [];

  const allItems = data?.items ?? [];
  const dispensaryStocks = data?.stocks ?? [];
  const totalCount = data?.totalCount ?? 0;
  const isLoadingItems = false; // Combined loading state

  const prefilter = searchParams.get('filter');

  const inventoryData: DispensaryStockItem[] = React.useMemo(() => {
    if (!allItems || !dispensaryStocks) return [];

    const itemMap = new Map<string, Stock[]>();
    dispensaryStocks.forEach(s => {
      const existing = itemMap.get(s.itemId) || [];
      itemMap.set(s.itemId, [...existing, s]);
    });

    let combinedData: DispensaryStockItem[] = allItems.map(item => {
      const itemStocks = itemMap.get(item.id) || [];
      if (itemStocks.length === 0) return null;
      return { ...item, stockData: itemStocks[0] };
    }).filter((item): item is DispensaryStockItem => item !== null);

    if (prefilter === 'low-stock') {
      const itemTotalStockMap = dispensaryStocks.reduce((acc, stock) => {
        acc[stock.itemId] = (acc[stock.itemId] || 0) + stock.currentStockQuantity;
        return acc;
      }, {} as Record<string, number>);

      const lowStockItemIds = new Set(
        allItems
          .filter(item => {
            const totalStock = itemTotalStockMap[item.id] || 0;
            return totalStock < item.dispensaryReorderLevel;
          })
          .map(item => item.id)
      );

      combinedData = combinedData.filter(item => lowStockItemIds.has(item.id));
    } else if (prefilter === 'near-expiry') {
      combinedData = combinedData.filter(item => {
        const { stockData } = item;
        if (!stockData.expiryDate) return false;
        const daysToExpiry = differenceInDays(parseISO(stockData.expiryDate), new Date());
        return daysToExpiry >= 0 && daysToExpiry <= 30;
      });
    }

    return combinedData;
  }, [allItems, dispensaryStocks, prefilter]);


  const handleStartStockTake = async () => {
    try {
      const newSession: any = {
        locationId: 'dispensary',
        status: 'Ongoing'
      };

      const created = await createStockTakeSession(newSession);
      router.push(`/dispensary/stock-taking?session=${created.id}`);
    } catch (error) {
      console.error("Failed to start stock take session:", error);
      toast({
        variant: 'destructive',
        title: 'Error Starting Session',
        description: 'Could not create a new stock-take session.',
      });
    }
  };

  const handleInitializeSubmit = async (values: any) => {
    if (!selectedMasterItem) return;

    try {
      // 1. Create the stock record for the Dispensary
      await createStock({
        itemId: selectedMasterItem.id,
        locationId: 'dispensary', // MUST be dispensary
        batchId: values.batchId,
        expiryDate: new Date(values.expiryDate),
        currentStockQuantity: values.initialQuantity,
      } as any);

      // 2. Optionally update prices if they changed
      const priceChanges: Partial<Item> = {};
      if (values.buyingPrice !== selectedMasterItem.buyingPrice) priceChanges.buyingPrice = values.buyingPrice;
      if (values.sellingPrice !== selectedMasterItem.sellingPrice) priceChanges.sellingPrice = values.sellingPrice;
      if (values.consultationPrice !== selectedMasterItem.consultationPrice) priceChanges.consultationPrice = values.consultationPrice;

      if (Object.keys(priceChanges).length > 0) {
        await updateItem(selectedMasterItem.id, priceChanges);
        if (priceChanges.buyingPrice) await createPriceHistory({ itemId: selectedMasterItem.id, type: 'buyingPrice', price: values.buyingPrice });
        if (priceChanges.sellingPrice) await createPriceHistory({ itemId: selectedMasterItem.id, type: 'sellingPrice', price: values.sellingPrice });
      }

      toast({
        title: "Item Initialized",
        description: `${formatItemName(selectedMasterItem)} added to Dispensary inventory.`,
      });

      setIsInitializeOpen(false);
      refetch(); // Refresh list
    } catch (error) {
      console.error("Initialization error:", error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to initialize item stock.",
      });
    }
  };

  const handleOpenDetails = (item: DispensaryStockItem) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const columns: ColumnDef<DispensaryStockItem>[] = [
    {
      accessorKey: 'genericName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Item Name
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div 
          className="capitalize cursor-pointer hover:text-primary transition-colors underline-offset-4 hover:underline font-medium"
          onClick={() => handleOpenDetails(row.original)}
        >
          {formatItemName(row.original)}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <div className="capitalize">{row.original.category}</div>
      ),
    },
    {
      id: 'nextExpiry',
      header: 'Soonest Expiry',
      cell: ({ row }) => {
        const itemStocks = dispensaryStocks.filter(s => s.itemId === row.original.id);
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
        const totalStock = dispensaryStocks
          ?.filter(s => s.itemId === row.original.id)
          .reduce((sum, s) => sum + s.currentStockQuantity, 0) || 0;

        const isLowStock = row.original.dispensaryReorderLevel && totalStock < row.original.dispensaryReorderLevel;

        return (
          <div className="text-right font-bold">
            {isLowStock ? (
              <Badge variant="destructive">
                {totalStock} (Low)
              </Badge>
            ) : (
              totalStock
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'expiryDate',
      header: 'Expiry Date',
      accessorFn: row => row.stockData.expiryDate,
      cell: ({ row }) => {
        const expiryDateStr = row.original.stockData.expiryDate;
        if (!expiryDateStr) return <Badge variant="outline">N/A</Badge>;

        const expiryDate = parseISO(expiryDateStr);
        const daysToExpiry = differenceInDays(expiryDate, new Date());
        let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';

        if (daysToExpiry < 0) {
          badgeVariant = 'destructive';
        } else if (daysToExpiry <= 30) {
          badgeVariant = 'destructive';
        }

        return <Badge variant={badgeVariant}>{new Date(expiryDate).toLocaleDateString()}</Badge>;

      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" onClick={() => handleOpenDetails(row.original)}>View</Button>
      ),
    },
  ];

  const table = useReactTable({
    data: inventoryData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const isLoading = isLoadingItems || isLoadingStock;

  return (
    <>
    <div className="space-y-4">
      <header className="flex items-center justify-between border-b pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dispensary Inventory</h1>
          <p className="text-xs text-muted-foreground">Manage medicines currently stocked.</p>
        </div>
      </header>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Filter items..."
            value={(table.getColumn('genericName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('genericName')?.setFilterValue(event.target.value)
            }
            className="max-w-xs h-8 text-xs"
          />
          {prefilter && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => router.push('/dispensary/inventory')}>
              <FilterX className="mr-1 h-3 w-3" /> Clear
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => router.push('/dispensary/return-stock')}>
            <ArrowUpRight className="mr-1 h-3 w-3" />
            Return Stock
          </Button>

          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleStartStockTake}>
            <ClipboardList className="mr-1 h-3 w-3" />
            Stock Take
          </Button>

          <Dialog open={isAddExistingOpen} onOpenChange={setIsAddExistingOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Search className="mr-1 h-3 w-3" />
                Add Existing Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
              <DialogHeader className="sr-only">
                <DialogTitle>Search Master List</DialogTitle>
              </DialogHeader>
              <Command className="rounded-lg border shadow-md">
                <CommandInput placeholder="Search Master List..." />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>No items found in Master List.</CommandEmpty>
                  <CommandGroup heading="Available Items">
                    {allMasterItems
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs" disabled={isFetchingPrint}>
                <Printer className="mr-1 h-3 w-3" /> {isFetchingPrint ? 'Preparing...' : 'Print...'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.print()}>
                Print Current Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintAll}>
                Print Entire List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Columns <ChevronDownIcon className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-10 text-xs py-0">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={columns.length}><Skeleton className='h-8 w-full' /></TableCell></TableRow>
            ))}
            {!isLoading && table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-0.5 text-xs">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : null}
            {!isLoading && !table.getRowModel().rows?.length ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {prefilter ? `No items match the filter: "${prefilter}"` : "No medicines in dispensary inventory."}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        page={page}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      {selectedItem && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Item Details</DialogTitle>
            </DialogHeader>
            <ItemDetails item={selectedItem} locationId="dispensary" />
          </DialogContent>
        </Dialog>
      )}

      {selectedMasterItem && (
        <Dialog open={isInitializeOpen} onOpenChange={setIsInitializeOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-[#A0D2EB]">Initialize Dispensary Stock</DialogTitle>
              <DialogDescription className="text-[11px]">
                Entering stock currently on the shelf in the Dispensary.
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
    {isPrintingAll && printAllData && (
      <div className="hidden print:block w-full mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-black border-b">Item Name</TableHead>
              <TableHead className="font-bold text-black border-b">Category</TableHead>
              <TableHead className="font-bold text-black border-b">Batch</TableHead>
              <TableHead className="font-bold text-black border-b">Expiry Date</TableHead>
              <TableHead className="font-bold text-black border-b text-right">Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {printAllData.items.map((item) => {
              const itemStocks = printAllData.stocks.filter(s => s.itemId === item.id);
              const primaryStock = itemStocks.sort((a, b) =>
                new Date(a.expiryDate ?? '9999').getTime() - new Date(b.expiryDate ?? '9999').getTime()
              )[0];
              const totalQty = itemStocks.reduce((sum, s) => sum + s.currentStockQuantity, 0);
              return (
                <TableRow key={item.id} className="border-b">
                  <TableCell className="py-2 capitalize font-medium">{formatItemName(item)}</TableCell>
                  <TableCell className="py-2 capitalize">{item.category}</TableCell>
                  <TableCell className="py-2 font-mono text-xs">{primaryStock?.batchId ?? 'N/A'}</TableCell>
                  <TableCell className="py-2">{primaryStock?.expiryDate ? format(new Date(primaryStock.expiryDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                  <TableCell className="py-2 text-right font-semibold">{totalQty}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    )}
    </>
  );
}

export default function DispensaryInventoryPage() {
  return (
    <React.Suspense fallback={<div className="space-y-6"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-96 w-full" /></div>}>
      <DispensaryInventoryContent />
    </React.Suspense>
  );
}

'use client';

import { PaginationControls } from '@/components/pagination-controls';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
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
import type { Item, PriceHistory } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { getItems, createItem, updateItem, createPriceHistory } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/context/settings-provider';
import { ItemForm } from '@/components/item-form';
import { ItemImportDialog } from '@/components/item-import-dialog';
import { ArrowLeft, Upload } from 'lucide-react';
import { formatItemName } from '@/lib/utils';
import { useRouter } from 'next/navigation';


export default function ItemMasterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currency, formatCurrency } = useSettings();

  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  const { data, isLoading, error, refetch } = useQuery<{ items: Item[]; totalCount: number }>(
    () => getItems({ limit: pageSize, offset: (page - 1) * pageSize }) as any,
    [page, pageSize]
  );
  
  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<Item | null>(null);

  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCopyItemId = (itemId: string) => {
    navigator.clipboard.writeText(itemId);
    toast({
      title: "Copied to Clipboard",
      description: `Item Code: ${itemId}`,
    });
  }

  const handleOpenDialog = (item: Item | null) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedItem(null);
  }

  const handleFormSubmit = async (itemData: Omit<Item, 'id' | 'itemCode'>) => {

    if (selectedItem) { // Editing existing item
      try {
        await updateItem(selectedItem.id, itemData);

        // Log buyingPrice change if it differs
        if (itemData.buyingPrice !== selectedItem.buyingPrice) {
          await createPriceHistory({
            itemId: selectedItem.id,
            type: 'buyingPrice',
            price: itemData.buyingPrice,
          });
        }

        // Log sellingPrice change if it differs
        if (itemData.sellingPrice !== selectedItem.sellingPrice) {
          await createPriceHistory({
            itemId: selectedItem.id,
            type: 'sellingPrice',
            price: itemData.sellingPrice,
          });
        }

        handleCloseDialog();
        refetch();
        toast({
          title: "Item Updated",
          description: `Successfully updated ${formatItemName(itemData as Item)}.`
        })
      } catch (error) {
        console.error("Error updating item:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update item. Please try again."
        })
      }
    } else { // Adding new item
      try {
        const codePrefix = itemData.genericName.substring(0, 3).toUpperCase();
        const codeSuffix = Math.floor(1000 + Math.random() * 9000);
        const itemCode = `${codePrefix}${codeSuffix}`;

        const finalData = {
          ...itemData,
          itemCode: itemCode,
        };

        const created = await createItem(finalData as any);

        // Log initial buyingPrice
        await createPriceHistory({
          itemId: created.id,
          type: 'buyingPrice',
          price: finalData.buyingPrice,
        });

        // Log initial sellingPrice
        await createPriceHistory({
          itemId: created.id,
          type: 'sellingPrice',
          price: finalData.sellingPrice,
        });

        handleCloseDialog();
        refetch();
        toast({
          title: "Item Added",
          description: `Successfully added ${formatItemName(finalData as Item)}.`
        })
      } catch (error) {
        console.error("Error adding item:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add item. Please try again."
        })
      }
    }
  };


  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: 'itemCode',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Item Code
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue('itemCode')}</div>,
    },
    {
      accessorKey: 'itemName',
      header: 'Item Name',
      cell: ({ row }) => <div className="font-medium">{formatItemName(row.original)}</div>,
    },
    {
      accessorKey: 'formulation',
      header: 'Formulation',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('formulation')}</div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('category')}</div>
      ),
    },
    {
      accessorKey: 'buyingPrice',
      header: () => <div className="text-right">Buying Price</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("buyingPrice"))
        return <div className="text-right font-medium">{formatCurrency(amount)}</div>
      },
    },
    {
      accessorKey: 'sellingPrice',
      header: () => <div className="text-right">Selling Price</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("sellingPrice"))
        return <div className="text-right font-medium">{formatCurrency(amount)}</div>
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleCopyItemId(item.itemCode)}>
                Copy item Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                Edit item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: items ?? [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view the item master data.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between">
        <header className="space-y-1.5">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Item Master Data</h1>
              <p className="text-muted-foreground">Define and manage all inventory item definitions.</p>
            </div>
          </div>
        </header>
        <div className="flex items-center gap-2">
          {isClient && (
            <>
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import from CSV
              </Button>
              <Button onClick={() => handleOpenDialog(null)}>Add New Item</Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
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
      <div className="flex items-center">
        <Input
          placeholder="Filter items by name..."
          value={(table.getColumn('itemName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('itemName')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-10 py-0 text-xs">
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
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              !isLoading && <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No items found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
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

      {isClient && (
        <>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{selectedItem ? `Edit Item: ${formatItemName(selectedItem)}` : 'Add New Master Item'}</DialogTitle>
                <DialogDescription>
                  {selectedItem ? 'Update the details for this item. The item code cannot be changed.' : 'Define a new item that can be stocked in inventory. The item code will be generated automatically.'}
                </DialogDescription>
              </DialogHeader>
              <ItemForm
                item={selectedItem}
                onSubmit={handleFormSubmit}
              />
            </DialogContent>
          </Dialog>

          <ItemImportDialog isOpen={isImportOpen} onOpenChange={setIsImportOpen} />
        </>
      )}
    </div>
  );
}

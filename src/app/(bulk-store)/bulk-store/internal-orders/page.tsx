
'use client';

import * as React from 'react';
import { CaretSortIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { InternalOrder, OrderStatus, Stock, Item } from '@/lib/types';
import { format, subDays, isWithinInterval } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { getInternalOrders, getStocks, getItems, updateInternalOrder, updateStock, createStock, issueInternalOrder } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';

export default function InternalOrderManagementPage() {
  const { toast } = useToast();

  const { data: ordersData, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery<{ internalOrders: InternalOrder[]; totalCount: number }>(() => getInternalOrders() as any, []);
  const internalOrders = ordersData?.internalOrders || [];
  const { data: stocksData, isLoading: isLoadingStock, refetch: refetchStock } = useQuery<{ stocks: Stock[]; totalCount: number }>(() => getStocks() as any, []);
  const { data: itemsData, isLoading: isLoadingItems } = useQuery<{ items: Item[]; totalCount: number }>(() => getItems() as any, []);

  const allStock = stocksData?.stocks || [];
  const allItems = itemsData?.items || [];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [selectedOrder, setSelectedOrder] = React.useState<InternalOrder | null>(null);
  const [issuedQuantities, setIssuedQuantities] = React.useState<Record<string, number>>({});
  const [isViewOrderOpen, setIsViewOrderOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredData = React.useMemo(() => {
    if (!internalOrders) return [];
    if (!dateRange?.from) return internalOrders;

    return internalOrders.filter(order => {
      try {
        const orderDate = new Date(order.date);
        return isWithinInterval(orderDate, { start: dateRange.from!, end: dateRange.to || new Date() });
      } catch (e) {
        return false;
      }
    });
  }, [internalOrders, dateRange]);

  const handleOpenViewOrder = (order: InternalOrder) => {
    setSelectedOrder(order);
    const initialQtys: Record<string, number> = {};
    order.items.forEach(item => {
        initialQtys[item.itemId] = item.quantity;
    });
    setIssuedQuantities(initialQtys);
    setIsViewOrderOpen(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'Issued' | 'Rejected') => {
    if (!selectedOrder) return;
    setIsProcessing(true);

    try {
      if (status === 'Issued') {
        // All the complex logic is now safely tucked away in the server action
        await issueInternalOrder(orderId, issuedQuantities);
        const isReturn = selectedOrder.type === 'Return';
        toast({ 
          title: isReturn ? "Return Acknowledged" : "Stock Issued", 
          description: isReturn 
            ? `Stock for order ${orderId} has been returned to bulk store.` 
            : `Stock for order ${orderId} has been transferred and order marked as Issued.` 
        });
      } else {
        await updateInternalOrder(orderId, { status });
        toast({ title: "Order Rejected", description: `Order ${orderId} has been marked as Rejected.` });
      }
      
      setIsViewOrderOpen(false);
      refetchOrders();
      refetchStock();
    } catch (error: any) {
      console.error(`Error updating order ${orderId} to ${status}:`, error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message || 'Could not update order status.' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: ColumnDef<InternalOrder>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Order ID<CaretSortIcon className="ml-2 h-4 w-4" /></Button>,
      cell: ({ row }) => <div className="font-mono">{row.getValue('id')}</div>,
    },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => format(new Date(row.getValue('date')), 'dd/MM/yyyy') },
    { accessorKey: 'requestingLocationId', header: 'From' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.type || 'Request';
        return <Badge variant="outline" className="capitalize">{type}</Badge>;
      },
    },
    {
      accessorKey: 'status', header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as OrderStatus;
        const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
          status === 'Issued' ? 'default' : status === 'Pending' ? 'secondary' : status === 'Rejected' ? 'destructive' : 'outline';
        return <Badge variant={variant} className="capitalize">{status}</Badge>;
      },
    },
    { id: 'actions', cell: ({ row }) => <Button variant="ghost" onClick={() => handleOpenViewOrder(row.original)}>View Request</Button> },
  ];

  const table = useReactTable({ data: filteredData ?? [], columns, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), onColumnVisibilityChange: setColumnVisibility, onRowSelectionChange: setRowSelection, state: { sorting, columnFilters, columnVisibility, rowSelection } });

  const isLoading = isLoadingOrders || isLoadingStock || isLoadingItems;

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4">
        <Input placeholder="Filter by Order ID..." value={(table.getColumn('id')?.getFilterValue() as string) ?? ''} onChange={(event) => table.getColumn('id')?.setFilterValue(event.target.value)} className="max-w-sm" />
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="ml-auto">Columns <ChevronDownIcon className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{table.getAllColumns().filter(c => c.getCanHide()).map(c => (<DropdownMenuCheckboxItem key={c.id} className="capitalize" checked={c.getIsVisible()} onCheckedChange={v => c.toggleVisibility(!!v)}>{c.id}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (<TableRow key={i}><TableCell colSpan={columns.length}><Skeleton className="h-8 w-full" /></TableCell></TableRow>))}
            {!isLoading && table.getRowModel().rows?.length ? (table.getRowModel().rows.map(row => (<TableRow key={row.id}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))) : null}
            {!isLoading && !table.getRowModel().rows.length ? (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No orders found.</TableCell></TableRow>) : null}
          </TableBody>
        </Table>
      </div>
      {selectedOrder && (
        <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>Internal Order Request</DialogTitle><DialogDescription>{`Order ID: ${selectedOrder.id} | From: ${selectedOrder.requestingLocationId} | Status: `}<Badge variant={selectedOrder.status === 'Issued' ? 'default' : selectedOrder.status === 'Pending' ? 'secondary' : 'destructive'} className="capitalize">{selectedOrder.status}</Badge></DialogDescription></DialogHeader>
            <div className="space-y-4"><ScrollArea className="max-h-80"><Table><TableHeader><TableRow><TableHead>Item Name</TableHead><TableHead>Requested Quantity</TableHead><TableHead className="text-right">Stock on Hand</TableHead></TableRow></TableHeader>
              <TableBody>
                {selectedOrder.items.map((item) => {
                  const itemDetails = allItems?.find(i => i.id === item.itemId);
                  const availableStock = allStock?.find(s => s.itemId === item.itemId && s.locationId === 'bulk-store')?.currentStockQuantity || 0;
                  const isInsufficient = availableStock < (issuedQuantities[item.itemId] ?? item.quantity);
                  const isPending = selectedOrder.status === 'Pending';

                  return (
                    <TableRow key={item.itemId} className={isInsufficient ? "bg-destructive/10" : ""}>
                      <TableCell className="font-medium">{itemDetails?.genericName || item.itemId}</TableCell>
                      <TableCell>
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground line-through">Requested: {item.quantity}</span>
                            <Input 
                              type="number" 
                              className="w-24 h-8" 
                              value={issuedQuantities[item.itemId] ?? item.quantity}
                              onChange={(e) => setIssuedQuantities(prev => ({ ...prev, [item.itemId]: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        ) : (
                          <span>{item.quantity}</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right ${isInsufficient ? 'text-destructive font-bold' : ''}`}>
                        {availableStock}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></ScrollArea></div>
            <DialogFooter className="sm:justify-between">
              <div>{selectedOrder.status === 'Pending' && (<Button variant="destructive" onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Rejected')} disabled={isProcessing}>Reject</Button>)}</div>
              <div className="flex gap-2"><DialogClose asChild><Button variant="outline">Close</Button></DialogClose>{selectedOrder.status === 'Pending' && (<Button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Issued')} disabled={isProcessing}>{isProcessing ? 'Issuing...' : 'Approve & Issue Stock'}</Button>)}</div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

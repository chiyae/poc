'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDownIcon } from '@radix-ui/react-icons';
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
    useReactTable 
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Bill, PaymentStatus } from '@/lib/types';
import { format, subDays } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-provider';
import { getBillings, updateBilling } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { ArrowLeft, Printer, Banknote, TrendingUp, Wallet, History, Search, FileText } from 'lucide-react';
import { PrintWrapper } from '@/components/print-wrapper';
import { Receipt } from '@/components/receipt';
import { PaginationControls } from '@/components/pagination-controls';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function InvoicesAndBillsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { formatCurrency } = useSettings();

  const initialPatientName = searchParams.get('patientName') || '';

  const [page, setPage] = React.useState(0);
  const pageSize = 50;

  const [patientName, setPatientName] = React.useState(initialPatientName);
  const [statusFilter, setStatusFilter] = React.useState<string>(searchParams.get('status') || 'all');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({ from: subDays(new Date(), 29), to: new Date() });

  const { data, isLoading: areBillsLoading, refetch } = useQuery<{ billings: Bill[]; totalCount: number }>(
    () => getBillings({
      limit: pageSize,
      offset: page * pageSize,
      patientName: patientName || undefined,
      startDate: dateRange?.from,
      endDate: dateRange?.to
    }) as any,
    [page, patientName, dateRange]
  );

  const bills = data?.billings ?? [];
  const totalCount = data?.totalCount ?? 0;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedBill, setSelectedBill] = React.useState<Bill | null>(null);
  const [isViewBillOpen, setIsViewBillOpen] = React.useState(false);
  const [receiptBill, setReceiptBill] = React.useState<{ bill: Bill, mode: 'invoice' | 'receipt' } | null>(null);

  const filteredData = React.useMemo(() => {
    if (!bills) return [];

    if (statusFilter === 'invoices') {
      return bills.filter(b => b.paymentDetails.invoiceNumber !== null && b.paymentDetails.invoiceNumber !== undefined);
    }

    if (statusFilter === 'receipts') {
      return bills.filter(b => b.receiptNumber !== null);
    }

    return bills;
  }, [bills, statusFilter]);

  const handleOpenViewBill = (bill: Bill) => { setSelectedBill(bill); setIsViewBillOpen(true); };

  const handleMarkAsPaid = async () => {
    if (!selectedBill) return;
    try {
      const updatedData: any = {
        paymentDetails: { ...selectedBill.paymentDetails, status: 'Paid' }
      };

      await updateBilling(selectedBill.id, updatedData);
      toast({ title: "Paid", description: `Invoice marked as paid and receipt generated.` });
      setIsViewBillOpen(false);
      refetch();
    } catch (error) {
      console.error("Error marking bill as paid:", error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not mark the bill as paid.' });
    }
  }

  const columns: ColumnDef<Bill>[] = [
    {
      id: 'number',
      header: 'No.',
      cell: ({ row }) => {
        const inv = row.original.paymentDetails.invoiceNumber;
        const rcpt = row.original.receiptNumber;

        // If we are in Receipts tab, always show RCPT
        if (statusFilter === 'receipts') return <div className="font-mono text-xs text-green-600 font-bold">{rcpt}</div>;
        // If we are in Invoices tab, always show INV
        if (statusFilter === 'invoices') return <div className="font-mono text-xs">{inv || '—'}</div>;

        // For 'All' tab, prioritize RCPT
        if (rcpt) return <div className="font-mono text-xs text-green-600 font-bold">{rcpt}</div>;
        return <div className="font-mono text-xs">{inv || '—'}</div>;
      }
    },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => format(new Date(row.getValue('date')), 'dd/MM/yyyy') },
    {
      accessorKey: 'patientName', header: 'Patient Name', cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-primary hover:underline decoration-primary/30"
            onClick={(e) => {
              e.stopPropagation();
              setPatientName(row.getValue('patientName'));
              setPage(0);
            }}
          >
            {row.getValue('patientName')}
          </Button>
          {row.original.patientId && (
            <Badge variant="outline" className="text-[10px] font-normal py-0">Reg</Badge>
          )}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.paymentDetails.status;
        return <Badge variant={status === 'Paid' ? 'default' : 'destructive'} className="capitalize">{status}</Badge>;
      }
    },
    { accessorKey: 'grandTotal', header: () => <div className="text-right">Total</div>, cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.getValue('grandTotal'))}</div> },
    {
      id: 'actions', cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleOpenViewBill(row.original)}>Details</Button>

          {/* Only show INV button in Invoices tab or All tab if inv exists */}
          {(statusFilter === 'all' || statusFilter === 'invoices') && row.original.paymentDetails.invoiceNumber && (
            <Button variant="outline" size="sm" onClick={() => setReceiptBill({ bill: row.original, mode: 'invoice' })}>
              <Printer className="h-3 w-3 mr-1" /> Inv
            </Button>
          )}

          {/* Only show RCPT button in Receipts tab or All tab if rcpt exists */}
          {(statusFilter === 'all' || statusFilter === 'receipts') && row.original.receiptNumber && (
            <Button variant="outline" size="sm" onClick={() => setReceiptBill({ bill: row.original, mode: 'receipt' })}>
              <Printer className="h-3 w-3 mr-1" /> Rcpt
            </Button>
          )}
        </div>
      )
    },
  ];

  const table = useReactTable({ data: filteredData ?? [], columns, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), onColumnVisibilityChange: setColumnVisibility, onRowSelectionChange: setRowSelection, state: { sorting, columnFilters, columnVisibility, rowSelection } });

  const stats = React.useMemo(() => {
    if (!bills) return { totalInvoices: 0, pendingAmount: 0, totalReceipts: 0, collectedAmount: 0 };

    const unpaidInvoices = bills.filter(b => b.paymentDetails.invoiceNumber && b.paymentDetails.status === 'Unpaid');
    const allReceipts = bills.filter(b => b.receiptNumber !== null);

    return {
      totalInvoices: unpaidInvoices.length,
      pendingAmount: unpaidInvoices.reduce((sum, b) => sum + b.grandTotal, 0),
      totalReceipts: allReceipts.length,
      collectedAmount: allReceipts.reduce((sum, b) => sum + b.grandTotal, 0)
    };
  }, [bills]);

  return (
    <>
      <PrintWrapper title={receiptBill?.mode === 'receipt' ? "Official Receipt" : receiptBill ? "Invoice" : "Invoices & Bills Report"}>
        {receiptBill ? (
          <Receipt bill={receiptBill.bill} mode={receiptBill.mode} />
        ) : (
          <div className="w-full space-y-6">
            <header className="flex items-start justify-between hide-on-print">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /><span className="sr-only">Back</span></Button>
                <div><h1 className="text-3xl font-bold tracking-tight">Invoices & Past Bills</h1><p className="text-muted-foreground">Review and manage patient invoices and past bills.</p></div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 hide-on-print">
              <Card className="bg-amber-500/5 border-amber-500/20 border-l-4 border-l-amber-500">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium text-amber-700 uppercase tracking-wider">Pending Invoices</CardTitle>
                    <p className="text-xs text-muted-foreground">{stats.totalInvoices} documents outstanding</p>
                  </div>
                  <History className="h-5 w-5 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-extrabold text-amber-600">{formatCurrency(stats.pendingAmount)}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-600/5 border-green-600/20 border-l-4 border-l-green-600">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium text-green-700 uppercase tracking-wider">Total Collected</CardTitle>
                    <p className="text-xs text-muted-foreground">{stats.totalReceipts} payments received</p>
                  </div>
                  <Banknote className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-extrabold text-green-600">{formatCurrency(stats.collectedAmount)}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full hide-on-print">
              <TabsList className="grid w-80 grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="receipts">Receipts</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center py-4 gap-4 hide-on-print">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Filter by Patient Name..."
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value);
                    setPage(0);
                  }}
                  className="max-w-sm"
                />
                {patientName && (
                  <Button variant="ghost" onClick={() => {
                    setPatientName('');
                    setPage(0);
                  }}>Clear</Button>
                )}
              </div>
              <DateRangePicker date={dateRange} onDateChange={(range) => {
                setDateRange(range);
                setPage(0);
              }} />
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print List
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>{table.getHeaderGroups().map((headerGroup) => (<TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => (<TableHead key={header.id} className="h-10 py-0 text-xs">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
                <TableBody>
                  {areBillsLoading && Array.from({ length: 5 }).map((_, i) => (<TableRow key={i}><TableCell colSpan={columns.length}><Skeleton className="h-8 w-full" /></TableCell></TableRow>))}
                  {!areBillsLoading && table.getRowModel().rows?.length ? (table.getRowModel().rows.map((row) => (<TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>{row.getVisibleCells().map((cell) => (<TableCell key={cell.id} className="py-1.5 px-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))) : null}
                  {!areBillsLoading && !table.getRowModel().rows?.length ? (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No bills found.</TableCell></TableRow>) : null}
                </TableBody>
              </Table>
            </div>

            <PaginationControls
              page={page + 1}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p - 1)}
              isLoading={areBillsLoading}
            />
          </div>
        )}
      </PrintWrapper>

      {selectedBill && (
        <Dialog open={isViewBillOpen} onOpenChange={setIsViewBillOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {statusFilter === 'receipts' || (statusFilter === 'all' && selectedBill.receiptNumber) ? 'Receipt Details' : 'Invoice Details'}
              </DialogTitle>
              <DialogDescription className="flex items-center flex-wrap gap-2">
                {statusFilter === 'receipts' || (statusFilter === 'all' && selectedBill.receiptNumber) ? (
                  <>
                    <span className="font-bold text-green-600">Receipt:</span> {selectedBill.receiptNumber}
                    <span className="mx-1 text-muted-foreground">|</span>
                    <span className="font-bold">Ref Inv:</span> {selectedBill.paymentDetails.parentInvoiceNumber || '—'}
                  </>
                ) : (
                  <>
                    <span className="font-bold">Invoice:</span> {selectedBill.paymentDetails.invoiceNumber || '—'}
                  </>
                )}
                <span className="mx-1 text-muted-foreground">|</span>
                <span className="font-bold">For:</span> {selectedBill.patientName}
                <span className="mx-1 text-muted-foreground">|</span>
                <Badge variant={selectedBill.paymentDetails.status === 'Paid' ? 'default' : 'destructive'} className="capitalize">{selectedBill.paymentDetails.status}</Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <ScrollArea className="max-h-80">
                <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Quantity</TableHead><TableHead>Unit Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>{selectedBill.items.map((item) => (<TableRow key={item.itemId}><TableCell className="font-medium">{item.itemName}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{formatCurrency(item.sellingPrice)}</TableCell><TableCell className="text-right">{formatCurrency(item.total)}</TableCell></TableRow>))}</TableBody>
                </Table>
              </ScrollArea>
              <div className="space-y-2 text-right">
                <div className="flex justify-end items-baseline gap-4"><span className="text-muted-foreground">Subtotal:</span><span className="font-medium">{formatCurrency(selectedBill.subtotal)}</span></div>
                {selectedBill.discount && selectedBill.discount > 0 ? (<div className="flex justify-end items-baseline gap-4"><span className="text-muted-foreground">Discount:</span><span className="font-medium text-destructive">-{formatCurrency(selectedBill.discount)}</span></div>) : null}
                <div className="flex justify-end items-baseline gap-4 text-lg font-bold"><span>Grand Total:</span><span>{formatCurrency(selectedBill.grandTotal)}</span></div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>

              {/* Show Print Invoice if either in Invoices tab OR in All tab for an Invoice record */}
              {(statusFilter === 'invoices' || (statusFilter === 'all' && selectedBill.paymentDetails.invoiceNumber)) && (
                <Button variant="secondary" onClick={() => { setIsViewBillOpen(false); setReceiptBill({ bill: selectedBill, mode: 'invoice' }); }}>
                  <Printer className="h-4 w-4 mr-2" />Print Invoice
                </Button>
              )}

              {/* Show Print Receipt if either in Receipts tab OR in All tab for a Receipt record */}
              {(statusFilter === 'receipts' || (statusFilter === 'all' && selectedBill.receiptNumber)) && selectedBill.paymentDetails.status === 'Paid' && (
                <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => { setIsViewBillOpen(false); setReceiptBill({ bill: selectedBill, mode: 'receipt' }); }}>
                  <Printer className="h-4 w-4 mr-2" />Print Receipt
                </Button>
              )}

              {selectedBill.paymentDetails.status === 'Unpaid' && (statusFilter === 'all' || statusFilter === 'invoices') && (
                <Button onClick={handleMarkAsPaid}>Mark as Paid</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!receiptBill} onOpenChange={(open) => !open && setReceiptBill(null)}>
        <DialogContent className="sm:max-w-md p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Print {receiptBill?.mode === 'receipt' ? 'Official Receipt' : 'Invoice'}</DialogTitle>
            <DialogDescription>Review the {receiptBill?.mode} and print.</DialogDescription>
          </DialogHeader>
          <div className="bg-muted/5 p-4">
            <ScrollArea className="h-[60vh]">
              <Receipt bill={receiptBill?.bill ?? null} mode={receiptBill?.mode} />
            </ScrollArea>
          </div>
          <DialogFooter className="p-6 pt-0">
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
            <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function InvoicesAndBillsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading invoices...</div>}>
      <InvoicesAndBillsContent />
    </React.Suspense>
  );
}

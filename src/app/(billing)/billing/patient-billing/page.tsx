'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Bill, BillItem, PaymentMethod, BillType, Service, Item, Stock } from '@/lib/types';
import { PlusCircle, Trash2, ArrowLeft, Printer } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSettings } from '@/context/settings-provider';
import { getItems, getServices, getStocks, createBilling, getPatientById } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import { Badge } from '@/components/ui/badge';
import { formatItemName } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Receipt } from '@/components/receipt';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PatientSearch } from '@/components/patient-search';
import type { Patient } from '@/lib/types';
import { PrintWrapper } from '@/components/print-wrapper';

function PatientBillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');
  const { toast } = useToast();
  const { formatCurrency } = useSettings();

  const { data: itemsData, isLoading: areItemsLoading } = useQuery<{ items: Item[]; totalCount: number }>(() => getItems() as any, []);
  const { data: servicesData, isLoading: areServicesLoading } = useQuery<{ services: Service[]; totalCount: number }>(() => getServices() as any, []);
  const { data: stocksData, isLoading: areStocksLoading } = useQuery<{ stocks: Stock[]; items: any[]; totalCount: number }>(() => getStocks() as any, []);

  const allItems = itemsData?.items || [];
  const allServices = servicesData?.services || [];
  const allStocks = stocksData?.stocks || [];
  const dispensaryStocks = React.useMemo(() => allStocks?.filter(s => s.locationId === 'dispensary') ?? [], [allStocks]);
  const isLoading = areItemsLoading || areServicesLoading || areStocksLoading;
  const billingLocationId = 'dispensary';

  const availableItems = React.useMemo(() => {
    if (!allItems || !dispensaryStocks) return [];
    return allItems
      .map(item => {
        const totalQuantity = dispensaryStocks.filter(s => s.itemId === item.id).reduce((sum, s) => sum + s.currentStockQuantity, 0);
        return { ...item, stockQuantity: totalQuantity };
      })
      .filter(item => item.stockQuantity > 0);
  }, [allItems, dispensaryStocks]);

  const [patientName, setPatientName] = React.useState('');
  const [patientId, setPatientId] = React.useState<string | undefined>();
  const [billItems, setBillItems] = React.useState<BillItem[]>([]);
  const [billType, setBillType] = React.useState<BillType>('Walk-in');
  const [prescriptionNumber, setPrescriptionNumber] = React.useState('');
  const [selectedMedicine, setSelectedMedicine] = React.useState<string | undefined>();
  const [medicineSearch, setMedicineSearch] = React.useState('');
  const [medicineQuantity, setMedicineQuantity] = React.useState('1');
  const [selectedService, setSelectedService] = React.useState<string | undefined>();
  const [serviceSearch, setServiceSearch] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = React.useState('');
  const [discount, setDiscount] = React.useState('0');
  const [billForReceipt, setBillForReceipt] = React.useState<Bill | null>(null);
  const [shiftType, setShiftType] = React.useState<'Day' | 'Night' | 'Auto'>('Auto');

  // Fetch patient details if patientId is provided in URL
  React.useEffect(() => {
    let cancelled = false;
    if (patientIdFromUrl) {
      getPatientById(patientIdFromUrl).then((patient: any) => {
        if (cancelled) return;
        if (patient) {
          setPatientId(patient.id);
          setPatientName(`${patient.firstName} ${patient.lastName}`);
          setBillType('OPD');
        }
      }).catch((err) => {
        if (cancelled) return;
        console.error("Error fetching patient details:", err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to find patient details.'
        });
      });
    }
    return () => { cancelled = true; };
  }, [patientIdFromUrl, toast]);

  const filteredMedicines = React.useMemo(() => {
    if (!medicineSearch) return [];
    return availableItems.filter(item => formatItemName(item).toLowerCase().includes(medicineSearch.toLowerCase()));
  }, [medicineSearch, availableItems]);

  const filteredServices = React.useMemo(() => {
    if (!serviceSearch) return [];
    return allServices?.filter(service => service.name.toLowerCase().startsWith(serviceSearch.toLowerCase())) || [];
  }, [serviceSearch, allServices]);

  const addMedicineToBill = () => {
    if (!selectedMedicine || !medicineQuantity || !availableItems) { toast({ variant: 'destructive', title: 'Error', description: 'Please select a medicine and quantity.' }); return; }
    const item = availableItems.find((i) => i.id === selectedMedicine);
    const quantity = parseInt(medicineQuantity, 10);
    if (!item) { toast({ variant: 'destructive', title: 'Error', description: 'Medicine not found.' }); return; }
    const existingItem = billItems.find(bi => bi.itemId === item.id);
    const quantityOnBill = existingItem ? existingItem.quantity : 0;
    if (quantityOnBill + quantity > item.stockQuantity) {
      toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Cannot add ${quantity} of ${formatItemName(item)}. You already have ${quantityOnBill} on the bill, and only ${item.stockQuantity} are available in total.` });
      return;
    }
    const existingItemIndex = billItems.findIndex(bi => bi.itemId === item.id);
    const sellingPrice = billType === 'OPD' ? item.consultationPrice : item.sellingPrice;

    if (sellingPrice === 0) {
      toast({ variant: 'destructive', title: 'Price Error', description: `Price for this medicine is not set for ${billType} patients.` });
      return;
    }

    if (existingItemIndex > -1) {
      const newQuantity = billItems[existingItemIndex].quantity + quantity;
      const newBillItems = [...billItems];
      newBillItems[existingItemIndex] = { ...newBillItems[existingItemIndex], quantity: newQuantity, total: newQuantity * sellingPrice };
      setBillItems(newBillItems);
    } else {
      setBillItems([...billItems, { itemId: item.id, itemName: formatItemName(item) || 'Unknown Item', quantity, sellingPrice, buyingPrice: item.buyingPrice, total: quantity * sellingPrice, itemType: 'product' }]);
    }
    setSelectedMedicine(undefined); setMedicineSearch(''); setMedicineQuantity('1');
  };

  const addServiceToBill = () => {
    if (!selectedService || !allServices) { toast({ variant: 'destructive', title: 'Error', description: 'Please select a service.' }); return; }
    const service = allServices.find(s => s.id === selectedService);
    if (!service) { toast({ variant: 'destructive', title: 'Error', description: 'Service not found.' }); return; }
    if (billItems.some(item => item.itemId === service.id)) { toast({ variant: 'destructive', title: 'Service Already Added', description: `${service.name} is already on the bill.` }); return; }
    setBillItems([...billItems, { itemId: service.id, itemName: service.name, quantity: 1, sellingPrice: service.fee, buyingPrice: 0, total: service.fee, itemType: 'service' }]);
    setSelectedService(undefined); setServiceSearch('');
  };

  const removeItemFromBill = (itemId: string) => setBillItems(billItems.filter((item) => item.itemId !== itemId));
  const subtotal = billItems.reduce((total, item) => total + item.total, 0);
  const discountAmount = parseFloat(discount) || 0;
  const grandTotal = subtotal - discountAmount;
  const tenderedAmountValue = parseFloat(amountTendered);
  const change = (paymentMethod === 'Cash' && !isNaN(tenderedAmountValue) && tenderedAmountValue >= grandTotal) ? tenderedAmountValue - grandTotal : 0;

  const canFinalize = React.useMemo(() => {
    if (billItems.length === 0 || !patientName.trim()) return false;
    if (billType === 'OPD' && !prescriptionNumber.trim()) return false;
    if (paymentMethod === 'Cash') { const tendered = parseFloat(amountTendered); return !isNaN(tendered) && tendered >= grandTotal; }
    return true;
  }, [billItems.length, patientName, billType, prescriptionNumber, paymentMethod, amountTendered, grandTotal]);

  const handleFinalizeBill = async () => {
    if (!canFinalize) { toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields.' }); return; }
    const newBill: any = {
      patientId,
      patientName,
      billType,
      items: billItems,
      subtotal,
      discount: discountAmount,
      grandTotal,
      paymentDetails: {
        method: paymentMethod,
        amountTendered: paymentMethod === 'Cash' ? tenderedAmountValue : grandTotal,
        change,
        status: paymentMethod === 'Invoice' ? 'Unpaid' : 'Paid'
      },
      dispensingLocationId: billingLocationId,
      isDispensed: false,
      ...(billType === 'OPD' && prescriptionNumber && { prescriptionNumber }),
      ...(shiftType !== 'Auto' && { shiftType }),
    };
    try {
      const created = await createBilling(newBill);
      setBillForReceipt(created as any);
      setPatientName(''); setPatientId(undefined); setBillItems([]); setBillType('Walk-in'); setPrescriptionNumber(''); setPaymentMethod('Cash'); setAmountTendered(''); setDiscount('0');
    } catch (error) {
      console.error("Error finalizing bill: ", error);
      toast({ variant: 'destructive', title: 'Failed to save bill', description: 'Could not save the bill to the database.' });
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4 border-b pb-2">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /><span className="sr-only">Back</span></Button>
          <h1 className="text-2xl font-bold tracking-tight">Patient Billing</h1>
        </div>
        <p className="text-sm text-muted-foreground hidden md:block">Create and finalize new bills or invoices for patients.</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="p-3 pb-0"><CardTitle className="text-sm font-bold">Patient & Bill Details</CardTitle></CardHeader>
            <CardContent className="p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
                <div>
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Bill Type</Label>
                  <RadioGroup value={billType} onValueChange={(value: BillType) => setBillType(value)} className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center space-x-1.5"><RadioGroupItem value="Walk-in" id="walk-in" className="h-3 w-3" /><Label htmlFor="walk-in" className="text-xs">Walk-in</Label></div>
                    <div className="flex items-center space-x-1.5"><RadioGroupItem value="OPD" id="opd" className="h-3 w-3" /><Label htmlFor="opd" className="text-xs">OPD</Label></div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Shift ({shiftType})</Label>
                  <div className="flex gap-1 mt-1">
                    <Button variant={shiftType === 'Auto' ? 'secondary' : 'outline'} size="sm" className="h-6 px-2 text-[10px]" onClick={() => setShiftType('Auto')}>Auto</Button>
                    <Button variant={shiftType === 'Day' ? 'secondary' : 'outline'} size="sm" className="h-6 px-2 text-[10px]" onClick={() => setShiftType('Day')}>Day</Button>
                    <Button variant={shiftType === 'Night' ? 'secondary' : 'outline'} size="sm" className="h-6 px-2 text-[10px]" onClick={() => setShiftType('Night')}>Night</Button>
                  </div>
                </div>
                {billType === 'OPD' && (
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="prescriptionNumber" className="text-[10px] uppercase font-bold text-muted-foreground">Prescription #</Label>
                    <Input id="prescriptionNumber" className="h-7 mt-1 text-xs" placeholder="Enter #" value={prescriptionNumber} onChange={(e) => setPrescriptionNumber(e.target.value)} required />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div>
                  <Label htmlFor="patientSearch" className="text-[10px] uppercase font-bold text-muted-foreground">Search Patient</Label>
                  <div className="mt-1">
                    <PatientSearch
                      selectedPatientId={patientId}
                      onSelect={(p) => {
                        if (p) {
                          setPatientId(p.id);
                          setPatientName(`${p.firstName} ${p.lastName}`);
                        } else {
                          setPatientId(undefined);
                          setPatientName('');
                        }
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="patientName" className="text-[10px] uppercase font-bold text-muted-foreground">Manual Name Input</Label>
                  <Input
                    id="patientName"
                    className="h-8 mt-1 text-xs"
                    placeholder="Or type name manually..."
                    value={patientName}
                    disabled={!!patientId}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-0"><CardTitle className="text-sm font-bold">Add Billable Items</CardTitle></CardHeader>
            <CardContent className="p-3 space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Medicine</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input className="h-8 text-sm" placeholder="Search medicine..." value={medicineSearch} onChange={(e) => { setMedicineSearch(e.target.value); setSelectedMedicine(undefined); }} disabled={isLoading} />
                    {medicineSearch.length > 0 && (
                      <div className="absolute z-10 w-full bg-card border rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                        {filteredMedicines.length > 0 ? filteredMedicines.map(item => (
                          <div key={item.id} className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center text-xs" onMouseDown={(e) => { e.preventDefault(); if (item.stockQuantity > 0) { setSelectedMedicine(item.id); setMedicineSearch(formatItemName(item)); } else { toast({ variant: 'destructive', title: 'Out of Stock', description: `${formatItemName(item)} cannot be selected.` }) } }}>
                            <span>{formatItemName(item)}</span>
                            <Badge variant={item.stockQuantity > 0 ? 'secondary' : 'destructive'} className="text-[10px] h-4">{item.stockQuantity > 0 ? `S: ${item.stockQuantity}` : 'OoS'}</Badge>
                          </div>
                        )) : <div className="p-2 text-xs text-muted-foreground">No matches.</div>}
                      </div>
                    )}
                  </div>
                  <Input type="number" placeholder="Qty" className="w-16 h-8 text-sm" value={medicineQuantity} onChange={(e) => setMedicineQuantity(e.target.value)} min="1" />
                  <Button size="sm" className="h-8" onClick={addMedicineToBill} disabled={isLoading || !selectedMedicine}><PlusCircle className="h-3 w-3 mr-1" /> Add</Button>
                </div>
              </div>
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Service</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input className="h-8 text-sm" placeholder="Search service..." value={serviceSearch} onChange={(e) => { setServiceSearch(e.target.value); setSelectedService(undefined); }} disabled={areServicesLoading} />
                    {serviceSearch.length > 0 && (
                      <div className="absolute z-10 w-full bg-card border rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                        {filteredServices.length > 0 ? filteredServices.map(service => (
                          <div key={service.id} className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center text-xs" onMouseDown={(e) => { e.preventDefault(); setSelectedService(service.id); setServiceSearch(service.name); }}>
                            <span>{service.name} - {formatCurrency(service.fee)}</span>
                          </div>
                        )) : <div className="p-2 text-xs text-muted-foreground">No matches.</div>}
                      </div>
                    )}
                  </div>
                  <Button size="sm" className="h-8" onClick={addServiceToBill} disabled={areServicesLoading || !selectedService}><PlusCircle className="h-3 w-3 mr-1" /> Add</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card className="lg:sticky lg:top-24">
            <CardHeader className="p-3 pb-0"><CardTitle className="text-sm font-bold">Bill Preview</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-60">
                <Table>
                  <TableHeader className="bg-muted/50"><TableRow><TableHead className="h-7 py-0 text-[10px] uppercase font-bold text-muted-foreground">Item</TableHead><TableHead className="h-7 py-0 text-[10px] uppercase font-bold text-muted-foreground">Qty</TableHead><TableHead className="h-7 py-0 text-[10px] uppercase font-bold text-muted-foreground">Price</TableHead><TableHead className="h-7 py-0 text-[10px] uppercase font-bold text-muted-foreground text-right">Total</TableHead><TableHead className="h-7 w-10"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {billItems.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center h-20 text-xs text-muted-foreground">No items added.</TableCell></TableRow>) : (
                      billItems.map((item) => (<TableRow key={item.itemId} className="h-7 hover:bg-muted/30 transition-colors"><TableCell className="py-0.5 text-xs font-medium">{item.itemName}</TableCell><TableCell className="py-0.5 text-xs">{item.quantity}</TableCell><TableCell className="py-0.5 text-xs">{formatCurrency(item.sellingPrice)}</TableCell><TableCell className="py-0.5 text-xs text-right font-medium">{formatCurrency(item.total)}</TableCell><TableCell className="py-0.5"><Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeItemFromBill(item.itemId)}><Trash2 className="h-3 w-3 text-destructive" /></Button></TableCell></TableRow>))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-3 flex flex-col space-y-2 bg-muted/20 border-t">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full text-sm">
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between items-center"><Label htmlFor='discount' className="text-xs">Discount</Label><Input id="discount" type="number" className="w-20 h-7 text-right text-xs" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
                <div className="col-span-2 border-t pt-2 flex justify-between items-center">
                  <span className="font-bold">Grand Total</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full border-t pt-2 items-end">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor='paymentMethod' className="text-[10px] uppercase font-bold text-muted-foreground">Method</Label>
                  <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                    <SelectTrigger id="paymentMethod" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Cash" className="text-xs">Cash</SelectItem><SelectItem value="Mobile Money" className="text-xs">Mobile Money</SelectItem><SelectItem value="Bank" className="text-xs">Bank/Card</SelectItem><SelectItem value="Invoice" className="text-xs">Invoice</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-0.5 text-[10px]">
                  {paymentMethod === 'Cash' && (
                    <>
                      <Label htmlFor='amountTendered' className="uppercase font-bold text-muted-foreground">Tendered</Label>
                      <Input id="amountTendered" type="number" className="h-8 text-xs" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} />
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  {paymentMethod === 'Cash' && (
                    <div className="h-8 flex flex-col justify-center border rounded-md px-2 bg-accent/5">
                      <span className="text-[8px] uppercase font-bold text-muted-foreground leading-none">Change</span>
                      <span className="text-xs font-bold text-primary truncate">{formatCurrency(change)}</span>
                    </div>
                  )}
                </div>
                <Button size="sm" className="w-full h-8 font-bold" onClick={handleFinalizeBill} disabled={!canFinalize}>
                  {paymentMethod === 'Invoice' ? 'Generate' : 'Process'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      {/* Hidden print-only receipt — this is what window.print() renders */}
      <PrintWrapper title={billForReceipt?.receiptNumber ? "Official Receipt" : "Invoice"}>
        <Receipt bill={billForReceipt} />
      </PrintWrapper>

      <Dialog open={!!billForReceipt} onOpenChange={(open) => !open && setBillForReceipt(null)}>
        <DialogContent className="sm:max-w-md p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {billForReceipt?.receiptNumber ? 'Receipt Generated' : 'Invoice Generated'}
            </DialogTitle>
            <DialogDescription>
              The {billForReceipt?.receiptNumber ? 'receipt' : 'invoice'} has been successfully generated. You can print it directly below.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/5 p-4">
            <ScrollArea className="h-[60vh]">
              <Receipt bill={billForReceipt} />
            </ScrollArea>
          </div>
          <DialogFooter className="p-6 pt-0">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print {billForReceipt?.receiptNumber ? 'Receipt' : 'Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PatientBillingPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground italic">Loading billing interface...</p>
        </div>
      </div>
    }>
      <PatientBillingContent />
    </React.Suspense>
  );
}

"use client";

import * as React from "react";

import type { Item, Stock } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "./ui/badge";
import { format, differenceInDays } from "date-fns";
import { useSettings } from "@/context/settings-provider";
import { formatItemName } from "@/lib/utils";
import { useQuery } from "@/hooks/use-query";
import { getStocks, getItemUsageStats, getItemHistory, updateStock, createStock, updateItem, createPriceHistory } from "@/app/actions/index";
import { Skeleton } from "./ui/skeleton";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertTriangle, Clock, PlusCircle, Edit3, DollarSign, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { AdjustStockForm } from "./adjust-stock-form";
import { useToast } from "@/hooks/use-toast";

type ItemDetailsProps = {
  item: Item;
  locationId?: string; // Filter batches by location if provided
};

export function ItemDetails({ item, locationId }: ItemDetailsProps) {
  const { formatCurrency } = useSettings();
  const { toast } = useToast();
  
  const { data: stocksData, isLoading: isStocksLoading, refetch: refetchStocks } = useQuery<{ stocks: Stock[] }>(() => getStocks({ locationId }) as any, [locationId]);
  const { data: stats, isLoading: isStatsLoading } = useQuery(() => getItemUsageStats(item.id), [item.id]);
  const { data: history, isLoading: isHistoryLoading } = useQuery(() => getItemHistory(item.id), [item.id]);

  const itemStocks = React.useMemo(() => {
    return (stocksData?.stocks || [])
      .filter(s => s.itemId === item.id)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [stocksData, item.id]);

  const totalInHand = itemStocks.reduce((sum, s) => sum + s.currentStockQuantity, 0);
  const earliestExpiry = itemStocks[0];

  const handleAdjustStock = async (itemId: string, value: number, batchId?: string, expiryDate?: Date, isAbsolute?: boolean, originalStockId?: string) => {
    try {
      // Find the specific stock record to update
      let stockToUpdate: Stock | undefined;
      
      if (originalStockId) {
        stockToUpdate = itemStocks.find(s => s.id === originalStockId);
      } else if (batchId) {
        stockToUpdate = itemStocks.find(s => s.batchId === batchId);
      }

      if (isAbsolute) {
        if (stockToUpdate) {
          // Update existing stock record
          await updateStock(stockToUpdate.id, { 
            currentStockQuantity: value,
            batchId: batchId, // Allow correcting the batch ID
            expiryDate: expiryDate ? expiryDate : new Date(stockToUpdate.expiryDate)
          } as any);
        } else {
          // New batch entry with absolute value
          await createStock({
            itemId,
            locationId: locationId as any,
            currentStockQuantity: value,
            batchId: batchId || `B${Date.now()}`,
            expiryDate: expiryDate || new Date(),
          } as any);
        }
      } else {
        // Delta-based adjustment
        if (stockToUpdate) {
          await updateStock(stockToUpdate.id, { 
            currentStockQuantity: stockToUpdate.currentStockQuantity + value,
            batchId: batchId || stockToUpdate.batchId,
            expiryDate: expiryDate ? expiryDate : new Date(stockToUpdate.expiryDate)
          } as any);
        } else {
          // Create new batch
          await createStock({
            itemId,
            locationId: locationId as any,
            currentStockQuantity: value,
            batchId: batchId || `B${Date.now()}`,
            expiryDate: expiryDate || new Date(),
          } as any);
        }
      }
      toast({ title: "Success", description: "Stock updated successfully." });
      refetchStocks();
    } catch (e) {
      toast({ title: "Error", description: "Failed to update stock.", variant: "destructive" });
    }
  };

  // --- Price Adjustment ---
  const [isEditingPrice, setIsEditingPrice] = React.useState(false);
  const [priceValues, setPriceValues] = React.useState({
    buyingPrice: item.buyingPrice,
    sellingPrice: item.sellingPrice,
    consultationPrice: item.consultationPrice,
  });
  const [isSavingPrice, setIsSavingPrice] = React.useState(false);

  const handleSavePrice = async () => {
    setIsSavingPrice(true);
    try {
      await updateItem(item.id, priceValues);

      if (priceValues.buyingPrice !== item.buyingPrice) {
        await createPriceHistory({ itemId: item.id, type: 'buyingPrice', price: priceValues.buyingPrice });
      }
      if (priceValues.sellingPrice !== item.sellingPrice) {
        await createPriceHistory({ itemId: item.id, type: 'sellingPrice', price: priceValues.sellingPrice });
      }
      if (priceValues.consultationPrice !== item.consultationPrice) {
        await createPriceHistory({ itemId: item.id, type: 'consultationPrice', price: priceValues.consultationPrice });
      }

      item.buyingPrice = priceValues.buyingPrice;
      item.sellingPrice = priceValues.sellingPrice;
      item.consultationPrice = priceValues.consultationPrice;

      toast({ title: "Prices Updated", description: `Prices for ${formatItemName(item)} saved.` });
      setIsEditingPrice(false);
    } catch (e) {
      toast({ title: "Error", description: "Failed to update prices.", variant: "destructive" });
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleCancelPrice = () => {
    setPriceValues({
      buyingPrice: item.buyingPrice,
      sellingPrice: item.sellingPrice,
      consultationPrice: item.consultationPrice,
    });
    setIsEditingPrice(false);
  };

  return (
    <div className="grid gap-3 py-1">
      {earliestExpiry && (
        <Alert variant="default" className="bg-primary/20 border-primary/30 py-2 px-3">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
              <span className="text-white font-bold text-xs uppercase tracking-tight">FEFO Reminder:</span>
              <span className="text-foreground/90 text-xs">
                Use <strong className="bg-[#A0D2EB] text-slate-900 px-1.5 py-0.5 rounded text-[11px] font-bold">Batch {earliestExpiry.batchId}</strong>
                <span className="ml-2 text-muted-foreground">(Expires {format(new Date(earliestExpiry.expiryDate), "dd/MM/yyyy")})</span>
              </span>
            </div>
          </div>
        </Alert>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#A0D2EB]">{formatItemName(item)}</h2>
          <p className="text-[10px] text-muted-foreground leading-none">{item.itemCode} • {item.category}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase">In Hand</p>
          <p className="text-2xl font-bold text-primary leading-none">{totalInHand} <span className="text-[10px] font-normal text-muted-foreground">{item.unitOfMeasure}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[11px] uppercase text-muted-foreground border-b pb-0.5">Available Batches</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 px-2">
                  <PlusCircle className="h-2.5 w-2.5" /> New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader><DialogTitle>Add New Batch</DialogTitle></DialogHeader>
                <AdjustStockForm item={item as any} onAdjustStock={handleAdjustStock} />
              </DialogContent>
            </Dialog>
          </div>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="h-7 hover:bg-transparent">
                  <TableHead className="h-7 text-[9px] uppercase px-2">Batch ID</TableHead>
                  <TableHead className="h-7 text-[9px] uppercase px-2">Expiry</TableHead>
                  <TableHead className="h-7 text-[9px] uppercase text-right px-2">Qty</TableHead>
                  <TableHead className="h-7 p-0 w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isStocksLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i} className="h-7"><TableCell colSpan={4}><Skeleton className="h-3 w-full" /></TableCell></TableRow>
                  ))
                ) : itemStocks.length > 0 ? (
                  itemStocks.map((s) => {
                    const daysToExpiry = s.expiryDate ? differenceInDays(new Date(s.expiryDate), new Date()) : 999;
                    const isExpiringSoon = daysToExpiry < 90;
                    const isCritical = daysToExpiry < 30;
                    
                    return (
                      <TableRow key={s.id} className={`h-7 hover:bg-muted/50 ${isCritical ? 'bg-red-500/10' : isExpiringSoon ? 'bg-yellow-500/10' : ''}`}>
                        <TableCell className="py-0 px-2 text-[11px] font-medium border-r">
                          {s.batchId}
                          {isCritical && <Badge variant="destructive" className="ml-1 h-3 text-[7px] px-1 uppercase leading-none border-none">!!!</Badge>}
                        </TableCell>
                        <TableCell className="py-0 px-2 text-[11px] border-r">
                          {s.expiryDate ? format(new Date(s.expiryDate), "dd/MM/yyyy") : 'N/A'}
                        </TableCell>
                        <TableCell className="py-0 px-2 text-[11px] text-right font-bold border-r">{s.currentStockQuantity}</TableCell>
                        <TableCell className="py-0 text-right px-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5">
                                <Edit3 className="h-2.5 w-2.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px]">
                              <DialogHeader><DialogTitle>Correct Stock: {s.batchId}</DialogTitle></DialogHeader>
                              <AdjustStockForm item={{ ...item, stock: s } as any} batchId={s.batchId} onAdjustStock={handleAdjustStock} />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center h-12 text-[10px] text-muted-foreground">No batches found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 border rounded-md bg-muted/20">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase leading-none mb-1">Usage (30d)</p>
              {isStatsLoading ? <Skeleton className="h-4 w-12" /> : (
                <p className="text-sm font-bold leading-none">{stats?.totalQuantityLast30Days ?? 0} <span className="text-[9px] font-normal">{item.unitOfMeasure}</span></p>
              )}
            </div>
            <div className="p-2 border rounded-md bg-muted/20">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase leading-none mb-1">Frequency</p>
              {isStatsLoading ? <Skeleton className="h-4 w-12" /> : (
                <p className="text-sm font-bold leading-none">{stats?.dispensingFrequency ?? 0} <span className="text-[9px] font-normal">orders</span></p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-semibold text-[11px] uppercase text-muted-foreground border-b pb-0.5">Recent Activity</h3>
            <ScrollArea className="h-[90px] pr-2">
              <div className="space-y-2">
                {isHistoryLoading ? (
                  Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
                ) : history && history.length > 0 ? (
                  history.map((log) => (
                    <div key={log.id} className="text-[10px] leading-tight border-l-2 border-primary/20 pl-2">
                      <p className="font-semibold text-primary/80">{log.action}</p>
                      <p className="text-muted-foreground text-[9px]">{format(new Date(log.timestamp), "PPp")}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">No recent activity.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </section>
      </div>

      <div className="pt-2 border-t mt-1">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-semibold text-[11px] uppercase text-muted-foreground">Pricing</h3>
          {!isEditingPrice ? (
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 px-2" onClick={() => setIsEditingPrice(true)}>
              <DollarSign className="h-2.5 w-2.5" /> Adjust Price
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button variant="default" size="sm" className="h-6 text-[9px] gap-1 px-2 bg-green-600 hover:bg-green-700" onClick={handleSavePrice} disabled={isSavingPrice}>
                <Check className="h-2.5 w-2.5" /> {isSavingPrice ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 px-2" onClick={handleCancelPrice}>
                <X className="h-2.5 w-2.5" /> Cancel
              </Button>
            </div>
          )}
        </div>
        {isEditingPrice ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <label className="text-[9px] font-semibold text-muted-foreground uppercase block">Buying</label>
              <Input type="number" step="0.01" className="h-7 text-xs" value={priceValues.buyingPrice} onChange={(e) => setPriceValues(p => ({ ...p, buyingPrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] font-semibold text-muted-foreground uppercase block">Walk-in</label>
              <Input type="number" step="0.01" className="h-7 text-xs" value={priceValues.sellingPrice} onChange={(e) => setPriceValues(p => ({ ...p, sellingPrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] font-semibold text-muted-foreground uppercase block">OPD</label>
              <Input type="number" step="0.01" className="h-7 text-xs" value={priceValues.consultationPrice} onChange={(e) => setPriceValues(p => ({ ...p, consultationPrice: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-0.5">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Walk-in</p>
              <p className="text-xs font-bold">{formatCurrency(item.sellingPrice)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">OPD</p>
              <p className="text-xs font-bold">{formatCurrency(item.consultationPrice)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Buying</p>
              <p className="text-xs font-bold">{formatCurrency(item.buyingPrice)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Unit</p>
              <p className="text-xs font-bold">{item.unitOfMeasure}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

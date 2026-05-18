
'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, AlertTriangle, Truck } from "lucide-react";
import type { Stock, Item, InternalOrder } from '@/lib/types';
import { StatCard } from '@/components/ui/stat-card';
import { ResponsiveContainer, Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { formatItemName } from '@/lib/utils';
import { getStocksByLocation, getItems, getInternalOrders } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import Link from 'next/link';

export default function BulkStoreDashboard() {
  // --- Data Fetching ---
  const { data: stocksData, isLoading: isLoadingStock } = useQuery<{ stocks: Stock[]; totalCount: number }>(() => getStocksByLocation('bulk-store') as any, []);
  const bulkStocks = stocksData?.stocks || [];
  const { data: itemsData, isLoading: isLoadingItems } = useQuery<{ items: Item[]; totalCount: number }>(() => getItems() as any, []);
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery<{ internalOrders: InternalOrder[]; totalCount: number }>(() => getInternalOrders() as any, []);

  const allItems = itemsData?.items || [];
  const allOrders = ordersData?.internalOrders || [];

  // --- Calculations ---
  const { totalUniqueItems, lowStockItemsCount, fastMovingItems, pendingOrdersCount, recentTransfers } = React.useMemo(() => {
    if (!bulkStocks || !allItems || !allOrders) {
      return { totalUniqueItems: 0, lowStockItemsCount: 0, fastMovingItems: [], pendingOrdersCount: 0, recentTransfers: [] };
    }

    const itemStockMap = new Map<string, number>();
    bulkStocks.forEach(stock => {
      itemStockMap.set(stock.itemId, (itemStockMap.get(stock.itemId) || 0) + stock.currentStockQuantity);
    });

    const lowStockCount = allItems.reduce((count, item) => {
      const currentStock = itemStockMap.get(item.id);
      // Only count items that have been initialized in this store (exist in map)
      if (currentStock !== undefined && currentStock < item.bulkStoreReorderLevel) {
        return count + 1;
      }
      return count;
    }, 0);

    // Calculate Fast Moving Items based on total quantity issued
    const issuanceMap = new Map<string, number>();
    allOrders.forEach(order => {
      if (order.status === 'Issued') {
        order.items.forEach(orderItem => {
          issuanceMap.set(orderItem.itemId, (issuanceMap.get(orderItem.itemId) || 0) + orderItem.quantity);
        });
      }
    });

    const sortedFrequency = Array.from(issuanceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const fastMoving = sortedFrequency.map(([itemId, totalQty]) => {
      const itemInfo = allItems.find(i => i.id === itemId);
      return {
        name: itemInfo ? formatItemName(itemInfo) : itemId,
        quantity: totalQty
      }
    });

    const pending = allOrders.filter(o => o.status === 'Pending').length;
    const recent = allOrders
      .filter(o => o.status === 'Issued')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalUniqueItems: itemStockMap.size,
      lowStockItemsCount: lowStockCount,
      fastMovingItems: fastMoving,
      pendingOrdersCount: pending,
      recentTransfers: recent
    };
  }, [bulkStocks, allItems, allOrders]);

  const isLoading = isLoadingStock || isLoadingItems || isLoadingOrders;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/bulk-store/inventory">
          <StatCard
            title="Total Items"
            value={totalUniqueItems}
            icon={Package}
            description="Unique items in bulk store"
            isLoading={isLoading}
            className="hover:bg-accent transition-colors"
          />
        </Link>
        <Link href="/bulk-store/inventory?filter=low-stock">
          <StatCard
            title="Low Stock Alerts"
            value={lowStockItemsCount}
            icon={AlertTriangle}
            description="Items below reorder level"
            isLoading={isLoading}
            className="hover:bg-accent transition-colors"
          />
        </Link>
        <Link href="/bulk-store/internal-orders">
          <StatCard
            title="Pending Orders"
            value={`+${pendingOrdersCount}`}
            icon={Truck}
            description="Internal orders from dispensary"
            isLoading={isLoading}
            className="hover:bg-accent transition-colors"
          />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Fast Moving Items</CardTitle>
            <CardDescription>Items with highest issuance frequency to dispensary.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={fastMovingItems} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                    formatter={(value) => [value, "Total Issued"]}
                  />
                  <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
            <CardDescription>
              Most recent stock issued to the dispensary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransfers.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No recent transfers.</p>}
                {recentTransfers.map(order => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(order.date), 'dd/MM/yyyy, p')}</p>
                    </div>
                    <Badge variant="default" className="capitalize">{order.items.length} items</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

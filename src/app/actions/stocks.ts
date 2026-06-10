'use server';

import { db } from '@/db';
import { eq, count, inArray, and, countDistinct } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { logAction } from '@/lib/audit';
import { serialize, serializeOne } from '@/lib/utils';
import { requireAuth } from './utils';

// ═══════════════════════════════════════════════════════════
//  STOCKS
// ═══════════════════════════════════════════════════════════
export async function getStocks(params?: { limit?: number; offset?: number; locationId?: string }) {
    await requireAuth(['admin', 'pharmacy', 'cashier']);
    
    const query = db.select().from(schema.stocks).$dynamic();
    const countQuery = db.select({ value: count() }).from(schema.stocks).$dynamic();

    if (params?.locationId) {
        query.where(eq(schema.stocks.locationId, params.locationId));
        countQuery.where(eq(schema.stocks.locationId, params.locationId));
    }

    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    // To provide items info, we need to join or fetch items.
    // However, the caller might just fetch items separately.
    // Let's stick to what the original 'getStocksByLocation' returned (stocks only).
    // The UI 'Dispensary Inventory' needs both. 
    // I'll fetch associated items to avoid multiple roundtrips if possible.
    
    const itemIds = rows.map(r => r.itemId).filter(Boolean);
    let items: any[] = [];
    if (itemIds.length > 0) {
        const itemRows = await db.select().from(schema.items).where(inArray(schema.items.id, itemIds));
        items = serialize(itemRows);
    }

    return {
        stocks: serialize(rows) as any[],
        items,
        totalCount: totalCount.value
    };
}

export async function getStocksByLocation(locationId: string, params?: { limit?: number; offset?: number }) {
    const user = await requireAuth(['admin', 'pharmacy', 'cashier']);

    // Authorization: User must belong to the location or be 'all' or 'admin'
    if (user.role !== 'admin' && user.locationId !== 'all' && user.locationId !== locationId) {
        throw new Error("Forbidden: You do not have access to stocks at this location.");
    }

    const filters = [eq(schema.stocks.locationId, locationId)];
    const whereClause = and(...filters);

    const query = db.select().from(schema.stocks).where(whereClause).$dynamic();
    
    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const countQuery = db.select({ value: count() }).from(schema.stocks).where(whereClause);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        stocks: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function createStock(data: typeof schema.stocks.$inferInsert) {
    try {
        await requireAuth(['admin', 'pharmacy']);
        const [row] = await db.insert(schema.stocks).values(data).returning();
        return serializeOne(row);
    } catch (error) {
        console.error("Error in createStock");
        throw error;
    }
}

export async function updateStock(id: string, data: Partial<typeof schema.stocks.$inferInsert>) {
    try {
        const user = await requireAuth(['admin', 'pharmacy']);
        
        const [before] = await db.select().from(schema.stocks).where(eq(schema.stocks.id, id));

        if (!before) {
            console.error(`Stock record ${id} not found`);
            return null;
        }

        // Authorization: Location check
        if (user.role !== 'admin' && user.locationId !== 'all' && user.locationId !== before.locationId) {
            throw new Error("Forbidden: You do not have access to stock at this location.");
        }

        const [row] = await db.update(schema.stocks).set(data).where(eq(schema.stocks.id, id)).returning();

        if (row) {
            await logAction(user, 'Update Stock', { before, after: row });
        }

        return row ? serializeOne(row) : null;
    } catch (error) {
        console.error("Error in updateStock:", error);
        throw error;
    }
}

export async function deleteStock(id: string) {
    await requireAuth(['admin', 'pharmacy']);
    await db.delete(schema.stocks).where(eq(schema.stocks.id, id));
}

export async function getInventoryItems(params: { limit?: number; offset?: number; locationId: string }) {
    await requireAuth(['admin', 'pharmacy', 'cashier']);
    
    const locationId = params.locationId;
    
    // 1. Find unique item IDs that have stock in this location
    const distinctItemIdsQuery = db
        .selectDistinct({ itemId: schema.stocks.itemId })
        .from(schema.stocks)
        .where(eq(schema.stocks.locationId, locationId))
        .$dynamic();

    if (params.limit !== undefined) distinctItemIdsQuery.limit(params.limit);
    if (params.offset !== undefined) distinctItemIdsQuery.offset(params.offset);
    
    // 2. Count total unique items with stock in this location
    const totalCountQuery = db
        .select({ value: countDistinct(schema.stocks.itemId) })
        .from(schema.stocks)
        .where(eq(schema.stocks.locationId, locationId));

    const [itemIdRows, [totalCount]] = await Promise.all([
        distinctItemIdsQuery,
        totalCountQuery
    ]);

    const itemIds = itemIdRows.map(r => r.itemId).filter(Boolean);
    
    if (itemIds.length === 0) {
        return { items: [], stocks: [], totalCount: totalCount.value || 0 };
    }

    // 3. Fetch the actual items
    const itemRows = await db.select().from(schema.items).where(inArray(schema.items.id, itemIds));
    
    // 4. Fetch ALL stock records for THESE items in THIS location
    const stockRows = await db.select().from(schema.stocks).where(
        and(
            eq(schema.stocks.locationId, locationId),
            inArray(schema.stocks.itemId, itemIds)
        )
    );

    return {
        items: serialize(itemRows) as any[],
        stocks: serialize(stockRows) as any[],
        totalCount: totalCount.value || 0
    };
}

'use server';

import { db } from '@/db';
import { eq, desc, ilike, count } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { logAction } from '@/lib/audit';
import { serialize, serializeOne } from '@/lib/utils';
import { requireAuth } from './utils';

// ═══════════════════════════════════════════════════════════
//  ITEMS
// ═══════════════════════════════════════════════════════════
export async function getItems(params?: { limit?: number; offset?: number }) {
    await requireAuth(['admin', 'pharmacy', 'cashier']);
    const query = db.select().from(schema.items).$dynamic();
    
    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);
    
    const countQuery = db.select({ value: count() }).from(schema.items);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        items: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function getItemById(id: string) {
    await requireAuth(['admin', 'pharmacy', 'cashier']);
    const [row] = await db.select().from(schema.items).where(eq(schema.items.id, id));
    return row ? serializeOne(row) : null;
}

export async function createItem(data: typeof schema.items.$inferInsert) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.insert(schema.items).values(data).returning();
    return serializeOne(row);
}

export async function updateItem(id: string, data: Partial<typeof schema.items.$inferInsert>) {
    const user = await requireAuth(['admin', 'pharmacy']);
    const [before] = await db.select().from(schema.items).where(eq(schema.items.id, id));
    const [row] = await db.update(schema.items).set(data).where(eq(schema.items.id, id)).returning();

    if (before && row) {
        await logAction(user, 'Update Item', { before, after: row });
    }

    return row ? serializeOne(row) : null;
}

export async function deleteItem(id: string) {
    await requireAuth(['admin', 'pharmacy']);
    await db.delete(schema.items).where(eq(schema.items.id, id));
}

// ═══════════════════════════════════════════════════════════
//  PRICE HISTORY
// ═══════════════════════════════════════════════════════════
export async function getPriceHistory(itemId: string) {
    await requireAuth(['admin', 'pharmacy', 'cashier']);
    const rows = await db.select().from(schema.priceHistory).where(eq(schema.priceHistory.itemId, itemId));
    return serialize(rows);
}

export async function createPriceHistory(data: typeof schema.priceHistory.$inferInsert) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.insert(schema.priceHistory).values(data).returning();
    return serializeOne(row);
}

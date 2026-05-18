'use server';

import { db } from '@/db';
import { eq, count, and } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { serialize, serializeOne } from '@/lib/utils';
import { requireAuth } from './utils';

// ═══════════════════════════════════════════════════════════
//  VENDORS
// ═══════════════════════════════════════════════════════════
export async function getVendors() {
    await requireAuth(['admin', 'pharmacy', 'cashier']);
    const rows = await db.select().from(schema.vendors);
    return serialize(rows);
}

export async function createVendor(data: typeof schema.vendors.$inferInsert) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.insert(schema.vendors).values(data).returning();
    return serializeOne(row);
}

export async function updateVendor(id: string, data: Partial<typeof schema.vendors.$inferInsert>) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.update(schema.vendors).set(data).where(eq(schema.vendors.id, id)).returning();
    return row ? serializeOne(row) : null;
}

export async function deleteVendor(id: string) {
    await requireAuth(['admin', 'pharmacy']);
    await db.delete(schema.vendors).where(eq(schema.vendors.id, id));
}

// ═══════════════════════════════════════════════════════════
//  SERVICES
// ═══════════════════════════════════════════════════════════
export async function getServices(params?: { limit?: number; offset?: number; category?: string }) {
    await requireAuth(['admin', 'pharmacy', 'cashier']);
    
    let whereClause = undefined;
    if (params?.category && params.category !== 'All') {
        whereClause = eq(schema.services.category, params.category);
    }

    const query = db.select().from(schema.services);
    if (whereClause) query.where(whereClause);
    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);
    
    const countQuery = db.select({ value: count() }).from(schema.services);
    if (whereClause) countQuery.where(whereClause);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        services: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function createService(data: typeof schema.services.$inferInsert) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.insert(schema.services).values(data).returning();
    return serializeOne(row);
}

export async function updateService(id: string, data: Partial<typeof schema.services.$inferInsert>) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.update(schema.services).set(data).where(eq(schema.services.id, id)).returning();
    return row ? serializeOne(row) : null;
}

export async function deleteService(id: string) {
    await requireAuth(['admin', 'pharmacy']);
    await db.delete(schema.services).where(eq(schema.services.id, id));
}

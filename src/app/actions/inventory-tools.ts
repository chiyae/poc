'use server';

import { db } from '@/db';
import { eq, desc, count, and, asc, sql, gte } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { logAction } from '@/lib/audit';
import { serialize, serializeOne, formatItemName } from '@/lib/utils';
import { requireAuth } from './utils';
import type { InternalOrder } from '@/lib/types';

// ═══════════════════════════════════════════════════════════
//  INTERNAL ORDERS
// ═══════════════════════════════════════════════════════════
export async function getInternalOrders(params?: { limit?: number; offset?: number }) {
    await requireAuth(['admin', 'pharmacy']);
    
    const query = db.select().from(schema.internalOrders).$dynamic();
    query.orderBy(desc(schema.internalOrders.date));
    
    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const countQuery = db.select({ value: count() }).from(schema.internalOrders);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        internalOrders: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function createInternalOrder(data: typeof schema.internalOrders.$inferInsert) {
    await requireAuth(['admin', 'pharmacy']);
    
    return await db.transaction(async (tx) => {
        const [row] = await tx.insert(schema.internalOrders).values(data).returning();
        
        // Reserve stock
        const type = data.type || 'Request';
        const sourceLocation = type === 'Return' ? 'dispensary' : 'bulk-store';
        const items = data.items as any[];
        
        if (items && Array.isArray(items)) {
            for (const item of items) {
                let remainingToReserve = item.quantity;
                const sourceStocks = await tx.select().from(schema.stocks).where(
                    and(
                        eq(schema.stocks.itemId, item.itemId),
                        eq(schema.stocks.locationId, sourceLocation)
                    )
                ).orderBy(asc(schema.stocks.expiryDate));

                for (const batch of sourceStocks) {
                    if (remainingToReserve <= 0) break;
                    const available = batch.currentStockQuantity - batch.reservedStock;
                    if (available > 0) {
                        const reserveAmount = Math.min(available, remainingToReserve);
                        await tx.update(schema.stocks)
                            .set({ reservedStock: sql`${schema.stocks.reservedStock} + ${reserveAmount}` })
                            .where(eq(schema.stocks.id, batch.id));
                        remainingToReserve -= reserveAmount;
                    }
                }
            }
        }
        
        return serializeOne(row);
    });
}

export async function updateInternalOrder(id: string, data: Partial<typeof schema.internalOrders.$inferInsert>) {
    try {
        const user = await requireAuth(['admin', 'pharmacy']);
        const [row] = await db.update(schema.internalOrders).set(data).where(eq(schema.internalOrders.id, id)).returning();
        
        if (row) {
            await logAction(user, 'Update Internal Order', { id, status: data.status });
        }
        
        return row ? serializeOne(row) : null;
    } catch (error) {
        console.error("Error in updateInternalOrder:", error);
        throw error;
    }
}

export async function issueInternalOrder(orderId: string, issueQuantities?: Record<string, number>) {
    const user = await requireAuth(['admin', 'pharmacy']);

    try {
        return await db.transaction(async (tx) => {
            // 1. Get the order
            const [order] = await tx.select().from(schema.internalOrders).where(eq(schema.internalOrders.id, orderId));
            if (!order) throw new Error("Order not found.");
            if (order.status !== 'Pending') throw new Error("Order is not in Pending status.");

            const orderData = order as any as InternalOrder;
            const finalIssuedItems: any[] = [];

            // 2. Validate stock for all items
            const type = orderData.type || 'Request';
            const sourceLocation = type === 'Return' ? 'dispensary' : 'bulk-store';
            const targetLocation = type === 'Return' ? 'bulk-store' : 'dispensary';



            for (const requestedItem of orderData.items) {
                const quantityToIssue = issueQuantities?.[requestedItem.itemId] ?? requestedItem.quantity;
                
                if (quantityToIssue < 0) throw new Error("Quantity to issue cannot be negative.");
                if (quantityToIssue > requestedItem.quantity && type !== 'Return') {
                   // Optional: Prevent issuing more than requested for Requests
                   // throw new Error(`Cannot issue more than requested for ${requestedItem.itemId}`);
                }

                if (quantityToIssue === 0) {
                    finalIssuedItems.push({ ...requestedItem, quantity: 0 });
                    continue; 
                }

                const sourceStocks = await tx.select().from(schema.stocks).where(
                    and(
                        eq(schema.stocks.itemId, requestedItem.itemId),
                        eq(schema.stocks.locationId, sourceLocation)
                    )
                ).orderBy(asc(schema.stocks.expiryDate));

                const totalSourceStock = sourceStocks.reduce((sum, s) => sum + s.currentStockQuantity, 0);

                if (totalSourceStock < quantityToIssue) {
                    const [itemDetails] = await tx.select().from(schema.items).where(eq(schema.items.id, requestedItem.itemId));
                    throw new Error(`Insufficient stock in ${sourceLocation} for ${itemDetails?.genericName || requestedItem.itemId}. Available: ${totalSourceStock}, Required: ${quantityToIssue}`);
                }
                
                finalIssuedItems.push({ ...requestedItem, quantity: quantityToIssue });
            }

            // 3. Process stock transfer
            for (const issuedItem of finalIssuedItems) {
                let remainingToIssue = issuedItem.quantity;
                if (remainingToIssue <= 0) continue;

                const sourceStocks = await tx.select().from(schema.stocks).where(
                    and(
                        eq(schema.stocks.itemId, issuedItem.itemId),
                        eq(schema.stocks.locationId, sourceLocation)
                    )
                ).orderBy(asc(schema.stocks.expiryDate));

                // FIFO issuance logic from source location
                for (const sourceBatch of sourceStocks) {
                    if (remainingToIssue <= 0) break;

                    const amountFromThisBatch = Math.min(sourceBatch.currentStockQuantity, remainingToIssue);
                    
                    if (amountFromThisBatch > 0) {
                        // Decrease source stock and release reservation atomically
                        const [updatedSource] = await tx.update(schema.stocks)
                            .set({ 
                                currentStockQuantity: sql`${schema.stocks.currentStockQuantity} - ${amountFromThisBatch}`,
                                reservedStock: sql`GREATEST(0, ${schema.stocks.reservedStock} - ${amountFromThisBatch})`
                            })
                            .where(
                                and(
                                    eq(schema.stocks.id, sourceBatch.id),
                                    gte(schema.stocks.currentStockQuantity, amountFromThisBatch)
                                )
                            ).returning();

                        if (!updatedSource) {
                            throw new Error(`Concurrency error: Stock for ${sourceBatch.batchId} changed while issuing.`);
                        }

                        // Increase/Create target stock
                        const [targetBatch] = await tx.select().from(schema.stocks).where(
                            and(
                                eq(schema.stocks.itemId, issuedItem.itemId),
                                eq(schema.stocks.locationId, targetLocation),
                                eq(schema.stocks.batchId, sourceBatch.batchId)
                            )
                        );

                        if (targetBatch) {
                            await tx.update(schema.stocks)
                                .set({ currentStockQuantity: targetBatch.currentStockQuantity + amountFromThisBatch })
                                .where(eq(schema.stocks.id, targetBatch.id));
                        } else {
                            await tx.insert(schema.stocks).values({
                                itemId: sourceBatch.itemId,
                                batchId: sourceBatch.batchId,
                                expiryDate: sourceBatch.expiryDate,
                                locationId: targetLocation,
                                currentStockQuantity: amountFromThisBatch,
                            });
                        }

                        remainingToIssue -= amountFromThisBatch;
                    }
                }
            }

            // 4. Update order status and final items
            const isPartiallyIssued = finalIssuedItems.some(
                (issuedItem, index) => issuedItem.quantity < orderData.items[index].quantity
            );
            const finalStatus = isPartiallyIssued ? 'Partially Issued' : 'Issued';

            const [finalOrder] = await tx.update(schema.internalOrders)
                .set({ 
                    status: finalStatus,
                    items: finalIssuedItems
                })
                .where(eq(schema.internalOrders.id, orderId))
                .returning();

            await logAction(user, 'Issue Internal Order', { orderId, items: finalIssuedItems });

            return serializeOne(finalOrder);
        });
    } catch (error: any) {
        console.error("Error in issueInternalOrder transaction:", error);
        throw new Error(error.message || "Failed to issue stock.");
    }
}

export async function deleteInternalOrder(id: string) {
    await requireAuth(['admin', 'pharmacy']);
    await db.delete(schema.internalOrders).where(eq(schema.internalOrders.id, id));
}

// ═══════════════════════════════════════════════════════════
//  STOCK TAKE SESSIONS
// ═══════════════════════════════════════════════════════════
export async function getStockTakeSessions(params?: { limit?: number; offset?: number }) {
    await requireAuth(['admin', 'pharmacy']);
    
    const query = db.select().from(schema.stockTakeSessions).$dynamic();
    query.orderBy(desc(schema.stockTakeSessions.date));

    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const countQuery = db.select({ value: count() }).from(schema.stockTakeSessions);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        sessions: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function getStockTakeSessionsByLocation(locationId: string, params?: { limit?: number; offset?: number }) {
    const user = await requireAuth(['admin', 'pharmacy']);

    // Authorization: Location check
    if (user.role !== 'admin' && user.locationId !== 'all' && user.locationId !== locationId) {
        throw new Error("Forbidden: You do not have access to stock take sessions at this location.");
    }

    const whereClause = eq(schema.stockTakeSessions.locationId, locationId);
    
    const query = db.select().from(schema.stockTakeSessions).where(whereClause).$dynamic();
    query.orderBy(desc(schema.stockTakeSessions.date));

    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const countQuery = db.select({ value: count() }).from(schema.stockTakeSessions).where(whereClause);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        sessions: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function createStockTakeSession(data: typeof schema.stockTakeSessions.$inferInsert) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.insert(schema.stockTakeSessions).values(data).returning();
    return serializeOne(row);
}

export async function updateStockTakeSession(id: string, data: Partial<typeof schema.stockTakeSessions.$inferInsert>) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.update(schema.stockTakeSessions).set(data).where(eq(schema.stockTakeSessions.id, id)).returning();
    return row ? serializeOne(row) : null;
}

// ═══════════════════════════════════════════════════════════
//  STOCK TAKE ITEMS
// ═══════════════════════════════════════════════════════════
export async function getStockTakeItems(sessionId: string, params?: { limit?: number; offset?: number }) {
    await requireAuth(['admin', 'pharmacy']);
    
    const query = db.select().from(schema.stockTakeItems).where(eq(schema.stockTakeItems.sessionId, sessionId)).$dynamic();
    
    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const countQuery = db.select({ value: count() }).from(schema.stockTakeItems).where(eq(schema.stockTakeItems.sessionId, sessionId));

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        data: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function createStockTakeItem(data: typeof schema.stockTakeItems.$inferInsert) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.insert(schema.stockTakeItems).values(data).returning();
    return serializeOne(row);
}

export async function updateStockTakeItem(id: string, data: Partial<typeof schema.stockTakeItems.$inferInsert>) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.update(schema.stockTakeItems).set(data).where(eq(schema.stockTakeItems.id, id)).returning();
    return row ? serializeOne(row) : null;
}

export async function deleteStockTakeItem(id: string) {
    await requireAuth(['admin', 'pharmacy']);
    await db.delete(schema.stockTakeItems).where(eq(schema.stockTakeItems.id, id));
}

// ═══════════════════════════════════════════════════════════
//  PROCUREMENT SESSIONS
// ═══════════════════════════════════════════════════════════
export async function getProcurementSessions(params?: { limit?: number; offset?: number }) {
    await requireAuth(['admin', 'pharmacy']);
    
    const query = db.select().from(schema.procurementSessions).$dynamic();
    query.orderBy(desc(schema.procurementSessions.createdAt));

    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const countQuery = db.select({ value: count() }).from(schema.procurementSessions);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        sessions: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function getProcurementSessionById(id: string) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.select().from(schema.procurementSessions).where(eq(schema.procurementSessions.id, id));
    return row ? serializeOne(row) : null;
}

export async function createProcurementSession(data: typeof schema.procurementSessions.$inferInsert) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.insert(schema.procurementSessions).values(data).returning();
    return serializeOne(row);
}

export async function updateProcurementSession(id: string, data: Partial<typeof schema.procurementSessions.$inferInsert>) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.update(schema.procurementSessions).set(data).where(eq(schema.procurementSessions.id, id)).returning();
    return row ? serializeOne(row) : null;
}

export async function deleteProcurementSession(id: string) {
    await requireAuth(['admin', 'pharmacy']);
    await db.delete(schema.procurementSessions).where(eq(schema.procurementSessions.id, id));
}

// ═══════════════════════════════════════════════════════════
//  LOCAL PURCHASE ORDERS
// ═══════════════════════════════════════════════════════════
export async function getLocalPurchaseOrders(params?: { limit?: number; offset?: number }) {
    await requireAuth(['admin', 'pharmacy']);
    
    const query = db.select().from(schema.localPurchaseOrders).$dynamic();
    query.orderBy(desc(schema.localPurchaseOrders.date));

    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const countQuery = db.select({ value: count() }).from(schema.localPurchaseOrders);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        lpos: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function createLocalPurchaseOrder(data: typeof schema.localPurchaseOrders.$inferInsert) {
    const user = await requireAuth(['admin', 'pharmacy']);
    const dataWithUser = {
        ...data,
        preparedByUserId: user.id,
        preparedByName: user.displayName,
    };
    const [row] = await db.insert(schema.localPurchaseOrders).values(dataWithUser).returning();
    return serializeOne(row);
}

export async function updateLocalPurchaseOrder(id: string, data: Partial<typeof schema.localPurchaseOrders.$inferInsert>) {
    await requireAuth(['admin', 'pharmacy']);
    const [row] = await db.update(schema.localPurchaseOrders).set(data).where(eq(schema.localPurchaseOrders.id, id)).returning();
    return row ? serializeOne(row) : null;
}

export async function deleteLocalPurchaseOrder(id: string) {
    await requireAuth(['admin', 'pharmacy']);
    await db.delete(schema.localPurchaseOrders).where(eq(schema.localPurchaseOrders.id, id));
}

// ═══════════════════════════════════════════════════════════
//  STOCK TAKE RECONCILIATION
// ═══════════════════════════════════════════════════════════
export async function commitStockTakeSession(sessionId: string) {
    const user = await requireAuth(['admin', 'pharmacy']);
    
    return await db.transaction(async (tx) => {
        const [session] = await tx.select().from(schema.stockTakeSessions).where(eq(schema.stockTakeSessions.id, sessionId));
        if (!session) throw new Error("Stock Take Session not found.");
        if (session.status === 'Completed') throw new Error("Session is already completed.");

        const items = await tx.select().from(schema.stockTakeItems).where(eq(schema.stockTakeItems.sessionId, sessionId));

        for (const item of items) {
            // Find the stock record
            const [stock] = await tx.select().from(schema.stocks).where(
                and(
                    eq(schema.stocks.itemId, item.itemId),
                    eq(schema.stocks.batchId, item.batchId),
                    eq(schema.stocks.locationId, session.locationId)
                )
            );

            if (stock) {
                // Update the stock to match the physical quantity
                await tx.update(schema.stocks)
                    .set({ currentStockQuantity: item.physicalQty })
                    .where(eq(schema.stocks.id, stock.id));
            } else if (item.physicalQty > 0) {
                // If it didn't exist but we counted some, create it
                let expiryDate = null;
                if (item.expiryDate && item.expiryDate !== 'N/A') {
                    const parsedDate = new Date(item.expiryDate);
                    if (!isNaN(parsedDate.getTime())) {
                        expiryDate = parsedDate;
                    }
                }
                await tx.insert(schema.stocks).values({
                    itemId: item.itemId,
                    batchId: item.batchId,
                    locationId: session.locationId,
                    expiryDate: expiryDate,
                    currentStockQuantity: item.physicalQty,
                });
            }
        }

        const [completedSession] = await tx.update(schema.stockTakeSessions)
            .set({ status: 'Completed' })
            .where(eq(schema.stockTakeSessions.id, sessionId))
            .returning();
            
        await logAction(user, 'Commit Stock Take', { sessionId, locationId: session.locationId });
        
        return serializeOne(completedSession);
    });
}

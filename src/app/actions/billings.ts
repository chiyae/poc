'use server';

import { db } from '@/db';
import { eq, desc, ilike, and, gte, lte, count } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { logAction } from '@/lib/audit';
import { ClinicSettings, Bill } from '@/lib/types';
import { serialize, serializeOne } from '@/lib/utils';
import { requireAuth } from './utils';

// ═══════════════════════════════════════════════════════════
//  BILLINGS
// ═══════════════════════════════════════════════════════════
export async function getBillings(params?: {
    limit?: number;
    offset?: number;
    patientName?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    await requireAuth(['admin', 'pharmacy', 'cashier']);

    const filters = [];
    if (params?.patientName) {
        filters.push(ilike(schema.billings.patientName, `%${params.patientName}%`));
    }
    if (params?.startDate) {
        filters.push(gte(schema.billings.date, params.startDate));
    }
    if (params?.endDate) {
        filters.push(lte(schema.billings.date, params.endDate));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const query = db.select().from(schema.billings).$dynamic();
    if (whereClause) query.where(whereClause);
    query.orderBy(desc(schema.billings.date));

    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const countQuery = db.select({ value: count() }).from(schema.billings);
    if (whereClause) countQuery.where(whereClause);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        billings: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function getBillingsByLocation(locationId: string, params?: { limit?: number; offset?: number }) {
    const user = await requireAuth(['admin', 'pharmacy', 'cashier']);

    // Authorization: Location check
    if (user.role !== 'admin' && user.locationId !== 'all' && user.locationId !== locationId) {
        throw new Error("Forbidden: You do not have access to billings at this location.");
    }

    const filters = [eq(schema.billings.dispensingLocationId, locationId)];
    const whereClause = and(...filters);

    const query = db.select().from(schema.billings).where(whereClause).$dynamic();
    query.orderBy(desc(schema.billings.date));

    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const countQuery = db.select({ value: count() }).from(schema.billings).where(whereClause);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        billings: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function createBilling(data: typeof schema.billings.$inferInsert) {
    const user = await requireAuth();

    return await db.transaction(async (tx) => {
        // 1. Get current settings to find next numbers
        const [settingsRow] = await tx.select().from(schema.settings).where(eq(schema.settings.id, 'clinic'));
        const settings = (settingsRow?.value || {}) as ClinicSettings;

        const isUnpaid = (data as any).paymentDetails?.status === 'Unpaid';

        let invoiceNumber: string | null = null;
        let receiptNumber: string | null = null;
        let nextInvoiceCount = settings.nextInvoiceNumber || 1;
        let nextReceiptCount = settings.nextReceiptNumber || 1;

        // One entry is EITHER an Invoice OR a Receipt initially
        if (isUnpaid) {
            invoiceNumber = `INV-${nextInvoiceCount.toString().padStart(4, '0')}`;
            nextInvoiceCount++;
        } else {
            receiptNumber = `RCPT-${nextReceiptCount.toString().padStart(4, '0')}`;
            nextReceiptCount++;
        }

        // 1.5 Determine shift if not provided
        let shiftType = data.shiftType;
        if (!shiftType) {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const currentTime = hours * 60 + minutes;
            const dayStart = 7 * 60 + 30; // 07:30
            const dayEnd = 17 * 60 + 30;  // 17:30
            shiftType = (currentTime >= dayStart && currentTime <= dayEnd) ? 'Day' : 'Night';
        }

        // 2. Prepare billing data
        const rowData = {
            ...data,
            patientId: data.patientId || null,
            prescriptionNumber: data.prescriptionNumber || null,
            receiptNumber: receiptNumber,
            paymentDetails: {
                ...(data.paymentDetails as any),
                invoiceNumber: invoiceNumber
            },
            discount: data.discount ?? 0,
            shiftType: shiftType,
        };

        const [row] = await tx.insert(schema.billings).values(rowData).returning();

        // 3. Update settings counters
        await tx.update(schema.settings)
            .set({
                value: {
                    ...settings,
                    nextInvoiceNumber: nextInvoiceCount,
                    nextReceiptNumber: nextReceiptCount
                }
            })
            .where(eq(schema.settings.id, 'clinic'));

        // Log and return
        await logAction(user, 'Create Bill', { bill: row });
        return serializeOne(row);
    });
}

export async function updateBilling(id: string, data: Partial<typeof schema.billings.$inferInsert>) {
    const user = await requireAuth(['admin', 'cashier']);

    return await db.transaction(async (tx) => {
        const [before] = await tx.select().from(schema.billings).where(eq(schema.billings.id, id));
        if (!before) return null;

        if (user.role !== 'admin' && user.locationId !== 'all' && user.locationId !== before.dispensingLocationId) {
            throw new Error("Forbidden: You cannot update billings at this location.");
        }

        let updatedData = { ...data };

        // If transitioning from Unpaid to Paid, assign a Receipt Number
        const billBefore = before as unknown as Bill;
        const paymentDetailsData = data.paymentDetails as any;

        if (billBefore.paymentDetails.status === 'Unpaid' && paymentDetailsData?.status === 'Paid') {
            const [settingsRow] = await tx.select().from(schema.settings).where(eq(schema.settings.id, 'clinic'));
            const settings = (settingsRow?.value || {}) as ClinicSettings;

            const currentReceiptCount = settings.nextReceiptNumber || 1;
            const receiptNumber = `RCPT-${currentReceiptCount.toString().padStart(4, '0')}`;

            // 1. Update Invoice status to Paid
            // We use standard status update logic here
            updatedData.paymentDetails = {
                ...billBefore.paymentDetails,
                ...paymentDetailsData,
                status: 'Paid'
            };

            const [updatedInvoice] = await tx.update(schema.billings)
                .set(updatedData)
                .where(eq(schema.billings.id, id))
                .returning();

            // 2. Create a NEW Separate Receipt record
            const receiptInsertData = {
                patientId: updatedInvoice.patientId,
                patientName: updatedInvoice.patientName,
                billType: updatedInvoice.billType,
                prescriptionNumber: updatedInvoice.prescriptionNumber,
                receiptNumber: receiptNumber,
                items: updatedInvoice.items,
                subtotal: updatedInvoice.subtotal,
                discount: updatedInvoice.discount,
                grandTotal: updatedInvoice.grandTotal,
                paymentDetails: {
                    ...(updatedInvoice.paymentDetails as any),
                    invoiceNumber: null, // Receipt record doesn't have an INV number
                    parentBillId: updatedInvoice.id,
                    parentInvoiceNumber: (updatedInvoice.paymentDetails as any).invoiceNumber
                },
                dispensingLocationId: updatedInvoice.dispensingLocationId,
                performedById: user.id, // Current logged in user
                date: new Date(), // Payment date
            };

            const [receiptRecord] = await tx.insert(schema.billings).values(receiptInsertData).returning();

            // 3. Increment the counter
            await tx.update(schema.settings)
                .set({
                    value: {
                        ...settings,
                        nextReceiptNumber: currentReceiptCount + 1
                    }
                })
                .where(eq(schema.settings.id, 'clinic'));

            await logAction(user, 'Invoice Paid', { invoice: updatedInvoice, receipt: receiptRecord });
            return serializeOne(receiptRecord);
        }

        const [row] = await tx.update(schema.billings).set(updatedData).where(eq(schema.billings.id, id)).returning();

        if (row) {
            await logAction(user, 'Update Bill', { before, after: row });
            return serializeOne(row);
        }
        return null;
    });
}

export async function deleteBilling(id: string) {
    await requireAuth(['admin']);
    await db.delete(schema.billings).where(eq(schema.billings.id, id));
}
export async function getItemUsageStats(itemId: string) {
    await requireAuth(['admin', 'pharmacy']);
    
    // We look at the last 30 days of billings
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBills = await db.select().from(schema.billings).where(gte(schema.billings.date, thirtyDaysAgo));
    
    let totalQuantity = 0;
    let occurrences = 0;

    recentBills.forEach(bill => {
        const items = (bill.items || []) as any[];
        const itemMatch = items.find(i => i.itemId === itemId);
        if (itemMatch) {
            totalQuantity += itemMatch.quantity;
            occurrences += 1;
        }
    });

    return {
        totalQuantityLast30Days: totalQuantity,
        dispensingFrequency: occurrences,
        averageDailyUsage: totalQuantity / 30
    };
}

'use server';

import { db } from '@/db';
import { eq, desc, like, count } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { getSettings } from './admin'; // We'll create this soon
import { serialize, serializeOne } from '@/lib/utils';
import { requireAuth } from './utils';

// ═══════════════════════════════════════════════════════════
//  PATIENTS
// ═══════════════════════════════════════════════════════════
export async function getPatients(params?: { limit?: number; offset?: number }) {
    await requireAuth(['admin', 'pharmacy', 'cashier']);
    const query = db.select().from(schema.patients).$dynamic();
    
    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);
    
    const countQuery = db.select({ value: count() }).from(schema.patients);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        patients: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function createPatient(data: typeof schema.patients.$inferInsert) {
    await requireAuth();
    const settingsRow = await getSettings('clinic');
    const prefix = (settingsRow?.value as any)?.patientIdPrefix || 'MPC';
    const year = new Date().getFullYear();
    const pattern = `${prefix}-${year}-%`;

    const lastPatient = await db.select({ patientNumber: schema.patients.patientNumber })
        .from(schema.patients)
        .where(like(schema.patients.patientNumber, pattern))
        .orderBy(desc(schema.patients.patientNumber))
        .limit(1);

    let nextSequence = 1;
    if (lastPatient.length > 0) {
        const lastNumber = lastPatient[0].patientNumber;
        const parts = lastNumber.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
            nextSequence = lastSeq + 1;
        }
    }

    const patientNumber = `${prefix}-${year}-${nextSequence.toString().padStart(3, '0')}`;

    const [row] = await db.insert(schema.patients).values({
        ...data,
        patientNumber,
    }).returning();

    return serializeOne(row);
}

export async function updatePatient(id: string, data: Partial<typeof schema.patients.$inferInsert>) {
    await requireAuth(['admin', 'pharmacy', 'cashier']);
    const [row] = await db.update(schema.patients).set(data).where(eq(schema.patients.id, id)).returning();
    return row ? serializeOne(row) : null;
}

export async function getPatientById(id: string) {
    await requireAuth(['admin', 'pharmacy', 'cashier']);
    const [row] = await db.select().from(schema.patients).where(eq(schema.patients.id, id));
    return row ? serializeOne(row) : null;
}

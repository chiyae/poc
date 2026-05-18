'use server';

import { db } from '@/db';
import { eq, desc, count, sql } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { serialize, serializeOne } from '@/lib/utils';
import { requireAuth } from './utils';

// ═══════════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════════
export async function getUsers(params?: { limit?: number; offset?: number }) {
    await requireAuth(['admin']);
    
    const query = db.select().from(schema.users).$dynamic();
    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const countQuery = db.select({ value: count() }).from(schema.users);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        users: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function getUserById(id: string) {
    await requireAuth(['admin']);
    const [row] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return row ? serializeOne(row) : null;
}

export async function getUserByUsername(username: string) {
    await requireAuth(['admin']);
    const [row] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return row ? serializeOne(row) : null;
}

export async function createUser(data: typeof schema.users.$inferInsert) {
    await requireAuth(['admin']);
    const [row] = await db.insert(schema.users).values(data).returning();
    return serializeOne(row);
}

export async function updateUser(id: string, data: Partial<typeof schema.users.$inferInsert>) {
    await requireAuth(['admin']);
    const [row] = await db.update(schema.users).set(data).where(eq(schema.users.id, id)).returning();
    return row ? serializeOne(row) : null;
}

export async function deleteUser(id: string) {
    await requireAuth(['admin']);
    await db.delete(schema.users).where(eq(schema.users.id, id));
}

// ═══════════════════════════════════════════════════════════
//  SESSIONS (Admin)
// ═══════════════════════════════════════════════════════════
export async function getActiveSessions(params?: { limit?: number; offset?: number }) {
    const user = await requireAuth();
    if (user.role !== 'admin') {
        throw new Error("Unauthorized: Only administrators can view active sessions.");
    }

    const query = db.select({
        id: schema.sessions.id,
        userId: schema.sessions.userId,
        userAgent: schema.sessions.userAgent,
        ipAddress: schema.sessions.ipAddress,
        lastActive: schema.sessions.lastActive,
        expiresAt: schema.sessions.expiresAt,
        createdAt: schema.sessions.createdAt,
        userDisplayName: schema.users.displayName,
        username: schema.users.username,
    })
        .from(schema.sessions)
        .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
        .orderBy(desc(schema.sessions.lastActive))
        .$dynamic();

    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);

    const countQuery = db.select({ value: count() }).from(schema.sessions);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        sessions: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

export async function revokeSession(sessionId: string) {
    const user = await requireAuth();
    if (user.role !== 'admin') {
        throw new Error("Unauthorized: Only administrators can revoke sessions.");
    }

    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
    return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  AUDIT LOGS
// ═══════════════════════════════════════════════════════════
export async function getLogs(params?: { limit?: number; offset?: number }) {
    await requireAuth(['admin']);
    const query = db.select().from(schema.logs).$dynamic();
    if (params?.limit !== undefined) query.limit(params.limit);
    if (params?.offset !== undefined) query.offset(params.offset);
    
    const countQuery = db.select({ value: count() }).from(schema.logs);

    const [rows, [totalCount]] = await Promise.all([
        query,
        countQuery
    ]);

    return {
        logs: serialize(rows) as any[],
        totalCount: totalCount.value
    };
}

// Internal-only — not exported to prevent unauthorized audit log entries
async function createLog(data: typeof schema.logs.$inferInsert) {
    const [row] = await db.insert(schema.logs).values(data).returning();
    return serializeOne(row);
}

// Re-export for internal use by audit.ts
export { createLog };

// ═══════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════
export async function getSettings(id: string) {
    // Settings reads are needed by many components; require any authenticated user
    await requireAuth();
    const [row] = await db.select().from(schema.settings).where(eq(schema.settings.id, id));
    return row ? serializeOne(row) : null;
}

export async function upsertSettings(id: string, value: Record<string, any>) {
    await requireAuth(['admin']);
    const [row] = await db.insert(schema.settings)
        .values({ id, value })
        .onConflictDoUpdate({
            target: schema.settings.id,
            set: { value },
        })
        .returning();
    return serializeOne(row);
}
export async function getItemHistory(itemId: string) {
    await requireAuth(['admin', 'pharmacy']);
    
    // Use SQL JSONB filtering instead of in-memory JavaScript filtering
    const itemLogs = await db.select()
        .from(schema.logs)
        .where(sql`${schema.logs.details}::text LIKE ${'%' + itemId + '%'}`)
        .orderBy(desc(schema.logs.timestamp))
        .limit(10);

    return serialize(itemLogs) as any[];
}

'use server';

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import * as schema from '@/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { randomBytes, scryptSync } from 'crypto';

// Secure password hashing using scrypt with random salt
function hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${hash}`;
}

// Legacy SHA-256 hash for backward compatibility detection
async function hashPasswordLegacy(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    if (storedHash.startsWith('scrypt:')) {
        // New scrypt format: "scrypt:<salt>:<hash>"
        const [, salt, hash] = storedHash.split(':');
        const inputHash = scryptSync(password, salt, 64).toString('hex');
        return inputHash === hash;
    }
    // Legacy SHA-256 format (no prefix)
    const legacyHash = await hashPasswordLegacy(password);
    return legacyHash === storedHash;
}

const SESSION_COOKIE = 'meditrack_session';

// ─── Login Rate Limiting ─────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

// Periodic cleanup of stale attempts (runs every 30 minutes)
const loginCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [username, entry] of loginAttempts) {
        if (now - entry.firstAttempt > LOCKOUT_WINDOW_MS) {
            loginAttempts.delete(username);
        }
    }
}, 30 * 60 * 1000);

// ─── Session Cleanup ─────────────────────────────────────
// Automatically purge expired sessions from the database every 6 hours
const sessionCleanupInterval = setInterval(async () => {
    try {
        console.log('Running background session cleanup...');
        const now = new Date();
        await db.delete(sessions).where(sql`${sessions.expiresAt} < ${now}`);
    } catch (error) {
        console.error('Failed to run background session cleanup:', error);
    }
}, 6 * 60 * 60 * 1000);

// Prevent intervals from blocking process exit in environments like tests/scripts
if (typeof loginCleanupInterval.unref === 'function') loginCleanupInterval.unref();
if (typeof sessionCleanupInterval.unref === 'function') sessionCleanupInterval.unref();

function checkRateLimit(username: string): { allowed: boolean; retryAfterMs?: number } {
    const entry = loginAttempts.get(username);
    if (!entry) return { allowed: true };

    const elapsed = Date.now() - entry.firstAttempt;
    if (elapsed > LOCKOUT_WINDOW_MS) {
        // Window expired, reset
        loginAttempts.delete(username);
        return { allowed: true };
    }

    if (entry.count >= MAX_LOGIN_ATTEMPTS) {
        return { allowed: false, retryAfterMs: LOCKOUT_WINDOW_MS - elapsed };
    }

    return { allowed: true };
}

function recordFailedAttempt(username: string) {
    const entry = loginAttempts.get(username);
    if (!entry) {
        loginAttempts.set(username, { count: 1, firstAttempt: Date.now() });
    } else {
        entry.count++;
    }
}

function clearAttempts(username: string) {
    loginAttempts.delete(username);
}

export async function login(username: string, password: string) {
    try {
        // Rate limit check
        const rateCheck = checkRateLimit(username);
        if (!rateCheck.allowed) {
            const minutesLeft = Math.ceil((rateCheck.retryAfterMs || 0) / 60000);
            return { success: false, error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` };
        }

        const [user] = await db.select().from(users).where(eq(users.username, username));

        if (!user) {
            recordFailedAttempt(username);
            return { success: false, error: 'Invalid username or password' };
        }

        if (user.disabled) {
            return { success: false, error: 'Account is disabled. Contact your administrator.' };
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            recordFailedAttempt(username);
            return { success: false, error: 'Invalid username or password' };
        }

        // Login successful — clear rate limit counter
        clearAttempts(username);

        // Auto-migrate legacy SHA-256 hashes to scrypt on successful login
        if (!user.passwordHash.startsWith('scrypt:')) {
            const newHash = hashPassword(password);
            await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));
        }

        // Generate session token
        const token = crypto.randomUUID();
        const headerList = await headers();
        const userAgent = headerList.get('user-agent') || 'Unknown';
        const ipAddress = headerList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

        // Store session in DB
        await db.insert(sessions).values({
            userId: user.id,
            token,
            userAgent,
            ipAddress,
            expiresAt,
        });

        // Set session cookie with token
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                locationId: user.locationId,
            },
        };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

export async function logout() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

        if (sessionToken) {
            await db.delete(sessions).where(eq(sessions.token, sessionToken));
        }

        cookieStore.delete(SESSION_COOKIE);
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false };
    }
}

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

        if (!sessionToken) {
            return null;
        }

        // Validate session in DB
        const [sessionRecord] = await db.select({
            session: sessions,
            user: users,
            settings: schema.settings
        })
            .from(sessions)
            .innerJoin(users, eq(sessions.userId, users.id))
            .leftJoin(schema.settings, eq(schema.settings.id, 'clinic'))
            .where(
                and(
                    eq(sessions.token, sessionToken),
                    gt(sessions.expiresAt, new Date())
                )
            );

        if (!sessionRecord || sessionRecord.user.disabled) {
            if (sessionRecord) {
                // Session exists but user disabled, cleanup
                await db.delete(sessions).where(eq(sessions.token, sessionToken));
            }
            return null;
        }

        const headerList = await headers();
        const currentUserAgent = headerList.get('user-agent') || 'Unknown';

        // 1. Session Fingerprinting: Prevent hijack if User Agent changes significantly
        if (sessionRecord.session.userAgent !== currentUserAgent) {
            console.warn(`Session fingerprint mismatch for user ${sessionRecord.user.username}. Revoking session.`);
            await db.delete(sessions).where(eq(sessions.token, sessionToken));
            return null;
        }

        // 2. Inactivity Enforcement: Check if user has been idle too long
        const settings = (sessionRecord.settings?.value || {}) as any;
        const timeoutMinutes = settings.sessionTimeout || 30;
        const timeoutMs = timeoutMinutes * 60 * 1000;
        const lastActiveTime = sessionRecord.session.lastActive.getTime();
        const now = Date.now();

        if (now - lastActiveTime > timeoutMs) {
            console.log(`Session for user ${sessionRecord.user.username} expired due to inactivity.`);
            await db.delete(sessions).where(eq(sessions.token, sessionToken));
            cookieStore.delete(SESSION_COOKIE);
            return null;
        }

        // Update last active
        await db.update(sessions)
            .set({ lastActive: new Date() })
            .where(eq(sessions.token, sessionToken));

        return {
            id: sessionRecord.user.id,
            username: sessionRecord.user.username,
            displayName: sessionRecord.user.displayName,
            role: sessionRecord.user.role,
            locationId: sessionRecord.user.locationId,
            sessionId: sessionRecord.session.id
        };
    } catch (error) {
        console.error('getCurrentUser error:', error);
        return null;
    }
}

export async function registerUser(data: {
    username: string;
    password: string;
    displayName: string;
    role: string;
    locationId: string;
}) {
    try {
        // Authorization: Only admins can register new users
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, error: 'Unauthorized: Only administrators can register new users' };
        }

        const passwordHash = hashPassword(data.password);
        const [user] = await db.insert(users).values({
            username: data.username,
            passwordHash,
            displayName: data.displayName,
            role: data.role,
            locationId: data.locationId,
        }).returning();

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                locationId: user.locationId,
            },
        };
    } catch (error: any) {
        if (error?.code === '23505') { // unique constraint violation
            return { success: false, error: 'Username already exists' };
        }
        console.error('Register error:', error);
        return { success: false, error: 'Failed to register user' };
    }
}

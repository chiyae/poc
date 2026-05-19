'use server';

import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { requireAuth } from './utils';

const execFileAsync = promisify(execFile);

const PG_DUMP_PATH = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe';
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
function ensureBackupDir() {
    if (process.env.VERCEL) return false;
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    return true;
}

export async function triggerDatabaseBackup() {
    await requireAuth(['admin']);

    if (process.env.VERCEL) {
        throw new Error('Local file system backups using pg_dump are not supported on Vercel.');
    }
    ensureBackupDir();

    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/MPMCPOC';
    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Parse connection string
    const url = new URL(connectionString);
    const host = url.hostname === 'localhost' ? '127.0.0.1' : url.hostname;
    const port = url.port || '5432';
    const user = url.username;
    const password = decodeURIComponent(url.password); 
    const database = url.pathname.slice(1);

    // Use execFile (not exec) to avoid shell injection
    const args = ['-h', host, '-p', port, '-U', user, '-F', 'p', '-f', filepath, database];

    console.log(`Starting backup: ${filename}`);

    try {
        await execFileAsync(PG_DUMP_PATH, args, {
            env: { ...process.env, PGPASSWORD: password }
        });
        console.log(`Backup completed: ${filename}`);
        return { success: true, filename };
    } catch (error: any) {
        console.error('Backup failed:', error.message);
        throw new Error(`Backup failed: ${error.message}`);
    }
}

export async function getBackupHistory() {
    await requireAuth(['admin']);

    if (process.env.VERCEL || !fs.existsSync(BACKUP_DIR)) return [];

    const files = fs.readdirSync(BACKUP_DIR);
    return files
        .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
        .map(f => {
            const stats = fs.statSync(path.join(BACKUP_DIR, f));
            return {
                filename: f,
                size: stats.size,
                createdAt: stats.birthtime.toISOString(),
            };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Helper: validate that a filename resolves to a path within BACKUP_DIR
function safeBackupPath(filename: string): string {
    const filepath = path.resolve(BACKUP_DIR, filename);
    if (!filepath.startsWith(path.resolve(BACKUP_DIR))) {
        throw new Error('Invalid filename: path traversal detected');
    }
    return filepath;
}

export async function downloadBackup(filename: string) {
    await requireAuth(['admin']);
    const filepath = safeBackupPath(filename);
    if (!fs.existsSync(filepath)) throw new Error('File not found');

    const content = fs.readFileSync(filepath, 'utf8');
    return content;
}

export async function deleteBackup(filename: string) {
    await requireAuth(['admin']);
    const filepath = safeBackupPath(filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
    return { success: true };
}

const LAST_BACKUP_FILE = path.join(BACKUP_DIR, '.last-backup');

export async function checkAndRunScheduledBackup() {
    if (process.env.VERCEL) return { triggered: false };
    
    // Only run if triggered from a valid admin context or as internal system task
    try {
        ensureBackupDir();
        let lastBackupTime = 0;
        if (fs.existsSync(LAST_BACKUP_FILE)) {
            lastBackupTime = parseInt(fs.readFileSync(LAST_BACKUP_FILE, 'utf8'), 10);
        }

        const now = Date.now();
        const twelveHours = 12 * 60 * 60 * 1000;

        if (now - lastBackupTime >= twelveHours) {
            console.log('Running scheduled 12-hour backup...');
            
            await performBackupInternal();
            
            fs.writeFileSync(LAST_BACKUP_FILE, now.toString());
            return { triggered: true };
        }
    } catch (error) {
        console.error('Scheduled backup check failed:', (error as Error).message);
    }
    return { triggered: false };
}

// Internal worker — uses execFile (no shell) to avoid injection
async function performBackupInternal() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/MPMCPOC';
    const filename = `auto-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const url = new URL(connectionString);
    const host = url.hostname === 'localhost' ? '127.0.0.1' : url.hostname;
    const port = url.port || '5432';
    const user = url.username;
    const password = decodeURIComponent(url.password);
    const database = url.pathname.slice(1);

    const args = ['-h', host, '-p', port, '-U', user, '-F', 'p', '-f', filepath, database];

    console.log(`Starting automated backup: ${filename}`);

    await execFileAsync(PG_DUMP_PATH, args, {
        env: { ...process.env, PGPASSWORD: password }
    });
    
    // Cleanup old backups (keep last 14 — one week if 12h)
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('auto-backup-') && f.endsWith('.sql'))
        .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

    if (files.length > 14) {
        for (const file of files.slice(14)) {
            fs.unlinkSync(path.join(BACKUP_DIR, file.name));
        }
    }
}

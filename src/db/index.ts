import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment variable
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/MPMCPOC';

// Create postgres.js connection
const client = postgres(connectionString, {
    max: 5,              // Limit concurrent connections
    idle_timeout: 30,    // Close idle connections after 30s
    max_lifetime: 300,   // Recycle connections every 5 min
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

export type Database = typeof db;

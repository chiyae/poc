import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/MPMCPOC';
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
    const settings = await db.select().from(schema.settings);
    console.log("Settings rows:", JSON.stringify(settings, null, 2));
    await client.end();
}

main().catch(console.error);

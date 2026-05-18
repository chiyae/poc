
import "dotenv/config";
import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq, ilike } from 'drizzle-orm';

async function checkStock() {
  const itemId = 'f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50';
  const item = await db.select().from(schema.items).where(eq(schema.items.id, itemId));
  console.log('ITEM:', JSON.stringify(item, null, 2));

  const stocks = await db.select().from(schema.stocks).where(eq(schema.stocks.itemId, itemId));
  console.log('STOCKS:', JSON.stringify(stocks, null, 2));

  const logs = await db.select().from(schema.logs).where(ilike(schema.logs.details as any, `%${itemId}%`));
  console.log('LOGS:', JSON.stringify(logs, null, 2));
}

checkStock().catch(console.error);


import "dotenv/config";
import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq, desc } from 'drizzle-orm';

async function repairStock() {
  const itemId = 'f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50';
  const batchId = 'PV09501';

  console.log('--- REPAIRING STOCK FOR STOPCOLD ---');
  
  // 1. Find the current bulk store stock
  const [bulkStock] = await db.select().from(schema.stocks).where(eq(schema.stocks.id, '53b7f001-c347-47f0-b558-097cbdf1aa9e'));
  
  if (bulkStock && bulkStock.currentStockQuantity === 5) {
    console.log(`Current quantity is 5. Adding 10 bottles back to make it 15.`);
    
    await db.update(schema.stocks)
      .set({ currentStockQuantity: 15 })
      .where(eq(schema.stocks.id, bulkStock.id));
      
    console.log('Stock updated successfully.');
  } else {
    console.log('Stock record not found or quantity does not match expectations.');
  }
}

repairStock().catch(console.error);

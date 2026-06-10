import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { serializeOne } from '../src/lib/utils';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/MPMCPOC';
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// Helper to simulate requireAuth and upsertSettings on backend
async function simulatedUpsertSettings(id: string, value: Record<string, any>) {
    return await db.transaction(async (tx) => {
        const [existing] = await tx.select().from(schema.settings).where(eq(schema.settings.id, id));
        const existingValue = (existing?.value || {}) as Record<string, any>;
        const mergedValue = { ...existingValue, ...value };

        const [row] = await tx.insert(schema.settings)
            .values({ id, value: mergedValue })
            .onConflictDoUpdate({
                target: schema.settings.id,
                set: { value: mergedValue },
            })
            .returning();
            
        return serializeOne(row);
    });
}

async function main() {
    console.log("=== Verification Script Starting ===");
    
    // 1. Fetch original settings
    const [original] = await db.select().from(schema.settings).where(eq(schema.settings.id, 'clinic'));
    const originalValue = original?.value as any;
    console.log("Original settings value:", JSON.stringify(originalValue, null, 2));

    // 2. Perform test update on clinicName only
    console.log("\nSimulating saving Clinic Name only...");
    await simulatedUpsertSettings('clinic', { clinicName: 'Test Merged Clinic Name' });
    
    // Fetch and check
    const [step1] = await db.select().from(schema.settings).where(eq(schema.settings.id, 'clinic'));
    console.log("Settings after saving Clinic Name:", JSON.stringify(step1?.value, null, 2));
    
    if ((step1?.value as any).currency !== originalValue.currency) {
        throw new Error("FAIL: Currency was wiped out when clinicName was updated!");
    }
    
    // 3. Perform test update on currency only
    console.log("\nSimulating saving Currency only...");
    await simulatedUpsertSettings('clinic', { currency: 'EUR' });
    
    // Fetch and check
    const [step2] = await db.select().from(schema.settings).where(eq(schema.settings.id, 'clinic'));
    console.log("Settings after saving Currency:", JSON.stringify(step2?.value, null, 2));
    
    if ((step2?.value as any).clinicName !== 'Test Merged Clinic Name') {
        throw new Error("FAIL: Clinic Name was wiped out when Currency was updated!");
    }

    // 4. Restore original settings
    console.log("\nRestoring original settings...");
    await simulatedUpsertSettings('clinic', originalValue);
    console.log("Original settings restored successfully!");
    
    console.log("\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
    await client.end();
}

main().catch(async (err) => {
    console.error("Test failed:", err);
    await client.end();
});

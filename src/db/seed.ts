import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/MPMCPOC';
const client = postgres(connectionString);
const db = drizzle(client, { schema });

function hashPassword(password: string): string {
    const { randomBytes, scryptSync } = require('crypto');
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${hash}`;
}

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Create admin user
    const passwordHash = hashPassword('admin123');

    await db.insert(schema.users).values({
        username: 'admin',
        displayName: 'System Administrator',
        passwordHash,
        role: 'admin',
        locationId: 'all',
    }).onConflictDoNothing();

    // 2. Create default clinic settings
    await db.insert(schema.settings).values({
        id: 'clinic',
        value: {
            clinicName: 'MediTrack Pro',
            clinicAddress: '123 Health St, Wellness City',
            clinicPhone: '+123456789',
            currency: 'USD',
        },
    }).onConflictDoNothing();

    // 3. Seed Items from CSV
    const csvPath = 'C:\\Users\\Bernard Kasinja\\Documents\\Point of sale\\item-master-template (1).csv';
    
    if (fs.existsSync(csvPath)) {
        console.log(`📄 Reading items from ${csvPath}...`);
        const csvFile = fs.readFileSync(csvPath, 'utf8');
        
        const results = Papa.parse(csvFile, {
            header: false,
            skipEmptyLines: true,
        });

        // Skip header row
        const rows = results.data.slice(1) as string[][];
        console.log(`📦 Found ${rows.length} items to seed.`);

        let insertedCount = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Map columns based on index
            const genericName = row[0]?.trim();
            if (!genericName) continue;

            const brandName = row[1]?.trim() || null;
            const formulation = row[2]?.trim() || 'Other';
            
            // Strength & Concentration
            const strengthValue = parseFloat(row[3]?.replace(/,/g, '')) || null;
            const strengthUnit = row[4]?.trim() || null;
            const concentrationValue = parseFloat(row[5]?.replace(/,/g, '')) || null;
            const concentrationUnit = row[6]?.trim() || null;
            
            // Package Size
            const packageSizeValue = parseFloat(row[7]?.replace(/,/g, '')) || null;
            const packageSizeUnit = row[8]?.trim() || null;
            
            const category = row[9]?.trim() || 'Medicine';
            const unitOfMeasure = row[10]?.trim() || 'Unit';
            
            // Reorder Levels
            const dispensaryReorderLevel = parseInt(row[11]?.replace(/,/g, '')) || 0;
            const bulkStoreReorderLevel = parseInt(row[12]?.replace(/,/g, '')) || 0;
            
            // Prices
            const buyingPrice = parseFloat(row[13]?.replace(/,/g, '')) || 0;
            const sellingPrice = parseFloat(row[14]?.replace(/,/g, '')) || 0;

            // Generate a unique item code: ITEM-0001, ITEM-0002, etc.
            const itemCode = `ITM-${(i + 1).toString().padStart(4, '0')}`;

            try {
                await db.insert(schema.items).values({
                    itemCode,
                    genericName,
                    brandName,
                    formulation,
                    strengthValue,
                    strengthUnit,
                    concentrationValue,
                    concentrationUnit,
                    packageSizeValue,
                    packageSizeUnit,
                    category,
                    unitOfMeasure,
                    dispensaryReorderLevel,
                    bulkStoreReorderLevel,
                    buyingPrice,
                    sellingPrice,
                    consultationPrice: 0,
                }).onConflictDoNothing();
                insertedCount++;
            } catch (err) {
                console.error(`❌ Failed to insert item ${genericName}:`, err);
            }
        }
        console.log(`✅ Seeded ${insertedCount} items.`);
    } else {
        console.warn(`⚠️ CSV file not found at ${csvPath}. Skipping items seed.`);
    }

    console.log('✅ Seed complete!');
    console.log('   Admin user: admin / admin123');
    await client.end();
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});


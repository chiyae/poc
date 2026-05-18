const { Client } = require('pg');

async function checkPendingBills() {
    const client = new Client({
        connectionString: "postgresql://postgres:Chiyanjano12%40B@localhost:5432/mpmcpoc"
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT id, patient_name, items, payment_details, is_dispensed, date
            FROM billings
            WHERE (payment_details->>'status') = 'Paid'
              AND is_dispensed = false
        `);

        const summarized = res.rows.map(row => {
            const hasProducts = row.items.some(item => item.itemType === 'product');
            const itemsList = row.items.map(i => `${i.itemName} (${i.itemType})`).join(', ');
            return {
                id: row.id,
                patient: row.patient_name,
                hasProducts,
                items: itemsList,
                date: row.date
            };
        });

        console.log(JSON.stringify(summarized, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkPendingBills();

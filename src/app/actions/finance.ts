'use server';

import { db } from '@/db';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { format } from 'date-fns';
import { serialize, serializeOne } from '@/lib/utils';
import { requireAuth } from './utils';

// ═══════════════════════════════════════════════════════════
//  EMPLOYEES
// ═══════════════════════════════════════════════════════════
export async function getEmployees() {
    await requireAuth(['admin']);
    const rows = await db.select().from(schema.employees).orderBy(schema.employees.lastName);
    return serialize(rows);
}

export async function createEmployee(data: typeof schema.employees.$inferInsert) {
    try {
        await requireAuth(['admin']);
        const [row] = await db.insert(schema.employees).values(data).returning();
        return { success: true, data: serializeOne(row) };
    } catch (error: any) {
        console.error('createEmployee error:', error);
        return { success: false, error: error.message || 'Failed to create employee' };
    }
}

export async function updateEmployee(id: string, data: Partial<typeof schema.employees.$inferInsert>) {
    try {
        await requireAuth(['admin']);
        const [row] = await db.update(schema.employees).set(data).where(eq(schema.employees.id, id)).returning();
        return { success: true, data: row ? serializeOne(row) : null };
    } catch (error: any) {
        console.error('updateEmployee error:', error);
        return { success: false, error: error.message || 'Failed to update employee' };
    }
}

// ═══════════════════════════════════════════════════════════
//  EXPENSES
// ═══════════════════════════════════════════════════════════
export async function getExpenses(params?: { startDate?: Date; endDate?: Date; category?: string }) {
    await requireAuth(['admin']);
    let query = db.select().from(schema.expenses);
    const conditions = [];

    if (params?.startDate) conditions.push(gte(schema.expenses.date, params.startDate));
    if (params?.endDate) conditions.push(lte(schema.expenses.date, params.endDate));
    if (params?.category && params.category !== 'all') conditions.push(eq(schema.expenses.category, params.category));

    if (conditions.length > 0) {
        (query as any) = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(schema.expenses.date));
    return serialize(rows);
}

export async function createExpense(data: typeof schema.expenses.$inferInsert) {
    try {
        await requireAuth(['admin']);
        const [row] = await db.insert(schema.expenses).values(data).returning();
        return { success: true, data: serializeOne(row) };
    } catch (error: any) {
        console.error('createExpense error:', error);
        return { success: false, error: error.message || 'Failed to create expense' };
    }
}

export async function deleteExpense(id: string) {
    await requireAuth(['admin']);
    await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
}

// ─── Payroll ──────────────────────────
export async function getPaySlips(month: number, year: number) {
    await requireAuth(['admin']);
    const rows = await db.select({
        payslip: schema.payslips,
        employee: schema.employees
    })
        .from(schema.payslips)
        .innerJoin(schema.employees, eq(schema.payslips.employeeId, schema.employees.id))
        .where(and(eq(schema.payslips.month, month), eq(schema.payslips.year, year)));

    return serialize(rows);
}

export async function createPaySlip(data: typeof schema.payslips.$inferInsert) {
    try {
        await requireAuth(['admin']);
        const [row] = await db.insert(schema.payslips).values(data).returning();
        return { success: true, data: serializeOne(row) };
    } catch (error: any) {
        console.error('createPaySlip error:', error);
        return { success: false, error: error.message || 'Failed to create payslip' };
    }
}

// ═══════════════════════════════════════════════════════════
//  FINANCE & SHIFT REPORTING
// ═══════════════════════════════════════════════════════════
export async function getShiftIncomeReport(date: Date) {
    await requireAuth(['admin']);

    // Day Shift: 07:30 to 17:30
    const dayStart = new Date(date);
    dayStart.setHours(7, 30, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(17, 30, 59, 999);

    // Night Shift: 17:31 to 07:29 (next day)
    const nightStart = new Date(date);
    nightStart.setHours(17, 31, 0, 0);
    const nightEnd = new Date(date);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(7, 29, 59, 999);

    const dayBills = await db.select().from(schema.billings).where(and(gte(schema.billings.date, dayStart), lte(schema.billings.date, dayEnd)));
    const nightBills = await db.select().from(schema.billings).where(and(gte(schema.billings.date, nightStart), lte(schema.billings.date, nightEnd)));

    const calculateTotal = (bills: any[]) => bills.reduce((sum, b) => sum + b.grandTotal, 0);

    return {
        dayShift: {
            totalIncome: calculateTotal(dayBills),
            billCount: dayBills.length,
        },
        nightShift: {
            totalIncome: calculateTotal(nightBills),
            billCount: nightBills.length,
        }
    };
}

// ═══════════════════════════════════════════════════════════
//  FINANCE SUMMARY
// ═══════════════════════════════════════════════════════════
export async function getFinanceSummary(month: number, year: number) {
    await requireAuth(['admin']);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Get Income from billings
    const bills = await db.select({
        total: schema.billings.grandTotal
    }).from(schema.billings).where(and(gte(schema.billings.date, startDate), lte(schema.billings.date, endDate)));

    const billingIncome = bills.reduce((sum, b) => sum + b.total, 0);

    // 1.5 Get Under-five income
    const underFive = await db.select({
        total: schema.underFiveIncome.amount
    }).from(schema.underFiveIncome).where(and(gte(schema.underFiveIncome.date, startDate), lte(schema.underFiveIncome.date, endDate)));

    const underFiveTotal = underFive.reduce((sum, r) => sum + r.total, 0);
    const totalIncome = billingIncome + underFiveTotal;

    // 2. Get Expenses
    const expenseRows = await db.select({
        amount: schema.expenses.amount,
        category: schema.expenses.category
    }).from(schema.expenses).where(and(gte(schema.expenses.date, startDate), lte(schema.expenses.date, endDate)));

    const totalExpenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);

    // 3. Get Payslips (as additional expenses)
    const payslipRows = await db.select({
        netPay: schema.payslips.netPay
    }).from(schema.payslips).where(and(eq(schema.payslips.month, month), eq(schema.payslips.year, year)));

    const totalPayroll = payslipRows.reduce((sum, p) => sum + p.netPay, 0);

    // 4. Category breakdown (of expenses)
    const categories: Record<string, number> = {};
    expenseRows.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    if (totalPayroll > 0) {
        categories['Personnel (Payslips)'] = totalPayroll;
    }

    const categoryBreakdown = Object.entries(categories).map(([name, value]) => ({ name, value }));

    return {
        totalIncome,
        totalExpenses: totalExpenses + totalPayroll,
        netProfit: totalIncome - (totalExpenses + totalPayroll),
        categoryBreakdown
    };
}

export async function getDailyIncomeAnalytics(month: number, year: number) {
    await requireAuth(['admin']);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Get all bills for the period
    const bills = await db.select().from(schema.billings).where(and(gte(schema.billings.date, startDate), lte(schema.billings.date, endDate)));

    // 2. Get Under-five income
    const underFive = await db.select().from(schema.underFiveIncome).where(and(gte(schema.underFiveIncome.date, startDate), lte(schema.underFiveIncome.date, endDate)));

    // 3. Aggregate daily
    const dailyData: Record<string, any> = {};

    // Initialize days of the month
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const dateKey = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        dailyData[dateKey] = {
            date: dateKey,
            total: 0,
            dayShift: 0,
            nightShift: 0,
            underFive: 0,
            categories: {
                Medicines: 0,
                Laboratory: 0,
                Consultation: 0,
                General: 0
            }
        };
    }

    // Process bills
    bills.forEach(bill => {
        const dateKey = format(new Date(bill.date), 'yyyy-MM-dd');
        if (!dailyData[dateKey]) return;

        const amount = bill.grandTotal;
        dailyData[dateKey].total += amount;

        if (bill.shiftType === 'Day') dailyData[dateKey].dayShift += amount;
        else dailyData[dateKey].nightShift += amount;

        // Breakdown categories from items
        const items = bill.items as any[];
        items.forEach(item => {
            if (item.itemType === 'product') {
                dailyData[dateKey].categories.Medicines += item.total;
            } else {
                const cat = item.category || 'General';
                if (!dailyData[dateKey].categories[cat]) dailyData[dateKey].categories[cat] = 0;
                dailyData[dateKey].categories[cat] += item.total;
            }
        });
    });

    // Process under-five
    underFive.forEach(rec => {
        const dateKey = format(new Date(rec.date), 'yyyy-MM-dd');
        if (dailyData[dateKey]) {
            dailyData[dateKey].underFive = rec.amount;
            dailyData[dateKey].total += rec.amount;
        }
    });

    return Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date));
}

// Under Five Income
export async function upsertUnderFiveIncome(date: Date, amount: number) {
    await requireAuth(['admin']);
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const [row] = await db.insert(schema.underFiveIncome)
        .values({ date: normalizedDate, amount })
        .onConflictDoUpdate({
            target: schema.underFiveIncome.date,
            set: { amount }
        })
        .returning();

    return serializeOne(row);
}

export async function getUnderFiveIncome(month: number, year: number) {
    await requireAuth(['admin']);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const rows = await db.select().from(schema.underFiveIncome).where(and(gte(schema.underFiveIncome.date, startDate), lte(schema.underFiveIncome.date, endDate)));
    return serialize(rows);
}
// Stock Value Analytics
export async function getStockValueAnalytics() {
    await requireAuth(['admin']);

    // Fetch all stocks joined with items to get prices
    const rows = await db.select({
        stock: schema.stocks,
        item: schema.items
    })
    .from(schema.stocks)
    .innerJoin(schema.items, eq(schema.stocks.itemId, schema.items.id));

    const analytics = {
        dispensary: {
            buyingValue: 0,
            sellingValue: 0,
            potentialProfit: 0,
        },
        bulkStore: {
            buyingValue: 0,
            sellingValue: 0,
            potentialProfit: 0,
        },
        overall: {
            buyingValue: 0,
            sellingValue: 0,
            potentialProfit: 0,
        }
    };

    rows.forEach(({ stock, item }) => {
        const qty = stock.currentStockQuantity;
        const bPrice = item.buyingPrice || 0;
        const sPrice = item.sellingPrice || 0;

        const bValue = qty * bPrice;
        const sValue = qty * sPrice;
        const profit = sValue - bValue;

        // Update overall
        analytics.overall.buyingValue += bValue;
        analytics.overall.sellingValue += sValue;
        analytics.overall.potentialProfit += profit;

        // Update by location
        if (stock.locationId === 'dispensary') {
            analytics.dispensary.buyingValue += bValue;
            analytics.dispensary.sellingValue += sValue;
            analytics.dispensary.potentialProfit += profit;
        } else if (stock.locationId === 'bulk-store') {
            analytics.bulkStore.buyingValue += bValue;
            analytics.bulkStore.sellingValue += sValue;
            analytics.bulkStore.potentialProfit += profit;
        }
    });

    return analytics;
}

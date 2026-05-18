'use client';

import * as React from 'react';
import { ExpenseManager } from '@/components/finance/expense-manager';

export default function ExpensesPage() {
    return (
        <div className="space-y-6">
            <header className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
                <p className="text-muted-foreground">Record and track clinic expenditures.</p>
            </header>
            <ExpenseManager />
        </div>
    );
}

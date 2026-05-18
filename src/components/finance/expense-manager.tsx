'use client';

import * as React from 'react';
import { useQuery } from '@/hooks/use-query';
import { getExpenses, createExpense, deleteExpense } from '@/app/actions/index';
import { Expense } from '@/lib/types';
import { useSettings } from '@/context/settings-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const expenseSchema = z.object({
    category: z.string().min(1, 'Category is required'),
    description: z.string().min(1, 'Description is required'),
    amount: z.coerce.number().positive('Amount must be positive'),
    date: z.string().optional(),
    paymentMethod: z.string().default('Cash'),
    reference: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const CATEGORIES = [
    'Salaries',
    'Transport',
    'Medicines',
    'Maintenance',
    'Utilities (ESCOM)',
    'Utilities (Solar)',
    'Casual Labour',
    'Lunch',
    'Regulatory Fees',
    'Other'
];

export function ExpenseManager() {
    const { formatCurrency } = useSettings();
    const { toast } = useToast();
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [categoryFilter, setCategoryFilter] = React.useState('all');

    const { data: expenses, isLoading, refetch } = useQuery<Expense[]>(
        () => getExpenses({ category: categoryFilter }) as any,
        [categoryFilter]
    );

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            category: '',
            description: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cash',
            reference: '',
        },
    });

    const onSubmit = async (values: ExpenseFormValues) => {
        try {
            const res = await createExpense({
                ...values,
                date: values.date ? new Date(values.date) : new Date(),
            } as any);
            if (res.success) {
                toast({ title: 'Expense Added', description: 'The expenditure has been recorded.' });
                setIsAddOpen(false);
                form.reset();
                refetch();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to add expense.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add expense.' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await deleteExpense(id);
            toast({ title: 'Expense Deleted' });
            refetch();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete expense.' });
        }
    };

    const filteredExpenses = expenses?.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-2 max-w-sm">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search expenses..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {CATEGORIES.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Add Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add Expense</DialogTitle>
                                <DialogDescription>Record a new clinic expenditure.</DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {CATEGORIES.map(c => (
                                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Electricity bill for Feb" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Amount</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="paymentMethod"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Payment Method</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select method" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Cash">Cash</SelectItem>
                                                        <SelectItem value="Bank">Bank Transfer</SelectItem>
                                                        <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="reference"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reference # (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Receipt or Ref ID" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="submit">Save Expense</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">Loading expenses...</TableCell>
                            </TableRow>
                        ) : filteredExpenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">No expenses found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="text-xs">{format(new Date(expense.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                                            {expense.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{expense.paymentMethod}</TableCell>
                                    <TableCell className="text-right font-bold text-destructive">
                                        -{formatCurrency(expense.amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

'use client';

import * as React from 'react';
import { useQuery } from '@/hooks/use-query';
import { getEmployees, createEmployee, updateEmployee, getPaySlips, createPaySlip } from '@/app/actions/index';
import { Employee, PaySlip } from '@/lib/types';
import { useSettings } from '@/context/settings-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UserPlus, FileText, Download, TrendingUp, Users, Wallet, CreditCard, Receipt, Printer, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const employeeSchema = z.object({
    employeeNumber: z.string().min(1, 'Employee number is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    position: z.string().optional(),
    baseSalary: z.coerce.number().nonnegative('Salary cannot be negative'),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
});

const payslipSchema = z.object({
    employeeId: z.string().min(1, 'Employee is required'),
    month: z.coerce.number().min(1).max(12),
    year: z.coerce.number().min(2020),
    allowanceDetails: z.array(z.object({ description: z.string(), amount: z.coerce.number().default(0) })).default([]),
    deductionDetails: z.array(z.object({ description: z.string(), amount: z.coerce.number().default(0) })).default([]),
});

export function PayrollManager() {
    const { settings, formatCurrency } = useSettings();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = React.useState('employees');
    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = React.useState(false);
    const [isPayrunOpen, setIsPayrunOpen] = React.useState(false);
    const [printingPayslip, setPrintingPayslip] = React.useState<{ payslip: PaySlip; employee: Employee } | null>(null);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const [viewMonth, setViewMonth] = React.useState(currentMonth);
    const [viewYear, setViewYear] = React.useState(currentYear);

    const { data: employees, isLoading: loadingEmployees, refetch: refetchEmployees } = useQuery<Employee[]>(
        () => getEmployees() as any,
        []
    );

    const { data: payslipsData, isLoading: loadingPayslips, refetch: refetchPayslips } = useQuery<any[]>(
        () => getPaySlips(viewMonth, viewYear) as any,
        [viewMonth, viewYear]
    );

    const employeeForm = useForm<z.infer<typeof employeeSchema>>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            employeeNumber: '',
            firstName: '',
            lastName: '',
            position: '',
            baseSalary: 0,
            phone: '',
            email: '',
        },
    });

    const payslipForm = useForm<z.infer<typeof payslipSchema>>({
        resolver: zodResolver(payslipSchema),
        defaultValues: {
            employeeId: '',
            month: currentMonth,
            year: currentYear,
            allowanceDetails: [{ description: '', amount: 0 }],
            deductionDetails: [{ description: '', amount: 0 }],
        },
    });

    const { fields: allowanceFields, append: appendAllowance, remove: removeAllowance } = useFieldArray({
        control: payslipForm.control,
        name: "allowanceDetails"
    });

    const { fields: deductionFields, append: appendDeduction, remove: removeDeduction } = useFieldArray({
        control: payslipForm.control,
        name: "deductionDetails"
    });

    const watchAllowances = payslipForm.watch('allowanceDetails');
    const watchDeductions = payslipForm.watch('deductionDetails');
    const selectedEmployeeId = payslipForm.watch('employeeId');
    const selectedEmployee = employees?.find(e => e.id === selectedEmployeeId);

    const totalAllowances = watchAllowances?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
    const totalDeductions = watchDeductions?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
    const netPay = (selectedEmployee?.baseSalary || 0) + totalAllowances - totalDeductions;


    const onAddEmployee = async (values: z.infer<typeof employeeSchema>) => {
        try {
            const res = await createEmployee(values as any);
            if (res.success) {
                toast({ title: 'Employee Added' });
                setIsAddEmployeeOpen(false);
                employeeForm.reset();
                refetchEmployees();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to add employee.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add employee.' });
        }
    };

    const onGeneratePayslip = async (values: z.infer<typeof payslipSchema>) => {
        const employee = employees?.find(e => e.id === values.employeeId);
        if (!employee) return;

        const sumAllowances = values.allowanceDetails.reduce((a, b) => a + b.amount, 0);
        const sumDeductions = values.deductionDetails.reduce((a, b) => a + b.amount, 0);
        const netPay = employee.baseSalary + sumAllowances - sumDeductions;

        try {
            const res = await createPaySlip({
                ...values,
                baseSalary: employee.baseSalary,
                allowances: sumAllowances,
                deductions: sumDeductions,
                netPay,
                status: 'Paid',
                paymentDate: new Date(),
            } as any);

            if (res.success) {
                toast({ title: 'Payslip Generated', description: `Processed payment for ${employee.firstName}.` });
                setIsPayrunOpen(false);
                payslipForm.reset();
                refetchPayslips();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to generate payslip.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate payslip.' });
        }
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="employees">Employees</TabsTrigger>
                        <TabsTrigger value="payslips">Payslips / History</TabsTrigger>
                    </TabsList>

                    {activeTab === 'employees' ? (
                        <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2"><UserPlus className="h-4 w-4" /> Add Employee</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Employee</DialogTitle>
                                    <DialogDescription>Enter employee details and base salary.</DialogDescription>
                                </DialogHeader>
                                <Form {...employeeForm}>
                                    <form onSubmit={employeeForm.handleSubmit(onAddEmployee)} className="space-y-4">
                                        <FormField control={employeeForm.control} name="employeeNumber" render={({ field }) => (
                                            <FormItem><FormLabel>Employee Number</FormLabel><FormControl><Input placeholder="e.g. EMP001" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={employeeForm.control} name="firstName" render={({ field }) => (
                                                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={employeeForm.control} name="lastName" render={({ field }) => (
                                                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        <FormField control={employeeForm.control} name="position" render={({ field }) => (
                                            <FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g. Nurse, Cashier" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={employeeForm.control} name="baseSalary" render={({ field }) => (
                                            <FormItem><FormLabel>Base Monthly Salary</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={employeeForm.control} name="phone" render={({ field }) => (
                                                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={employeeForm.control} name="email" render={({ field }) => (
                                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        <DialogFooter><Button type="submit">Create Record</Button></DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Dialog open={isPayrunOpen} onOpenChange={setIsPayrunOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2" variant="secondary"><FileText className="h-4 w-4" /> Process Payment</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Generate Payslip</DialogTitle>
                                    <DialogDescription>Record a salary payment for an employee.</DialogDescription>
                                </DialogHeader>
                                <Form {...payslipForm}>
                                    <form onSubmit={payslipForm.handleSubmit(onGeneratePayslip)} className="space-y-4">
                                        <FormField control={payslipForm.control} name="employeeId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Employee</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {employees?.filter(e => e.active).map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={payslipForm.control} name="month" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Month</FormLabel>
                                                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value.toString()}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {Array.from({ length: 12 }).map((_, i) => (
                                                                <SelectItem key={i + 1} value={(i + 1).toString()}>{format(new Date(2024, i, 1), 'MMMM')}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                            <FormField control={payslipForm.control} name="year" render={({ field }) => (
                                                <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                            )} />
                                        </div>
                                        <div className="space-y-4 border-t pt-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium">Allowances</h4>
                                                <Button type="button" variant="outline" size="sm" onClick={() => appendAllowance({ description: '', amount: 0 })}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                                            </div>
                                            {allowanceFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2 items-end">
                                                    <FormField control={payslipForm.control} name={`allowanceDetails.${index}.description`} render={({ field }) => (
                                                        <FormItem className="flex-1"><FormControl><Input placeholder="Description" {...field} /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={payslipForm.control} name={`allowanceDetails.${index}.amount`} render={({ field }) => (
                                                        <FormItem className="w-24"><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                                    )} />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAllowance(index)} disabled={allowanceFields.length === 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4 border-t pt-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium">Deductions</h4>
                                                <Button type="button" variant="outline" size="sm" onClick={() => appendDeduction({ description: '', amount: 0 })}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                                            </div>
                                            {deductionFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2 items-end">
                                                    <FormField control={payslipForm.control} name={`deductionDetails.${index}.description`} render={({ field }) => (
                                                        <FormItem className="flex-1"><FormControl><Input placeholder="Description" {...field} /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={payslipForm.control} name={`deductionDetails.${index}.amount`} render={({ field }) => (
                                                        <FormItem className="w-24"><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                                    )} />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDeduction(index)} disabled={deductionFields.length === 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center bg-muted p-3 rounded-lg text-sm font-medium">
                                            <span>Net Payable</span>
                                            <span>{formatCurrency(netPay)}</span>
                                        </div>

                                        <DialogFooter><Button type="submit" disabled={!selectedEmployee}>Verify & Pay</Button></DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <TabsContent value="employees">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Num</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="text-right">Base Salary</TableHead>
                                    <TableHead className="text-center w-[60px]">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingEmployees ? (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading staff...</TableCell></TableRow>
                                ) : !employees?.length ? (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">No employees registered.</TableCell></TableRow>
                                ) : employees.map(emp => (
                                    <TableRow key={emp.id} className={`${!emp.active ? 'opacity-40 grayscale' : ''}`}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{emp.employeeNumber}</TableCell>
                                        <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{emp.position || '—'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{emp.phone || emp.email || '—'}</TableCell>
                                        <TableCell className="text-right font-bold tabular-nums">{formatCurrency(emp.baseSalary)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    const res = await updateEmployee(emp.id, { active: !emp.active }) as any;
                                                    if (res.success) {
                                                        refetchEmployees();
                                                        toast({ title: emp.active ? 'Employee Deactivated' : 'Employee Activated' });
                                                    } else {
                                                        toast({ title: 'Error', description: res.error, variant: 'destructive' });
                                                    }
                                                }}
                                            >
                                                {emp.active ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <div className="h-4 w-4 border-2 border-muted rounded-full mx-auto" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="payslips">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 py-2">
                            <span className="text-sm font-medium">Filter Period:</span>
                            <Select value={viewMonth.toString()} onValueChange={(v) => setViewMonth(parseInt(v))}>
                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{Array.from({ length: 12 }).map((_, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>{format(new Date(2024, i, 1), 'MMMM')}</SelectItem>)}</SelectContent>
                            </Select>
                            <Input type="number" className="w-[100px]" value={viewYear} onChange={(e) => setViewYear(parseInt(e.target.value))} />
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Base</TableHead>
                                        <TableHead>Allw.</TableHead>
                                        <TableHead>Deduct.</TableHead>
                                        <TableHead className="text-right">Net Paid</TableHead>
                                        <TableHead className="text-center">Date</TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingPayslips ? (
                                        <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading records...</TableCell></TableRow>
                                    ) : !payslipsData?.length ? (
                                        <TableRow><TableCell colSpan={7} className="h-24 text-center">No payments recorded for this period.</TableCell></TableRow>
                                    ) : payslipsData.map(({ payslip, employee }) => (
                                        <TableRow key={payslip.id}>
                                            <TableCell className="font-medium">{employee.firstName} {employee.lastName}</TableCell>
                                            <TableCell className="text-xs">{formatCurrency(payslip.baseSalary)}</TableCell>
                                            <TableCell className="text-xs text-green-600">+{formatCurrency(payslip.allowances)}</TableCell>
                                            <TableCell className="text-xs text-red-600">-{formatCurrency(payslip.deductions)}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(payslip.netPay)}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{format(new Date(payslip.paymentDate!), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setPrintingPayslip({ payslip, employee })}><Printer className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={!!printingPayslip} onOpenChange={(open) => !open && setPrintingPayslip(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader className="print:hidden">
                        <DialogTitle>Payslip Preview</DialogTitle>
                    </DialogHeader>
                    {printingPayslip && (
                        <div className="bg-white p-6 text-slate-900 border" id="printable-payslip">
                            <style>{`
                                @media print {
                                    body * { visibility: hidden; }
                                    #printable-payslip, #printable-payslip * { visibility: visible; }
                                    #printable-payslip { position: absolute; left: 0; top: 0; width: 100%; border: none; padding: 0; }
                                    .print\\:hidden { display: none !important; }
                                }
                            `}</style>
                            <div className="flex justify-between items-start border-b pb-4 mb-4">
                                <div>
                                    <h1 className="text-xl font-bold uppercase tracking-tight">{settings?.clinicName || 'Clinic Name'}</h1>
                                    <p className="text-[10px] text-slate-500">{settings?.clinicAddress || 'Clinic Address'}</p>
                                    <p className="text-[10px] text-slate-500">{settings?.clinicPhone || 'Clinic Phone'}</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-lg font-semibold opacity-60">PAYSLIP</h2>
                                    <p className="text-[10px] font-medium">#{printingPayslip.payslip.id.slice(0, 8).toUpperCase()}</p>
                                    <p className="text-[10px]">{format(new Date(2024, printingPayslip.payslip.month - 1, 1), 'MMMM yyyy')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-3 rounded-lg">
                                <div>
                                    <p className="text-[8px] uppercase font-bold text-slate-400 mb-0.5">Employee Details</p>
                                    <p className="font-bold text-base leading-tight">{printingPayslip.employee.firstName} {printingPayslip.employee.lastName}</p>
                                    <p className="text-[10px] opacity-80">{printingPayslip.employee.position || 'Employee'} ({printingPayslip.employee.employeeNumber})</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] uppercase font-bold text-slate-400 mb-0.5">Payment Details</p>
                                    <p className="text-[10px]"><span className="opacity-60">Date:</span> {format(new Date(printingPayslip.payslip.paymentDate!), 'dd MMM yyyy')}</p>
                                    <p className="text-[10px] font-bold text-green-700">PAID</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b text-[8px] uppercase font-bold text-slate-400">
                                                <th className="text-left py-1">Description</th>
                                                <th className="text-right py-1 w-24">Earnings</th>
                                                <th className="text-right py-1 w-24">Deductions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            <tr>
                                                <td className="py-1.5 font-medium">Basic Salary</td>
                                                <td className="py-1.5 text-right">{formatCurrency(printingPayslip.payslip.baseSalary)}</td>
                                                <td className="py-1.5 text-right">—</td>
                                            </tr>
                                            {printingPayslip.payslip.allowanceDetails?.filter(a => a.amount > 0).map((a, i) => (
                                                <tr key={i}>
                                                    <td className="py-1.5 text-slate-600">{a.description}</td>
                                                    <td className="py-1.5 text-right">{formatCurrency(a.amount)}</td>
                                                    <td className="py-1.5 text-right">—</td>
                                                </tr>
                                            ))}
                                            {printingPayslip.payslip.deductionDetails?.filter(d => d.amount > 0).map((d, i) => (
                                                <tr key={i}>
                                                    <td className="py-1.5 text-slate-600">{d.description}</td>
                                                    <td className="py-1.5 text-right">—</td>
                                                    <td className="py-1.5 text-right text-red-600">({formatCurrency(d.amount)})</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="bg-slate-900 text-white p-4 rounded-lg flex justify-between items-center">
                                    <div className="text-[8px] uppercase font-bold opacity-60">Net Salary Payable</div>
                                    <div className="text-xl font-bold">{formatCurrency(printingPayslip.payslip.netPay)}</div>
                                </div>
                            </div>

                            <div className="mt-8 pt-4 border-t border-dashed flex justify-between items-end">
                                <div className="w-32 border-t border-slate-300 pt-1 text-center">
                                    <p className="text-[8px] uppercase font-bold text-slate-400">Employer Signature</p>
                                </div>
                                <div className="text-[8px] text-slate-400 italic">
                                    Computer generated document — no stamp required.
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="print:hidden">
                        <Button variant="outline" onClick={() => setPrintingPayslip(null)}>Close</Button>
                        <Button onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" /> Print Payslip</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

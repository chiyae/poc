
'use client';

import * as React from 'react';
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from '@radix-ui/react-icons';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Patient } from '@/lib/types';
import { format, differenceInYears } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { getPatients, createPatient, updatePatient } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { PatientForm } from '@/components/patient-form';
import { PrintWrapper } from '@/components/print-wrapper';


export default function PatientManagementPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [page, setPage] = React.useState(0);
  const pageSize = 50;

  const [totalCount, setTotalCount] = React.useState(0);
  const { data: patientsData, isLoading, error, refetch } = useQuery<{ patients: Patient[]; totalCount: number }>(
    () => getPatients({ limit: pageSize, offset: page * pageSize }) as any,
    [page]
  );
  const patients = patientsData?.patients || [];
  
  React.useEffect(() => {
    if (patientsData?.totalCount !== undefined) {
      setTotalCount(patientsData.totalCount);
    }
  }, [patientsData]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);

  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const [printData, setPrintData] = React.useState<Patient[] | null>(null);
  const [isPrintingAll, setIsPrintingAll] = React.useState(false);
  const [isFetchingPrint, setIsFetchingPrint] = React.useState(false);

  const handlePrintAll = async () => {
    setIsFetchingPrint(true);
    try {
      const res = await getPatients() as any;
      if (res?.patients) {
        setPrintData(res.patients);
        setIsPrintingAll(true);
      }
    } catch (err) {
      console.error("Failed to fetch patients for printing:", err);
      toast({
        variant: "destructive",
        title: "Print Error",
        description: "Could not retrieve the complete patient registry."
      });
    } finally {
      setIsFetchingPrint(false);
    }
  };

  React.useEffect(() => {
    if (isPrintingAll && printData) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrintingAll(false);
        setPrintData(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isPrintingAll, printData]);

  const handleOpenDialog = (patient: Patient | null) => {
    setSelectedPatient(patient);
    setIsDialogOpen(true);
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPatient(null);
  }

  const handleFormSubmit = async (patientData: Omit<Patient, 'id'>) => {
    if (selectedPatient) { // Editing existing patient
      try {
        await updatePatient(selectedPatient.id, patientData as any);
        handleCloseDialog();
        refetch();
        toast({
          title: "Patient Updated",
          description: `Successfully updated details for ${patientData.firstName} ${patientData.lastName}.`
        })
      } catch (error) {
        console.error("Error updating patient:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update patient details."
        })
      }
    } else { // Adding new patient
      try {
        await createPatient(patientData as any);
        handleCloseDialog();
        refetch();
        toast({
          title: "Patient Registered",
          description: `Successfully registered ${patientData.firstName} ${patientData.lastName}.`
        })
      } catch (error) {
        console.error("Error adding patient:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to register new patient."
        })
      }
    }
  };


  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: 'patientNumber',
      header: 'Reg. Number',
      cell: ({ row }) => <div className="font-mono">{row.getValue('patientNumber')}</div>,
    },
    {
      accessorKey: 'firstName',
      header: 'First Name',
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
    },
    {
      accessorKey: 'dateOfBirth',
      header: 'Date of Birth (Age)',
      cell: ({ row }) => {
        const dob = new Date(row.getValue('dateOfBirth'));
        const age = differenceInYears(new Date(), dob);
        return <div>{format(dob, 'dd/MM/yyyy')} <span className="text-muted-foreground">({age})</span></div>;
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'address',
      header: 'Address',
    },
    {
      accessorKey: 'loyaltyPoints',
      header: 'Points',
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(row.original)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/billing/invoices?patientName=${row.original.firstName} ${row.original.lastName}`)}
          >
            History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/billing/patient-billing?patientId=${row.original.id}`)}
          >
            Create Bill
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: patients ?? [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view patient data.</p>
      </div>
    );
  }

  return (
    <PrintWrapper title="Patient Registry Report">
      <div className={isPrintingAll ? "print:hidden w-full space-y-6" : "w-full space-y-6"}>
        <div className="flex items-start justify-between">
          <header className="space-y-1.5">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0 hide-on-print" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Patient Management</h1>
                <p className="text-muted-foreground hide-on-print">Register new patients and manage existing records.</p>
              </div>
            </div>
          </header>
          <div className="flex items-center gap-2 hide-on-print">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isLoading || isFetchingPrint}>
                  <Printer className="mr-2 h-4 w-4" /> {isFetchingPrint ? 'Preparing...' : 'Print...'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.print()}>
                  Print Current Page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintAll}>
                  Print Entire Registry
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isClient && (
              <Button onClick={() => handleOpenDialog(null)}>Register New Patient</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto hide-on-print">
                  Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center hide-on-print">
          <Input
            placeholder="Filter by first name or ID..."
            value={(table.getColumn('firstName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('firstName')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!isLoading && table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                !isLoading && <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No patients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4 hide-on-print">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <div className="text-sm font-medium">Page {page + 1}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={!patients || patients.length < pageSize}
          >
            Next
          </Button>
        </div>

        {isClient && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedPatient ? `Edit Patient: ${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Register New Patient'}</DialogTitle>
                <DialogDescription>
                  {selectedPatient ? 'Update the details for this patient.' : 'Fill in the details for the new patient. A registration number will be generated automatically.'}
                </DialogDescription>
              </DialogHeader>
              <PatientForm
                patient={selectedPatient}
                onSubmit={handleFormSubmit}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      {isPrintingAll && printData && (
        <div className="hidden print:block w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-black border-b">Reg. Number</TableHead>
                <TableHead className="font-bold text-black border-b">First Name</TableHead>
                <TableHead className="font-bold text-black border-b">Last Name</TableHead>
                <TableHead className="font-bold text-black border-b">Gender</TableHead>
                <TableHead className="font-bold text-black border-b">Age</TableHead>
                <TableHead className="font-bold text-black border-b">Phone</TableHead>
                <TableHead className="font-bold text-black border-b">Address</TableHead>
                <TableHead className="font-bold text-black border-b text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printData.map((p) => {
                const dob = new Date(p.dateOfBirth);
                const age = differenceInYears(new Date(), dob);
                return (
                  <TableRow key={p.id} className="border-b">
                    <TableCell className="font-mono py-2">{p.patientNumber}</TableCell>
                    <TableCell className="py-2">{p.firstName}</TableCell>
                    <TableCell className="py-2">{p.lastName}</TableCell>
                    <TableCell className="py-2">{p.gender}</TableCell>
                    <TableCell className="py-2">{age}</TableCell>
                    <TableCell className="py-2">{p.phone}</TableCell>
                    <TableCell className="py-2">{p.address}</TableCell>
                    <TableCell className="py-2 text-right">{p.loyaltyPoints}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PrintWrapper>
  );
}

"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getPatients } from "@/app/actions/index"
import type { Patient } from "@/lib/types"

interface PatientSearchProps {
    onSelect: (patient: Patient | null) => void;
    selectedPatientId?: string;
    defaultValue?: string;
}

export function PatientSearch({ onSelect, selectedPatientId, defaultValue }: PatientSearchProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(defaultValue || "")
    const [patients, setPatients] = React.useState<Patient[]>([])
    const [loading, setLoading] = React.useState(false)

    const fetchPatients = React.useCallback(async () => {
        setLoading(true)
        try {
            // In a real app, we'd search server-side. For now, we fetch a bunch.
            const data = await getPatients({ limit: 100, offset: 0 }) as any;
            setPatients(data.patients || []);
        } catch (error) {
            console.error("Failed to fetch patients:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchPatients()
    }, [fetchPatients])

    const selectedPatient = patients.find((p) => p.id === selectedPatientId)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedPatient ? (
                        <span>{selectedPatient.firstName} {selectedPatient.lastName} <span className="text-muted-foreground ml-2 text-xs">({selectedPatient.patientNumber})</span></span>
                    ) : (
                        defaultValue || "Search patient..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search name or ID..." />
                    <CommandList>
                        <CommandEmpty>No patient found.</CommandEmpty>
                        <CommandGroup>
                            {patients.map((patient) => (
                                <CommandItem
                                    key={patient.id}
                                    value={`${patient.firstName} ${patient.lastName} ${patient.patientNumber}`}
                                    onSelect={() => {
                                        onSelect(patient)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedPatientId === patient.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{patient.firstName} {patient.lastName}</span>
                                        <span className="text-xs text-muted-foreground">{patient.patientNumber}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

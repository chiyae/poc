'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command';
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Plus,
    Package,
    History,
    LayoutDashboard,
    Search,
    TrendingUp,
} from 'lucide-react';

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Navigation">
                        <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Main Menu</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/bulk-store/dashboard'))}>
                            <Package className="mr-2 h-4 w-4" />
                            <span>Bulk Store Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/dispensary/dashboard'))}>
                            <Smile className="mr-2 h-4 w-4" />
                            <span>Dispensary Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/billing/dashboard'))}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>Billing Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/settings/audit-log'))}>
                            <History className="mr-2 h-4 w-4" />
                            <span>Audit Log</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/billing/reports'))}>
                            <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                            <span>Financial Reports</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Quick Actions">
                        <CommandItem onSelect={() => runCommand(() => router.push('/bulk-store/inventory'))}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Inventory Management</span>
                            <CommandShortcut>Shift+I</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/billing/patients'))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Patients</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/tools/dashboard'))}>
                            <Calculator className="mr-2 h-4 w-4" />
                            <span>Calculators & Tools</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Settings">
                        <CommandItem onSelect={() => runCommand(() => router.push('/settings/users'))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>User Settings</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}

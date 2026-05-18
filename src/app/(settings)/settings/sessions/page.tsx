'use client';

import { PaginationControls } from '@/components/pagination-controls';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getActiveSessions, revokeSession } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAppUser } from '@/hooks/use-app-user';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Monitor, Shield, Trash2, Globe, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function SessionsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { authUser, isLoading: isUserLoading } = useAppUser();

    const [page, setPage] = React.useState(1);
    const pageSize = 20;

    const { data, isLoading: areSessionsLoading, error, refetch } = useQuery<{ sessions: any[]; totalCount: number }>(
        () => getActiveSessions({ limit: pageSize, offset: (page - 1) * pageSize }) as any,
        [page]
    );

    const sessions = data?.sessions ?? [];
    const totalCount = data?.totalCount ?? 0;

    const isLoading = isUserLoading || areSessionsLoading;

    const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
        if (isCurrent) {
            toast({
                title: "Cannot logout current session",
                description: "Please use the logout button in the sidebar to end your current session.",
                variant: "destructive"
            });
            return;
        }

        try {
            await revokeSession(sessionId);
            toast({
                title: 'Session Revoked',
                description: 'The user session has been terminated.',
            });
            refetch();
        } catch (error) {
            console.error('Error revoking session:', error);
            toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: 'Could not revoke the session.',
            });
        }
    };

    if (error) {
        return (
            <div className="w-full space-y-6 text-center py-20">
                <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
                <p className="text-muted-foreground">Only administrators can view active sessions.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <header className="space-y-1.5 focus:outline-none">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
                        <p className="text-muted-foreground">Monitor and manage all active devices and logged-in users.</p>
                    </div>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Connected Devices</CardTitle>
                    <CardDescription>
                        A list of all active browser sessions currently connected to your clinic.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="h-10 py-0 text-xs">User</TableHead>
                                    <TableHead className="h-10 py-0 text-xs">Device / Browser</TableHead>
                                    <TableHead className="h-10 py-0 text-xs">IP Address</TableHead>
                                    <TableHead className="h-10 py-0 text-xs">Last Active</TableHead>
                                    <TableHead className="h-10 py-0 text-xs">Created</TableHead>
                                    <TableHead className="h-10 py-0 text-xs text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                                    </TableRow>
                                ))}
                                {!isLoading && sessions?.map(session => {
                                    const isCurrent = (authUser as any)?.sessionId === session.id;

                                    return (
                                        <TableRow key={session.id} className={isCurrent ? "bg-muted/30" : ""}>
                                            <TableCell className="py-1.5 px-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{session.userDisplayName}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">@{session.username}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-1.5 px-3">
                                                <div className="flex items-center gap-2 max-w-[250px]">
                                                    <Monitor className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                    <span className="text-[10px] truncate" title={session.userAgent}>
                                                        {session.userAgent}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-1.5 px-3">
                                                <div className="flex items-center gap-2 text-[10px]">
                                                    <Globe className="h-3 w-3 text-muted-foreground" />
                                                    {session.ipAddress}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-1.5 px-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        {formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}
                                                    </span>
                                                    {isCurrent && <Badge variant="secondary" className="w-fit text-[9px] px-1 h-3.5 leading-none">Current</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground py-1.5 px-3">
                                                {format(new Date(session.createdAt), 'MMM d, HH:mm')}
                                            </TableCell>
                                            <TableCell className="text-right py-1.5 px-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isCurrent}
                                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRevokeSession(session.id, isCurrent)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span className="sr-only">Revoke Session</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {!isLoading && (!sessions || sessions.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No active sessions found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <div className="px-6 pb-6 pt-0">
                    <PaginationControls
                        page={page}
                        totalCount={totalCount}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        isLoading={isLoading}
                    />
                </div>
            </Card>
        </div>
    );
}

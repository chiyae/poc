'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getBackupHistory, triggerDatabaseBackup, deleteBackup, downloadBackup } from '@/app/actions/backup-actions';
import { useQuery } from '@/hooks/use-query';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Database, Download, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackupsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isBackingUp, setIsBackingUp] = React.useState(false);

    const { data: backups, isLoading, refetch } = useQuery<any[]>(() => getBackupHistory() as any, []);

    const handleBackupNow = async () => {
        setIsBackingUp(true);
        try {
            await triggerDatabaseBackup();
            toast({
                title: "Backup Successful",
                description: "A new database backup has been created.",
            });
            refetch();
        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Backup Failed",
                description: error.message,
            });
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleDownload = async (filename: string) => {
        try {
            const content = await downloadBackup(filename);
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Download Failed",
                description: error.message,
            });
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
        try {
            await deleteBackup(filename);
            toast({
                title: "Backup Deleted",
                description: "The backup file has been removed.",
            });
            refetch();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Delete Failed",
                description: error.message,
            });
        }
    };

    return (
        <div className="w-full space-y-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Database Backups</h1>
                        <p className="text-muted-foreground">Manage and schedule database maintenance.</p>
                    </div>
                </div>
                <Button 
                    onClick={handleBackupNow} 
                    disabled={isBackingUp}
                    className="bg-primary hover:bg-primary/90"
                >
                    {isBackingUp ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                    Backup Now
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Backup History</CardTitle>
                    <CardDescription>
                        A list of database snapshots stored on the server.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="h-10 py-0 text-xs text-muted-foreground">Date & Time</TableHead>
                                <TableHead className="h-10 py-0 text-xs text-muted-foreground">Filename</TableHead>
                                <TableHead className="h-10 py-0 text-xs text-muted-foreground text-right">Size</TableHead>
                                <TableHead className="h-10 py-0 text-xs text-muted-foreground text-right px-8">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && backups?.map((file) => (
                                <TableRow key={file.filename}>
                                    <TableCell className="py-2 text-sm">
                                        {format(new Date(file.createdAt), 'PPpp')}
                                    </TableCell>
                                    <TableCell className="py-2 text-sm font-mono text-muted-foreground">
                                        {file.filename}
                                    </TableCell>
                                    <TableCell className="py-2 text-sm text-right">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </TableCell>
                                    <TableCell className="py-2 text-right">
                                        <div className="flex justify-end gap-2 px-6">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleDownload(file.filename)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleDelete(file.filename)}
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && (!backups || backups.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        No backups found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="bg-muted/50 rounded-lg p-4 border border-blue-200/50">
                <h3 className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Automated Backups
                </h3>
                <p className="text-xs text-blue-700">
                    The system is configured to perform an automatic backup every **12 hours**. 
                    Automated snapshots are kept for 7 days (up to 14 files) before rotating.
                </p>
            </div>
        </div>
    );
}

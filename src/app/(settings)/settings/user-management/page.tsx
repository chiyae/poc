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
import type { User } from '@/lib/types';
import { getUsers, updateUser } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddUserForm } from '@/components/add-user-form';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { useAppUser } from '@/hooks/use-app-user';
import { logAction } from '@/lib/audit';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function UserManagementPage() {
  const { toast } = useToast();
  const router = useRouter();
  const currentUser = useAppUser();

  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const { data, isLoading: areUsersLoading, error, refetch } = useQuery<{ users: User[]; totalCount: number }>(
    () => getUsers({ limit: pageSize, offset: (page - 1) * pageSize }) as any,
    [page, pageSize]
  );
  
  const users = data?.users ?? [];
  const totalCount = data?.totalCount ?? 0;
  const isLoading = currentUser.isLoading || areUsersLoading;

  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleUserAdded = () => {
    setIsAddUserOpen(false);
    refetch();
  }

  const handleToggleDisable = async (targetUser: User) => {
    if (!currentUser.authUser) return;

    if (targetUser.id === currentUser.authUser.id) {
      toast({
        variant: 'destructive',
        title: 'Action Not Allowed',
        description: 'You cannot disable your own account.',
      });
      return;
    }

    const newDisabledState = !targetUser.disabled;

    try {
      await updateUser(targetUser.id, { disabled: newDisabledState });

      await logAction(currentUser.authUser, newDisabledState ? 'user.disable' : 'user.enable', {
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.username,
      });

      toast({
        title: 'User Updated',
        description: `${targetUser.displayName}'s account has been ${newDisabledState ? 'disabled' : 'enabled'}.`,
      });
      refetch();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: "Could not update the user's status.",
      });
    }
  };


  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view the list of users.</p>
        <p className="text-sm text-muted-foreground">Please contact an administrator if you believe this is an error.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between">
        <header className="space-y-1.5">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">Add, view, and manage user accounts and roles.</p>
            </div>
          </div>
        </header>
        {isClient && (
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>Add New User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Fill out the form below to create a new user account.
                </DialogDescription>
              </DialogHeader>
              <AddUserForm onUserAdded={handleUserAdded} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all user accounts in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-10 py-0 text-xs">Display Name</TableHead>
                <TableHead className="h-10 py-0 text-xs">Username</TableHead>
                <TableHead className="h-10 py-0 text-xs">Role</TableHead>
                <TableHead className="h-10 py-0 text-xs">Location</TableHead>
                <TableHead className="h-10 py-0 text-xs">Status</TableHead>
                <TableHead className="h-10 py-0 text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && users && users.map(user => {
                const isSelf = currentUser.authUser?.id === user.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="py-1.5 px-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{user.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5 px-3 text-muted-foreground text-sm">{user.username}</TableCell>
                    <TableCell className="py-1.5 px-3"><Badge className="px-1.5 py-0 text-[10px]">{user.role}</Badge></TableCell>
                    <TableCell className="py-1.5 px-3"><Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{user.locationId}</Badge></TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Badge variant={user.disabled ? 'destructive' : 'default'} className="px-1.5 py-0 text-[10px]">
                        {user.disabled ? 'Disabled' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5 px-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-7 w-7 p-0">
                            <span className="sr-only">Open menu</span>
                            <DotsHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem disabled>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleDisable(user)}
                            disabled={isSelf}
                            className={!user.disabled ? 'text-destructive focus:text-destructive' : ''}
                          >
                            {user.disabled ? 'Enable User' : 'Disable User'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {!isLoading && (!users || users.length === 0) && (
            <p className="py-12 text-center text-muted-foreground">No users found.</p>
          )}

          <PaginationControls
            page={page}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

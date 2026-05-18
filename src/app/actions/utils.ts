'use server';

import { getCurrentUser } from '../auth-actions';


export async function requireAuth(allowedRoles?: ('admin' | 'cashier' | 'pharmacy')[]) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Unauthorized: You must be logged in to perform this action.");
    }

    if (allowedRoles && !allowedRoles.includes(user.role as any)) {
        throw new Error(`Forbidden: You do not have the required permissions (${allowedRoles.join(', ')}) to perform this action.`);
    }

    return user;
}

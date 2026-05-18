
import { createLog } from '@/app/actions/index';

export const logAction = async (
    user: { id?: string; displayName?: string } | null,
    action: string,
    details: {
        before?: any;
        after?: any;
        [key: string]: any;
    } = {}
) => {
    const userId = user?.id || 'system';
    const userDisplayName = user?.displayName || 'System';

    try {
        await createLog({
            userId,
            userDisplayName,
            action,
            details,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error("Failed to write to audit log:", error);
    }
};

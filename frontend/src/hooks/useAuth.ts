import { useMemo } from 'react';
import { getStoredUser, isAuthenticated as checkAuthenticated } from '@/lib/api';
import type { User } from '@/types/user';

export interface UseAuthReturn {
    user: User | null;
    isAuthenticated: boolean;
    clientId: string | null;
}

export const useAuth = (): UseAuthReturn => {
    return useMemo(() => {
        const user = getStoredUser();
        const isAuthenticated = checkAuthenticated();
        
        // For now, use the user ID as the client ID
        // In a real app, this might be a separate field or lookup
        const clientId = user ? user.id.toString() : null;

        return {
            user,
            isAuthenticated,
            clientId
        };
    }, []);
};
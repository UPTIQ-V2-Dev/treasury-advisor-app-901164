import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '@/lib/api';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const location = useLocation();

    if (!isAuthenticated()) {
        return (
            <Navigate
                to='/login'
                state={{ from: location }}
                replace
            />
        );
    }

    return <>{children}</>;
};

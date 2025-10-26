import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UploadPage } from '@/pages/UploadPage';
import { RecommendationsPage } from '@/pages/RecommendationsPage';
import { ProcessingPage } from '@/pages/ProcessingPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ClientsPage } from '@/pages/ClientsPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000 // 5 minutes
        }
    }
});

export const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Routes>
                    <Route
                        path='/login'
                        element={<LoginPage />}
                    />
                    <Route
                        path='/'
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route
                            index
                            element={
                                <Navigate
                                    to='/dashboard'
                                    replace
                                />
                            }
                        />
                        <Route
                            path='dashboard'
                            element={<DashboardPage />}
                        />
                        <Route
                            path='upload'
                            element={<UploadPage />}
                        />
                        <Route
                            path='recommendations'
                            element={<RecommendationsPage />}
                        />
                        <Route
                            path='processing'
                            element={<ProcessingPage />}
                        />
                        <Route
                            path='analytics'
                            element={<AnalyticsPage />}
                        />
                        <Route
                            path='clients'
                            element={<ClientsPage />}
                        />
                        <Route
                            path='*'
                            element={
                                <Navigate
                                    to='/dashboard'
                                    replace
                                />
                            }
                        />
                    </Route>
                </Routes>
            </Router>
        </QueryClientProvider>
    );
};

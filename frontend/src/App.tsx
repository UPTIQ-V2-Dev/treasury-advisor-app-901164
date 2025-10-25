import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { UploadPage } from '@/pages/UploadPage';

export const App = () => {
    return (
        <Router>
            <Routes>
                <Route
                    path='/'
                    element={<AppLayout />}
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
    );
};

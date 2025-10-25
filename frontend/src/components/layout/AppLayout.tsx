import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { useState } from 'react';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: 1
        }
    }
});

export const AppLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                defaultTheme='light'
                storageKey='treasury-ui-theme'
            >
                <div className='min-h-screen bg-background'>
                    <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                    <div className='flex'>
                        <Sidebar
                            isOpen={sidebarOpen}
                            onClose={() => setSidebarOpen(false)}
                        />

                        <main className='flex-1 min-w-0'>
                            <div className='p-6'>
                                <Outlet />
                            </div>
                        </main>
                    </div>

                    <Toaster />
                </div>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

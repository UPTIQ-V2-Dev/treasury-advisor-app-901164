import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Create a custom render function that includes providers
const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 0,
                gcTime: 0
            },
            mutations: {
                retry: false
            }
        }
    });

interface AllTheProvidersProps {
    children: ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
    const queryClient = createTestQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
    );
};

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'>;

const customRender = (ui: ReactElement, options?: CustomRenderOptions) =>
    render(ui, { wrapper: AllTheProviders, ...options });

// Mock API delay utility for testing
export const mockApiDelay = vi.fn(() => Promise.resolve());

// Common test data
export const mockClientId = 'test-client-1';

// Export everything
export * from '@testing-library/react';
export { customRender as render };
export { vi } from 'vitest';

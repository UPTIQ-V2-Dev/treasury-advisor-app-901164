import { api } from '@/lib/api';
import { mockApiDelay } from '@/lib/utils';
import {
    mockDashboardMetrics,
    mockCashFlowData,
    mockTransactionCategories,
    mockLiquidityAnalysis,
    mockSpendingPatterns,
    mockAnalyticsSummary
} from '@/data/mockAnalytics';
import type {
    DashboardMetrics,
    CashFlowData,
    TransactionCategory,
    LiquidityAnalysis,
    SpendingPattern,
    AnalyticsSummary,
    AnalyticsFilters
} from '@/types/analytics';

export const analyticsService = {
    getDashboardMetrics: async (clientId: string, filters?: AnalyticsFilters): Promise<DashboardMetrics> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getDashboardMetrics ---', { clientId, filters });
            await mockApiDelay();
            return mockDashboardMetrics;
        }

        const params = new URLSearchParams();
        if (filters) {
            if (filters.dateRange) {
                params.append('startDate', filters.dateRange.startDate);
                params.append('endDate', filters.dateRange.endDate);
            }
            if (filters.categories) {
                filters.categories.forEach(category => params.append('categories', category));
            }
            if (filters.transactionTypes) {
                filters.transactionTypes.forEach(type => params.append('transactionTypes', type));
            }
            if (filters.amountRange) {
                params.append('minAmount', filters.amountRange.min.toString());
                params.append('maxAmount', filters.amountRange.max.toString());
            }
        }

        const response = await api.get(`/analytics/overview/${clientId}?${params}`);
        return response.data;
    },

    getCashFlowData: async (
        clientId: string,
        period: 'daily' | 'weekly' | 'monthly' = 'daily'
    ): Promise<CashFlowData[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getCashFlowData ---', { clientId, period });
            await mockApiDelay();
            return mockCashFlowData;
        }

        const response = await api.get(`/analytics/cashflow/${clientId}?period=${period}`);
        return response.data;
    },

    getTransactionCategories: async (clientId: string, filters?: AnalyticsFilters): Promise<TransactionCategory[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getTransactionCategories ---', { clientId, filters });
            await mockApiDelay();
            return mockTransactionCategories;
        }

        const params = new URLSearchParams();
        if (filters?.dateRange) {
            params.append('startDate', filters.dateRange.startDate);
            params.append('endDate', filters.dateRange.endDate);
        }

        const response = await api.get(`/analytics/categories/${clientId}?${params}`);
        return response.data;
    },

    getLiquidityAnalysis: async (clientId: string): Promise<LiquidityAnalysis> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getLiquidityAnalysis ---', clientId);
            await mockApiDelay();
            return mockLiquidityAnalysis;
        }

        const response = await api.get(`/analytics/liquidity/${clientId}`);
        return response.data;
    },

    getSpendingPatterns: async (clientId: string): Promise<SpendingPattern[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getSpendingPatterns ---', clientId);
            await mockApiDelay();
            return mockSpendingPatterns;
        }

        const response = await api.get(`/analytics/patterns/${clientId}`);
        return response.data;
    },

    getAnalyticsSummary: async (clientId: string, filters?: AnalyticsFilters): Promise<AnalyticsSummary> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getAnalyticsSummary ---', { clientId, filters });
            await mockApiDelay();
            return mockAnalyticsSummary;
        }

        const params = new URLSearchParams();
        if (filters?.dateRange) {
            params.append('startDate', filters.dateRange.startDate);
            params.append('endDate', filters.dateRange.endDate);
        }

        const response = await api.get(`/analytics/summary/${clientId}?${params}`);
        return response.data;
    },

    exportAnalyticsData: async (
        clientId: string,
        format: 'csv' | 'excel' | 'pdf',
        filters?: AnalyticsFilters
    ): Promise<Blob> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: exportAnalyticsData ---', { clientId, format, filters });
            await mockApiDelay();
            return new Blob(['Mock analytics export data'], {
                type: format === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel'
            });
        }

        const params = new URLSearchParams({ format });
        if (filters?.dateRange) {
            params.append('startDate', filters.dateRange.startDate);
            params.append('endDate', filters.dateRange.endDate);
        }

        const response = await api.get(`/analytics/export/${clientId}?${params}`, {
            responseType: 'blob'
        });
        return response.data;
    },

    getVendorAnalysis: async (clientId: string): Promise<any[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getVendorAnalysis ---', clientId);
            await mockApiDelay();
            return mockSpendingPatterns.flatMap(pattern => pattern.vendors);
        }

        const response = await api.get(`/analytics/vendors/${clientId}`);
        return response.data;
    },

    getTrendAnalysis: async (
        clientId: string,
        metric: 'inflow' | 'outflow' | 'balance',
        period: string = '12m'
    ): Promise<any[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getTrendAnalysis ---', { clientId, metric, period });
            await mockApiDelay();
            return mockAnalyticsSummary.trends[metric];
        }

        const response = await api.get(`/analytics/trends/${clientId}?metric=${metric}&period=${period}`);
        return response.data;
    }
};

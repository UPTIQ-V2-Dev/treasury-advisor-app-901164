import { api } from '@/lib/api';
import { mockApiDelay } from '@/lib/utils';
import { mockRecommendations, mockTreasuryProducts, mockRecommendationSummary } from '@/data/mockRecommendations';
import type {
    Recommendation,
    TreasuryProduct,
    RecommendationFeedback,
    RecommendationSummary
} from '@/types/recommendations';

export const recommendationsService = {
    getRecommendations: async (clientId: string): Promise<Recommendation[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getRecommendations ---', clientId);
            await mockApiDelay();
            return mockRecommendations.filter(r => r.clientId === clientId);
        }

        const response = await api.get(`/recommendations/${clientId}`);
        return response.data;
    },

    generateRecommendations: async (clientId: string): Promise<{ taskId: string }> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: generateRecommendations ---', clientId);
            await mockApiDelay();
            return { taskId: 'mock-generation-task-id' };
        }

        const response = await api.post(`/recommendations/generate`, { clientId });
        return response.data;
    },

    getRecommendationById: async (recommendationId: string): Promise<Recommendation> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getRecommendationById ---', recommendationId);
            await mockApiDelay();
            const recommendation = mockRecommendations.find(r => r.id === recommendationId);
            if (!recommendation) throw new Error('Recommendation not found');
            return recommendation;
        }

        const response = await api.get(`/recommendations/detail/${recommendationId}`);
        return response.data;
    },

    provideFeedback: async (feedback: RecommendationFeedback): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: provideFeedback ---', feedback);
            await mockApiDelay();
            return;
        }

        await api.post('/recommendations/feedback', feedback);
    },

    approveRecommendation: async (recommendationId: string, reviewerId: string, comments?: string): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: approveRecommendation ---', { recommendationId, reviewerId, comments });
            await mockApiDelay();
            return;
        }

        await api.post(`/recommendations/${recommendationId}/approve`, {
            reviewerId,
            comments
        });
    },

    rejectRecommendation: async (recommendationId: string, reviewerId: string, reason: string): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: rejectRecommendation ---', { recommendationId, reviewerId, reason });
            await mockApiDelay();
            return;
        }

        await api.post(`/recommendations/${recommendationId}/reject`, {
            reviewerId,
            reason
        });
    },

    getTreasuryProducts: async (): Promise<TreasuryProduct[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getTreasuryProducts ---');
            await mockApiDelay();
            return mockTreasuryProducts;
        }

        const response = await api.get('/products/catalog');
        return response.data;
    },

    getProductById: async (productId: string): Promise<TreasuryProduct> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getProductById ---', productId);
            await mockApiDelay();
            const product = mockTreasuryProducts.find(p => p.id === productId);
            if (!product) throw new Error('Product not found');
            return product;
        }

        const response = await api.get(`/products/${productId}`);
        return response.data;
    },

    getRecommendationSummary: async (clientId: string): Promise<RecommendationSummary> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getRecommendationSummary ---', clientId);
            await mockApiDelay();
            return mockRecommendationSummary;
        }

        const response = await api.get(`/recommendations/summary/${clientId}`);
        return response.data;
    },

    updateRecommendationPriority: async (
        recommendationId: string,
        priority: 'high' | 'medium' | 'low'
    ): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: updateRecommendationPriority ---', { recommendationId, priority });
            await mockApiDelay();
            return;
        }

        await api.patch(`/recommendations/${recommendationId}/priority`, { priority });
    },

    markRecommendationImplemented: async (
        recommendationId: string,
        implementationDate: string,
        notes?: string
    ): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: markRecommendationImplemented ---', {
                recommendationId,
                implementationDate,
                notes
            });
            await mockApiDelay();
            return;
        }

        await api.post(`/recommendations/${recommendationId}/implement`, {
            implementationDate,
            notes
        });
    },

    exportRecommendationReport: async (clientId: string, format: 'pdf' | 'excel'): Promise<Blob> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: exportRecommendationReport ---', { clientId, format });
            await mockApiDelay();
            return new Blob(['Mock recommendation report'], {
                type: format === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel'
            });
        }

        const response = await api.get(`/recommendations/export/${clientId}?format=${format}`, {
            responseType: 'blob'
        });
        return response.data;
    },

    getRecommendationHistory: async (clientId: string): Promise<Recommendation[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getRecommendationHistory ---', clientId);
            await mockApiDelay();
            return mockRecommendations.filter(r => r.clientId === clientId);
        }

        const response = await api.get(`/recommendations/history/${clientId}`);
        return response.data;
    }
};

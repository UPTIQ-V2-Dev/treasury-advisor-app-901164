import { api } from '@/lib/api';
import { USE_MOCK_DATA } from '@/lib/constants';
import { mockApiDelay } from '@/lib/utils';
import { emitter } from '@/agentSdk';
import { mockRecommendations, mockTreasuryProducts, mockRecommendationSummary } from '@/data/mockRecommendations';
import type {
    Recommendation,
    TreasuryProduct,
    RecommendationFeedback,
    RecommendationSummary
} from '@/types/recommendations';

export const recommendationsService = {
    getRecommendations: async (clientId: string): Promise<Recommendation[]> => {
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: getRecommendations ---', clientId);
            await mockApiDelay();
            return mockRecommendations.filter(r => r.clientId === clientId);
        }

        const response = await api.get(`/recommendations/${clientId}`);
        return response.data;
    },

    generateRecommendations: async (clientId: string): Promise<{ taskId: string }> => {
        try {
            // Try to use agent for enhanced recommendations if statements are available
            const agentRecommendations = await emitter.emit({
                agentId: '37cff143-f7d2-4204-878f-020620e7697e',
                event: 'Bank-Statement-Uploaded',
                payload: {
                    clientId,
                    analysisType: 'recommendation_generation',
                    requestedAt: new Date().toISOString()
                }
            });

            if (agentRecommendations?.recommendations?.length > 0) {
                console.log('Generated enhanced recommendations using AI agent:', agentRecommendations);
                // Return success immediately as agent provided recommendations
                return { taskId: `agent-enhanced-${Date.now()}` };
            }
        } catch (error) {
            console.log('Agent-enhanced recommendation generation failed, falling back to standard API:', error);
        }

        // Fallback to standard API or mock data
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: generateRecommendations ---', clientId);
            await mockApiDelay();
            return { taskId: 'mock-generation-task-id' };
        }

        const response = await api.post(`/recommendations/generate`, { clientId });
        return response.data;
    },

    getRecommendationById: async (recommendationId: string): Promise<Recommendation> => {
        if (USE_MOCK_DATA) {
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
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: provideFeedback ---', feedback);
            await mockApiDelay();
            return;
        }

        await api.post('/recommendations/feedback', feedback);
    },

    approveRecommendation: async (recommendationId: string, reviewerId: string, comments?: string): Promise<void> => {
        if (USE_MOCK_DATA) {
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
        if (USE_MOCK_DATA) {
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
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: getTreasuryProducts ---');
            await mockApiDelay();
            return mockTreasuryProducts;
        }

        const response = await api.get('/products/catalog');
        return response.data;
    },

    getProductById: async (productId: string): Promise<TreasuryProduct> => {
        if (USE_MOCK_DATA) {
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
        if (USE_MOCK_DATA) {
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
        if (USE_MOCK_DATA) {
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
        if (USE_MOCK_DATA) {
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
        if (USE_MOCK_DATA) {
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
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: getRecommendationHistory ---', clientId);
            await mockApiDelay();
            return mockRecommendations.filter(r => r.clientId === clientId);
        }

        const response = await api.get(`/recommendations/history/${clientId}`);
        return response.data;
    }
};

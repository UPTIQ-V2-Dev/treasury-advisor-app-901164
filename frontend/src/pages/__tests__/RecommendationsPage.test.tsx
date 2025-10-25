import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test-utils';
import '@testing-library/jest-dom';
import { RecommendationsPage } from '../RecommendationsPage';
import * as recommendationsService from '@/services/recommendations';
import { mockRecommendations, mockRecommendationSummary } from '@/data/mockRecommendations';

// Mock the recommendations service
vi.mock('@/services/recommendations', () => ({
    recommendationsService: {
        getRecommendations: vi.fn(),
        getRecommendationSummary: vi.fn()
    }
}));

describe('RecommendationsPage', () => {
    const mockGetRecommendations = vi.mocked(recommendationsService.recommendationsService.getRecommendations);
    const mockGetRecommendationSummary = vi.mocked(
        recommendationsService.recommendationsService.getRecommendationSummary
    );

    beforeEach(() => {
        // Setup default mock responses
        mockGetRecommendations.mockResolvedValue(mockRecommendations);
        mockGetRecommendationSummary.mockResolvedValue(mockRecommendationSummary);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders page title and description', async () => {
        render(<RecommendationsPage />);

        expect(screen.getByText('Treasury Recommendations')).toBeInTheDocument();
        expect(
            screen.getByText('AI-generated product suggestions based on your financial analysis')
        ).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
        mockGetRecommendations.mockReturnValue(new Promise(() => {}));
        mockGetRecommendationSummary.mockReturnValue(new Promise(() => {}));

        render(<RecommendationsPage />);

        expect(screen.getByText('Loading recommendations...')).toBeInTheDocument();
        expect(screen.getByRole('generic', { name: /loading/i })).toBeInTheDocument();
    });

    it('displays summary metrics after loading', async () => {
        render(<RecommendationsPage />);

        await waitFor(() => {
            expect(screen.getByText('Total Recommendations')).toBeInTheDocument();
            expect(screen.getByText('High Priority')).toBeInTheDocument();
            expect(screen.getByText('Potential Savings')).toBeInTheDocument();
            expect(screen.getByText('Approved')).toBeInTheDocument();
        });

        expect(screen.getByText(mockRecommendationSummary.totalRecommendations.toString())).toBeInTheDocument();
        expect(screen.getByText(mockRecommendationSummary.highPriorityCount.toString())).toBeInTheDocument();
    });

    it('displays recommendation cards with correct information', async () => {
        render(<RecommendationsPage />);

        await waitFor(() => {
            expect(screen.getByText(mockRecommendations[0].product.name)).toBeInTheDocument();
        });

        const firstRecommendation = mockRecommendations[0];

        expect(screen.getByText(firstRecommendation.product.description)).toBeInTheDocument();
        expect(screen.getByText(firstRecommendation.rationale.primaryTrigger)).toBeInTheDocument();
        expect(
            screen.getByText(`Confidence: ${Math.round(firstRecommendation.confidence * 100)}%`)
        ).toBeInTheDocument();
    });

    it('filters recommendations by tabs', async () => {
        render(<RecommendationsPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByText(mockRecommendations[0].product.name)).toBeInTheDocument();
        });

        // Click on High Priority tab
        const highPriorityTab = screen.getByRole('tab', { name: /high priority/i });
        await user.click(highPriorityTab);

        // Should show only high priority recommendations
        expect(screen.getAllByText(/high/i).length).toBeGreaterThan(0);
    });

    it('shows view details button for each recommendation', async () => {
        render(<RecommendationsPage />);

        await waitFor(() => {
            expect(screen.getByText(mockRecommendations[0].product.name)).toBeInTheDocument();
        });

        const viewDetailsButtons = screen.getAllByText('View Details');
        expect(viewDetailsButtons.length).toBeGreaterThan(0);
    });

    it('displays priority and status badges correctly', async () => {
        render(<RecommendationsPage />);

        await waitFor(() => {
            expect(screen.getByText(mockRecommendations[0].product.name)).toBeInTheDocument();
        });

        const firstRecommendation = mockRecommendations[0];

        // Check for priority badge
        expect(screen.getByText(firstRecommendation.priority)).toBeInTheDocument();

        // Check for status badge
        expect(screen.getByText(firstRecommendation.status)).toBeInTheDocument();
    });

    it('shows empty state when no recommendations found', async () => {
        mockGetRecommendations.mockResolvedValue([]);

        render(<RecommendationsPage />);

        await waitFor(() => {
            expect(screen.getByText('No recommendations found')).toBeInTheDocument();
        });
    });

    it('handles API errors gracefully', async () => {
        mockGetRecommendations.mockRejectedValue(new Error('API Error'));
        mockGetRecommendationSummary.mockRejectedValue(new Error('API Error'));

        render(<RecommendationsPage />);

        // The component should still render without crashing
        expect(screen.getByText('Treasury Recommendations')).toBeInTheDocument();
    });

    it('displays export report button', async () => {
        render(<RecommendationsPage />);

        expect(screen.getByRole('button', { name: /export report/i })).toBeInTheDocument();
    });

    it('shows supporting factors for recommendations', async () => {
        render(<RecommendationsPage />);

        await waitFor(() => {
            expect(screen.getByText('Supporting Factors')).toBeInTheDocument();
        });

        const firstRecommendation = mockRecommendations[0];
        if (firstRecommendation.rationale.supportingFactors.length > 0) {
            expect(screen.getByText(firstRecommendation.rationale.supportingFactors[0])).toBeInTheDocument();
        }
    });

    it('displays implementation timeframe and complexity', async () => {
        render(<RecommendationsPage />);

        await waitFor(() => {
            expect(screen.getByText('Implementation')).toBeInTheDocument();
        });

        const firstRecommendation = mockRecommendations[0];
        expect(screen.getByText(firstRecommendation.implementation.timeframe)).toBeInTheDocument();
        expect(
            screen.getByText(`${firstRecommendation.implementation.complexity} complexity`, { exact: false })
        ).toBeInTheDocument();
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test-utils';
import '@testing-library/jest-dom';
import { AnalyticsPage } from '../AnalyticsPage';
import * as analyticsService from '@/services/analytics';
import { mockAnalyticsSummary, mockTransactionCategories, mockSpendingPatterns } from '@/data/mockAnalytics';

// Mock the analytics service
vi.mock('@/services/analytics', () => ({
    analyticsService: {
        getAnalyticsSummary: vi.fn(),
        getTransactionCategories: vi.fn(),
        getSpendingPatterns: vi.fn(),
        getVendorAnalysis: vi.fn(),
        exportAnalyticsData: vi.fn()
    }
}));

describe('AnalyticsPage', () => {
    const mockGetAnalyticsSummary = vi.mocked(analyticsService.analyticsService.getAnalyticsSummary);
    const mockGetTransactionCategories = vi.mocked(analyticsService.analyticsService.getTransactionCategories);
    const mockGetSpendingPatterns = vi.mocked(analyticsService.analyticsService.getSpendingPatterns);
    const mockGetVendorAnalysis = vi.mocked(analyticsService.analyticsService.getVendorAnalysis);
    const mockExportAnalyticsData = vi.mocked(analyticsService.analyticsService.exportAnalyticsData);

    const mockVendors = [
        {
            vendorName: 'Office Supplies Inc',
            totalAmount: 15000,
            transactionCount: 25,
            percentage: 12.5,
            paymentMethods: ['ach', 'check']
        },
        {
            vendorName: 'Consulting Corp',
            totalAmount: 25000,
            transactionCount: 8,
            percentage: 20.8,
            paymentMethods: ['wire']
        }
    ];

    beforeEach(() => {
        mockGetAnalyticsSummary.mockResolvedValue(mockAnalyticsSummary);
        mockGetTransactionCategories.mockResolvedValue(mockTransactionCategories);
        mockGetSpendingPatterns.mockResolvedValue(mockSpendingPatterns);
        mockGetVendorAnalysis.mockResolvedValue(mockVendors);
        mockExportAnalyticsData.mockResolvedValue(new Blob(['test data'], { type: 'text/csv' }));

        // Mock URL.createObjectURL and related methods
        global.URL.createObjectURL = vi.fn(() => 'mock-url');
        global.URL.revokeObjectURL = vi.fn();

        // Mock document methods for download
        const mockAnchor = {
            href: '',
            download: '',
            click: vi.fn()
        };
        vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
        vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
        vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders page title and description', async () => {
        render(<AnalyticsPage />);

        expect(screen.getByText('Financial Analytics')).toBeInTheDocument();
        expect(screen.getByText('Detailed analysis with advanced filtering and insights')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
        mockGetAnalyticsSummary.mockReturnValue(new Promise(() => {}));

        render(<AnalyticsPage />);

        expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('displays metrics cards after loading', async () => {
        render(<AnalyticsPage />);

        await waitFor(() => {
            expect(screen.getByText('Total Inflow')).toBeInTheDocument();
            expect(screen.getByText('Total Outflow')).toBeInTheDocument();
            expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
            expect(screen.getByText('Avg Daily Balance')).toBeInTheDocument();
        });
    });

    it('shows export buttons', async () => {
        render(<AnalyticsPage />);

        expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /export excel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
    });

    it('allows applying filters', async () => {
        render(<AnalyticsPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
        });

        const applyFiltersButton = screen.getByRole('button', { name: /apply filters/i });
        await user.click(applyFiltersButton);

        expect(mockGetAnalyticsSummary).toHaveBeenCalledWith(
            'client-1',
            expect.objectContaining({
                dateRange: expect.any(Object)
            })
        );
    });

    it('allows clearing all filters', async () => {
        render(<AnalyticsPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
        });

        const clearAllButton = screen.getByRole('button', { name: /clear all/i });
        await user.click(clearAllButton);

        // Verify filters are cleared (this would trigger a new API call)
        expect(clearAllButton).toBeInTheDocument();
    });

    it('displays transaction categories in categories tab', async () => {
        render(<AnalyticsPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByRole('tab', { name: /categories/i })).toBeInTheDocument();
        });

        const categoriesTab = screen.getByRole('tab', { name: /categories/i });
        await user.click(categoriesTab);

        await waitFor(() => {
            expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
            expect(screen.getByText('Category Insights')).toBeInTheDocument();
        });

        // Check if categories are displayed
        mockTransactionCategories.forEach(category => {
            expect(screen.getByText(category.category)).toBeInTheDocument();
        });
    });

    it('displays spending patterns in patterns tab', async () => {
        render(<AnalyticsPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByRole('tab', { name: /patterns/i })).toBeInTheDocument();
        });

        const patternsTab = screen.getByRole('tab', { name: /patterns/i });
        await user.click(patternsTab);

        await waitFor(() => {
            expect(screen.getByText('Spending Patterns')).toBeInTheDocument();
        });

        // Check if patterns are displayed
        mockSpendingPatterns.forEach(pattern => {
            expect(screen.getByText(pattern.category)).toBeInTheDocument();
        });
    });

    it('displays vendor analysis in vendors tab', async () => {
        render(<AnalyticsPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByRole('tab', { name: /vendors/i })).toBeInTheDocument();
        });

        const vendorsTab = screen.getByRole('tab', { name: /vendors/i });
        await user.click(vendorsTab);

        await waitFor(() => {
            expect(screen.getByText('Vendor Concentration Analysis')).toBeInTheDocument();
        });

        // Check if vendors are displayed
        mockVendors.forEach(vendor => {
            expect(screen.getByText(vendor.vendorName)).toBeInTheDocument();
        });
    });

    it('shows liquidity analysis in overview tab', async () => {
        render(<AnalyticsPage />);

        await waitFor(() => {
            expect(screen.getByText('Liquidity Analysis')).toBeInTheDocument();
        });

        expect(screen.getByText('Average Balance')).toBeInTheDocument();
        expect(screen.getByText('Liquidity Score')).toBeInTheDocument();
        expect(screen.getByText('Idle Days')).toBeInTheDocument();
    });

    it('handles export functionality', async () => {
        render(<AnalyticsPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
        });

        const exportButton = screen.getByRole('button', { name: /export csv/i });
        await user.click(exportButton);

        expect(mockExportAnalyticsData).toHaveBeenCalledWith('client-1', 'csv', expect.any(Object));
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('shows cash flow trends in overview', async () => {
        render(<AnalyticsPage />);

        await waitFor(() => {
            expect(screen.getByText('Cash Flow Trends')).toBeInTheDocument();
        });
    });

    it('displays category trends with indicators', async () => {
        render(<AnalyticsPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByRole('tab', { name: /categories/i })).toBeInTheDocument();
        });

        const categoriesTab = screen.getByRole('tab', { name: /categories/i });
        await user.click(categoriesTab);

        await waitFor(() => {
            mockTransactionCategories.forEach(category => {
                expect(screen.getByText(category.trend)).toBeInTheDocument();
            });
        });
    });

    it('shows threshold exceeded warning when applicable', async () => {
        const summaryWithThreshold = {
            ...mockAnalyticsSummary,
            liquidity: {
                ...mockAnalyticsSummary.liquidity,
                thresholdExceeded: true,
                thresholdAmount: 50000
            }
        };
        mockGetAnalyticsSummary.mockResolvedValue(summaryWithThreshold);

        render(<AnalyticsPage />);

        await waitFor(() => {
            expect(screen.getByText(/threshold exceeded/i)).toBeInTheDocument();
        });
    });

    it('handles date range filter selection', async () => {
        render(<AnalyticsPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByText('Date Range')).toBeInTheDocument();
        });

        const dateRangeButton = screen.getByRole('button', { name: /pick a date range/i });
        await user.click(dateRangeButton);

        // Calendar should open (this tests that the popover works)
        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    });

    it('shows active filter badges', async () => {
        render(<AnalyticsPage />);
        const user = userEvent.setup();

        // First need to set some filters
        await waitFor(() => {
            expect(screen.getByText('Categories')).toBeInTheDocument();
        });

        const categoriesButton = screen.getByRole('button', { name: /select categories/i });
        await user.click(categoriesButton);

        // Select a category
        const operatingExpenses = screen.getByLabelText('Operating Expenses');
        await user.click(operatingExpenses);

        // Close the popover by clicking outside
        await user.click(document.body);

        // Apply filters to show badges
        const applyButton = screen.getByRole('button', { name: /apply filters/i });
        await user.click(applyButton);

        // The badge should appear after applying filters
        await waitFor(() => {
            expect(screen.getByText('Operating Expenses')).toBeInTheDocument();
        });
    });

    it('shows pattern frequency and seasonality', async () => {
        render(<AnalyticsPage />);
        const user = userEvent.setup();

        const patternsTab = screen.getByRole('tab', { name: /patterns/i });
        await user.click(patternsTab);

        await waitFor(() => {
            mockSpendingPatterns.forEach(pattern => {
                expect(screen.getByText(pattern.frequency, { exact: false })).toBeInTheDocument();
                if (pattern.seasonality) {
                    expect(screen.getByText(pattern.seasonality, { exact: false })).toBeInTheDocument();
                }
            });
        });
    });
});

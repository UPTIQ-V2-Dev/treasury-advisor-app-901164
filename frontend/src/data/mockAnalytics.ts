import type {
    DashboardMetrics,
    CashFlowData,
    TransactionCategory,
    LiquidityAnalysis,
    SpendingPattern,
    AnalyticsSummary,
    TrendData
} from '@/types/analytics';

export const mockDashboardMetrics: DashboardMetrics = {
    totalInflow: 485000.0,
    totalOutflow: 125350.0,
    netCashFlow: 359650.0,
    averageDailyBalance: 342500.0,
    liquidityRatio: 2.85,
    idleBalance: 280000.0,
    transactionCount: 145,
    period: {
        startDate: '2024-11-01',
        endDate: '2024-11-30'
    }
};

export const mockCashFlowData: CashFlowData[] = [
    {
        date: '2024-11-01',
        inflow: 25000,
        outflow: 8500,
        balance: 320000,
        netFlow: 16500
    },
    {
        date: '2024-11-05',
        inflow: 75000,
        outflow: 12000,
        balance: 383000,
        netFlow: 63000
    },
    {
        date: '2024-11-10',
        inflow: 45000,
        outflow: 18500,
        balance: 409500,
        netFlow: 26500
    },
    {
        date: '2024-11-15',
        inflow: 125000,
        outflow: 25000,
        balance: 509500,
        netFlow: 100000
    },
    {
        date: '2024-11-20',
        inflow: 85000,
        outflow: 22000,
        balance: 572500,
        netFlow: 63000
    },
    {
        date: '2024-11-25',
        inflow: 65000,
        outflow: 15500,
        balance: 622000,
        netFlow: 49500
    },
    {
        date: '2024-11-30',
        inflow: 65000,
        outflow: 23850,
        balance: 663150,
        netFlow: 41150
    }
];

export const mockTransactionCategories: TransactionCategory[] = [
    {
        category: 'Customer Payments',
        amount: 285000,
        count: 24,
        percentage: 58.8,
        trend: 'up'
    },
    {
        category: 'Payroll',
        amount: 125000,
        count: 2,
        percentage: 25.8,
        trend: 'stable'
    },
    {
        category: 'Vendor Payments',
        amount: 45000,
        count: 18,
        percentage: 9.3,
        trend: 'down'
    },
    {
        category: 'Office Expenses',
        amount: 15500,
        count: 12,
        percentage: 3.2,
        trend: 'stable'
    },
    {
        category: 'Utilities',
        amount: 8750,
        count: 6,
        percentage: 1.8,
        trend: 'up'
    },
    {
        category: 'Other',
        amount: 5100,
        count: 8,
        percentage: 1.1,
        trend: 'stable'
    }
];

export const mockLiquidityAnalysis: LiquidityAnalysis = {
    averageBalance: 342500,
    minimumBalance: 125000,
    maximumBalance: 675000,
    volatility: 0.24,
    idleDays: 45,
    liquidityScore: 85,
    thresholdExceeded: true,
    thresholdAmount: 250000
};

export const mockSpendingPatterns: SpendingPattern[] = [
    {
        category: 'Payroll',
        averageAmount: 62500,
        frequency: 'monthly',
        seasonality: 'low',
        vendors: [
            {
                vendorName: 'ADP Payroll Services',
                totalAmount: 125000,
                transactionCount: 2,
                percentage: 100,
                paymentMethods: ['ACH']
            }
        ]
    },
    {
        category: 'Vendor Payments',
        averageAmount: 2500,
        frequency: 'weekly',
        seasonality: 'medium',
        vendors: [
            {
                vendorName: 'Office Depot',
                totalAmount: 12000,
                transactionCount: 6,
                percentage: 26.7,
                paymentMethods: ['Check', 'ACH']
            },
            {
                vendorName: 'Tech Solutions Inc',
                totalAmount: 18000,
                transactionCount: 4,
                percentage: 40.0,
                paymentMethods: ['Wire', 'ACH']
            }
        ]
    },
    {
        category: 'Rent',
        averageAmount: 15000,
        frequency: 'monthly',
        seasonality: 'low',
        vendors: [
            {
                vendorName: 'Downtown Properties LLC',
                totalAmount: 15000,
                transactionCount: 1,
                percentage: 100,
                paymentMethods: ['Check']
            }
        ]
    }
];

export const mockTrendData: TrendData[] = [
    { period: '2024-08', value: 425000, change: 15000, changePercent: 3.7 },
    { period: '2024-09', value: 398000, change: -27000, changePercent: -6.4 },
    { period: '2024-10', value: 456000, change: 58000, changePercent: 14.6 },
    { period: '2024-11', value: 485000, change: 29000, changePercent: 6.4 }
];

export const mockAnalyticsSummary: AnalyticsSummary = {
    metrics: mockDashboardMetrics,
    cashFlow: mockCashFlowData,
    categories: mockTransactionCategories,
    liquidity: mockLiquidityAnalysis,
    patterns: mockSpendingPatterns,
    trends: {
        inflow: mockTrendData,
        outflow: mockTrendData.map(d => ({ ...d, value: d.value * 0.3 })),
        balance: mockTrendData.map(d => ({ ...d, value: d.value * 0.7 }))
    }
};

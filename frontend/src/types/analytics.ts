export interface DashboardMetrics {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
    averageDailyBalance: number;
    liquidityRatio: number;
    idleBalance: number;
    transactionCount: number;
    period: {
        startDate: string;
        endDate: string;
    };
}

export interface CashFlowData {
    date: string;
    inflow: number;
    outflow: number;
    balance: number;
    netFlow: number;
}

export interface TransactionCategory {
    category: string;
    amount: number;
    count: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
}

export interface LiquidityAnalysis {
    averageBalance: number;
    minimumBalance: number;
    maximumBalance: number;
    volatility: number;
    idleDays: number;
    liquidityScore: number;
    thresholdExceeded: boolean;
    thresholdAmount: number;
}

export interface SpendingPattern {
    category: string;
    subcategory?: string;
    averageAmount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'irregular';
    seasonality?: 'high' | 'medium' | 'low';
    vendors: VendorConcentration[];
}

export interface VendorConcentration {
    vendorName: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
    paymentMethods: string[];
}

export interface AnalyticsFilters {
    dateRange: {
        startDate: string;
        endDate: string;
    };
    categories?: string[];
    transactionTypes?: string[];
    amountRange?: {
        min: number;
        max: number;
    };
}

export interface TrendData {
    period: string;
    value: number;
    change?: number;
    changePercent?: number;
}

export interface AnalyticsSummary {
    metrics: DashboardMetrics;
    cashFlow: CashFlowData[];
    categories: TransactionCategory[];
    liquidity: LiquidityAnalysis;
    patterns: SpendingPattern[];
    trends: {
        inflow: TrendData[];
        outflow: TrendData[];
        balance: TrendData[];
    };
}

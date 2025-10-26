import { analyticsService } from '../services/index.ts';
import { MCPTool } from '../types/mcp.ts';
import pick from '../utils/pick.ts';
import { z } from 'zod';

// Schema definitions for analytics data structures
const analyticsOverviewSchema = z.object({
    totalInflow: z.number(),
    totalOutflow: z.number(),
    netCashFlow: z.number(),
    averageDailyBalance: z.number(),
    liquidityRatio: z.number(),
    idleBalance: z.number(),
    transactionCount: z.number(),
    period: z.object({
        startDate: z.string().nullable(),
        endDate: z.string().nullable()
    })
});

// Schema definitions removed for brevity - using z.any() for output schemas

const liquidityAnalyticsSchema = z.object({
    averageBalance: z.number(),
    minimumBalance: z.number(),
    maximumBalance: z.number(),
    volatility: z.number(),
    idleDays: z.number(),
    liquidityScore: z.number(),
    thresholdExceeded: z.boolean(),
    thresholdAmount: z.number()
});

// Schema definitions removed for brevity - using z.any() for output schemas

// Analytics Overview Tool
const getAnalyticsOverviewTool: MCPTool = {
    id: 'analytics_get_overview',
    name: 'Get Analytics Overview',
    description:
        'Get comprehensive financial analytics overview for a client including cash flow, liquidity ratios, and key metrics',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        categories: z.array(z.string()).optional(),
        transactionTypes: z.array(z.string()).optional(),
        minAmount: z.number().optional(),
        maxAmount: z.number().optional()
    }),
    outputSchema: analyticsOverviewSchema,
    fn: async (inputs: {
        clientId: string;
        startDate?: string;
        endDate?: string;
        categories?: string[];
        transactionTypes?: string[];
        minAmount?: number;
        maxAmount?: number;
    }) => {
        const filters = pick(inputs, [
            'startDate',
            'endDate',
            'categories',
            'transactionTypes',
            'minAmount',
            'maxAmount'
        ]);

        // Convert date strings to Date objects
        if (filters.startDate && typeof filters.startDate === 'string') {
            filters.startDate = new Date(filters.startDate);
        }
        if (filters.endDate && typeof filters.endDate === 'string') {
            filters.endDate = new Date(filters.endDate);
        }

        const overview = await analyticsService.getAnalyticsOverview(inputs.clientId, filters);
        return overview;
    }
};

// Cash Flow Analytics Tool
const getCashFlowAnalyticsTool: MCPTool = {
    id: 'analytics_get_cashflow',
    name: 'Get Cash Flow Analytics',
    description: 'Get detailed cash flow analysis with period-based grouping (daily, weekly, monthly, yearly)',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().default('daily'),
        startDate: z.string().optional(),
        endDate: z.string().optional()
    }),
    outputSchema: z.any(),
    fn: async (inputs: { clientId: string; period?: string; startDate?: string; endDate?: string }) => {
        const options = pick(inputs, ['period', 'startDate', 'endDate']);

        // Convert date strings to Date objects
        if (options.startDate && typeof options.startDate === 'string') {
            options.startDate = new Date(options.startDate);
        }
        if (options.endDate && typeof options.endDate === 'string') {
            options.endDate = new Date(options.endDate);
        }

        const cashFlow = await analyticsService.getCashFlowAnalytics(inputs.clientId, options);
        return cashFlow;
    }
};

// Category Analytics Tool
const getCategoryAnalyticsTool: MCPTool = {
    id: 'analytics_get_categories',
    name: 'Get Category Analytics',
    description: 'Get spending breakdown by transaction categories with trend analysis and percentages',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        startDate: z.string().optional(),
        endDate: z.string().optional()
    }),
    outputSchema: z.any(),
    fn: async (inputs: { clientId: string; startDate?: string; endDate?: string }) => {
        const filters = pick(inputs, ['startDate', 'endDate']);

        // Convert date strings to Date objects
        if (filters.startDate && typeof filters.startDate === 'string') {
            filters.startDate = new Date(filters.startDate);
        }
        if (filters.endDate && typeof filters.endDate === 'string') {
            filters.endDate = new Date(filters.endDate);
        }

        const categories = await analyticsService.getCategoryAnalytics(inputs.clientId, filters);
        return categories;
    }
};

// Liquidity Analytics Tool
const getLiquidityAnalyticsTool: MCPTool = {
    id: 'analytics_get_liquidity',
    name: 'Get Liquidity Analytics',
    description: 'Get comprehensive liquidity analysis including balance patterns, volatility, and liquidity score',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: liquidityAnalyticsSchema,
    fn: async (inputs: { clientId: string }) => {
        const liquidity = await analyticsService.getLiquidityAnalytics(inputs.clientId);
        return liquidity;
    }
};

// Spending Patterns Tool
const getSpendingPatternsTool: MCPTool = {
    id: 'analytics_get_patterns',
    name: 'Get Spending Patterns',
    description: 'Get detailed spending patterns analysis including vendor relationships, frequency, and seasonality',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.any(),
    fn: async (inputs: { clientId: string }) => {
        const patterns = await analyticsService.getSpendingPatterns(inputs.clientId);
        return patterns;
    }
};

// Vendor Analytics Tool
const getVendorAnalyticsTool: MCPTool = {
    id: 'analytics_get_vendors',
    name: 'Get Vendor Analytics',
    description: 'Get vendor/counterparty analysis showing spending breakdown by vendors with payment methods',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.any(),
    fn: async (inputs: { clientId: string }) => {
        const vendors = await analyticsService.getVendorAnalytics(inputs.clientId);
        return vendors;
    }
};

// Trend Analytics Tool
const getTrendAnalyticsTool: MCPTool = {
    id: 'analytics_get_trends',
    name: 'Get Trend Analytics',
    description:
        'Get time-series trend analysis for specific financial metrics (inflow, outflow, balance, transactions)',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        metric: z.enum(['inflow', 'outflow', 'balance', 'transactions']),
        period: z.enum(['3m', '6m', '12m', '24m']).optional().default('12m')
    }),
    outputSchema: z.any(),
    fn: async (inputs: { clientId: string; metric: string; period?: string }) => {
        const trends = await analyticsService.getTrendAnalytics(inputs.clientId, inputs.metric, inputs.period || '12m');
        return trends;
    }
};

// Analytics Summary Tool
const getAnalyticsSummaryTool: MCPTool = {
    id: 'analytics_get_summary',
    name: 'Get Analytics Summary',
    description:
        'Get complete analytics summary including all key insights: overview, cash flow, categories, liquidity, patterns, and trends',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        startDate: z.string().optional(),
        endDate: z.string().optional()
    }),
    outputSchema: z.any(),
    fn: async (inputs: { clientId: string; startDate?: string; endDate?: string }) => {
        const filters = pick(inputs, ['startDate', 'endDate']);

        // Convert date strings to Date objects
        if (filters.startDate && typeof filters.startDate === 'string') {
            filters.startDate = new Date(filters.startDate);
        }
        if (filters.endDate && typeof filters.endDate === 'string') {
            filters.endDate = new Date(filters.endDate);
        }

        const summary = await analyticsService.getAnalyticsSummary(inputs.clientId, filters);
        return summary;
    }
};

// Export Analytics Tool
const exportAnalyticsDataTool: MCPTool = {
    id: 'analytics_export_data',
    name: 'Export Analytics Data',
    description:
        'Export comprehensive analytics data in various formats (CSV, PDF, Excel, JSON) for reporting and external analysis',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        format: z.enum(['csv', 'pdf', 'excel', 'json']),
        startDate: z.string().optional(),
        endDate: z.string().optional()
    }),
    outputSchema: z.object({
        format: z.string(),
        content: z.string(),
        summary: z.any()
    }),
    fn: async (inputs: { clientId: string; format: string; startDate?: string; endDate?: string }) => {
        const filters = pick(inputs, ['startDate', 'endDate']);

        // Convert date strings to Date objects
        if (filters.startDate && typeof filters.startDate === 'string') {
            filters.startDate = new Date(filters.startDate);
        }
        if (filters.endDate && typeof filters.endDate === 'string') {
            filters.endDate = new Date(filters.endDate);
        }

        const exportData = await analyticsService.exportAnalyticsData(inputs.clientId, inputs.format, filters);
        return exportData;
    }
};

// Financial Health Score Tool
const getFinancialHealthScoreTool: MCPTool = {
    id: 'analytics_get_health_score',
    name: 'Get Financial Health Score',
    description:
        'Calculate overall financial health score based on liquidity, cash flow patterns, and spending efficiency',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        overallScore: z.number(),
        liquidityScore: z.number(),
        cashFlowScore: z.number(),
        efficiencyScore: z.number(),
        riskScore: z.number(),
        recommendations: z.array(z.string())
    }),
    fn: async (inputs: { clientId: string }) => {
        // Get various analytics components
        const [liquidity, overview] = await Promise.all([
            analyticsService.getLiquidityAnalytics(inputs.clientId),
            analyticsService.getAnalyticsOverview(inputs.clientId)
        ]);

        // Calculate component scores (0-100 scale)
        const liquidityScore = liquidity.liquidityScore * 10; // Convert from 0-10 to 0-100

        const cashFlowScore = Math.min(
            100,
            Math.max(0, 50 + (overview.netCashFlow / Math.max(1, overview.totalOutflow)) * 50)
        );

        const efficiencyScore = Math.min(
            100,
            Math.max(
                0,
                100 - liquidity.volatility * 100 // Lower volatility = higher efficiency
            )
        );

        const riskScore = Math.min(100, Math.max(0, liquidity.thresholdExceeded ? 30 : 80 - liquidity.idleDays * 2));

        // Calculate overall weighted score
        const overallScore = liquidityScore * 0.3 + cashFlowScore * 0.3 + efficiencyScore * 0.2 + riskScore * 0.2;

        // Generate recommendations based on scores
        const recommendations = [];
        if (liquidityScore < 50) {
            recommendations.push('Consider improving cash reserves and liquidity management');
        }
        if (cashFlowScore < 50) {
            recommendations.push('Focus on improving cash flow patterns and reducing outflow volatility');
        }
        if (efficiencyScore < 50) {
            recommendations.push('Optimize balance management to reduce volatility');
        }
        if (riskScore < 50) {
            recommendations.push('Address minimum balance threshold breaches and reduce idle cash');
        }
        if (overview.idleBalance > overview.averageDailyBalance * 0.2) {
            recommendations.push('Consider investment options for idle cash to improve yield');
        }

        return {
            overallScore: Math.round(overallScore),
            liquidityScore: Math.round(liquidityScore),
            cashFlowScore: Math.round(cashFlowScore),
            efficiencyScore: Math.round(efficiencyScore),
            riskScore: Math.round(riskScore),
            recommendations
        };
    }
};

// Comparative Analytics Tool
const getComparativeAnalyticsTool: MCPTool = {
    id: 'analytics_get_comparative',
    name: 'Get Comparative Analytics',
    description: 'Compare financial metrics between different time periods or against benchmarks',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        currentPeriodStart: z.string(),
        currentPeriodEnd: z.string(),
        comparisonPeriodStart: z.string(),
        comparisonPeriodEnd: z.string()
    }),
    outputSchema: z.any(),
    fn: async (inputs: {
        clientId: string;
        currentPeriodStart: string;
        currentPeriodEnd: string;
        comparisonPeriodStart: string;
        comparisonPeriodEnd: string;
    }) => {
        const currentFilters = {
            startDate: new Date(inputs.currentPeriodStart),
            endDate: new Date(inputs.currentPeriodEnd)
        };

        const comparisonFilters = {
            startDate: new Date(inputs.comparisonPeriodStart),
            endDate: new Date(inputs.comparisonPeriodEnd)
        };

        const [currentPeriod, comparisonPeriod] = await Promise.all([
            analyticsService.getAnalyticsOverview(inputs.clientId, currentFilters),
            analyticsService.getAnalyticsOverview(inputs.clientId, comparisonFilters)
        ]);

        // Calculate changes
        const inflowChange = currentPeriod.totalInflow - comparisonPeriod.totalInflow;
        const outflowChange = currentPeriod.totalOutflow - comparisonPeriod.totalOutflow;
        const netCashFlowChange = currentPeriod.netCashFlow - comparisonPeriod.netCashFlow;
        const liquidityChange = currentPeriod.liquidityRatio - comparisonPeriod.liquidityRatio;
        const transactionCountChange = currentPeriod.transactionCount - comparisonPeriod.transactionCount;

        // Calculate percentage changes
        const inflowPercent =
            comparisonPeriod.totalInflow > 0 ? (inflowChange / comparisonPeriod.totalInflow) * 100 : 0;
        const outflowPercent =
            comparisonPeriod.totalOutflow > 0 ? (outflowChange / comparisonPeriod.totalOutflow) * 100 : 0;
        const netCashFlowPercent =
            Math.abs(comparisonPeriod.netCashFlow) > 0
                ? (netCashFlowChange / Math.abs(comparisonPeriod.netCashFlow)) * 100
                : 0;

        return {
            currentPeriod,
            comparisonPeriod,
            changes: {
                inflowChange: Math.round(inflowChange * 100) / 100,
                outflowChange: Math.round(outflowChange * 100) / 100,
                netCashFlowChange: Math.round(netCashFlowChange * 100) / 100,
                liquidityChange: Math.round(liquidityChange * 1000) / 1000,
                transactionCountChange,
                inflowPercent: Math.round(inflowPercent * 100) / 100,
                outflowPercent: Math.round(outflowPercent * 100) / 100,
                netCashFlowPercent: Math.round(netCashFlowPercent * 100) / 100
            }
        };
    }
};

// Dashboard Analytics Tool
const getDashboardTool: MCPTool = {
    id: 'analytics_get_dashboard',
    name: 'Get Dashboard Analytics',
    description: 'Get comprehensive dashboard data with KPIs, charts, and visualizations for executive reporting',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        dateRange: z.enum(['7d', '30d', '90d', '6m', '1y']).optional().default('30d'),
        compareMode: z.enum(['previous', 'year_over_year', 'none']).optional().default('previous')
    }),
    outputSchema: z.object({
        metrics: z.object({
            totalInflow: z.number(),
            totalOutflow: z.number(),
            netCashFlow: z.number(),
            averageDailyBalance: z.number(),
            liquidityRatio: z.number(),
            idleBalance: z.number(),
            transactionCount: z.number(),
            period: z.object({
                startDate: z.string().nullable(),
                endDate: z.string().nullable()
            })
        }),
        charts: z.object({
            cashFlow: z.array(z.any()),
            categories: z.array(z.any()),
            trends: z.array(z.any())
        }),
        kpis: z.array(
            z.object({
                name: z.string(),
                value: z.number(),
                unit: z.string(),
                trend: z.string(),
                change: z.number()
            })
        ),
        period: z.object({
            startDate: z.string(),
            endDate: z.string()
        })
    }),
    fn: async (inputs: { clientId: string; dateRange?: string; compareMode?: string }) => {
        const dashboard = await analyticsService.getDashboard(
            inputs.clientId,
            inputs.dateRange || '30d',
            inputs.compareMode || 'previous'
        );
        return dashboard;
    }
};

export const analyticsTools: MCPTool[] = [
    getAnalyticsOverviewTool,
    getCashFlowAnalyticsTool,
    getCategoryAnalyticsTool,
    getLiquidityAnalyticsTool,
    getSpendingPatternsTool,
    getVendorAnalyticsTool,
    getTrendAnalyticsTool,
    getAnalyticsSummaryTool,
    exportAnalyticsDataTool,
    getFinancialHealthScoreTool,
    getComparativeAnalyticsTool,
    getDashboardTool
];

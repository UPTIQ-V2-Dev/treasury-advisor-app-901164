import prisma from '../client.ts';
import { Prisma } from '../generated/prisma/index.js';
import ApiError from '../utils/ApiError.ts';
import httpStatus from 'http-status';

/**
 * Analytics Service for Treasury Management
 * Provides comprehensive financial insights and analytics
 */

interface AnalyticsFilter {
    startDate?: Date;
    endDate?: Date;
    accountId?: string;
    categories?: string[];
    transactionTypes?: string[];
    minAmount?: number;
    maxAmount?: number;
}

interface PeriodOptions {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: Date;
    endDate?: Date;
}

/**
 * Get comprehensive analytics overview for a client
 */
const getAnalyticsOverview = async (clientId: string, filters: AnalyticsFilter = {}) => {
    // Verify client exists
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    const where = buildTransactionWhereClause(clientId, filters);

    // Get total inflow and outflow
    const [totalInflow, totalOutflow, transactionCount] = await Promise.all([
        prisma.transaction.aggregate({
            where: { ...where, amount: { gt: 0 } },
            _sum: { amount: true },
            _count: true
        }),
        prisma.transaction.aggregate({
            where: { ...where, amount: { lt: 0 } },
            _sum: { amount: true },
            _count: true
        }),
        prisma.transaction.count({ where })
    ]);

    // Calculate basic metrics
    const inflowSum = totalInflow._sum.amount || 0;
    const outflowSum = Math.abs(totalOutflow._sum.amount || 0);
    const netCashFlow = inflowSum - outflowSum;

    // Get average daily balance (simplified - using latest balance)
    const latestTransactions = await prisma.transaction.findMany({
        where: { clientId },
        orderBy: { date: 'desc' },
        take: 30,
        select: { balanceAfter: true, date: true }
    });

    const averageDailyBalance =
        latestTransactions.length > 0
            ? latestTransactions.reduce((sum, t) => sum + (t.balanceAfter || 0), 0) / latestTransactions.length
            : 0;

    // Calculate liquidity ratio (simplified as current balance vs outflow)
    const liquidityRatio = outflowSum > 0 ? averageDailyBalance / outflowSum : 0;

    // Calculate idle balance (balance that could be optimized)
    const idleBalance = Math.max(0, averageDailyBalance - outflowSum * 0.1); // 10% buffer

    return {
        totalInflow: inflowSum,
        totalOutflow: outflowSum,
        netCashFlow,
        averageDailyBalance,
        liquidityRatio,
        idleBalance,
        transactionCount,
        period: {
            startDate: filters.startDate?.toISOString() || null,
            endDate: filters.endDate?.toISOString() || null
        }
    };
};

/**
 * Get cash flow data with period granularity
 */
const getCashFlowAnalytics = async (clientId: string, options: PeriodOptions = {}) => {
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    const period = options.period || 'daily';
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Get all transactions in the period
    const transactions = await prisma.transaction.findMany({
        where: {
            clientId,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: { date: 'asc' },
        select: {
            date: true,
            amount: true,
            balanceAfter: true
        }
    });

    // Group transactions by period
    const cashFlowData = groupTransactionsByPeriod(transactions, period);

    return cashFlowData;
};

/**
 * Get transaction category breakdown
 */
const getCategoryAnalytics = async (clientId: string, filters: AnalyticsFilter = {}) => {
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    const where = buildTransactionWhereClause(clientId, filters);

    // Get category breakdown with trend analysis
    const categoryData = await prisma.transaction.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } }
    });

    // Calculate total for percentages
    const totalAmount = categoryData.reduce((sum, item) => sum + Math.abs(item._sum.amount || 0), 0);

    // Get trend data (compare with previous period)
    const previousPeriodWhere = getPreviousPeriodWhere(clientId, filters);
    const previousCategoryData = await prisma.transaction.groupBy({
        by: ['category'],
        where: previousPeriodWhere,
        _sum: { amount: true }
    });

    // Create category map for trend comparison
    const previousCategoryMap = new Map();
    previousCategoryData.forEach(item => {
        previousCategoryMap.set(item.category, Math.abs(item._sum.amount || 0));
    });

    return categoryData.map(item => {
        const amount = Math.abs(item._sum.amount || 0);
        const previousAmount = previousCategoryMap.get(item.category) || 0;
        const trend =
            previousAmount > 0 ? (amount > previousAmount ? 'up' : amount < previousAmount ? 'down' : 'stable') : 'new';

        return {
            category: item.category || 'Uncategorized',
            amount,
            count: item._count,
            percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
            trend
        };
    });
};

/**
 * Get liquidity analysis
 */
const getLiquidityAnalytics = async (clientId: string) => {
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    // Get recent transactions to analyze balance patterns
    const recentTransactions = await prisma.transaction.findMany({
        where: { clientId },
        orderBy: { date: 'desc' },
        take: 90, // Last 90 transactions
        select: { balanceAfter: true, date: true, amount: true }
    });

    if (recentTransactions.length === 0) {
        return {
            averageBalance: 0,
            minimumBalance: 0,
            maximumBalance: 0,
            volatility: 0,
            idleDays: 0,
            liquidityScore: 0,
            thresholdExceeded: false,
            thresholdAmount: 0
        };
    }

    const balances = recentTransactions.map(t => t.balanceAfter || 0);
    const averageBalance = balances.reduce((sum, b) => sum + b, 0) / balances.length;
    const minimumBalance = Math.min(...balances);
    const maximumBalance = Math.max(...balances);

    // Calculate volatility (standard deviation / mean)
    const variance = balances.reduce((sum, b) => sum + Math.pow(b - averageBalance, 2), 0) / balances.length;
    const volatility = averageBalance > 0 ? Math.sqrt(variance) / averageBalance : 0;

    // Calculate idle days (days with high balance and low activity)
    const dailyBalances = groupBalancesByDay(recentTransactions);
    const idleDays = calculateIdleDays(dailyBalances);

    // Calculate liquidity score (0-10 scale)
    const liquidityScore = calculateLiquidityScore({
        averageBalance,
        minimumBalance,
        volatility,
        idleDays: idleDays.length
    });

    // Check threshold (arbitrary: 25,000)
    const thresholdAmount = 25000;
    const thresholdExceeded = minimumBalance < thresholdAmount;

    return {
        averageBalance,
        minimumBalance,
        maximumBalance,
        volatility: Math.round(volatility * 100) / 100,
        idleDays: idleDays.length,
        liquidityScore: Math.round(liquidityScore * 10) / 10,
        thresholdExceeded,
        thresholdAmount
    };
};

/**
 * Get spending patterns analysis
 */
const getSpendingPatterns = async (clientId: string) => {
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    // Get spending transactions (negative amounts)
    const spendingTransactions = await prisma.transaction.findMany({
        where: {
            clientId,
            amount: { lt: 0 } // Only outgoing transactions
        },
        select: {
            category: true,
            counterparty: true,
            amount: true,
            date: true,
            description: true,
            type: true
        }
    });

    // Group by category and analyze patterns
    const categoryPatterns = analyzeCategoryPatterns(spendingTransactions);

    return categoryPatterns;
};

/**
 * Get vendor analysis
 */
const getVendorAnalytics = async (clientId: string) => {
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    // Get vendor breakdown
    const vendorData = await prisma.transaction.groupBy({
        by: ['counterparty'],
        where: {
            clientId,
            counterparty: { not: null },
            amount: { lt: 0 } // Only spending
        },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'asc' } }, // Most spending first
        take: 50
    });

    // Get payment methods for each vendor
    const vendorAnalytics = await Promise.all(
        vendorData.map(async vendor => {
            const paymentMethods = await prisma.transaction.groupBy({
                by: ['type'],
                where: {
                    clientId,
                    counterparty: vendor.counterparty
                },
                _count: true
            });

            const totalAmount = Math.abs(vendor._sum.amount || 0);

            return {
                vendorName: vendor.counterparty || 'Unknown',
                totalAmount,
                transactionCount: vendor._count,
                percentage: 0, // Will be calculated after getting total
                paymentMethods: paymentMethods.map(pm => pm.type)
            };
        })
    );

    // Calculate percentages
    const totalSpending = vendorAnalytics.reduce((sum, v) => sum + v.totalAmount, 0);
    vendorAnalytics.forEach(vendor => {
        vendor.percentage = totalSpending > 0 ? (vendor.totalAmount / totalSpending) * 100 : 0;
    });

    return vendorAnalytics;
};

/**
 * Get trend analysis for specific metrics
 */
const getTrendAnalytics = async (clientId: string, metric: string, period: string = '12m') => {
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    const validMetrics = ['inflow', 'outflow', 'balance', 'transactions'];
    if (!validMetrics.includes(metric)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid metric');
    }

    // Parse period (e.g., '12m', '6m', '24m')
    const months = parseInt(period.replace('m', ''));
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await prisma.transaction.findMany({
        where: {
            clientId,
            date: { gte: startDate }
        },
        orderBy: { date: 'asc' },
        select: {
            date: true,
            amount: true,
            balanceAfter: true
        }
    });

    // Group by month and calculate trends
    const trendData = calculateTrendsByPeriod(transactions, metric, 'monthly');

    return trendData;
};

/**
 * Get complete analytics summary
 */
const getAnalyticsSummary = async (clientId: string, filters: AnalyticsFilter = {}) => {
    const [metrics, cashFlow, categories, liquidity, patterns, trends] = await Promise.all([
        getAnalyticsOverview(clientId, filters),
        getCashFlowAnalytics(clientId, { period: 'daily' }),
        getCategoryAnalytics(clientId, filters),
        getLiquidityAnalytics(clientId),
        getSpendingPatterns(clientId),
        Promise.all([
            getTrendAnalytics(clientId, 'inflow', '12m'),
            getTrendAnalytics(clientId, 'outflow', '12m'),
            getTrendAnalytics(clientId, 'balance', '12m')
        ])
    ]);

    return {
        metrics,
        cashFlow,
        categories,
        liquidity,
        patterns,
        trends: {
            inflow: trends[0],
            outflow: trends[1],
            balance: trends[2]
        }
    };
};

/**
 * Export analytics data in various formats
 */
const exportAnalyticsData = async (clientId: string, format: string, filters: AnalyticsFilter = {}) => {
    const validFormats = ['csv', 'pdf', 'excel', 'json'];
    if (!validFormats.includes(format.toLowerCase())) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid export format');
    }

    const summary = await getAnalyticsSummary(clientId, filters);

    // For this implementation, we'll return the data structure
    // In a real implementation, you would generate actual files
    switch (format.toLowerCase()) {
        case 'csv':
            return generateCSVData(summary);
        case 'pdf':
            return generatePDFData(summary);
        case 'excel':
            return generateExcelData(summary);
        default:
            return summary;
    }
};

/**
 * Get cash flow forecasting and predictive analytics
 */
const getForecastingAnalytics = async (
    clientId: string,
    forecastPeriod: string = '90d',
    confidenceLevel: number = 0.85
) => {
    // Verify client exists
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    // Parse forecast period
    const days = parseInt(forecastPeriod.replace('d', ''));
    if (isNaN(days) || days < 1 || days > 365) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid forecast period. Use format like "90d" (1-365 days)');
    }

    if (confidenceLevel < 0.1 || confidenceLevel > 1.0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Confidence level must be between 0.1 and 1.0');
    }

    // Get historical transaction data (last 6 months for analysis)
    const historicalStartDate = new Date();
    historicalStartDate.setMonth(historicalStartDate.getMonth() - 6);

    const historicalTransactions = await prisma.transaction.findMany({
        where: {
            clientId,
            date: { gte: historicalStartDate }
        },
        orderBy: { date: 'asc' },
        select: {
            date: true,
            amount: true,
            category: true,
            type: true
        }
    });

    // Generate forecast using simplified predictive model
    const forecast = generateCashFlowForecast(historicalTransactions, days, confidenceLevel);

    // Analyze seasonality patterns
    const seasonality = analyzeSeasonalPatterns(historicalTransactions);

    // Generate recommendations based on forecast
    const recommendations = generateForecastRecommendations(forecast, seasonality);

    return {
        forecast,
        seasonality,
        recommendations
    };
};

/**
 * Compare client metrics against industry benchmarks
 */
const getBenchmarkingAnalytics = async (clientId: string, industry?: string, businessSegment?: string) => {
    // Verify client exists and get client data
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: {
            id: true,
            name: true,
            industry: true,
            businessSegment: true
        }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    // Use provided industry/segment or fallback to client's data
    const targetIndustry = industry || client.industry;
    const targetSegment = businessSegment || client.businessSegment;

    // Get client's current metrics
    const clientMetrics = await getAnalyticsOverview(clientId);
    const liquidityData = await getLiquidityAnalytics(clientId);

    // Get industry benchmarks (in real implementation, this would come from external data sources)
    const industryBenchmarks = getIndustryBenchmarks(targetIndustry, targetSegment);

    // Calculate client's percentile ranking
    const percentileRank = calculatePercentileRank(clientMetrics, liquidityData, industryBenchmarks);

    // Generate comparison areas
    const comparisonAreas = generateBenchmarkComparisons(clientMetrics, liquidityData, industryBenchmarks);

    return {
        clientMetrics: {
            ...clientMetrics,
            liquidity: liquidityData
        },
        industryBenchmarks,
        percentileRank,
        comparisonAreas
    };
};

/**
 * Export analytics with enhanced formatting and templates
 */
const exportEnhancedAnalytics = async (
    clientId: string,
    format: string,
    template?: string,
    startDate?: string,
    endDate?: string,
    sections?: string[]
) => {
    const validFormats = ['csv', 'pdf', 'excel', 'json'];
    if (!validFormats.includes(format.toLowerCase())) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid export format');
    }

    const validTemplates = ['executive_summary', 'detailed_report', 'board_presentation', 'regulatory'];
    if (template && !validTemplates.includes(template)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Invalid template. Valid options: executive_summary, detailed_report, board_presentation, regulatory'
        );
    }

    // Parse date filters
    const filters: AnalyticsFilter = {};
    if (startDate) {
        filters.startDate = new Date(startDate);
    }
    if (endDate) {
        filters.endDate = new Date(endDate);
    }

    // Get comprehensive analytics data
    const [summary, forecasting, benchmarking] = await Promise.all([
        getAnalyticsSummary(clientId, filters),
        getForecastingAnalytics(clientId),
        getBenchmarkingAnalytics(clientId)
    ]);

    // Filter sections if specified
    const includedSections = sections || [
        'overview',
        'cashflow',
        'categories',
        'liquidity',
        'patterns',
        'trends',
        'forecasting',
        'benchmarking'
    ];

    const enhancedData = {
        metadata: {
            clientId,
            generatedAt: new Date().toISOString(),
            template: template || 'standard',
            format,
            sections: includedSections
        },
        summary: includedSections.includes('overview') ? summary.metrics : undefined,
        cashFlow: includedSections.includes('cashflow') ? summary.cashFlow : undefined,
        categories: includedSections.includes('categories') ? summary.categories : undefined,
        liquidity: includedSections.includes('liquidity') ? summary.liquidity : undefined,
        patterns: includedSections.includes('patterns') ? summary.patterns : undefined,
        trends: includedSections.includes('trends') ? summary.trends : undefined,
        forecasting: includedSections.includes('forecasting') ? forecasting : undefined,
        benchmarking: includedSections.includes('benchmarking') ? benchmarking : undefined
    };

    // Generate enhanced export based on format and template
    switch (format.toLowerCase()) {
        case 'excel':
            return generateEnhancedExcelData(enhancedData, template);
        case 'pdf':
            return generateEnhancedPDFData(enhancedData, template);
        case 'csv':
            return generateEnhancedCSVData(enhancedData);
        default:
            return enhancedData;
    }
};

/**
 * Get comprehensive dashboard data with KPIs and visualizations
 */
const getDashboard = async (clientId: string, dateRange: string = '30d', compareMode: string = 'previous') => {
    // Verify client exists
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    // Calculate date ranges
    const { currentPeriod, comparisonPeriod } = calculateDashboardDateRanges(dateRange, compareMode);

    // Get current period data
    const [metrics, cashFlowData, categoriesData] = await Promise.all([
        getAnalyticsOverview(clientId, {
            startDate: currentPeriod.startDate,
            endDate: currentPeriod.endDate
        }),
        getCashFlowAnalytics(clientId, {
            period: 'daily',
            startDate: currentPeriod.startDate,
            endDate: currentPeriod.endDate
        }),
        getCategoryAnalytics(clientId, {
            startDate: currentPeriod.startDate,
            endDate: currentPeriod.endDate
        })
    ]);

    // Get comparison data if compareMode is not 'none'
    let comparisonMetrics = null;
    if (compareMode !== 'none' && comparisonPeriod) {
        comparisonMetrics = await getAnalyticsOverview(clientId, {
            startDate: comparisonPeriod.startDate,
            endDate: comparisonPeriod.endDate
        });
    }

    // Generate KPIs with trends
    const kpis = generateDashboardKPIs(metrics, comparisonMetrics);

    // Generate chart data
    const charts = {
        cashFlow: cashFlowData.slice(-30), // Last 30 data points
        categories: categoriesData.slice(0, 10), // Top 10 categories
        trends: await getTrendAnalytics(clientId, 'balance', '3m') // 3 months balance trend
    };

    return {
        metrics,
        charts,
        kpis,
        period: {
            startDate: currentPeriod.startDate.toISOString(),
            endDate: currentPeriod.endDate.toISOString()
        }
    };
};

// Helper functions

const buildTransactionWhereClause = (clientId: string, filters: AnalyticsFilter): Prisma.TransactionWhereInput => {
    const where: Prisma.TransactionWhereInput = { clientId };

    if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
            where.date.gte = filters.startDate;
        }
        if (filters.endDate) {
            where.date.lte = filters.endDate;
        }
    }

    if (filters.accountId) {
        where.accountId = filters.accountId;
    }

    if (filters.categories && filters.categories.length > 0) {
        where.category = { in: filters.categories };
    }

    if (filters.transactionTypes && filters.transactionTypes.length > 0) {
        where.type = { in: filters.transactionTypes as any };
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.amount = {};
        if (filters.minAmount !== undefined) {
            where.amount.gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
            where.amount.lte = filters.maxAmount;
        }
    }

    return where;
};

const getPreviousPeriodWhere = (clientId: string, filters: AnalyticsFilter) => {
    const currentStart = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const currentEnd = filters.endDate || new Date();

    const periodLength = currentEnd.getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - periodLength);
    const previousEnd = new Date(currentStart);

    return buildTransactionWhereClause(clientId, {
        ...filters,
        startDate: previousStart,
        endDate: previousEnd
    });
};

const groupTransactionsByPeriod = (transactions: any[], period: string) => {
    const grouped = new Map();

    transactions.forEach(transaction => {
        let key: string;
        const date = new Date(transaction.date);

        switch (period) {
            case 'daily':
                key = date.toISOString().split('T')[0];
                break;
            case 'weekly':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
                break;
            case 'monthly':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
            case 'yearly':
                key = String(date.getFullYear());
                break;
            default:
                key = date.toISOString().split('T')[0];
        }

        if (!grouped.has(key)) {
            grouped.set(key, {
                date: key,
                inflow: 0,
                outflow: 0,
                balance: transaction.balanceAfter || 0,
                netFlow: 0
            });
        }

        const group = grouped.get(key);
        if (transaction.amount > 0) {
            group.inflow += transaction.amount;
        } else {
            group.outflow += Math.abs(transaction.amount);
        }
        group.netFlow = group.inflow - group.outflow;
        group.balance = transaction.balanceAfter || group.balance;
    });

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
};

const groupBalancesByDay = (transactions: any[]) => {
    const dailyBalances = new Map();

    transactions.forEach(t => {
        const day = new Date(t.date).toISOString().split('T')[0];
        if (!dailyBalances.has(day)) {
            dailyBalances.set(day, []);
        }
        dailyBalances.get(day).push({
            balance: t.balanceAfter || 0,
            amount: t.amount
        });
    });

    return Array.from(dailyBalances.entries()).map(([date, transactions]) => ({
        date,
        averageBalance: transactions.reduce((sum: number, t: any) => sum + t.balance, 0) / transactions.length,
        transactionCount: transactions.length,
        totalActivity: transactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)
    }));
};

const calculateIdleDays = (dailyBalances: any[]) => {
    const threshold = 1000; // Minimum activity threshold
    return dailyBalances.filter(
        day =>
            day.averageBalance > 50000 && // High balance
            day.totalActivity < threshold // Low activity
    );
};

const calculateLiquidityScore = (metrics: any) => {
    let score = 5; // Base score

    // Adjust for average balance
    if (metrics.averageBalance > 100000) score += 2;
    else if (metrics.averageBalance > 50000) score += 1;
    else if (metrics.averageBalance < 10000) score -= 2;

    // Adjust for volatility
    if (metrics.volatility < 0.1) score += 1;
    else if (metrics.volatility > 0.5) score -= 1;

    // Adjust for idle days
    if (metrics.idleDays > 10) score -= 1;
    else if (metrics.idleDays < 3) score += 1;

    return Math.max(0, Math.min(10, score));
};

const analyzeCategoryPatterns = (transactions: any[]) => {
    const categoryMap = new Map();

    transactions.forEach(t => {
        const category = t.category || 'Uncategorized';
        if (!categoryMap.has(category)) {
            categoryMap.set(category, {
                category,
                subcategory: category, // Simplified
                amounts: [],
                vendors: new Map(),
                paymentMethods: new Set()
            });
        }

        const categoryData = categoryMap.get(category);
        categoryData.amounts.push(Math.abs(t.amount));
        categoryData.paymentMethods.add(t.type);

        if (t.counterparty) {
            if (!categoryData.vendors.has(t.counterparty)) {
                categoryData.vendors.set(t.counterparty, {
                    vendorName: t.counterparty,
                    totalAmount: 0,
                    transactionCount: 0,
                    percentage: 0,
                    paymentMethods: new Set()
                });
            }

            const vendor = categoryData.vendors.get(t.counterparty);
            vendor.totalAmount += Math.abs(t.amount);
            vendor.transactionCount += 1;
            vendor.paymentMethods.add(t.type);
        }
    });

    return Array.from(categoryMap.values()).map(categoryData => {
        const amounts = categoryData.amounts;
        const averageAmount =
            amounts.length > 0 ? amounts.reduce((s: number, a: number) => s + a, 0) / amounts.length : 0;

        // Calculate frequency and seasonality (simplified)
        const frequency = amounts.length > 30 ? 'high' : amounts.length > 10 ? 'medium' : 'low';
        const seasonality = 'medium'; // Simplified - would need more complex analysis

        // Process vendors
        const totalCategoryAmount = Array.from(categoryData.vendors.values()).reduce(
            (sum: number, v: any) => sum + v.totalAmount,
            0
        );
        const vendors = Array.from(categoryData.vendors.values()).map((vendor: any) => ({
            vendorName: vendor.vendorName,
            totalAmount: vendor.totalAmount,
            transactionCount: vendor.transactionCount,
            percentage: totalCategoryAmount > 0 ? (vendor.totalAmount / totalCategoryAmount) * 100 : 0,
            paymentMethods: Array.from(vendor.paymentMethods)
        }));

        return {
            category: categoryData.category,
            subcategory: categoryData.subcategory,
            averageAmount,
            frequency,
            seasonality,
            vendors: vendors.sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5) // Top 5 vendors
        };
    });
};

const calculateTrendsByPeriod = (transactions: any[], metric: string, period: string) => {
    const grouped = groupTransactionsByPeriod(transactions, period);

    return grouped.map((current, index) => {
        const previous = index > 0 ? grouped[index - 1] : null;
        let value = 0;
        let change = 0;
        let changePercent = 0;

        switch (metric) {
            case 'inflow':
                value = current.inflow;
                change = previous ? value - previous.inflow : 0;
                changePercent = previous && previous.inflow > 0 ? (change / previous.inflow) * 100 : 0;
                break;
            case 'outflow':
                value = current.outflow;
                change = previous ? value - previous.outflow : 0;
                changePercent = previous && previous.outflow > 0 ? (change / previous.outflow) * 100 : 0;
                break;
            case 'balance':
                value = current.balance;
                change = previous ? value - previous.balance : 0;
                changePercent = previous && previous.balance > 0 ? (change / previous.balance) * 100 : 0;
                break;
            case 'transactions':
                // This would need additional data
                value = current.inflow + current.outflow;
                change = 0;
                changePercent = 0;
                break;
        }

        return {
            period: current.date,
            value: Math.round(value * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100
        };
    });
};

// Export format generators (simplified implementations)
const generateCSVData = (summary: any) => {
    return {
        format: 'csv',
        content: 'data:text/csv;base64,...', // Would contain actual CSV data
        summary
    };
};

const generatePDFData = (summary: any) => {
    return {
        format: 'pdf',
        content: 'data:application/pdf;base64,...', // Would contain actual PDF data
        summary
    };
};

const generateExcelData = (summary: any) => {
    return {
        format: 'excel',
        content: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,...', // Would contain actual Excel data
        summary
    };
};

// Dashboard helper functions
const calculateDashboardDateRanges = (dateRange: string, compareMode: string) => {
    const now = new Date();
    let currentPeriod = {
        startDate: new Date(),
        endDate: new Date(now)
    };

    // Calculate current period based on dateRange
    switch (dateRange) {
        case '7d':
            currentPeriod.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            currentPeriod.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            currentPeriod.startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '6m':
            currentPeriod.startDate = new Date(now);
            currentPeriod.startDate.setMonth(now.getMonth() - 6);
            break;
        case '1y':
            currentPeriod.startDate = new Date(now);
            currentPeriod.startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            currentPeriod.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let comparisonPeriod = null;
    if (compareMode !== 'none') {
        const periodLength = currentPeriod.endDate.getTime() - currentPeriod.startDate.getTime();
        if (compareMode === 'previous') {
            // Previous period of same length
            comparisonPeriod = {
                startDate: new Date(currentPeriod.startDate.getTime() - periodLength),
                endDate: new Date(currentPeriod.startDate)
            };
        } else if (compareMode === 'year_over_year') {
            // Same period last year
            comparisonPeriod = {
                startDate: new Date(currentPeriod.startDate),
                endDate: new Date(currentPeriod.endDate)
            };
            comparisonPeriod.startDate.setFullYear(comparisonPeriod.startDate.getFullYear() - 1);
            comparisonPeriod.endDate.setFullYear(comparisonPeriod.endDate.getFullYear() - 1);
        }
    }

    return { currentPeriod, comparisonPeriod };
};

const generateDashboardKPIs = (currentMetrics: any, comparisonMetrics: any = null) => {
    const kpis = [];

    // Net Cash Flow KPI
    const netCashFlowKPI = {
        name: 'Net Cash Flow',
        value: currentMetrics.netCashFlow,
        unit: 'USD',
        trend: 'stable',
        change: 0
    };

    if (comparisonMetrics) {
        const change = currentMetrics.netCashFlow - comparisonMetrics.netCashFlow;
        netCashFlowKPI.change = Math.round((change / Math.abs(comparisonMetrics.netCashFlow || 1)) * 100 * 100) / 100;
        netCashFlowKPI.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    }

    kpis.push(netCashFlowKPI);

    // Average Daily Balance KPI
    const avgBalanceKPI = {
        name: 'Average Daily Balance',
        value: currentMetrics.averageDailyBalance,
        unit: 'USD',
        trend: 'stable',
        change: 0
    };

    if (comparisonMetrics) {
        const change = currentMetrics.averageDailyBalance - comparisonMetrics.averageDailyBalance;
        avgBalanceKPI.change =
            Math.round((change / Math.abs(comparisonMetrics.averageDailyBalance || 1)) * 100 * 100) / 100;
        avgBalanceKPI.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    }

    kpis.push(avgBalanceKPI);

    // Liquidity Ratio KPI
    const liquidityKPI = {
        name: 'Liquidity Ratio',
        value: currentMetrics.liquidityRatio,
        unit: 'ratio',
        trend: 'stable',
        change: 0
    };

    if (comparisonMetrics) {
        const change = currentMetrics.liquidityRatio - comparisonMetrics.liquidityRatio;
        liquidityKPI.change = Math.round((change / Math.abs(comparisonMetrics.liquidityRatio || 1)) * 100 * 100) / 100;
        liquidityKPI.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    }

    kpis.push(liquidityKPI);

    // Total Inflow KPI
    const inflowKPI = {
        name: 'Total Inflow',
        value: currentMetrics.totalInflow,
        unit: 'USD',
        trend: 'stable',
        change: 0
    };

    if (comparisonMetrics) {
        const change = currentMetrics.totalInflow - comparisonMetrics.totalInflow;
        inflowKPI.change = Math.round((change / Math.abs(comparisonMetrics.totalInflow || 1)) * 100 * 100) / 100;
        inflowKPI.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    }

    kpis.push(inflowKPI);

    // Total Outflow KPI
    const outflowKPI = {
        name: 'Total Outflow',
        value: currentMetrics.totalOutflow,
        unit: 'USD',
        trend: 'stable',
        change: 0
    };

    if (comparisonMetrics) {
        const change = currentMetrics.totalOutflow - comparisonMetrics.totalOutflow;
        outflowKPI.change = Math.round((change / Math.abs(comparisonMetrics.totalOutflow || 1)) * 100 * 100) / 100;
        outflowKPI.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    }

    kpis.push(outflowKPI);

    // Transaction Count KPI
    const transactionKPI = {
        name: 'Transaction Count',
        value: currentMetrics.transactionCount,
        unit: 'count',
        trend: 'stable',
        change: 0
    };

    if (comparisonMetrics) {
        const change = currentMetrics.transactionCount - comparisonMetrics.transactionCount;
        transactionKPI.change =
            Math.round((change / Math.abs(comparisonMetrics.transactionCount || 1)) * 100 * 100) / 100;
        transactionKPI.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    }

    kpis.push(transactionKPI);

    return kpis;
};

// Helper functions for new analytics features

/**
 * Generate cash flow forecast using simplified predictive model
 */
const generateCashFlowForecast = (historicalData: any[], forecastDays: number, confidenceLevel: number) => {
    if (historicalData.length < 30) {
        // Not enough data for meaningful forecast
        return [];
    }

    // Group by day and calculate averages
    const dailyData = groupTransactionsByPeriod(historicalData, 'daily');

    // Calculate moving averages and trends
    const recentDays = dailyData.slice(-30); // Last 30 days
    const avgInflow = recentDays.reduce((sum, day) => sum + day.inflow, 0) / recentDays.length;
    const avgOutflow = recentDays.reduce((sum, day) => sum + day.outflow, 0) / recentDays.length;

    // Calculate trend (simplified linear regression)
    const inflowTrend = calculateTrend(recentDays.map((d, i) => ({ x: i, y: d.inflow })));
    const outflowTrend = calculateTrend(recentDays.map((d, i) => ({ x: i, y: d.outflow })));

    // Generate forecast for each day
    const forecast = [];
    const currentBalance = recentDays.length > 0 ? recentDays[recentDays.length - 1].balance : 0;
    let runningBalance = currentBalance;

    for (let day = 1; day <= forecastDays; day++) {
        // Apply trend and seasonality
        const seasonalFactor = getSeasonalFactor(day);
        const predictedInflow = Math.max(0, avgInflow + inflowTrend * day * seasonalFactor);
        const predictedOutflow = Math.max(0, avgOutflow + outflowTrend * day * seasonalFactor);

        runningBalance += predictedInflow - predictedOutflow;

        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + day);

        forecast.push({
            date: forecastDate.toISOString().split('T')[0],
            predictedInflow: Math.round(predictedInflow * 100) / 100,
            predictedOutflow: Math.round(predictedOutflow * 100) / 100,
            predictedBalance: Math.round(runningBalance * 100) / 100,
            confidence: Math.max(0.5, confidenceLevel - (day / forecastDays) * 0.3) // Confidence decreases over time
        });
    }

    return forecast;
};

/**
 * Analyze seasonal patterns in transaction data
 */
const analyzeSeasonalPatterns = (historicalData: any[]) => {
    const monthlyData = new Map();
    const weeklyData = new Map();

    historicalData.forEach(transaction => {
        const date = new Date(transaction.date);
        const month = date.getMonth();
        const dayOfWeek = date.getDay();

        // Monthly patterns
        if (!monthlyData.has(month)) {
            monthlyData.set(month, { inflow: 0, outflow: 0, count: 0 });
        }
        const monthData = monthlyData.get(month);
        if (transaction.amount > 0) {
            monthData.inflow += transaction.amount;
        } else {
            monthData.outflow += Math.abs(transaction.amount);
        }
        monthData.count += 1;

        // Weekly patterns
        if (!weeklyData.has(dayOfWeek)) {
            weeklyData.set(dayOfWeek, { inflow: 0, outflow: 0, count: 0 });
        }
        const weekData = weeklyData.get(dayOfWeek);
        if (transaction.amount > 0) {
            weekData.inflow += transaction.amount;
        } else {
            weekData.outflow += Math.abs(transaction.amount);
        }
        weekData.count += 1;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return {
        patterns: [
            {
                type: 'monthly',
                data: Array.from(monthlyData.entries()).map(([month, data]) => ({
                    period: monthNames[month],
                    avgInflow: data.count > 0 ? data.inflow / data.count : 0,
                    avgOutflow: data.count > 0 ? data.outflow / data.count : 0,
                    transactionCount: data.count
                }))
            },
            {
                type: 'weekly',
                data: Array.from(weeklyData.entries()).map(([day, data]) => ({
                    period: dayNames[day],
                    avgInflow: data.count > 0 ? data.inflow / data.count : 0,
                    avgOutflow: data.count > 0 ? data.outflow / data.count : 0,
                    transactionCount: data.count
                }))
            }
        ],
        factors: [
            {
                name: 'High Activity Months',
                description: 'Months with above-average transaction volume',
                value: Array.from(monthlyData.entries())
                    .filter(([, data]) => data.count > 0)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 3)
                    .map(([month]) => monthNames[month])
            },
            {
                name: 'High Activity Days',
                description: 'Days of week with above-average transaction volume',
                value: Array.from(weeklyData.entries())
                    .filter(([, data]) => data.count > 0)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 3)
                    .map(([day]) => dayNames[day])
            }
        ]
    };
};

/**
 * Generate recommendations based on forecast
 */
const generateForecastRecommendations = (forecast: any[], seasonality: any) => {
    const recommendations = [];

    if (forecast.length === 0) {
        return [
            'Insufficient historical data for detailed recommendations. Consider accumulating more transaction history.'
        ];
    }

    // Check for potential cash flow issues
    const lowBalanceDays = forecast.filter(day => day.predictedBalance < 10000);
    if (lowBalanceDays.length > 0) {
        recommendations.push(
            `Potential low balance periods detected in forecast. Consider establishing credit facilities or adjusting cash management strategy.`
        );
    }

    // Check for excess cash periods
    const highBalanceDays = forecast.filter(day => day.predictedBalance > 100000);
    if (highBalanceDays.length > forecast.length * 0.5) {
        recommendations.push(
            'Consistently high cash balances predicted. Consider investment options to optimize idle cash returns.'
        );
    }

    // Seasonality recommendations
    if (seasonality.factors.length > 0) {
        const highActivityMonths = seasonality.factors.find((f: any) => f.name === 'High Activity Months');
        if (highActivityMonths) {
            recommendations.push(
                `Plan for increased activity during ${highActivityMonths.value.join(', ')} based on historical patterns.`
            );
        }
    }

    // General recommendations
    const avgConfidence = forecast.reduce((sum, day) => sum + day.confidence, 0) / forecast.length;
    if (avgConfidence < 0.7) {
        recommendations.push(
            'Forecast confidence is moderate. Monitor actual performance closely and update predictions regularly.'
        );
    }

    return recommendations;
};

/**
 * Get industry benchmarks (mock implementation)
 */
const getIndustryBenchmarks = (industry: string, businessSegment: string) => {
    // In a real implementation, this would fetch from external benchmark databases
    const benchmarkData: { [key: string]: any } = {
        technology: {
            small: { liquidityRatio: 1.2, avgDailyBalance: 75000, volatility: 0.12 },
            medium: { liquidityRatio: 1.5, avgDailyBalance: 200000, volatility: 0.08 },
            large: { liquidityRatio: 2.0, avgDailyBalance: 500000, volatility: 0.06 }
        },
        manufacturing: {
            small: { liquidityRatio: 1.1, avgDailyBalance: 100000, volatility: 0.15 },
            medium: { liquidityRatio: 1.3, avgDailyBalance: 300000, volatility: 0.1 },
            large: { liquidityRatio: 1.8, avgDailyBalance: 750000, volatility: 0.07 }
        },
        retail: {
            small: { liquidityRatio: 0.9, avgDailyBalance: 50000, volatility: 0.2 },
            medium: { liquidityRatio: 1.1, avgDailyBalance: 150000, volatility: 0.15 },
            large: { liquidityRatio: 1.4, avgDailyBalance: 400000, volatility: 0.1 }
        }
    };

    return (
        benchmarkData[industry?.toLowerCase()]?.[businessSegment?.toLowerCase()] || {
            liquidityRatio: 1.2,
            avgDailyBalance: 150000,
            volatility: 0.12
        }
    );
};

/**
 * Calculate client's percentile rank against industry
 */
const calculatePercentileRank = (clientMetrics: any, liquidityData: any, benchmarks: any) => {
    let score = 0;
    let factors = 0;

    // Liquidity ratio comparison
    if (liquidityData.liquidityRatio >= benchmarks.liquidityRatio * 1.2) score += 25;
    else if (liquidityData.liquidityRatio >= benchmarks.liquidityRatio) score += 20;
    else if (liquidityData.liquidityRatio >= benchmarks.liquidityRatio * 0.8) score += 15;
    else score += 10;
    factors++;

    // Average balance comparison
    if (clientMetrics.averageDailyBalance >= benchmarks.avgDailyBalance * 1.5) score += 25;
    else if (clientMetrics.averageDailyBalance >= benchmarks.avgDailyBalance) score += 20;
    else if (clientMetrics.averageDailyBalance >= benchmarks.avgDailyBalance * 0.7) score += 15;
    else score += 10;
    factors++;

    // Volatility comparison (lower is better)
    if (liquidityData.volatility <= benchmarks.volatility * 0.7) score += 25;
    else if (liquidityData.volatility <= benchmarks.volatility) score += 20;
    else if (liquidityData.volatility <= benchmarks.volatility * 1.3) score += 15;
    else score += 10;
    factors++;

    return Math.round((score / factors / 25) * 100); // Convert to percentile
};

/**
 * Generate benchmark comparison areas
 */
const generateBenchmarkComparisons = (clientMetrics: any, liquidityData: any, benchmarks: any) => {
    return [
        {
            metric: 'Liquidity Ratio',
            clientValue: liquidityData.liquidityRatio,
            benchmarkValue: benchmarks.liquidityRatio,
            performance: liquidityData.liquidityRatio >= benchmarks.liquidityRatio ? 'above_average' : 'below_average'
        },
        {
            metric: 'Average Daily Balance',
            clientValue: clientMetrics.averageDailyBalance,
            benchmarkValue: benchmarks.avgDailyBalance,
            performance:
                clientMetrics.averageDailyBalance >= benchmarks.avgDailyBalance ? 'above_average' : 'below_average'
        },
        {
            metric: 'Balance Volatility',
            clientValue: liquidityData.volatility,
            benchmarkValue: benchmarks.volatility,
            performance: liquidityData.volatility <= benchmarks.volatility ? 'above_average' : 'below_average'
        }
    ];
};

// Enhanced export helper functions

/**
 * Generate enhanced Excel export
 */
const generateEnhancedExcelData = (data: any, template?: string) => {
    return {
        format: 'excel',
        template: template || 'standard',
        content: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,...',
        filename: `analytics-enhanced-${data.metadata.clientId}-${template || 'standard'}.xlsx`,
        data
    };
};

/**
 * Generate enhanced PDF export
 */
const generateEnhancedPDFData = (data: any, template?: string) => {
    return {
        format: 'pdf',
        template: template || 'standard',
        content: 'data:application/pdf;base64,...',
        filename: `analytics-enhanced-${data.metadata.clientId}-${template || 'standard'}.pdf`,
        data
    };
};

/**
 * Generate enhanced CSV export
 */
const generateEnhancedCSVData = (data: any) => {
    return {
        format: 'csv',
        content: 'data:text/csv;base64,...',
        filename: `analytics-enhanced-${data.metadata.clientId}.csv`,
        data
    };
};

// Math helper functions

/**
 * Calculate trend using simple linear regression
 */
const calculateTrend = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return 0;

    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
};

/**
 * Get seasonal factor for a given day
 */
const getSeasonalFactor = (dayOffset: number) => {
    // Simple seasonal model - could be made more sophisticated
    const weekCycle = Math.sin((dayOffset * 2 * Math.PI) / 7) * 0.1; // Weekly cycle
    const monthCycle = Math.sin((dayOffset * 2 * Math.PI) / 30) * 0.05; // Monthly cycle
    return 1 + weekCycle + monthCycle;
};

export default {
    getAnalyticsOverview,
    getCashFlowAnalytics,
    getCategoryAnalytics,
    getLiquidityAnalytics,
    getSpendingPatterns,
    getVendorAnalytics,
    getTrendAnalytics,
    getAnalyticsSummary,
    exportAnalyticsData,
    getDashboard,
    getForecastingAnalytics,
    getBenchmarkingAnalytics,
    exportEnhancedAnalytics
};

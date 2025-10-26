import prisma from "../client.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from 'http-status';
/**
 * Get comprehensive analytics overview for a client
 */
const getAnalyticsOverview = async (clientId, filters = {}) => {
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
    const averageDailyBalance = latestTransactions.length > 0
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
const getCashFlowAnalytics = async (clientId, options = {}) => {
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
const getCategoryAnalytics = async (clientId, filters = {}) => {
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
        const trend = previousAmount > 0 ? (amount > previousAmount ? 'up' : amount < previousAmount ? 'down' : 'stable') : 'new';
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
const getLiquidityAnalytics = async (clientId) => {
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
const getSpendingPatterns = async (clientId) => {
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
const getVendorAnalytics = async (clientId) => {
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
    const vendorAnalytics = await Promise.all(vendorData.map(async (vendor) => {
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
    }));
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
const getTrendAnalytics = async (clientId, metric, period = '12m') => {
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
const getAnalyticsSummary = async (clientId, filters = {}) => {
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
const exportAnalyticsData = async (clientId, format, filters = {}) => {
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
 * Get comprehensive dashboard data with KPIs and visualizations
 */
const getDashboard = async (clientId, dateRange = '30d', compareMode = 'previous') => {
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
const buildTransactionWhereClause = (clientId, filters) => {
    const where = { clientId };
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
        where.type = { in: filters.transactionTypes };
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
const getPreviousPeriodWhere = (clientId, filters) => {
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
const groupTransactionsByPeriod = (transactions, period) => {
    const grouped = new Map();
    transactions.forEach(transaction => {
        let key;
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
        }
        else {
            group.outflow += Math.abs(transaction.amount);
        }
        group.netFlow = group.inflow - group.outflow;
        group.balance = transaction.balanceAfter || group.balance;
    });
    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
};
const groupBalancesByDay = (transactions) => {
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
        averageBalance: transactions.reduce((sum, t) => sum + t.balance, 0) / transactions.length,
        transactionCount: transactions.length,
        totalActivity: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    }));
};
const calculateIdleDays = (dailyBalances) => {
    const threshold = 1000; // Minimum activity threshold
    return dailyBalances.filter(day => day.averageBalance > 50000 && // High balance
        day.totalActivity < threshold // Low activity
    );
};
const calculateLiquidityScore = (metrics) => {
    let score = 5; // Base score
    // Adjust for average balance
    if (metrics.averageBalance > 100000)
        score += 2;
    else if (metrics.averageBalance > 50000)
        score += 1;
    else if (metrics.averageBalance < 10000)
        score -= 2;
    // Adjust for volatility
    if (metrics.volatility < 0.1)
        score += 1;
    else if (metrics.volatility > 0.5)
        score -= 1;
    // Adjust for idle days
    if (metrics.idleDays > 10)
        score -= 1;
    else if (metrics.idleDays < 3)
        score += 1;
    return Math.max(0, Math.min(10, score));
};
const analyzeCategoryPatterns = (transactions) => {
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
        const averageAmount = amounts.length > 0 ? amounts.reduce((s, a) => s + a, 0) / amounts.length : 0;
        // Calculate frequency and seasonality (simplified)
        const frequency = amounts.length > 30 ? 'high' : amounts.length > 10 ? 'medium' : 'low';
        const seasonality = 'medium'; // Simplified - would need more complex analysis
        // Process vendors
        const totalCategoryAmount = Array.from(categoryData.vendors.values()).reduce((sum, v) => sum + v.totalAmount, 0);
        const vendors = Array.from(categoryData.vendors.values()).map((vendor) => ({
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
const calculateTrendsByPeriod = (transactions, metric, period) => {
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
const generateCSVData = (summary) => {
    return {
        format: 'csv',
        content: 'data:text/csv;base64,...', // Would contain actual CSV data
        summary
    };
};
const generatePDFData = (summary) => {
    return {
        format: 'pdf',
        content: 'data:application/pdf;base64,...', // Would contain actual PDF data
        summary
    };
};
const generateExcelData = (summary) => {
    return {
        format: 'excel',
        content: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,...', // Would contain actual Excel data
        summary
    };
};
// Dashboard helper functions
const calculateDashboardDateRanges = (dateRange, compareMode) => {
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
        }
        else if (compareMode === 'year_over_year') {
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
const generateDashboardKPIs = (currentMetrics, comparisonMetrics = null) => {
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
    getDashboard
};

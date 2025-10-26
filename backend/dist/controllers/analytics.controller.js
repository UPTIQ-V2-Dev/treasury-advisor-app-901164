import { analyticsService } from "../services/index.js";
import catchAsyncWithAuth from "../utils/catchAsyncWithAuth.js";
import pick from "../utils/pick.js";
const getAnalyticsOverview = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const filters = pick(req.validatedQuery, [
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
    const overview = await analyticsService.getAnalyticsOverview(clientId, filters);
    res.send(overview);
});
const getCashFlowAnalytics = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const options = pick(req.validatedQuery, ['period', 'startDate', 'endDate']);
    // Convert date strings to Date objects
    if (options.startDate && typeof options.startDate === 'string') {
        options.startDate = new Date(options.startDate);
    }
    if (options.endDate && typeof options.endDate === 'string') {
        options.endDate = new Date(options.endDate);
    }
    const cashFlow = await analyticsService.getCashFlowAnalytics(clientId, options);
    res.send(cashFlow);
});
const getCategoryAnalytics = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const filters = pick(req.validatedQuery, ['startDate', 'endDate']);
    // Convert date strings to Date objects
    if (filters.startDate && typeof filters.startDate === 'string') {
        filters.startDate = new Date(filters.startDate);
    }
    if (filters.endDate && typeof filters.endDate === 'string') {
        filters.endDate = new Date(filters.endDate);
    }
    const categories = await analyticsService.getCategoryAnalytics(clientId, filters);
    res.send(categories);
});
const getLiquidityAnalytics = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const liquidity = await analyticsService.getLiquidityAnalytics(clientId);
    res.send(liquidity);
});
const getSpendingPatterns = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const patterns = await analyticsService.getSpendingPatterns(clientId);
    res.send(patterns);
});
const getAnalyticsSummary = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const filters = pick(req.validatedQuery, ['startDate', 'endDate']);
    // Convert date strings to Date objects
    if (filters.startDate && typeof filters.startDate === 'string') {
        filters.startDate = new Date(filters.startDate);
    }
    if (filters.endDate && typeof filters.endDate === 'string') {
        filters.endDate = new Date(filters.endDate);
    }
    const summary = await analyticsService.getAnalyticsSummary(clientId, filters);
    res.send(summary);
});
const exportAnalyticsData = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const { format } = req.validatedQuery;
    const filters = pick(req.validatedQuery, ['startDate', 'endDate']);
    // Convert date strings to Date objects
    if (filters.startDate && typeof filters.startDate === 'string') {
        filters.startDate = new Date(filters.startDate);
    }
    if (filters.endDate && typeof filters.endDate === 'string') {
        filters.endDate = new Date(filters.endDate);
    }
    const exportData = await analyticsService.exportAnalyticsData(clientId, format, filters);
    // Set appropriate headers based on format
    switch (format.toLowerCase()) {
        case 'csv':
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="analytics-${clientId}.csv"`);
            break;
        case 'pdf':
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="analytics-${clientId}.pdf"`);
            break;
        case 'excel':
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="analytics-${clientId}.xlsx"`);
            break;
        default:
            res.setHeader('Content-Type', 'application/json');
    }
    res.send(exportData);
});
const getVendorAnalytics = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const vendors = await analyticsService.getVendorAnalytics(clientId);
    res.send(vendors);
});
const getTrendAnalytics = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const { metric, period } = req.validatedQuery;
    const trends = await analyticsService.getTrendAnalytics(clientId, metric, period);
    res.send(trends);
});
const getDashboard = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const { dateRange, compareMode } = req.validatedQuery;
    const dashboard = await analyticsService.getDashboard(clientId, dateRange, compareMode);
    res.send(dashboard);
});
const getForecastingAnalytics = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const { forecastPeriod, confidenceLevel } = req.validatedQuery;
    const forecasting = await analyticsService.getForecastingAnalytics(clientId, forecastPeriod, confidenceLevel);
    res.send(forecasting);
});
const getBenchmarkingAnalytics = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const { industry, businessSegment } = req.validatedQuery;
    const benchmarking = await analyticsService.getBenchmarkingAnalytics(clientId, industry, businessSegment);
    res.send(benchmarking);
});
const exportEnhancedAnalytics = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const { format, template, startDate, endDate, sections } = req.validatedQuery;
    const exportData = await analyticsService.exportEnhancedAnalytics(clientId, format, template, startDate, endDate, sections);
    // Set appropriate headers based on format
    const filename = exportData.filename;
    switch (format?.toLowerCase()) {
        case 'csv':
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename || `analytics-enhanced-${clientId}.csv`}"`);
            break;
        case 'pdf':
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename || `analytics-enhanced-${clientId}.pdf`}"`);
            break;
        case 'excel':
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename || `analytics-enhanced-${clientId}.xlsx`}"`);
            break;
        default:
            res.setHeader('Content-Type', 'application/json');
    }
    res.send(exportData);
});
export default {
    getAnalyticsOverview,
    getCashFlowAnalytics,
    getCategoryAnalytics,
    getLiquidityAnalytics,
    getSpendingPatterns,
    getAnalyticsSummary,
    exportAnalyticsData,
    getVendorAnalytics,
    getTrendAnalytics,
    getDashboard,
    getForecastingAnalytics,
    getBenchmarkingAnalytics,
    exportEnhancedAnalytics
};

import { TransactionType } from '../generated/prisma/index.js';
import Joi from 'joi';

const clientIdParams = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    })
};

const analyticsFilters = {
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    categories: Joi.array().items(Joi.string()),
    transactionTypes: Joi.array().items(Joi.string().valid(...Object.values(TransactionType))),
    minAmount: Joi.number(),
    maxAmount: Joi.number().greater(Joi.ref('minAmount'))
};

const getAnalyticsOverview = {
    ...clientIdParams,
    query: Joi.object().keys(analyticsFilters)
};

const getCashFlowAnalytics = {
    ...clientIdParams,
    query: Joi.object().keys({
        period: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').default('daily'),
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().greater(Joi.ref('startDate'))
    })
};

const getCategoryAnalytics = {
    ...clientIdParams,
    query: Joi.object().keys({
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().greater(Joi.ref('startDate'))
    })
};

const getLiquidityAnalytics = {
    ...clientIdParams
};

const getSpendingPatterns = {
    ...clientIdParams
};

const getAnalyticsSummary = {
    ...clientIdParams,
    query: Joi.object().keys({
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().greater(Joi.ref('startDate'))
    })
};

const exportAnalyticsData = {
    ...clientIdParams,
    query: Joi.object().keys({
        format: Joi.string().valid('csv', 'pdf', 'excel', 'json').required(),
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().greater(Joi.ref('startDate'))
    })
};

const getVendorAnalytics = {
    ...clientIdParams
};

const getTrendAnalytics = {
    ...clientIdParams,
    query: Joi.object().keys({
        metric: Joi.string().valid('inflow', 'outflow', 'balance', 'transactions').required(),
        period: Joi.string().valid('3m', '6m', '12m', '24m').default('12m')
    })
};

const getDashboard = {
    ...clientIdParams,
    query: Joi.object().keys({
        dateRange: Joi.string().valid('7d', '30d', '90d', '6m', '1y').default('30d'),
        compareMode: Joi.string().valid('previous', 'year_over_year', 'none').default('previous')
    })
};

const getForecastingAnalytics = {
    ...clientIdParams,
    query: Joi.object().keys({
        forecastPeriod: Joi.string()
            .regex(/^\d+d$/)
            .default('90d')
            .description('Forecast period in days (e.g., "90d")'),
        confidenceLevel: Joi.number().min(0.1).max(1.0).default(0.85).description('Confidence level (0.1-1.0)')
    })
};

const getBenchmarkingAnalytics = {
    ...clientIdParams,
    query: Joi.object().keys({
        industry: Joi.string()
            .optional()
            .description('Industry for benchmarking (optional, defaults to client industry)'),
        businessSegment: Joi.string()
            .optional()
            .description('Business segment for benchmarking (optional, defaults to client segment)')
    })
};

const exportEnhancedAnalytics = {
    ...clientIdParams,
    query: Joi.object().keys({
        format: Joi.string().valid('csv', 'pdf', 'excel', 'json').required(),
        template: Joi.string()
            .valid('executive_summary', 'detailed_report', 'board_presentation', 'regulatory')
            .optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional(),
        sections: Joi.array()
            .items(
                Joi.string().valid(
                    'overview',
                    'cashflow',
                    'categories',
                    'liquidity',
                    'patterns',
                    'trends',
                    'forecasting',
                    'benchmarking'
                )
            )
            .optional()
            .description('Sections to include in export')
    })
};

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

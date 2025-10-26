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
    getDashboard
};

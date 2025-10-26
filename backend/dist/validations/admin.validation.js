import Joi from 'joi';
const getSystemHealth = {
// No parameters required
};
const getSystemLogs = {
    query: Joi.object().keys({
        level: Joi.string().valid('error', 'warn', 'info', 'debug'),
        service: Joi.string(),
        startTime: Joi.date().iso(),
        endTime: Joi.date().iso(),
        limit: Joi.number().integer().min(1).max(1000).default(100),
        page: Joi.number().integer().min(1).default(1)
    })
};
const createMaintenanceTask = {
    body: Joi.object().keys({
        operation: Joi.string().required().valid('database_cleanup', 'cache_clear', 'index_rebuild'),
        parameters: Joi.object().optional()
    })
};
const getMaintenanceTask = {
    params: Joi.object().keys({
        taskId: Joi.string().uuid().required()
    })
};
const getUsageAnalytics = {
    query: Joi.object().keys({
        period: Joi.string().valid('24h', '7d', '30d', '90d').default('7d'),
        granularity: Joi.string().valid('hour', 'day', 'week', 'month').default('day')
    })
};
export default {
    getSystemHealth,
    getSystemLogs,
    createMaintenanceTask,
    getMaintenanceTask,
    getUsageAnalytics
};

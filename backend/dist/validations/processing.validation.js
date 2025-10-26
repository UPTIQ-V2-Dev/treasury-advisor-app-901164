import { TaskType } from '../generated/prisma/index.js';
import Joi from 'joi';
const getTaskById = {
    params: Joi.object().keys({
        taskId: Joi.string().required()
    })
};
const getClientTasks = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    })
};
const startProcessing = {
    body: Joi.object().keys({
        clientId: Joi.string().uuid().required(),
        type: Joi.string()
            .valid(...Object.values(TaskType))
            .required(),
        options: Joi.object()
            .keys({
            statementId: Joi.string().uuid(),
            includeRecommendations: Joi.boolean(),
            analysisDepth: Joi.string().valid('basic', 'detailed', 'comprehensive'),
            dateRange: Joi.object().keys({
                startDate: Joi.date().iso(),
                endDate: Joi.date().iso().min(Joi.ref('startDate'))
            }),
            categories: Joi.array().items(Joi.string()),
            priority: Joi.string().valid('low', 'medium', 'high')
        })
            .optional()
    })
};
const cancelTask = {
    params: Joi.object().keys({
        taskId: Joi.string().required()
    })
};
const retryTask = {
    params: Joi.object().keys({
        taskId: Joi.string().required()
    })
};
const getMetrics = {
// No parameters needed for metrics endpoint
};
const getClientHistory = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    }),
    query: Joi.object().keys({
        limit: Joi.number().integer().min(1).max(100).default(10),
        offset: Joi.number().integer().min(0).default(0)
    })
};
const getTaskLogs = {
    params: Joi.object().keys({
        taskId: Joi.string().required()
    }),
    query: Joi.object().keys({
        level: Joi.string().valid('debug', 'info', 'warn', 'error').optional()
    })
};
const getTaskStream = {
    params: Joi.object().keys({
        taskId: Joi.string().required()
    })
};
export default {
    getTaskById,
    getClientTasks,
    startProcessing,
    cancelTask,
    retryTask,
    getMetrics,
    getClientHistory,
    getTaskLogs,
    getTaskStream
};

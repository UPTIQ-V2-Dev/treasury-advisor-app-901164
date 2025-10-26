import {
    WorkflowActivityType,
    WorkflowTaskPriority,
    WorkflowTaskStatus,
    WorkflowTaskType
} from '../generated/prisma/index.js';
import Joi from 'joi';

const getWorkflowTasks = {
    query: Joi.object().keys({
        status: Joi.string().valid(...Object.values(WorkflowTaskStatus)),
        type: Joi.string().valid(...Object.values(WorkflowTaskType)),
        assignedTo: Joi.string(),
        clientId: Joi.string(),
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        sortBy: Joi.string(),
        sortType: Joi.string().valid('asc', 'desc')
    })
};

const completeWorkflowTask = {
    params: Joi.object().keys({
        taskId: Joi.string().required()
    }),
    body: Joi.object().keys({
        resolution: Joi.string().required(),
        comments: Joi.string(),
        attachments: Joi.array().items(Joi.string())
    })
};

const getWorkflowAudit = {
    params: Joi.object().keys({
        clientId: Joi.string().required()
    }),
    query: Joi.object().keys({
        startDate: Joi.string().isoDate(),
        endDate: Joi.string().isoDate(),
        activityType: Joi.string().valid(...Object.values(WorkflowActivityType)),
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        sortBy: Joi.string(),
        sortType: Joi.string().valid('asc', 'desc')
    })
};

const createWorkflowTask = {
    body: Joi.object().keys({
        type: Joi.string()
            .required()
            .valid(...Object.values(WorkflowTaskType)),
        priority: Joi.string().valid(...Object.values(WorkflowTaskPriority)),
        clientId: Joi.string().required(),
        clientName: Joi.string().required(),
        assignedTo: Joi.string().required(),
        dueDate: Joi.string().isoDate(),
        metadata: Joi.object()
    })
};

export default {
    getWorkflowTasks,
    completeWorkflowTask,
    getWorkflowAudit,
    createWorkflowTask
};

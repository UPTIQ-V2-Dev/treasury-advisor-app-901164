import { workflowService } from "../services/index.js";
import pick from "../utils/pick.js";
import { z } from 'zod';
// Schema definitions
const workflowTaskSchema = z.object({
    id: z.string(),
    type: z.enum(['RECOMMENDATION_APPROVAL', 'CLIENT_REVIEW', 'STATEMENT_REVIEW', 'RISK_ASSESSMENT', 'GENERAL_TASK']),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    clientId: z.string(),
    clientName: z.string(),
    assignedTo: z.string(),
    createdAt: z.string(),
    dueDate: z.string().nullable(),
    metadata: z.any().nullable(),
    resolution: z.string().nullable(),
    comments: z.string().nullable(),
    completedAt: z.string().nullable(),
    completedBy: z.string().nullable(),
    updatedAt: z.string(),
    client: z
        .object({
        id: z.string(),
        name: z.string(),
        businessType: z.string(),
        industry: z.string(),
        riskProfile: z.string()
    })
        .optional()
});
const workflowAuditSchema = z.object({
    id: z.string(),
    timestamp: z.string(),
    activityType: z.enum([
        'TASK_CREATED',
        'TASK_ASSIGNED',
        'TASK_COMPLETED',
        'RECOMMENDATION_APPROVED',
        'RECOMMENDATION_REJECTED',
        'CLIENT_UPDATED',
        'STATEMENT_PROCESSED'
    ]),
    userId: z.string(),
    userName: z.string(),
    description: z.string(),
    changes: z.array(z.any()),
    metadata: z.any().nullable(),
    clientId: z.string(),
    client: z
        .object({
        id: z.string(),
        name: z.string(),
        businessType: z.string(),
        industry: z.string()
    })
        .optional()
});
const getWorkflowTasksTool = {
    id: 'workflow_get_tasks',
    name: 'Get Workflow Tasks',
    description: 'Get workflow tasks with optional filtering by status, type, assigned user, and client',
    inputSchema: z.object({
        status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
        type: z
            .enum(['RECOMMENDATION_APPROVAL', 'CLIENT_REVIEW', 'STATEMENT_REVIEW', 'RISK_ASSESSMENT', 'GENERAL_TASK'])
            .optional(),
        assignedTo: z.string().optional(),
        clientId: z.string().optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        sortBy: z.string().optional(),
        sortType: z.enum(['asc', 'desc']).optional()
    }),
    outputSchema: z.array(workflowTaskSchema),
    fn: async (inputs) => {
        const filter = pick(inputs, ['status', 'type', 'assignedTo', 'clientId']);
        const options = pick(inputs, ['page', 'limit', 'sortBy', 'sortType']);
        return await workflowService.getWorkflowTasks(filter, options);
    }
};
const getWorkflowTaskByIdTool = {
    id: 'workflow_get_task_by_id',
    name: 'Get Workflow Task By ID',
    description: 'Get a specific workflow task by ID with client details',
    inputSchema: z.object({
        taskId: z.string().uuid()
    }),
    outputSchema: workflowTaskSchema,
    fn: async (inputs) => {
        const task = await workflowService.getWorkflowTaskById(inputs.taskId);
        if (!task) {
            throw new Error('Workflow task not found');
        }
        return task;
    }
};
const completeWorkflowTaskTool = {
    id: 'workflow_complete_task',
    name: 'Complete Workflow Task',
    description: 'Complete a workflow task with resolution and optional comments',
    inputSchema: z.object({
        taskId: z.string().uuid(),
        resolution: z.string(),
        comments: z.string().optional(),
        attachments: z.array(z.string()).optional(),
        userId: z.string(),
        userName: z.string()
    }),
    outputSchema: z.object({
        task: workflowTaskSchema,
        nextSteps: z.array(z.object({
            type: z.string(),
            assignedTo: z.string().optional(),
            dueDate: z.string().optional(),
            description: z.string().optional()
        })),
        notifications: z.array(z.object({
            type: z.string(),
            recipient: z.string(),
            message: z.string()
        }))
    }),
    fn: async (inputs) => {
        const completionData = {
            resolution: inputs.resolution,
            comments: inputs.comments,
            attachments: inputs.attachments
        };
        return await workflowService.completeWorkflowTask(inputs.taskId, completionData, inputs.userId, inputs.userName);
    }
};
const createWorkflowTaskTool = {
    id: 'workflow_create_task',
    name: 'Create Workflow Task',
    description: 'Create a new workflow task for approval or review processes',
    inputSchema: z.object({
        type: z.enum([
            'RECOMMENDATION_APPROVAL',
            'CLIENT_REVIEW',
            'STATEMENT_REVIEW',
            'RISK_ASSESSMENT',
            'GENERAL_TASK'
        ]),
        priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
        clientId: z.string().uuid(),
        clientName: z.string(),
        assignedTo: z.string(),
        dueDate: z.string().datetime().optional(),
        metadata: z.any().optional()
    }),
    outputSchema: workflowTaskSchema,
    fn: async (inputs) => {
        const taskData = {
            type: inputs.type,
            priority: inputs.priority,
            clientId: inputs.clientId,
            clientName: inputs.clientName,
            assignedTo: inputs.assignedTo,
            dueDate: inputs.dueDate ? new Date(inputs.dueDate) : undefined,
            metadata: inputs.metadata
        };
        return await workflowService.createWorkflowTask(taskData);
    }
};
const getWorkflowAuditTool = {
    id: 'workflow_get_audit',
    name: 'Get Workflow Audit Trail',
    description: 'Get workflow audit trail for a client with optional filtering',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        activityType: z
            .enum([
            'TASK_CREATED',
            'TASK_ASSIGNED',
            'TASK_COMPLETED',
            'RECOMMENDATION_APPROVED',
            'RECOMMENDATION_REJECTED',
            'CLIENT_UPDATED',
            'STATEMENT_PROCESSED'
        ])
            .optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        sortBy: z.string().optional(),
        sortType: z.enum(['asc', 'desc']).optional()
    }),
    outputSchema: z.array(workflowAuditSchema),
    fn: async (inputs) => {
        const filter = pick(inputs, ['startDate', 'endDate', 'activityType']);
        const options = pick(inputs, ['page', 'limit', 'sortBy', 'sortType']);
        return await workflowService.getWorkflowAudit(inputs.clientId, filter, options);
    }
};
const createWorkflowAuditTool = {
    id: 'workflow_create_audit',
    name: 'Create Workflow Audit Entry',
    description: 'Create a workflow audit trail entry for tracking activities',
    inputSchema: z.object({
        activityType: z.enum([
            'TASK_CREATED',
            'TASK_ASSIGNED',
            'TASK_COMPLETED',
            'RECOMMENDATION_APPROVED',
            'RECOMMENDATION_REJECTED',
            'CLIENT_UPDATED',
            'STATEMENT_PROCESSED'
        ]),
        userId: z.string(),
        userName: z.string(),
        description: z.string(),
        changes: z.array(z.object({
            field: z.string(),
            oldValue: z.any(),
            newValue: z.any()
        })),
        metadata: z.any().optional(),
        clientId: z.string().uuid()
    }),
    outputSchema: workflowAuditSchema,
    fn: async (inputs) => {
        return await workflowService.createAuditEntry({
            activityType: inputs.activityType,
            userId: inputs.userId,
            userName: inputs.userName,
            description: inputs.description,
            changes: inputs.changes,
            metadata: inputs.metadata,
            clientId: inputs.clientId
        });
    }
};
export const workflowTools = [
    getWorkflowTasksTool,
    getWorkflowTaskByIdTool,
    completeWorkflowTaskTool,
    createWorkflowTaskTool,
    getWorkflowAuditTool,
    createWorkflowAuditTool
];

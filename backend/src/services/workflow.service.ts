import prisma from '../client.ts';
import {
    Prisma,
    WorkflowActivityType,
    WorkflowAudit,
    WorkflowTask,
    WorkflowTaskPriority,
    WorkflowTaskStatus,
    WorkflowTaskType
} from '../generated/prisma/index.js';
import ApiError from '../utils/ApiError.ts';
import httpStatus from 'http-status';

/**
 * Get workflow tasks for a user with filters
 * @param {Object} filter - Filter options
 * @param {Object} options - Query options
 * @returns {Promise<WorkflowTask[]>}
 */
const getWorkflowTasks = async (
    filter: {
        status?: WorkflowTaskStatus;
        type?: WorkflowTaskType;
        assignedTo?: string;
        clientId?: string;
    },
    options: {
        limit?: number;
        page?: number;
        sortBy?: string;
        sortType?: 'asc' | 'desc';
    } = {}
): Promise<WorkflowTask[]> => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';

    const where: Prisma.WorkflowTaskWhereInput = {};

    if (filter.status) {
        where.status = filter.status;
    }
    if (filter.type) {
        where.type = filter.type;
    }
    if (filter.assignedTo) {
        where.assignedTo = filter.assignedTo;
    }
    if (filter.clientId) {
        where.clientId = filter.clientId;
    }

    const tasks = await prisma.workflowTask.findMany({
        where,
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    businessType: true,
                    industry: true,
                    riskProfile: true
                }
            }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType }
    });

    return tasks;
};

/**
 * Get workflow task by ID
 * @param {string} taskId
 * @returns {Promise<WorkflowTask | null>}
 */
const getWorkflowTaskById = async (taskId: string): Promise<WorkflowTask | null> => {
    return await prisma.workflowTask.findUnique({
        where: { id: taskId },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    businessType: true,
                    industry: true,
                    riskProfile: true
                }
            }
        }
    });
};

/**
 * Complete a workflow task
 * @param {string} taskId
 * @param {Object} completionData
 * @param {string} userId
 * @param {string} userName
 * @returns {Promise<Object>}
 */
const completeWorkflowTask = async (
    taskId: string,
    completionData: {
        resolution: string;
        comments?: string;
        attachments?: string[];
    },
    userId: string,
    userName: string
): Promise<{
    task: WorkflowTask;
    nextSteps: Array<{
        type: string;
        assignedTo?: string;
        dueDate?: string;
        description?: string;
    }>;
    notifications: Array<{
        type: string;
        recipient: string;
        message: string;
    }>;
}> => {
    const task = await getWorkflowTaskById(taskId);
    if (!task) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Workflow task not found');
    }

    if (task.status === WorkflowTaskStatus.COMPLETED || task.status === WorkflowTaskStatus.CANCELLED) {
        throw new ApiError(httpStatus.CONFLICT, 'Task cannot be completed');
    }

    // Update the task
    const updatedTask = await prisma.workflowTask.update({
        where: { id: taskId },
        data: {
            status: WorkflowTaskStatus.COMPLETED,
            resolution: completionData.resolution,
            comments: completionData.comments,
            completedAt: new Date(),
            completedBy: userId
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    businessType: true,
                    industry: true,
                    riskProfile: true
                }
            }
        }
    });

    // Create audit trail entry
    await createAuditEntry({
        activityType: WorkflowActivityType.TASK_COMPLETED,
        userId,
        userName,
        description: `Completed ${task.type.toLowerCase().replace('_', ' ')} task for ${task.clientName}`,
        changes: [
            {
                field: 'status',
                oldValue: task.status,
                newValue: WorkflowTaskStatus.COMPLETED
            },
            {
                field: 'resolution',
                oldValue: null,
                newValue: completionData.resolution
            }
        ],
        metadata: {
            taskId: task.id,
            taskType: task.type,
            resolution: completionData.resolution,
            attachments: completionData.attachments || []
        },
        clientId: task.clientId
    });

    // Generate next steps based on task type and resolution
    const nextSteps = generateNextSteps(task, completionData.resolution);
    const notifications = generateNotifications(task, completionData.resolution);

    return {
        task: updatedTask,
        nextSteps,
        notifications
    };
};

/**
 * Create audit entry for workflow activity
 * @param {Object} auditData
 * @returns {Promise<WorkflowAudit>}
 */
const createAuditEntry = async (auditData: {
    activityType: WorkflowActivityType;
    userId: string;
    userName: string;
    description: string;
    changes: Array<{
        field: string;
        oldValue: any;
        newValue: any;
    }>;
    metadata?: any;
    clientId: string;
}): Promise<WorkflowAudit> => {
    return await prisma.workflowAudit.create({
        data: auditData
    });
};

/**
 * Get workflow audit trail for a client
 * @param {string} clientId
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<WorkflowAudit[]>}
 */
const getWorkflowAudit = async (
    clientId: string,
    filter: {
        startDate?: string;
        endDate?: string;
        activityType?: WorkflowActivityType;
    } = {},
    options: {
        limit?: number;
        page?: number;
        sortBy?: string;
        sortType?: 'asc' | 'desc';
    } = {}
): Promise<WorkflowAudit[]> => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 50;
    const sortBy = options.sortBy ?? 'timestamp';
    const sortType = options.sortType ?? 'desc';

    const where: Prisma.WorkflowAuditWhereInput = {
        clientId
    };

    if (filter.activityType) {
        where.activityType = filter.activityType;
    }

    if (filter.startDate || filter.endDate) {
        where.timestamp = {};
        if (filter.startDate) {
            where.timestamp.gte = new Date(filter.startDate);
        }
        if (filter.endDate) {
            where.timestamp.lte = new Date(filter.endDate);
        }
    }

    return await prisma.workflowAudit.findMany({
        where,
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    businessType: true,
                    industry: true
                }
            }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType }
    });
};

/**
 * Create a new workflow task
 * @param {Object} taskData
 * @returns {Promise<WorkflowTask>}
 */
const createWorkflowTask = async (taskData: {
    type: WorkflowTaskType;
    priority?: WorkflowTaskPriority;
    clientId: string;
    clientName: string;
    assignedTo: string;
    dueDate?: Date;
    metadata?: any;
}): Promise<WorkflowTask> => {
    return await prisma.workflowTask.create({
        data: {
            type: taskData.type,
            priority: taskData.priority || WorkflowTaskPriority.MEDIUM,
            clientId: taskData.clientId,
            clientName: taskData.clientName,
            assignedTo: taskData.assignedTo,
            dueDate: taskData.dueDate,
            metadata: taskData.metadata
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    businessType: true,
                    industry: true,
                    riskProfile: true
                }
            }
        }
    });
};

/**
 * Generate next steps based on task completion
 */
const generateNextSteps = (
    task: WorkflowTask,
    resolution: string
): Array<{
    type: string;
    assignedTo?: string;
    dueDate?: string;
    description?: string;
}> => {
    const nextSteps: Array<{
        type: string;
        assignedTo?: string;
        dueDate?: string;
        description?: string;
    }> = [];

    // Generate next steps based on task type and resolution
    if (task.type === WorkflowTaskType.RECOMMENDATION_APPROVAL) {
        if (resolution === 'approved') {
            nextSteps.push({
                type: 'implementation',
                description: 'Implement approved recommendation',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
            });
        } else if (resolution === 'rejected') {
            nextSteps.push({
                type: 'review',
                description: 'Review and revise recommendation based on feedback'
            });
        }
    } else if (task.type === WorkflowTaskType.CLIENT_REVIEW) {
        if (resolution === 'changes_required') {
            nextSteps.push({
                type: 'client_update',
                description: 'Update client information based on review findings'
            });
        }
    }

    return nextSteps;
};

/**
 * Generate notifications based on task completion
 */
const generateNotifications = (
    task: WorkflowTask,
    resolution: string
): Array<{
    type: string;
    recipient: string;
    message: string;
}> => {
    const notifications: Array<{
        type: string;
        recipient: string;
        message: string;
    }> = [];

    // Generate notifications based on task type and resolution
    if (task.type === WorkflowTaskType.RECOMMENDATION_APPROVAL && resolution === 'approved') {
        notifications.push({
            type: 'task_completion',
            recipient: 'implementation_team',
            message: `Recommendation for ${task.clientName} has been approved and is ready for implementation`
        });
    }

    return notifications;
};

export default {
    getWorkflowTasks,
    getWorkflowTaskById,
    completeWorkflowTask,
    createAuditEntry,
    getWorkflowAudit,
    createWorkflowTask
};

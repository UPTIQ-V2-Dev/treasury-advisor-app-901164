import { TaskStatus, TaskType } from '../generated/prisma/index.js';
import { processingService } from '../services/index.ts';
import { MCPTool } from '../types/mcp.ts';
import { z } from 'zod';

// Schema definitions
const currentStepSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        status: z.string(),
        progress: z.number()
    })
    .nullable();

// Simplified schemas for output validation
const processingTaskOutputSchema = z.any();

const getProcessingTaskTool: MCPTool = {
    id: 'processing_get_task',
    name: 'Get Processing Task',
    description: 'Get detailed information about a specific processing task',
    inputSchema: z.object({
        taskId: z.string()
    }),
    outputSchema: processingTaskOutputSchema,
    fn: async (inputs: { taskId: string }) => {
        const task = await processingService.getProcessingTaskById(inputs.taskId);
        return task;
    }
};

const getClientProcessingTasksTool: MCPTool = {
    id: 'processing_get_client_tasks',
    name: 'Get Client Processing Tasks',
    description: 'Get all processing tasks for a specific client',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: processingTaskOutputSchema,
    fn: async (inputs: { clientId: string }) => {
        const tasks = await processingService.getClientProcessingTasks(inputs.clientId);
        return tasks;
    }
};

const startProcessingTaskTool: MCPTool = {
    id: 'processing_start_task',
    name: 'Start Processing Task',
    description: 'Start a new processing task for a client',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        type: z.nativeEnum(TaskType),
        options: z
            .object({
                statementId: z.string().uuid().optional(),
                includeRecommendations: z.boolean().optional(),
                analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']).optional(),
                priority: z.enum(['low', 'medium', 'high']).optional()
            })
            .optional()
    }),
    outputSchema: z.object({
        taskId: z.string()
    }),
    fn: async (inputs: {
        clientId: string;
        type: TaskType;
        options?: {
            statementId?: string;
            includeRecommendations?: boolean;
            analysisDepth?: string;
            priority?: string;
        };
    }) => {
        const result = await processingService.startProcessingTask(inputs.clientId, inputs.type, inputs.options || {});
        return result;
    }
};

const cancelProcessingTaskTool: MCPTool = {
    id: 'processing_cancel_task',
    name: 'Cancel Processing Task',
    description: 'Cancel a running or pending processing task',
    inputSchema: z.object({
        taskId: z.string()
    }),
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string()
    }),
    fn: async (inputs: { taskId: string }) => {
        await processingService.cancelProcessingTask(inputs.taskId);
        return { success: true, message: 'Task cancelled successfully' };
    }
};

const retryProcessingTaskTool: MCPTool = {
    id: 'processing_retry_task',
    name: 'Retry Processing Task',
    description: 'Retry a failed processing task',
    inputSchema: z.object({
        taskId: z.string()
    }),
    outputSchema: z.object({
        taskId: z.string()
    }),
    fn: async (inputs: { taskId: string }) => {
        const result = await processingService.retryProcessingTask(inputs.taskId);
        return result;
    }
};

const getProcessingMetricsTool: MCPTool = {
    id: 'processing_get_metrics',
    name: 'Get Processing Metrics',
    description: 'Get overall processing system metrics and statistics',
    inputSchema: z.object({}),
    outputSchema: z.object({
        totalTasks: z.number(),
        completedTasks: z.number(),
        failedTasks: z.number(),
        averageProcessingTime: z.number(),
        currentLoad: z.number()
    }),
    fn: async () => {
        const metrics = await processingService.getProcessingMetrics();
        return metrics;
    }
};

const getClientProcessingHistoryTool: MCPTool = {
    id: 'processing_get_client_history',
    name: 'Get Client Processing History',
    description: 'Get processing history for a client with pagination',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional()
    }),
    outputSchema: processingTaskOutputSchema,
    fn: async (inputs: { clientId: string; limit?: number; offset?: number }) => {
        const result = await processingService.getClientProcessingHistory(inputs.clientId, {
            limit: inputs.limit || 10,
            offset: inputs.offset || 0
        });
        return result;
    }
};

const getProcessingLogsTool: MCPTool = {
    id: 'processing_get_logs',
    name: 'Get Processing Logs',
    description: 'Get processing logs for a specific task',
    inputSchema: z.object({
        taskId: z.string(),
        level: z.enum(['debug', 'info', 'warn', 'error']).optional()
    }),
    outputSchema: processingTaskOutputSchema,
    fn: async (inputs: { taskId: string; level?: string }) => {
        const logs = await processingService.getProcessingLogs(inputs.taskId, inputs.level);
        return logs;
    }
};

const checkTaskStatusTool: MCPTool = {
    id: 'processing_check_status',
    name: 'Check Task Status',
    description: 'Check the current status and progress of a processing task',
    inputSchema: z.object({
        taskId: z.string()
    }),
    outputSchema: z.object({
        taskId: z.string(),
        status: z.nativeEnum(TaskStatus),
        progress: z.number(),
        currentStep: currentStepSchema,
        startTime: z.string(),
        endTime: z.string().nullable(),
        error: z.any().nullable()
    }),
    fn: async (inputs: { taskId: string }) => {
        const task = await processingService.getProcessingTaskById(inputs.taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        return {
            taskId: task.taskId,
            status: task.status,
            progress: task.progress,
            currentStep: task.currentStep,
            startTime: task.startTime.toISOString(),
            endTime: task.endTime?.toISOString() || null,
            error: task.error
        };
    }
};

const getActiveProcessingTasksTool: MCPTool = {
    id: 'processing_get_active_tasks',
    name: 'Get Active Processing Tasks',
    description: 'Get all currently running or pending processing tasks',
    inputSchema: z.object({
        status: z.nativeEnum(TaskStatus).optional()
    }),
    outputSchema: processingTaskOutputSchema,
    fn: async (inputs: { status?: TaskStatus }) => {
        // Use prisma directly for this query since it's not in the service
        const prisma = (await import('../client.ts')).default;

        const where: any = {};
        if (inputs.status) {
            where.status = inputs.status;
        } else {
            // Default to active statuses
            where.status = {
                in: [TaskStatus.PENDING, TaskStatus.RUNNING]
            };
        }

        const tasks = await prisma.processingTask.findMany({
            where,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { startTime: 'desc' }
        });

        return tasks.map(task => ({
            taskId: task.taskId,
            clientId: task.clientId,
            clientName: task.client?.name || null,
            type: task.type,
            status: task.status,
            progress: task.progress,
            startTime: task.startTime.toISOString(),
            currentStep: task.currentStep,
            createdAt: task.createdAt.toISOString()
        }));
    }
};

export const processingTools: MCPTool[] = [
    getProcessingTaskTool,
    getClientProcessingTasksTool,
    startProcessingTaskTool,
    cancelProcessingTaskTool,
    retryProcessingTaskTool,
    getProcessingMetricsTool,
    getClientProcessingHistoryTool,
    getProcessingLogsTool,
    checkTaskStatusTool,
    getActiveProcessingTasksTool
];

import prisma from '../client.ts';
import { ProcessingTask, TaskStatus, TaskType } from '../generated/prisma/index.js';
import ApiError from '../utils/ApiError.ts';
import { EventEmitter } from 'events';
import httpStatus from 'http-status';

// Task processing logs storage (in production, this would be a proper logging service)
const taskLogs: { [taskId: string]: string[] } = {};

// Event emitter for real-time updates
export const taskEmitter = new EventEmitter();

// Interface for step definition
interface StepDefinition {
    name: string;
    description: string;
}

/**
 * Create a processing task
 * @param {Object} taskData
 * @returns {Promise<ProcessingTask>}
 */
const createProcessingTask = async (taskData: {
    clientId: string;
    statementId?: string;
    type: TaskType;
    steps: any;
    estimatedDuration?: number;
}): Promise<ProcessingTask> => {
    // Validate client exists
    const client = await prisma.client.findUnique({
        where: { id: taskData.clientId }
    });

    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    // Validate statement exists if provided
    if (taskData.statementId) {
        const statement = await prisma.statement.findUnique({
            where: { id: taskData.statementId }
        });

        if (!statement) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Statement not found');
        }
    }

    const task = await prisma.processingTask.create({
        data: {
            ...taskData,
            status: TaskStatus.PENDING,
            progress: 0,
            steps: taskData.steps || []
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true
                }
            },
            statement: {
                select: {
                    id: true,
                    fileName: true
                }
            }
        }
    });

    // Initialize logs for the task
    taskLogs[task.taskId] = [`[INFO] Task ${task.taskId} created at ${new Date().toISOString()}`];

    return task;
};

/**
 * Start processing task
 * @param {string} clientId
 * @param {TaskType} type
 * @param {Object} options
 * @returns {Promise<{taskId: string}>}
 */
const startProcessingTask = async (
    clientId: string,
    type: TaskType,
    options: any = {}
): Promise<{ taskId: string }> => {
    // Define steps based on task type
    const taskSteps = getTaskSteps(type);

    const task = await createProcessingTask({
        clientId,
        statementId: options.statementId,
        type,
        steps: taskSteps,
        estimatedDuration: getEstimatedDuration(type)
    });

    // Start background processing
    void processTaskInBackground(task.taskId);

    return { taskId: task.taskId };
};

/**
 * Get processing task by ID
 * @param {string} taskId
 * @returns {Promise<ProcessingTask | null>}
 */
const getProcessingTaskById = async (taskId: string): Promise<ProcessingTask | null> => {
    return await prisma.processingTask.findUnique({
        where: { taskId },
        include: {
            client: {
                select: {
                    id: true,
                    name: true
                }
            },
            statement: {
                select: {
                    id: true,
                    fileName: true
                }
            }
        }
    });
};

/**
 * Get all processing tasks for a client
 * @param {string} clientId
 * @returns {Promise<ProcessingTask[]>}
 */
const getClientProcessingTasks = async (clientId: string): Promise<ProcessingTask[]> => {
    // Validate client exists
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });

    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    return prisma.processingTask.findMany({
        where: { clientId },
        include: {
            client: {
                select: {
                    id: true,
                    name: true
                }
            },
            statement: {
                select: {
                    id: true,
                    fileName: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * Cancel a processing task
 * @param {string} taskId
 * @returns {Promise<void>}
 */
const cancelProcessingTask = async (taskId: string): Promise<void> => {
    const task = await getProcessingTaskById(taskId);
    if (!task) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) {
        throw new ApiError(httpStatus.CONFLICT, 'Task cannot be cancelled');
    }

    await prisma.processingTask.update({
        where: { taskId },
        data: {
            status: TaskStatus.CANCELLED,
            endTime: new Date(),
            error: { message: 'Task cancelled by user' }
        }
    });

    addTaskLog(taskId, '[INFO] Task cancelled by user');
    emitTaskUpdate(taskId, TaskStatus.CANCELLED, 100);
};

/**
 * Retry a failed processing task
 * @param {string} taskId
 * @returns {Promise<{taskId: string}>}
 */
const retryProcessingTask = async (taskId: string): Promise<{ taskId: string }> => {
    const originalTask = await getProcessingTaskById(taskId);
    if (!originalTask) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
    }

    if (originalTask.status !== TaskStatus.FAILED) {
        throw new ApiError(httpStatus.CONFLICT, 'Task cannot be retried');
    }

    // Create new task with same parameters
    const newTask = await createProcessingTask({
        clientId: originalTask.clientId,
        statementId: originalTask.statementId || undefined,
        type: originalTask.type,
        steps: originalTask.steps,
        estimatedDuration: originalTask.estimatedDuration || undefined
    });

    // Start background processing
    void processTaskInBackground(newTask.taskId);

    return { taskId: newTask.taskId };
};

/**
 * Get processing system metrics
 * @returns {Promise<Object>}
 */
const getProcessingMetrics = async (): Promise<{
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
    currentLoad: number;
}> => {
    const [totalTasks, completedTasks, failedTasks, runningTasks] = await Promise.all([
        prisma.processingTask.count(),
        prisma.processingTask.count({ where: { status: TaskStatus.COMPLETED } }),
        prisma.processingTask.count({ where: { status: TaskStatus.FAILED } }),
        prisma.processingTask.count({ where: { status: TaskStatus.RUNNING } })
    ]);

    // Calculate average processing time for completed tasks
    const completedTasksWithDuration = await prisma.processingTask.findMany({
        where: {
            status: TaskStatus.COMPLETED,
            endTime: { not: null }
        },
        select: {
            startTime: true,
            endTime: true
        }
    });

    let averageProcessingTime = 0;
    if (completedTasksWithDuration.length > 0) {
        const totalTime = completedTasksWithDuration.reduce((sum, task) => {
            if (task.endTime && task.startTime) {
                return sum + (task.endTime.getTime() - task.startTime.getTime());
            }
            return sum;
        }, 0);
        averageProcessingTime = Math.floor(totalTime / completedTasksWithDuration.length);
    }

    // Current load is percentage of running tasks vs max capacity (assume 10 max concurrent)
    const maxCapacity = 10;
    const currentLoad = runningTasks / maxCapacity;

    return {
        totalTasks,
        completedTasks,
        failedTasks,
        averageProcessingTime,
        currentLoad: Math.min(currentLoad, 1.0)
    };
};

/**
 * Get processing history for a client with pagination
 * @param {string} clientId
 * @param {Object} options
 * @returns {Promise<{tasks: ProcessingTask[], total: number}>}
 */
const getClientProcessingHistory = async (
    clientId: string,
    options: { limit?: number; offset?: number } = {}
): Promise<{ tasks: ProcessingTask[]; total: number }> => {
    // Validate client exists
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });

    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    const limit = options.limit || 10;
    const offset = options.offset || 0;

    const [tasks, total] = await Promise.all([
        prisma.processingTask.findMany({
            where: { clientId },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                statement: {
                    select: {
                        id: true,
                        fileName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit
        }),
        prisma.processingTask.count({ where: { clientId } })
    ]);

    return { tasks, total };
};

/**
 * Get processing logs for a task
 * @param {string} taskId
 * @param {string} level - Log level filter
 * @returns {Promise<string[]>}
 */
const getProcessingLogs = async (taskId: string, level?: string): Promise<string[]> => {
    const task = await getProcessingTaskById(taskId);
    if (!task) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
    }

    const logs = taskLogs[taskId] || [];

    if (level) {
        const levelFilter = `[${level.toUpperCase()}]`;
        return logs.filter(log => log.includes(levelFilter));
    }

    return logs;
};

/**
 * Update task progress
 * @param {string} taskId
 * @param {number} progress
 * @param {Object} currentStep
 */
const updateTaskProgress = async (taskId: string, progress: number, currentStep?: any): Promise<void> => {
    await prisma.processingTask.update({
        where: { taskId },
        data: {
            progress,
            currentStep,
            updatedAt: new Date()
        }
    });

    emitTaskUpdate(taskId, TaskStatus.RUNNING, progress, currentStep);
};

/**
 * Complete task
 * @param {string} taskId
 * @param {Object} results
 */
const completeTask = async (taskId: string, results: any): Promise<void> => {
    await prisma.processingTask.update({
        where: { taskId },
        data: {
            status: TaskStatus.COMPLETED,
            progress: 100,
            endTime: new Date(),
            results
        }
    });

    addTaskLog(taskId, '[INFO] Task completed successfully');
    emitTaskUpdate(taskId, TaskStatus.COMPLETED, 100);
};

/**
 * Fail task
 * @param {string} taskId
 * @param {Object} error
 */
const failTask = async (taskId: string, error: any): Promise<void> => {
    await prisma.processingTask.update({
        where: { taskId },
        data: {
            status: TaskStatus.FAILED,
            endTime: new Date(),
            error
        }
    });

    addTaskLog(taskId, `[ERROR] Task failed: ${error.message}`);
    emitTaskUpdate(taskId, TaskStatus.FAILED, 0);
};

/**
 * Add log entry for a task
 * @param {string} taskId
 * @param {string} message
 */
const addTaskLog = (taskId: string, message: string): void => {
    if (!taskLogs[taskId]) {
        taskLogs[taskId] = [];
    }
    taskLogs[taskId].push(`${new Date().toISOString()}: ${message}`);
};

/**
 * Emit task update event
 * @param {string} taskId
 * @param {TaskStatus} status
 * @param {number} progress
 * @param {any} currentStep
 */
const emitTaskUpdate = (taskId: string, status: TaskStatus, progress: number, currentStep?: any): void => {
    taskEmitter.emit('taskUpdate', {
        taskId,
        status,
        progress,
        currentStep,
        timestamp: new Date().toISOString()
    });
};

/**
 * Background task processor
 * @param {string} taskId
 */
const processTaskInBackground = async (taskId: string): Promise<void> => {
    try {
        const task = await getProcessingTaskById(taskId);
        if (!task) return;

        // Update status to running
        await prisma.processingTask.update({
            where: { taskId },
            data: { status: TaskStatus.RUNNING }
        });

        addTaskLog(taskId, '[INFO] Task processing started');
        emitTaskUpdate(taskId, TaskStatus.RUNNING, 0);

        const steps = Array.isArray(task.steps) ? (task.steps as unknown as StepDefinition[]) : [];

        // Process each step
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const progress = Math.floor(((i + 1) / steps.length) * 100);

            addTaskLog(taskId, `[INFO] Starting step ${i + 1}/${steps.length}: ${step?.name || 'Unknown Step'}`);

            await updateTaskProgress(taskId, progress, {
                id: `step-${i + 1}`,
                name: step?.name || 'Unknown Step',
                description: step?.description || 'Processing...',
                status: 'running',
                progress: 0
            });

            // Simulate step processing time
            await new Promise(resolve => setTimeout(resolve, getStepDuration()));

            await updateTaskProgress(taskId, progress, {
                id: `step-${i + 1}`,
                name: step?.name || 'Unknown Step',
                description: step?.description || 'Processing...',
                status: 'completed',
                progress: 100
            });

            addTaskLog(taskId, `[INFO] Completed step ${i + 1}/${steps.length}: ${step?.name || 'Unknown Step'}`);
        }

        // Complete the task
        const results = await generateTaskResults(task);
        await completeTask(taskId, results);
    } catch (error: any) {
        await failTask(taskId, { message: error.message, stack: error.stack });
    }
};

/**
 * Get task steps based on type
 * @param {TaskType} type
 * @returns {Array}
 */
const getTaskSteps = (type: TaskType): StepDefinition[] => {
    const stepDefinitions: { [key in TaskType]: StepDefinition[] } = {
        [TaskType.STATEMENT_PARSE]: [
            { name: 'File Validation', description: 'Validating uploaded statement files' },
            { name: 'Document Processing', description: 'Extracting data from documents' },
            { name: 'Transaction Parsing', description: 'Parsing transaction data' },
            { name: 'Data Validation', description: 'Validating parsed transaction data' },
            { name: 'Analysis Generation', description: 'Generating financial insights and analytics' }
        ],
        [TaskType.DATA_SYNC]: [
            { name: 'Connection Verification', description: 'Verifying bank connection' },
            { name: 'Data Retrieval', description: 'Retrieving latest transaction data' },
            { name: 'Data Reconciliation', description: 'Reconciling with existing data' },
            { name: 'Update Processing', description: 'Processing data updates' }
        ],
        [TaskType.ANALYSIS]: [
            { name: 'Data Collection', description: 'Collecting transaction data for analysis' },
            { name: 'Pattern Analysis', description: 'Analyzing spending patterns' },
            { name: 'Risk Assessment', description: 'Assessing financial risk indicators' },
            { name: 'Insights Generation', description: 'Generating actionable insights' }
        ],
        [TaskType.RECOMMENDATION_GENERATION]: [
            { name: 'Client Profile Analysis', description: 'Analyzing client financial profile' },
            { name: 'Product Matching', description: 'Matching suitable treasury products' },
            { name: 'Benefit Calculation', description: 'Calculating estimated benefits' },
            { name: 'Recommendation Scoring', description: 'Scoring and ranking recommendations' }
        ]
    };

    return stepDefinitions[type] || [];
};

/**
 * Get estimated duration for task type (in milliseconds)
 * @param {TaskType} type
 * @returns {number}
 */
const getEstimatedDuration = (type: TaskType): number => {
    const durations: { [key in TaskType]: number } = {
        [TaskType.STATEMENT_PARSE]: 300000, // 5 minutes
        [TaskType.DATA_SYNC]: 120000, // 2 minutes
        [TaskType.ANALYSIS]: 180000, // 3 minutes
        [TaskType.RECOMMENDATION_GENERATION]: 240000 // 4 minutes
    };

    return durations[type] || 180000;
};

/**
 * Get step processing duration (simulated)
 * @param {string} stepName
 * @returns {number}
 */
const getStepDuration = (): number => {
    // Simulate different processing times for different steps
    const baseDuration = 2000; // 2 seconds base
    const variation = Math.random() * 3000; // 0-3 seconds variation
    return Math.floor(baseDuration + variation);
};

/**
 * Generate task results based on type
 * @param {ProcessingTask} task
 * @returns {Promise<Object>}
 */
const generateTaskResults = (task: ProcessingTask): any => {
    const baseResults = {
        processingTime: task.estimatedDuration || 0,
        completedSteps: Array.isArray(task.steps) ? task.steps.length : 0
    };

    switch (task.type) {
        case TaskType.STATEMENT_PARSE:
            return {
                ...baseResults,
                transactionCount: Math.floor(Math.random() * 500) + 50,
                accountsProcessed: [`acc-${Math.random().toString(36).substr(2, 9)}`],
                dataQualityScore: Math.floor(Math.random() * 20) + 80,
                warnings: []
            };

        case TaskType.DATA_SYNC:
            return {
                ...baseResults,
                recordsUpdated: Math.floor(Math.random() * 100) + 10,
                newTransactions: Math.floor(Math.random() * 50),
                lastSyncTime: new Date().toISOString()
            };

        case TaskType.ANALYSIS:
            return {
                ...baseResults,
                insightsGenerated: Math.floor(Math.random() * 10) + 5,
                riskScore: Math.random() * 10,
                liquidityRatio: Math.random() * 2 + 1,
                recommendationsTriggered: Math.floor(Math.random() * 3)
            };

        case TaskType.RECOMMENDATION_GENERATION:
            return {
                ...baseResults,
                recommendationsCreated: Math.floor(Math.random() * 5) + 1,
                highPriorityCount: Math.floor(Math.random() * 2),
                totalEstimatedBenefit: Math.floor(Math.random() * 50000) + 10000
            };

        default:
            return baseResults;
    }
};

export default {
    createProcessingTask,
    startProcessingTask,
    getProcessingTaskById,
    getClientProcessingTasks,
    cancelProcessingTask,
    retryProcessingTask,
    getProcessingMetrics,
    getClientProcessingHistory,
    getProcessingLogs,
    updateTaskProgress,
    completeTask,
    failTask,
    addTaskLog,
    emitTaskUpdate
};

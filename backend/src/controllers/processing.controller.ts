import { processingService } from '../services/index.ts';
import { taskEmitter } from '../services/processing.service.ts';
import ApiError from '../utils/ApiError.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import { RequestWithAdditionalProperties } from '../utils/types.ts';
import { Request, Response } from 'express';
import httpStatus from 'http-status';

/**
 * Get processing task by ID
 */
const getTaskById = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const task = await processingService.getProcessingTaskById(taskId);

    if (!task) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
    }

    res.json(task);
});

/**
 * Get all processing tasks for a client
 */
const getClientTasks = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { clientId } = req.params;
    const tasks = await processingService.getClientProcessingTasks(clientId);

    res.json(tasks);
});

/**
 * Start a new processing task
 */
const startProcessing = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { clientId, type, options } = req.body;
    const result = await processingService.startProcessingTask(clientId, type, options || {});

    res.status(httpStatus.ACCEPTED).json(result);
});

/**
 * Cancel a running processing task
 */
const cancelTask = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    await processingService.cancelProcessingTask(taskId);

    res.json({});
});

/**
 * Retry a failed processing task
 */
const retryTask = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const result = await processingService.retryProcessingTask(taskId);

    res.status(httpStatus.ACCEPTED).json(result);
});

/**
 * Get processing system metrics
 */
const getMetrics = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const metrics = await processingService.getProcessingMetrics();

    res.json(metrics);
});

/**
 * Get processing history for a client with pagination
 */
const getClientHistory = catchAsyncWithAuth(async (req: RequestWithAdditionalProperties, res: Response) => {
    const { clientId } = req.params;
    const options = pick(req.validatedQuery, ['limit', 'offset']);
    const result = await processingService.getClientProcessingHistory(clientId, options);

    res.json(result);
});

/**
 * Get processing logs for a specific task
 */
const getTaskLogs = catchAsyncWithAuth(async (req: RequestWithAdditionalProperties, res: Response) => {
    const { taskId } = req.params;
    const { level } = req.validatedQuery;
    const logs = await processingService.getProcessingLogs(taskId, level as string);

    res.json(logs);
});

/**
 * Server-sent events stream for real-time processing updates
 */
const getTaskStream = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { taskId } = req.params;

    // Verify task exists
    const task = await processingService.getProcessingTaskById(taskId);
    if (!task) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
    }

    // Set headers for Server-Sent Events
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial task state
    const initialData = {
        taskId: task.taskId,
        status: task.status,
        progress: task.progress,
        currentStep: task.currentStep,
        timestamp: new Date().toISOString()
    };

    res.write(`data: ${JSON.stringify(initialData)}\n\n`);

    // Set up event listener for this specific task
    const taskUpdateListener = (update: any) => {
        if (update.taskId === taskId) {
            res.write(`data: ${JSON.stringify(update)}\n\n`);

            // Close connection when task is completed, failed, or cancelled
            if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(update.status)) {
                res.write(`data: {"type": "close"}\n\n`);
                res.end();
            }
        }
    };

    taskEmitter.on('taskUpdate', taskUpdateListener);

    // Clean up when client disconnects
    req.on('close', () => {
        taskEmitter.removeListener('taskUpdate', taskUpdateListener);
        res.end();
    });

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
        res.write(`: heartbeat ${Date.now()}\n\n`);
    }, 30000);

    // Clean up heartbeat when connection closes
    req.on('close', () => {
        clearInterval(heartbeatInterval);
    });
});

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

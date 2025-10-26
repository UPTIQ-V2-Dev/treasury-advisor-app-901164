import { NotificationType } from '../generated/prisma/index.js';
import { notificationService } from "../services/index.js";
import pick from "../utils/pick.js";
import { z } from 'zod';
const notificationSchema = z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    message: z.string(),
    data: z.record(z.any()).nullable(),
    read: z.boolean(),
    createdAt: z.string(),
    userId: z.number(),
    expiresAt: z.string().nullable()
});
const createNotificationTool = {
    id: 'notification_create',
    name: 'Create Notification',
    description: 'Create a new notification for a user',
    inputSchema: z.object({
        userId: z.number().int(),
        type: z.enum([
            NotificationType.PROCESSING_COMPLETE,
            NotificationType.PROCESSING_FAILED,
            NotificationType.RECOMMENDATION_READY,
            NotificationType.STATEMENT_UPLOADED,
            NotificationType.CLIENT_UPDATED,
            NotificationType.WORKFLOW_TASK_ASSIGNED,
            NotificationType.WORKFLOW_TASK_COMPLETED,
            NotificationType.SYSTEM_ALERT,
            NotificationType.GENERAL
        ]),
        title: z.string(),
        message: z.string(),
        data: z.record(z.any()).optional(),
        expiresAt: z.string().datetime().optional()
    }),
    outputSchema: notificationSchema,
    fn: async (inputs) => {
        const notification = await notificationService.createNotification(inputs.userId, inputs.type, inputs.title, inputs.message, inputs.data, inputs.expiresAt ? new Date(inputs.expiresAt) : undefined);
        return {
            ...notification,
            createdAt: notification.createdAt.toISOString(),
            expiresAt: notification.expiresAt?.toISOString() || null
        };
    }
};
const getNotificationsTool = {
    id: 'notification_get_all',
    name: 'Get Notifications',
    description: 'Get notifications for a user with optional filters and pagination',
    inputSchema: z.object({
        userId: z.number().int(),
        read: z.boolean().optional(),
        type: z
            .enum([
            NotificationType.PROCESSING_COMPLETE,
            NotificationType.PROCESSING_FAILED,
            NotificationType.RECOMMENDATION_READY,
            NotificationType.STATEMENT_UPLOADED,
            NotificationType.CLIENT_UPDATED,
            NotificationType.WORKFLOW_TASK_ASSIGNED,
            NotificationType.WORKFLOW_TASK_COMPLETED,
            NotificationType.SYSTEM_ALERT,
            NotificationType.GENERAL
        ])
            .optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional(),
        sortBy: z.string().optional(),
        sortType: z.enum(['asc', 'desc']).optional()
    }),
    outputSchema: z.object({
        notifications: z.array(notificationSchema),
        total: z.number(),
        unreadCount: z.number()
    }),
    fn: async (inputs) => {
        const filter = pick(inputs, ['read', 'type']);
        const options = pick(inputs, ['limit', 'page', 'sortBy', 'sortType']);
        const result = await notificationService.queryNotifications(inputs.userId, filter, options);
        return {
            ...result,
            notifications: result.notifications.map(notification => ({
                ...notification,
                createdAt: notification.createdAt.toISOString(),
                expiresAt: notification.expiresAt?.toISOString() || null
            }))
        };
    }
};
const markNotificationAsReadTool = {
    id: 'notification_mark_read',
    name: 'Mark Notification as Read',
    description: 'Mark a specific notification as read for a user',
    inputSchema: z.object({
        notificationId: z.string(),
        userId: z.number().int()
    }),
    outputSchema: notificationSchema,
    fn: async (inputs) => {
        const notification = await notificationService.markNotificationAsRead(inputs.notificationId, inputs.userId);
        return {
            ...notification,
            createdAt: notification.createdAt.toISOString(),
            expiresAt: notification.expiresAt?.toISOString() || null
        };
    }
};
const markAllNotificationsAsReadTool = {
    id: 'notification_mark_all_read',
    name: 'Mark All Notifications as Read',
    description: 'Mark all notifications as read for a user',
    inputSchema: z.object({
        userId: z.number().int()
    }),
    outputSchema: z.object({
        markedCount: z.number()
    }),
    fn: async (inputs) => {
        return await notificationService.markAllNotificationsAsRead(inputs.userId);
    }
};
const cleanupExpiredNotificationsTool = {
    id: 'notification_cleanup_expired',
    name: 'Cleanup Expired Notifications',
    description: 'Remove expired notifications from the system',
    inputSchema: z.object({}),
    outputSchema: z.object({
        deletedCount: z.number()
    }),
    fn: async () => {
        return await notificationService.cleanupExpiredNotifications();
    }
};
const createProcessingCompleteNotificationTool = {
    id: 'notification_create_processing_complete',
    name: 'Create Processing Complete Notification',
    description: 'Create a processing complete notification for a user',
    inputSchema: z.object({
        userId: z.number().int(),
        clientId: z.string(),
        clientName: z.string(),
        taskId: z.string(),
        transactionCount: z.number().int().optional()
    }),
    outputSchema: notificationSchema,
    fn: async (inputs) => {
        const notification = await notificationService.createProcessingCompleteNotification(inputs.userId, inputs.clientId, inputs.clientName, inputs.taskId, inputs.transactionCount);
        return {
            ...notification,
            createdAt: notification.createdAt.toISOString(),
            expiresAt: notification.expiresAt?.toISOString() || null
        };
    }
};
const createProcessingFailedNotificationTool = {
    id: 'notification_create_processing_failed',
    name: 'Create Processing Failed Notification',
    description: 'Create a processing failed notification for a user',
    inputSchema: z.object({
        userId: z.number().int(),
        clientId: z.string(),
        clientName: z.string(),
        taskId: z.string(),
        error: z.string()
    }),
    outputSchema: notificationSchema,
    fn: async (inputs) => {
        const notification = await notificationService.createProcessingFailedNotification(inputs.userId, inputs.clientId, inputs.clientName, inputs.taskId, inputs.error);
        return {
            ...notification,
            createdAt: notification.createdAt.toISOString(),
            expiresAt: notification.expiresAt?.toISOString() || null
        };
    }
};
const createRecommendationReadyNotificationTool = {
    id: 'notification_create_recommendation_ready',
    name: 'Create Recommendation Ready Notification',
    description: 'Create a recommendation ready notification for a user',
    inputSchema: z.object({
        userId: z.number().int(),
        clientId: z.string(),
        clientName: z.string(),
        recommendationId: z.string(),
        priority: z.string(),
        estimatedBenefit: z.number().optional()
    }),
    outputSchema: notificationSchema,
    fn: async (inputs) => {
        const notification = await notificationService.createRecommendationReadyNotification(inputs.userId, inputs.clientId, inputs.clientName, inputs.recommendationId, inputs.priority, inputs.estimatedBenefit);
        return {
            ...notification,
            createdAt: notification.createdAt.toISOString(),
            expiresAt: notification.expiresAt?.toISOString() || null
        };
    }
};
const createWorkflowTaskAssignedNotificationTool = {
    id: 'notification_create_workflow_task_assigned',
    name: 'Create Workflow Task Assigned Notification',
    description: 'Create a workflow task assigned notification for a user',
    inputSchema: z.object({
        userId: z.number().int(),
        taskId: z.string(),
        taskType: z.string(),
        clientId: z.string(),
        clientName: z.string(),
        priority: z.string(),
        dueDate: z.string().datetime().optional()
    }),
    outputSchema: notificationSchema,
    fn: async (inputs) => {
        const notification = await notificationService.createWorkflowTaskAssignedNotification(inputs.userId, inputs.taskId, inputs.taskType, inputs.clientId, inputs.clientName, inputs.priority, inputs.dueDate ? new Date(inputs.dueDate) : undefined);
        return {
            ...notification,
            createdAt: notification.createdAt.toISOString(),
            expiresAt: notification.expiresAt?.toISOString() || null
        };
    }
};
const createSystemAlertNotificationTool = {
    id: 'notification_create_system_alert',
    name: 'Create System Alert Notification',
    description: 'Create a system alert notification for a user',
    inputSchema: z.object({
        userId: z.number().int(),
        title: z.string(),
        message: z.string(),
        alertData: z.record(z.any()).optional(),
        expiresAt: z.string().datetime().optional()
    }),
    outputSchema: notificationSchema,
    fn: async (inputs) => {
        const notification = await notificationService.createSystemAlertNotification(inputs.userId, inputs.title, inputs.message, inputs.alertData, inputs.expiresAt ? new Date(inputs.expiresAt) : undefined);
        return {
            ...notification,
            createdAt: notification.createdAt.toISOString(),
            expiresAt: notification.expiresAt?.toISOString() || null
        };
    }
};
export const notificationTools = [
    createNotificationTool,
    getNotificationsTool,
    markNotificationAsReadTool,
    markAllNotificationsAsReadTool,
    cleanupExpiredNotificationsTool,
    createProcessingCompleteNotificationTool,
    createProcessingFailedNotificationTool,
    createRecommendationReadyNotificationTool,
    createWorkflowTaskAssignedNotificationTool,
    createSystemAlertNotificationTool
];

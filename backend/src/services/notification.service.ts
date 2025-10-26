import prisma from '../client.ts';
import { Notification, NotificationType } from '../generated/prisma/index.js';
import ApiError from '../utils/ApiError.ts';
import { EventEmitter } from 'events';
import httpStatus from 'http-status';

// Server-Sent Events stream manager
class NotificationStreamManager extends EventEmitter {
    private connections: Map<number, { res: any; types?: string[] }> = new Map();

    addConnection(userId: number, res: any, types?: string[]) {
        this.connections.set(userId, { res, types });

        // Clean up on disconnect
        res.on('close', () => {
            this.connections.delete(userId);
        });
    }

    broadcast(userId: number, notification: Notification) {
        const connection = this.connections.get(userId);
        if (connection) {
            const { res, types } = connection;

            // Filter by notification types if specified
            if (!types || types.length === 0 || types.includes(notification.type)) {
                try {
                    const data = JSON.stringify({
                        id: notification.id,
                        type: notification.type,
                        title: notification.title,
                        message: notification.message,
                        data: notification.data,
                        read: notification.read,
                        createdAt: notification.createdAt
                    });

                    res.write(`data: ${data}\n\n`);
                } catch (error) {
                    console.error('Error broadcasting notification:', error);
                    this.connections.delete(userId);
                }
            }
        }
    }

    removeConnection(userId: number) {
        this.connections.delete(userId);
    }
}

export const notificationStreamManager = new NotificationStreamManager();

/**
 * Create a notification
 * @param {Object} notificationData
 * @returns {Promise<Notification>}
 */
const createNotification = async (
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    expiresAt?: Date
): Promise<Notification> => {
    const notification = await prisma.notification.create({
        data: {
            userId,
            type,
            title,
            message,
            data: data || null,
            expiresAt
        }
    });

    // Broadcast to SSE streams
    notificationStreamManager.broadcast(userId, notification);

    return notification;
};

/**
 * Query notifications with pagination and filtering
 * @param {number} userId - User ID to get notifications for
 * @param {Object} filter - Filter options
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
const queryNotifications = async (
    userId: number,
    filter: {
        read?: boolean;
        type?: NotificationType;
    } = {},
    options: {
        limit?: number;
        page?: number;
        sortBy?: string;
        sortType?: 'asc' | 'desc';
    } = {}
): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
}> => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';

    const where = {
        userId,
        ...filter
    };

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: sortType }
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
            where: {
                userId,
                read: false
            }
        })
    ]);

    return {
        notifications,
        total,
        unreadCount
    };
};

/**
 * Get notification by ID
 * @param {string} notificationId
 * @param {number} userId
 * @returns {Promise<Notification | null>}
 */
const getNotificationById = async (notificationId: string, userId: number): Promise<Notification | null> => {
    return await prisma.notification.findFirst({
        where: {
            id: notificationId,
            userId
        }
    });
};

/**
 * Mark notification as read
 * @param {string} notificationId
 * @param {number} userId
 * @returns {Promise<Notification>}
 */
const markNotificationAsRead = async (notificationId: string, userId: number): Promise<Notification> => {
    const notification = await getNotificationById(notificationId, userId);

    if (!notification) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
    }

    return await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
    });
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId
 * @returns {Promise<{markedCount: number}>}
 */
const markAllNotificationsAsRead = async (userId: number): Promise<{ markedCount: number }> => {
    const result = await prisma.notification.updateMany({
        where: {
            userId,
            read: false
        },
        data: { read: true }
    });

    return { markedCount: result.count };
};

/**
 * Delete expired notifications
 * @returns {Promise<{deletedCount: number}>}
 */
const cleanupExpiredNotifications = async (): Promise<{ deletedCount: number }> => {
    const result = await prisma.notification.deleteMany({
        where: {
            expiresAt: {
                lte: new Date()
            }
        }
    });

    return { deletedCount: result.count };
};

/**
 * Helper functions for creating common notification types
 */

const createProcessingCompleteNotification = async (
    userId: number,
    clientId: string,
    clientName: string,
    taskId: string,
    transactionCount?: number
): Promise<Notification> => {
    return await createNotification(
        userId,
        NotificationType.PROCESSING_COMPLETE,
        'Statement Processing Complete',
        `Processing completed successfully for ${clientName} statements`,
        {
            clientId,
            clientName,
            taskId,
            transactionCount,
            processingTime: new Date().toISOString()
        },
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};

const createProcessingFailedNotification = async (
    userId: number,
    clientId: string,
    clientName: string,
    taskId: string,
    error: string
): Promise<Notification> => {
    return await createNotification(
        userId,
        NotificationType.PROCESSING_FAILED,
        'Statement Processing Failed',
        `Processing failed for ${clientName} statements: ${error}`,
        {
            clientId,
            clientName,
            taskId,
            error,
            failedAt: new Date().toISOString()
        },
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};

const createRecommendationReadyNotification = async (
    userId: number,
    clientId: string,
    clientName: string,
    recommendationId: string,
    priority: string,
    estimatedBenefit?: number
): Promise<Notification> => {
    return await createNotification(
        userId,
        NotificationType.RECOMMENDATION_READY,
        'New Recommendation Available',
        `${priority} priority recommendation generated for ${clientName}`,
        {
            clientId,
            clientName,
            recommendationId,
            priority,
            estimatedBenefit,
            generatedAt: new Date().toISOString()
        },
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};

const createStatementUploadedNotification = async (
    userId: number,
    clientId: string,
    clientName: string,
    fileName: string,
    fileSize: number
): Promise<Notification> => {
    return await createNotification(
        userId,
        NotificationType.STATEMENT_UPLOADED,
        'Statement Uploaded',
        `New bank statement uploaded for ${clientName}`,
        {
            clientId,
            clientName,
            fileName,
            fileSize,
            uploadedAt: new Date().toISOString()
        },
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};

const createWorkflowTaskAssignedNotification = async (
    userId: number,
    taskId: string,
    taskType: string,
    clientId: string,
    clientName: string,
    priority: string,
    dueDate?: Date
): Promise<Notification> => {
    return await createNotification(
        userId,
        NotificationType.WORKFLOW_TASK_ASSIGNED,
        'New Task Assigned',
        `${taskType.replace('_', ' ').toLowerCase()} task has been assigned to you`,
        {
            taskId,
            taskType,
            clientId,
            clientName,
            priority,
            dueDate: dueDate?.toISOString(),
            assignedAt: new Date().toISOString()
        },
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};

const createWorkflowTaskCompletedNotification = async (
    userId: number,
    taskId: string,
    taskType: string,
    clientId: string,
    clientName: string,
    completedBy: string
): Promise<Notification> => {
    return await createNotification(
        userId,
        NotificationType.WORKFLOW_TASK_COMPLETED,
        'Task Completed',
        `${taskType.replace('_', ' ').toLowerCase()} task for ${clientName} has been completed`,
        {
            taskId,
            taskType,
            clientId,
            clientName,
            completedBy,
            completedAt: new Date().toISOString()
        },
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};

const createSystemAlertNotification = async (
    userId: number,
    title: string,
    message: string,
    alertData?: any,
    expiresAt?: Date
): Promise<Notification> => {
    return await createNotification(
        userId,
        NotificationType.SYSTEM_ALERT,
        title,
        message,
        alertData,
        expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
    );
};

const createClientUpdatedNotification = async (
    userId: number,
    clientId: string,
    clientName: string,
    updateType: string,
    changes: any[]
): Promise<Notification> => {
    return await createNotification(
        userId,
        NotificationType.CLIENT_UPDATED,
        'Client Updated',
        `${clientName} profile has been updated (${updateType})`,
        {
            clientId,
            clientName,
            updateType,
            changes,
            updatedAt: new Date().toISOString()
        },
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};

export default {
    createNotification,
    queryNotifications,
    getNotificationById,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    cleanupExpiredNotifications,

    // Helper functions
    createProcessingCompleteNotification,
    createProcessingFailedNotification,
    createRecommendationReadyNotification,
    createStatementUploadedNotification,
    createWorkflowTaskAssignedNotification,
    createWorkflowTaskCompletedNotification,
    createSystemAlertNotification,
    createClientUpdatedNotification,

    // Stream manager
    notificationStreamManager
};

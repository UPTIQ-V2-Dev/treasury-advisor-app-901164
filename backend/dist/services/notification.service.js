import prisma from "../client.js";
import { NotificationType } from '../generated/prisma/index.js';
import ApiError from "../utils/ApiError.js";
import { EventEmitter } from 'events';
import httpStatus from 'http-status';
// Server-Sent Events stream manager
class NotificationStreamManager extends EventEmitter {
    connections = new Map();
    addConnection(userId, res, types) {
        this.connections.set(userId, { res, types });
        // Clean up on disconnect
        res.on('close', () => {
            this.connections.delete(userId);
        });
    }
    broadcast(userId, notification) {
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
                }
                catch (error) {
                    console.error('Error broadcasting notification:', error);
                    this.connections.delete(userId);
                }
            }
        }
    }
    removeConnection(userId) {
        this.connections.delete(userId);
    }
}
export const notificationStreamManager = new NotificationStreamManager();
/**
 * Create a notification
 * @param {Object} notificationData
 * @returns {Promise<Notification>}
 */
const createNotification = async (userId, type, title, message, data, expiresAt) => {
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
const queryNotifications = async (userId, filter = {}, options = {}) => {
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
const getNotificationById = async (notificationId, userId) => {
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
const markNotificationAsRead = async (notificationId, userId) => {
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
const markAllNotificationsAsRead = async (userId) => {
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
const cleanupExpiredNotifications = async () => {
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
const createProcessingCompleteNotification = async (userId, clientId, clientName, taskId, transactionCount) => {
    return await createNotification(userId, NotificationType.PROCESSING_COMPLETE, 'Statement Processing Complete', `Processing completed successfully for ${clientName} statements`, {
        clientId,
        clientName,
        taskId,
        transactionCount,
        processingTime: new Date().toISOString()
    }, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};
const createProcessingFailedNotification = async (userId, clientId, clientName, taskId, error) => {
    return await createNotification(userId, NotificationType.PROCESSING_FAILED, 'Statement Processing Failed', `Processing failed for ${clientName} statements: ${error}`, {
        clientId,
        clientName,
        taskId,
        error,
        failedAt: new Date().toISOString()
    }, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};
const createRecommendationReadyNotification = async (userId, clientId, clientName, recommendationId, priority, estimatedBenefit) => {
    return await createNotification(userId, NotificationType.RECOMMENDATION_READY, 'New Recommendation Available', `${priority} priority recommendation generated for ${clientName}`, {
        clientId,
        clientName,
        recommendationId,
        priority,
        estimatedBenefit,
        generatedAt: new Date().toISOString()
    }, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};
const createStatementUploadedNotification = async (userId, clientId, clientName, fileName, fileSize) => {
    return await createNotification(userId, NotificationType.STATEMENT_UPLOADED, 'Statement Uploaded', `New bank statement uploaded for ${clientName}`, {
        clientId,
        clientName,
        fileName,
        fileSize,
        uploadedAt: new Date().toISOString()
    }, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};
const createWorkflowTaskAssignedNotification = async (userId, taskId, taskType, clientId, clientName, priority, dueDate) => {
    return await createNotification(userId, NotificationType.WORKFLOW_TASK_ASSIGNED, 'New Task Assigned', `${taskType.replace('_', ' ').toLowerCase()} task has been assigned to you`, {
        taskId,
        taskType,
        clientId,
        clientName,
        priority,
        dueDate: dueDate?.toISOString(),
        assignedAt: new Date().toISOString()
    }, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};
const createWorkflowTaskCompletedNotification = async (userId, taskId, taskType, clientId, clientName, completedBy) => {
    return await createNotification(userId, NotificationType.WORKFLOW_TASK_COMPLETED, 'Task Completed', `${taskType.replace('_', ' ').toLowerCase()} task for ${clientName} has been completed`, {
        taskId,
        taskType,
        clientId,
        clientName,
        completedBy,
        completedAt: new Date().toISOString()
    }, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );
};
const createSystemAlertNotification = async (userId, title, message, alertData, expiresAt) => {
    return await createNotification(userId, NotificationType.SYSTEM_ALERT, title, message, alertData, expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
    );
};
const createClientUpdatedNotification = async (userId, clientId, clientName, updateType, changes) => {
    return await createNotification(userId, NotificationType.CLIENT_UPDATED, 'Client Updated', `${clientName} profile has been updated (${updateType})`, {
        clientId,
        clientName,
        updateType,
        changes,
        updatedAt: new Date().toISOString()
    }, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
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

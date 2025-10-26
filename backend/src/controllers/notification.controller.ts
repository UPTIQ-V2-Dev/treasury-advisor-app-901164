import { NotificationType } from '../generated/prisma/index.js';
import { notificationService } from '../services/index.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import httpStatus from 'http-status';

const getNotifications = catchAsyncWithAuth(async (req, res) => {
    const filter = pick(req.validatedQuery, ['read', 'type']);
    const options = pick(req.validatedQuery, ['sortBy', 'sortType', 'limit', 'page']);

    const result = await notificationService.queryNotifications(req.user.id, filter, options);
    res.send(result);
});

const getNotificationStream = catchAsyncWithAuth((req, res) => {
    // Set headers for Server-Sent Events
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Parse types filter
    let types: string[] | undefined = undefined;
    if (req.validatedQuery.types) {
        if (Array.isArray(req.validatedQuery.types)) {
            types = req.validatedQuery.types;
        } else {
            types = [req.validatedQuery.types as string];
        }
    }

    // Send initial connection confirmation
    res.write('data: {"type":"connected","message":"SSE connection established"}\n\n');

    // Add connection to stream manager
    notificationService.notificationStreamManager.addConnection(req.user.id, res, types);

    // Clean up on client disconnect
    req.on('close', () => {
        notificationService.notificationStreamManager.removeConnection(req.user.id);
    });

    // Keep connection alive with periodic heartbeats
    const heartbeat = setInterval(() => {
        try {
            res.write('data: {"type":"heartbeat","timestamp":"' + new Date().toISOString() + '"}\n\n');
        } catch (error) {
            clearInterval(heartbeat);
            notificationService.notificationStreamManager.removeConnection(req.user.id);
        }
    }, 30000); // 30 seconds

    // Clean up heartbeat on disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
    });
});

const markNotificationAsRead = catchAsyncWithAuth(async (req, res) => {
    await notificationService.markNotificationAsRead(req.params.notificationId, req.user.id);
    res.send({});
});

const markAllNotificationsAsRead = catchAsyncWithAuth(async (req, res) => {
    const result = await notificationService.markAllNotificationsAsRead(req.user.id);
    res.send(result);
});

// Admin-only: Create notification (for MCP tools)
const createNotification = catchAsyncWithAuth(async (req, res) => {
    const { userId, type, title, message, data, expiresAt } = req.body;
    const notification = await notificationService.createNotification(
        userId,
        type as NotificationType,
        title,
        message,
        data,
        expiresAt ? new Date(expiresAt) : undefined
    );
    res.status(httpStatus.CREATED).send(notification);
});

// Admin-only: Cleanup expired notifications
const cleanupExpiredNotifications = catchAsyncWithAuth(async (req, res) => {
    const result = await notificationService.cleanupExpiredNotifications();
    res.send(result);
});

export default {
    getNotifications,
    getNotificationStream,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    createNotification,
    cleanupExpiredNotifications
};

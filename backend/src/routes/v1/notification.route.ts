import { notificationController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { notificationValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

// Real-time SSE stream
router
    .route('/stream')
    .get(
        auth('getNotifications'),
        validate(notificationValidation.getNotificationStream),
        notificationController.getNotificationStream
    );

// Notifications CRUD
router
    .route('/')
    .get(
        auth('getNotifications'),
        validate(notificationValidation.getNotifications),
        notificationController.getNotifications
    )
    .post(
        auth('manageNotifications'),
        validate(notificationValidation.createNotification),
        notificationController.createNotification
    );

// Mark notification as read
router
    .route('/:notificationId/read')
    .post(
        auth('manageNotifications'),
        validate(notificationValidation.markNotificationAsRead),
        notificationController.markNotificationAsRead
    );

// Mark all notifications as read
router.route('/read-all').post(auth('manageNotifications'), notificationController.markAllNotificationsAsRead);

// Admin routes
router.route('/cleanup-expired').post(auth('manageNotifications'), notificationController.cleanupExpiredNotifications);

export default router;

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Real-time notification management
 */

/**
 * @swagger
 * /notifications/stream:
 *   get:
 *     summary: Server-sent events stream for real-time notifications
 *     description: Establishes a real-time connection to receive notifications as they are created
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: types
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [PROCESSING_COMPLETE, PROCESSING_FAILED, RECOMMENDATION_READY, STATEMENT_UPLOADED, CLIENT_UPDATED, WORKFLOW_TASK_ASSIGNED, WORKFLOW_TASK_COMPLETED, SYSTEM_ALERT, GENERAL]
 *         description: Filter notifications by type
 *     responses:
 *       "200":
 *         description: Server-sent events stream
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications with pagination
 *     description: Retrieve notifications for the authenticated user with filtering and pagination
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of notifications per page
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PROCESSING_COMPLETE, PROCESSING_FAILED, RECOMMENDATION_READY, STATEMENT_UPLOADED, CLIENT_UPDATED, WORKFLOW_TASK_ASSIGNED, WORKFLOW_TASK_COMPLETED, SYSTEM_ALERT, GENERAL]
 *         description: Filter by notification type
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 total:
 *                   type: integer
 *                   description: Total number of notifications
 *                 unreadCount:
 *                   type: integer
 *                   description: Number of unread notifications
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     summary: Create a notification
 *     description: Create a new notification (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [PROCESSING_COMPLETE, PROCESSING_FAILED, RECOMMENDATION_READY, STATEMENT_UPLOADED, CLIENT_UPDATED, WORKFLOW_TASK_ASSIGNED, WORKFLOW_TASK_COMPLETED, SYSTEM_ALERT, GENERAL]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *                 description: Additional notification data
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Notification expiration date
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   post:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     summary: Mark all notifications as read
 *     description: Mark all notifications as read for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 markedCount:
 *                   type: integer
 *                   description: Number of notifications marked as read
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Notification ID
 *         type:
 *           type: string
 *           enum: [PROCESSING_COMPLETE, PROCESSING_FAILED, RECOMMENDATION_READY, STATEMENT_UPLOADED, CLIENT_UPDATED, WORKFLOW_TASK_ASSIGNED, WORKFLOW_TASK_COMPLETED, SYSTEM_ALERT, GENERAL]
 *           description: Type of notification
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message
 *         data:
 *           type: object
 *           description: Additional notification data
 *         read:
 *           type: boolean
 *           description: Whether the notification has been read
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         userId:
 *           type: integer
 *           description: User ID
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration timestamp (optional)
 *       example:
 *         id: "notif-123"
 *         type: "PROCESSING_COMPLETE"
 *         title: "Statement Processing Complete"
 *         message: "Processing completed successfully for ABC Corporation statements"
 *         data:
 *           clientId: "client-123"
 *           clientName: "ABC Corporation"
 *           taskId: "task-456"
 *         read: false
 *         createdAt: "2024-01-15T10:00:00Z"
 *         userId: 1
 *         expiresAt: "2024-02-15T10:00:00Z"
 */

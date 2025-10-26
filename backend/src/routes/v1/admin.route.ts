import { adminController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { adminValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

// System health endpoint
router
    .route('/system/health')
    .get(auth('adminAccess'), validate(adminValidation.getSystemHealth), adminController.getSystemHealth);

// System logs endpoint
router
    .route('/system/logs')
    .get(auth('adminAccess'), validate(adminValidation.getSystemLogs), adminController.getSystemLogs);

// Maintenance operations
router
    .route('/system/maintenance')
    .post(auth('adminAccess'), validate(adminValidation.createMaintenanceTask), adminController.createMaintenanceTask);

router
    .route('/system/maintenance/:taskId')
    .get(auth('adminAccess'), validate(adminValidation.getMaintenanceTask), adminController.getMaintenanceTask);

// Analytics endpoints
router
    .route('/analytics/usage')
    .get(auth('adminAccess'), validate(adminValidation.getUsageAnalytics), adminController.getUsageAnalytics);

export default router;

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: System administration and monitoring endpoints
 */

/**
 * @swagger
 * /admin/system/health:
 *   get:
 *     summary: Get system health status
 *     description: Get comprehensive system health information including services status, uptime, and metrics. Only admins can access this endpoint.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                   example: healthy
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 uptime:
 *                   type: number
 *                   description: System uptime in seconds
 *                   example: 3600
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                     processing:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                     storage:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     memory:
 *                       type: object
 *                     cpuUsage:
 *                       type: object
 *                     activeConnections:
 *                       type: number
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /admin/system/logs:
 *   get:
 *     summary: Get system logs
 *     description: Retrieve system logs with filtering capabilities. Only admins can access this endpoint.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: Filter by log level
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: Filter by service name
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start time for log filtering (ISO 8601)
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End time for log filtering (ISO 8601)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of log entries to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       "200":
 *         description: System logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   level:
 *                     type: string
 *                     enum: [error, warn, info, debug]
 *                   service:
 *                     type: string
 *                   message:
 *                     type: string
 *                   metadata:
 *                     type: object
 *                   traceId:
 *                     type: string
 *                     nullable: true
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /admin/system/maintenance:
 *   post:
 *     summary: Trigger maintenance operation
 *     description: Start a system maintenance operation. Only admins can access this endpoint.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [database_cleanup, cache_clear, index_rebuild]
 *                 description: Type of maintenance operation to perform
 *               parameters:
 *                 type: object
 *                 description: Optional parameters specific to the operation
 *             example:
 *               operation: database_cleanup
 *               parameters:
 *                 olderThan: "30d"
 *     responses:
 *       "202":
 *         description: Maintenance task created and accepted for processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                   description: Unique identifier for the maintenance task
 *                 estimatedDuration:
 *                   type: integer
 *                   description: Estimated duration in seconds
 *               example:
 *                 taskId: "123e4567-e89b-12d3-a456-426614174000"
 *                 estimatedDuration: 300
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /admin/system/maintenance/{taskId}:
 *   get:
 *     summary: Get maintenance task status
 *     description: Get the status and details of a maintenance task. Only admins can access this endpoint.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Maintenance task ID
 *     responses:
 *       "200":
 *         description: Maintenance task details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 operation:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, running, completed, failed]
 *                 parameters:
 *                   type: object
 *                   nullable: true
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 endTime:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 estimatedDuration:
 *                   type: integer
 *                   nullable: true
 *                 results:
 *                   type: object
 *                   nullable: true
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /admin/analytics/usage:
 *   get:
 *     summary: Get system usage analytics
 *     description: Get system usage analytics and metrics over specified time period. Only admins can access this endpoint.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d]
 *           default: 7d
 *         description: Time period for analytics
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: Data granularity
 *     responses:
 *       "200":
 *         description: System usage analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usage:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: integer
 *                     clients:
 *                       type: integer
 *                     transactions:
 *                       type: integer
 *                     statements:
 *                       type: integer
 *                     processingTasks:
 *                       type: integer
 *                 trends:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         change:
 *                           type: string
 *                         direction:
 *                           type: string
 *                     clients:
 *                       type: object
 *                       properties:
 *                         change:
 *                           type: string
 *                         direction:
 *                           type: string
 *                     transactions:
 *                       type: object
 *                       properties:
 *                         change:
 *                           type: string
 *                         direction:
 *                           type: string
 *                 topUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       clientCount:
 *                         type: integer
 *               example:
 *                 usage:
 *                   users: 25
 *                   clients: 150
 *                   transactions: 5000
 *                   statements: 300
 *                   processingTasks: 45
 *                 trends:
 *                   users:
 *                     change: "+5%"
 *                     direction: "up"
 *                   clients:
 *                     change: "+12%"
 *                     direction: "up"
 *                 topUsers:
 *                   - id: 1
 *                     name: "John Smith"
 *                     email: "john.smith@example.com"
 *                     clientCount: 25
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

import { processingController } from "../../controllers/index.js";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import { processingValidation } from "../../validations/index.js";
import express from 'express';
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     ProcessingTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Task database ID
 *         taskId:
 *           type: string
 *           description: Unique task identifier
 *         clientId:
 *           type: string
 *           description: Client ID associated with the task
 *         client:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         statementId:
 *           type: string
 *           description: Statement ID if task is related to a statement
 *           nullable: true
 *         statement:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             fileName:
 *               type: string
 *         type:
 *           type: string
 *           enum: [STATEMENT_PARSE, DATA_SYNC, ANALYSIS, RECOMMENDATION_GENERATION]
 *           description: Type of processing task
 *         status:
 *           type: string
 *           enum: [PENDING, RUNNING, COMPLETED, FAILED, CANCELLED]
 *           description: Current task status
 *         progress:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Task completion percentage
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Task start time
 *         endTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Task end time
 *         estimatedDuration:
 *           type: integer
 *           nullable: true
 *           description: Estimated duration in milliseconds
 *         currentStep:
 *           type: object
 *           nullable: true
 *           description: Current processing step information
 *         steps:
 *           type: array
 *           items:
 *             type: object
 *           description: List of processing steps
 *         error:
 *           type: object
 *           nullable: true
 *           description: Error information if task failed
 *         results:
 *           type: object
 *           nullable: true
 *           description: Task results when completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - taskId
 *         - clientId
 *         - type
 *         - status
 *         - progress
 *         - startTime
 *         - steps
 *         - createdAt
 *         - updatedAt
 */
/**
 * @swagger
 * /processing/tasks/{taskId}:
 *   get:
 *     summary: Get detailed information about a processing task
 *     tags: [Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProcessingTask'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/tasks/:taskId', auth('getProcessing'), validate(processingValidation.getTaskById), processingController.getTaskById);
/**
 * @swagger
 * /processing/clients/{clientId}/tasks:
 *   get:
 *     summary: Get all processing tasks for a client
 *     tags: [Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProcessingTask'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/clients/:clientId/tasks', auth('getProcessing'), validate(processingValidation.getClientTasks), processingController.getClientTasks);
/**
 * @swagger
 * /processing/start:
 *   post:
 *     summary: Start a new processing task
 *     tags: [Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - type
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *                 description: Client ID
 *               type:
 *                 type: string
 *                 enum: [STATEMENT_PARSE, DATA_SYNC, ANALYSIS, RECOMMENDATION_GENERATION]
 *                 description: Type of processing task
 *               options:
 *                 type: object
 *                 description: Task-specific options
 *                 properties:
 *                   statementId:
 *                     type: string
 *                     format: uuid
 *                     description: Statement ID for statement-related tasks
 *                   includeRecommendations:
 *                     type: boolean
 *                     description: Whether to include recommendations in analysis
 *                   analysisDepth:
 *                     type: string
 *                     enum: [basic, detailed, comprehensive]
 *                     description: Depth of analysis to perform
 *                   dateRange:
 *                     type: object
 *                     properties:
 *                       startDate:
 *                         type: string
 *                         format: date
 *                       endDate:
 *                         type: string
 *                         format: date
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Transaction categories to include
 *                   priority:
 *                     type: string
 *                     enum: [low, medium, high]
 *                     description: Task priority
 *     responses:
 *       202:
 *         description: Processing task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                   description: ID of the started task
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/start', auth('manageProcessing'), validate(processingValidation.startProcessing), processingController.startProcessing);
/**
 * @swagger
 * /processing/tasks/{taskId}/cancel:
 *   post:
 *     summary: Cancel a running processing task
 *     tags: [Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/tasks/:taskId/cancel', auth('manageProcessing'), validate(processingValidation.cancelTask), processingController.cancelTask);
/**
 * @swagger
 * /processing/tasks/{taskId}/retry:
 *   post:
 *     summary: Retry a failed processing task
 *     tags: [Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       202:
 *         description: Task retry started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                   description: ID of the new task created for retry
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/tasks/:taskId/retry', auth('manageProcessing'), validate(processingValidation.retryTask), processingController.retryTask);
/**
 * @swagger
 * /processing/metrics:
 *   get:
 *     summary: Get overall processing system metrics
 *     tags: [Processing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Processing metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTasks:
 *                   type: integer
 *                   description: Total number of tasks
 *                 completedTasks:
 *                   type: integer
 *                   description: Number of completed tasks
 *                 failedTasks:
 *                   type: integer
 *                   description: Number of failed tasks
 *                 averageProcessingTime:
 *                   type: integer
 *                   description: Average processing time in milliseconds
 *                 currentLoad:
 *                   type: number
 *                   format: float
 *                   minimum: 0
 *                   maximum: 1
 *                   description: Current system load (0-1)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/metrics', auth('getProcessing'), validate(processingValidation.getMetrics), processingController.getMetrics);
/**
 * @swagger
 * /processing/clients/{clientId}/history:
 *   get:
 *     summary: Get processing history for a client with pagination
 *     tags: [Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of tasks to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of tasks to skip
 *     responses:
 *       200:
 *         description: Processing history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProcessingTask'
 *                 total:
 *                   type: integer
 *                   description: Total number of tasks for this client
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/clients/:clientId/history', auth('getProcessing'), validate(processingValidation.getClientHistory), processingController.getClientHistory);
/**
 * @swagger
 * /processing/tasks/{taskId}/stream:
 *   get:
 *     summary: Server-sent events stream for real-time processing updates
 *     tags: [Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Event stream started successfully
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: Server-sent events stream with real-time task updates
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/tasks/:taskId/stream', auth('getProcessing'), validate(processingValidation.getTaskStream), processingController.getTaskStream);
/**
 * @swagger
 * /processing/tasks/{taskId}/logs:
 *   get:
 *     summary: Get processing logs for a specific task
 *     tags: [Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [debug, info, warn, error]
 *         description: Log level filter
 *     responses:
 *       200:
 *         description: Processing logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               description: Array of log messages
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/tasks/:taskId/logs', auth('getProcessing'), validate(processingValidation.getTaskLogs), processingController.getTaskLogs);
export default router;

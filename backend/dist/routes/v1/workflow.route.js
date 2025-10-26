import { workflowController } from "../../controllers/index.js";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import { workflowValidation } from "../../validations/index.js";
import express from 'express';
const router = express.Router();
// Workflow tasks routes
router
    .route('/tasks')
    .get(auth('getWorkflowTasks'), validate(workflowValidation.getWorkflowTasks), workflowController.getWorkflowTasks)
    .post(auth('manageWorkflowTasks'), validate(workflowValidation.createWorkflowTask), workflowController.createWorkflowTask);
router
    .route('/tasks/:taskId/complete')
    .post(auth('manageWorkflowTasks'), validate(workflowValidation.completeWorkflowTask), workflowController.completeWorkflowTask);
// Audit trail routes
router
    .route('/audit/:clientId')
    .get(auth('getWorkflowAudit'), validate(workflowValidation.getWorkflowAudit), workflowController.getWorkflowAudit);
export default router;
/**
 * @swagger
 * tags:
 *   name: Workflow
 *   description: Workflow and approval management
 */
/**
 * @swagger
 * /workflow/tasks:
 *   get:
 *     summary: Get workflow tasks for current user
 *     description: Retrieve workflow tasks with optional filtering by status, type, and assigned user
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter by task status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [RECOMMENDATION_APPROVAL, CLIENT_REVIEW, STATEMENT_REVIEW, RISK_ASSESSMENT, GENERAL_TASK]
 *         description: Filter by task type
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter by client ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         default: 20
 *         description: Number of tasks per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [RECOMMENDATION_APPROVAL, CLIENT_REVIEW, STATEMENT_REVIEW, RISK_ASSESSMENT, GENERAL_TASK]
 *                   status:
 *                     type: string
 *                     enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *                   priority:
 *                     type: string
 *                     enum: [HIGH, MEDIUM, LOW]
 *                   clientId:
 *                     type: string
 *                   clientName:
 *                     type: string
 *                   assignedTo:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   metadata:
 *                     type: object
 *                     nullable: true
 *                   client:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       businessType:
 *                         type: string
 *                       industry:
 *                         type: string
 *                       riskProfile:
 *                         type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 *
 *   post:
 *     summary: Create a new workflow task
 *     description: Create a new workflow task for approval or review processes
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - clientId
 *               - clientName
 *               - assignedTo
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [RECOMMENDATION_APPROVAL, CLIENT_REVIEW, STATEMENT_REVIEW, RISK_ASSESSMENT, GENERAL_TASK]
 *               priority:
 *                 type: string
 *                 enum: [HIGH, MEDIUM, LOW]
 *               clientId:
 *                 type: string
 *               clientName:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *             example:
 *               type: RECOMMENDATION_APPROVAL
 *               priority: HIGH
 *               clientId: "client-123"
 *               clientName: "ABC Corp"
 *               assignedTo: "user-456"
 *               dueDate: "2024-01-20T10:00:00Z"
 *               metadata:
 *                 recommendationId: "rec-789"
 *                 productType: "High-Yield Savings"
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 type:
 *                   type: string
 *                 status:
 *                   type: string
 *                 priority:
 *                   type: string
 *                 clientId:
 *                   type: string
 *                 clientName:
 *                   type: string
 *                 assignedTo:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 dueDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */
/**
 * @swagger
 * /workflow/tasks/{taskId}/complete:
 *   post:
 *     summary: Complete a workflow task
 *     description: Complete a workflow task with resolution and optional comments
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workflow task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resolution
 *             properties:
 *               resolution:
 *                 type: string
 *                 description: Task completion resolution
 *               comments:
 *                 type: string
 *                 description: Optional completion comments
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional attachment file IDs
 *             example:
 *               resolution: "approved"
 *               comments: "Recommendation approved for implementation in Q2"
 *               attachments: ["file-123", "file-456"]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     resolution:
 *                       type: string
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                     completedBy:
 *                       type: string
 *                 nextSteps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       assignedTo:
 *                         type: string
 *                       dueDate:
 *                         type: string
 *                         format: date-time
 *                       description:
 *                         type: string
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       recipient:
 *                         type: string
 *                       message:
 *                         type: string
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "409":
 *         description: Task cannot be completed
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */
/**
 * @swagger
 * /workflow/audit/{clientId}:
 *   get:
 *     summary: Get audit trail for client workflow activities
 *     description: Retrieve workflow audit trail entries for a specific client with optional filtering
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: activityType
 *         schema:
 *           type: string
 *           enum: [TASK_CREATED, TASK_ASSIGNED, TASK_COMPLETED, RECOMMENDATION_APPROVED, RECOMMENDATION_REJECTED, CLIENT_UPDATED, STATEMENT_PROCESSED]
 *         description: Filter by activity type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         default: 50
 *         description: Number of audit entries per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       "200":
 *         description: OK
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
 *                   activityType:
 *                     type: string
 *                     enum: [TASK_CREATED, TASK_ASSIGNED, TASK_COMPLETED, RECOMMENDATION_APPROVED, RECOMMENDATION_REJECTED, CLIENT_UPDATED, STATEMENT_PROCESSED]
 *                   userId:
 *                     type: string
 *                   userName:
 *                     type: string
 *                   description:
 *                     type: string
 *                   changes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         field:
 *                           type: string
 *                         oldValue:
 *                           type: string
 *                         newValue:
 *                           type: string
 *                   metadata:
 *                     type: object
 *                     nullable: true
 *                   client:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       businessType:
 *                         type: string
 *                       industry:
 *                         type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */

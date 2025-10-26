import { agentController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { agentValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

router
    .route('/trigger')
    .post(auth('manageAgentTasks'), validate(agentValidation.triggerAgent), agentController.triggerAgent);

router
    .route('/tasks/:agentTaskId')
    .get(auth('getAgentTasks'), validate(agentValidation.getAgentTask), agentController.getAgentTask);

router
    .route('/document-analysis')
    .post(
        auth('manageAgentTasks'),
        validate(agentValidation.createDocumentAnalysis),
        agentController.createDocumentAnalysis
    );

router
    .route('/analysis/:analysisTaskId')
    .get(auth('getAgentTasks'), validate(agentValidation.getAgentAnalysis), agentController.getAgentAnalysis);

export default router;

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: AI Agent integration for enhanced processing and recommendations
 */

/**
 * @swagger
 * /agents/trigger:
 *   post:
 *     summary: Trigger AI agent for enhanced processing and recommendations
 *     description: Start an AI agent task for processing, analysis, or recommendation generation
 *     tags: [Agents]
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
 *               - agentType
 *               - context
 *             properties:
 *               clientId:
 *                 type: string
 *                 description: Client ID for the agent task
 *               agentType:
 *                 type: string
 *                 enum: [recommendation, analysis, processing]
 *                 description: Type of agent processing
 *               context:
 *                 type: object
 *                 description: Context data for agent processing
 *               options:
 *                 type: object
 *                 description: Optional configuration for agent
 *             example:
 *               clientId: "client-123"
 *               agentType: "recommendation"
 *               context:
 *                 transactionData: true
 *                 riskProfile: "medium"
 *               options:
 *                 includeForecasting: true
 *     responses:
 *       "202":
 *         description: Accepted - Agent task started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agentTaskId:
 *                   type: string
 *                   description: Unique identifier for the agent task
 *                 estimatedDuration:
 *                   type: integer
 *                   description: Estimated duration in seconds
 *               example:
 *                 agentTaskId: "agent-task-456"
 *                 estimatedDuration: 120
 *       "400":
 *         description: Invalid agent configuration
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: Client not found
 */

/**
 * @swagger
 * /agents/tasks/{agentTaskId}:
 *   get:
 *     summary: Get AI agent task status and results
 *     description: Retrieve the current status and results of an AI agent task
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentTaskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent task ID
 *     responses:
 *       "200":
 *         description: Agent task details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [PENDING, RUNNING, COMPLETED, FAILED, CANCELLED]
 *                 progress:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 100
 *                 results:
 *                   type: object
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *                 endTime:
 *                   type: string
 *                   format: date-time
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: string
 *               example:
 *                 id: "agent-task-456"
 *                 status: "COMPLETED"
 *                 progress: 100
 *                 results:
 *                   recommendations: []
 *                   insights: []
 *                   confidence: 0.92
 *                 startTime: "2024-01-15T10:00:00Z"
 *                 endTime: "2024-01-15T10:02:00Z"
 *                 logs: ["Agent initialized", "Processing client data"]
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: Agent task not found
 */

/**
 * @swagger
 * /agents/document-analysis:
 *   post:
 *     summary: Analyze documents using AI agents for enhanced insights
 *     description: Start AI-powered analysis of uploaded documents
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileIds
 *               - analysisType
 *               - clientId
 *             properties:
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of file IDs to analyze
 *               analysisType:
 *                 type: string
 *                 enum: [financial_patterns, risk_assessment, compliance_check]
 *                 description: Type of analysis to perform
 *               clientId:
 *                 type: string
 *                 description: Client ID for the analysis
 *             example:
 *               fileIds: ["stmt-456", "stmt-789"]
 *               analysisType: "financial_patterns"
 *               clientId: "client-123"
 *     responses:
 *       "202":
 *         description: Accepted - Analysis task started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysisTaskId:
 *                   type: string
 *                   description: Unique identifier for the analysis task
 *               example:
 *                 analysisTaskId: "analysis-task-789"
 *       "400":
 *         description: Invalid analysis parameters
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: Client or files not found
 */

/**
 * @swagger
 * /agents/analysis/{analysisTaskId}:
 *   get:
 *     summary: Get document analysis results from AI agents
 *     description: Retrieve the results of AI-powered document analysis
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisTaskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Analysis task ID
 *     responses:
 *       "200":
 *         description: Analysis results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [PENDING, RUNNING, COMPLETED, FAILED, CANCELLED]
 *                 results:
 *                   type: object
 *                   properties:
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: object
 *                     patterns:
 *                       type: array
 *                       items:
 *                         type: object
 *                     anomalies:
 *                       type: array
 *                       items:
 *                         type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                 confidence:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 1
 *                 processingTime:
 *                   type: integer
 *                   description: Processing time in seconds
 *               example:
 *                 id: "analysis-task-789"
 *                 status: "COMPLETED"
 *                 results:
 *                   insights:
 *                     - type: "cash_flow"
 *                       description: "Seasonal patterns detected"
 *                       confidence: 0.88
 *                   patterns: []
 *                   anomalies: []
 *                   recommendations: ["Consider automated bill pay"]
 *                 confidence: 0.89
 *                 processingTime: 180
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: Analysis task not found
 */

import { recommendationController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { recommendationValidation } from '../../validations/index.ts';
import express, { Router } from 'express';

const router: Router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Recommendation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the recommendation
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Client ID this recommendation is for
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Treasury product ID being recommended
 *         priority:
 *           type: string
 *           enum: [HIGH, MEDIUM, LOW]
 *           description: Priority level of the recommendation
 *         rationale:
 *           type: object
 *           description: AI-generated rationale for the recommendation
 *         estimatedBenefit:
 *           type: object
 *           description: Estimated benefits and savings
 *         implementation:
 *           type: object
 *           description: Implementation details and timeline
 *         supportingData:
 *           type: array
 *           items:
 *             type: object
 *           description: Supporting data and metrics
 *         confidence:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Confidence score of the recommendation
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, IMPLEMENTED]
 *           description: Current status of the recommendation
 *         reviewedBy:
 *           type: string
 *           description: ID of the reviewer
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *           description: Date when reviewed
 *         implementedAt:
 *           type: string
 *           format: date-time
 *           description: Date when implemented
 *         notes:
 *           type: string
 *           description: Additional notes or comments
 *         feedback:
 *           type: object
 *           description: Client feedback on the recommendation
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         product:
 *           $ref: '#/components/schemas/TreasuryProduct'
 *         client:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             businessType:
 *               type: string
 *             riskProfile:
 *               type: string
 *       required:
 *         - id
 *         - clientId
 *         - productId
 *         - priority
 *         - rationale
 *         - estimatedBenefit
 *         - implementation
 *         - confidence
 *         - status
 *         - createdAt
 *         - updatedAt
 *
 *     RecommendationSummary:
 *       type: object
 *       properties:
 *         totalRecommendations:
 *           type: integer
 *           description: Total number of recommendations
 *         highPriorityCount:
 *           type: integer
 *           description: Number of high priority recommendations
 *         totalEstimatedSavings:
 *           type: number
 *           description: Total estimated annual savings from all recommendations
 *         categoryCounts:
 *           type: object
 *           description: Count of recommendations by product category
 *         statusCounts:
 *           type: object
 *           description: Count of recommendations by status
 */

/**
 * @swagger
 * /recommendations/{clientId}:
 *   get:
 *     summary: Get all recommendations for a client
 *     description: Retrieve all recommendations for a specific client, ordered by priority and creation date
 *     tags: [Recommendations]
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
 *         description: Successfully retrieved recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recommendation'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */
router.get(
    '/:clientId',
    auth('getRecommendations'),
    validate(recommendationValidation.getByClientId),
    recommendationController.getRecommendationsByClientId
);

/**
 * @swagger
 * /recommendations/generate:
 *   post:
 *     summary: Generate new recommendations
 *     description: Trigger AI-driven recommendation generation for a client based on their analytics and profile
 *     tags: [Recommendations]
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
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *                 description: Client ID to generate recommendations for
 *     responses:
 *       202:
 *         description: Recommendation generation started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                   description: Task ID for tracking recommendation generation progress
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */
router.post(
    '/generate',
    auth('manageRecommendations'),
    validate(recommendationValidation.generate),
    recommendationController.generateRecommendations
);

/**
 * @swagger
 * /recommendations/detail/{recommendationId}:
 *   get:
 *     summary: Get detailed recommendation information
 *     description: Retrieve comprehensive details about a specific recommendation including product info and implementation details
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recommendation ID
 *     responses:
 *       200:
 *         description: Successfully retrieved recommendation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recommendation'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 *       500:
 *         description: Internal server error
 */
router.get(
    '/detail/:recommendationId',
    auth('getRecommendations'),
    validate(recommendationValidation.getById),
    recommendationController.getRecommendationById
);

/**
 * @swagger
 * /recommendations/feedback:
 *   post:
 *     summary: Provide feedback on a recommendation
 *     description: Submit client feedback on a recommendation including acceptance, rejection, or modification requests
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recommendationId
 *               - feedback
 *             properties:
 *               recommendationId:
 *                 type: string
 *                 format: uuid
 *                 description: Recommendation ID
 *               feedback:
 *                 type: string
 *                 enum: [accepted, rejected, needs_modification, deferred]
 *                 description: Type of feedback
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for the feedback
 *               modifications:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Requested modifications
 *               implementationDate:
 *                 type: string
 *                 format: date-time
 *                 description: Preferred implementation date
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Invalid feedback data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 *       500:
 *         description: Internal server error
 */
router.post(
    '/feedback',
    auth('manageRecommendations'),
    validate(recommendationValidation.feedback),
    recommendationController.provideFeedback
);

/**
 * @swagger
 * /recommendations/{recommendationId}/approve:
 *   post:
 *     summary: Approve a recommendation
 *     description: Approve a recommendation for implementation with reviewer comments
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recommendation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewerId
 *             properties:
 *               reviewerId:
 *                 type: string
 *                 description: ID of the reviewing user
 *               comments:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Reviewer comments
 *     responses:
 *       200:
 *         description: Recommendation approved successfully
 *       400:
 *         description: Invalid approval data or recommendation not in pending status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 *       500:
 *         description: Internal server error
 */
router.post(
    '/:recommendationId/approve',
    auth('manageRecommendations'),
    validate(recommendationValidation.approve),
    recommendationController.approveRecommendation
);

/**
 * @swagger
 * /recommendations/{recommendationId}/reject:
 *   post:
 *     summary: Reject a recommendation
 *     description: Reject a recommendation with a specified reason
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recommendation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewerId
 *               - reason
 *             properties:
 *               reviewerId:
 *                 type: string
 *                 description: ID of the reviewing user
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: Reason for rejection
 *     responses:
 *       200:
 *         description: Recommendation rejected successfully
 *       400:
 *         description: Invalid rejection data or recommendation not in pending status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 *       500:
 *         description: Internal server error
 */
router.post(
    '/:recommendationId/reject',
    auth('manageRecommendations'),
    validate(recommendationValidation.reject),
    recommendationController.rejectRecommendation
);

/**
 * @swagger
 * /recommendations/summary/{clientId}:
 *   get:
 *     summary: Get recommendation summary
 *     description: Get summary statistics of recommendations for a client
 *     tags: [Recommendations]
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
 *         description: Successfully retrieved recommendation summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecommendationSummary'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */
router.get(
    '/summary/:clientId',
    auth('getRecommendations'),
    validate(recommendationValidation.getSummary),
    recommendationController.getRecommendationSummary
);

/**
 * @swagger
 * /recommendations/{recommendationId}/priority:
 *   patch:
 *     summary: Update recommendation priority
 *     description: Update the priority level of a recommendation
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recommendation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priority
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [HIGH, MEDIUM, LOW]
 *                 description: New priority level
 *     responses:
 *       200:
 *         description: Priority updated successfully
 *       400:
 *         description: Invalid priority level
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 *       500:
 *         description: Internal server error
 */
router.patch(
    '/:recommendationId/priority',
    auth('manageRecommendations'),
    validate(recommendationValidation.updatePriority),
    recommendationController.updateRecommendationPriority
);

/**
 * @swagger
 * /recommendations/{recommendationId}/implement:
 *   post:
 *     summary: Mark recommendation as implemented
 *     description: Mark an approved recommendation as implemented with implementation date and notes
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recommendation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - implementationDate
 *             properties:
 *               implementationDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date when recommendation was implemented
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Implementation notes
 *     responses:
 *       200:
 *         description: Recommendation marked as implemented successfully
 *       400:
 *         description: Invalid implementation data or recommendation not approved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 *       500:
 *         description: Internal server error
 */
router.post(
    '/:recommendationId/implement',
    auth('manageRecommendations'),
    validate(recommendationValidation.implement),
    recommendationController.implementRecommendation
);

/**
 * @swagger
 * /recommendations/export/{clientId}:
 *   get:
 *     summary: Export recommendations
 *     description: Export recommendation report in specified format (PDF, CSV, Excel, JSON)
 *     tags: [Recommendations]
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
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, csv, excel, json]
 *         description: Export format
 *     responses:
 *       200:
 *         description: Export file generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Export data structure (actual file download in production)
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */
router.get(
    '/export/:clientId',
    auth('getRecommendations'),
    validate(recommendationValidation.exportRecommendations),
    recommendationController.exportRecommendations
);

/**
 * @swagger
 * /recommendations/history/{clientId}:
 *   get:
 *     summary: Get historical recommendations
 *     description: Get all historical recommendations for a client regardless of status
 *     tags: [Recommendations]
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
 *         description: Successfully retrieved historical recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recommendation'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */
router.get(
    '/history/:clientId',
    auth('getRecommendations'),
    validate(recommendationValidation.getHistory),
    recommendationController.getHistoricalRecommendations
);

export default router;

import statementController from '../../controllers/statement.controller.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { statementValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

// Client statement endpoints
router
    .route('/:clientId/statements')
    .get(
        auth('getStatements'),
        validate(statementValidation.getClientStatements),
        statementController.getClientStatements
    );

// Client bank connections
router
    .route('/:clientId/bank-connections')
    .get(
        auth('getStatements'),
        validate(statementValidation.getClientBankConnections),
        statementController.getClientBankConnections
    );

// Client upload progress
router
    .route('/:clientId/upload-progress')
    .get(auth('getStatements'), validate(statementValidation.getUploadProgress), statementController.getUploadProgress);

// Client connection statistics
router
    .route('/:clientId/connection-stats')
    .get(
        auth('getStatements'),
        validate(statementValidation.getConnectionStats),
        statementController.getConnectionStats
    );

export default router;

/**
 * @swagger
 * /clients/{clientId}/statements:
 *   get:
 *     summary: Get all statements for a specific client
 *     description: Retrieve all bank statements for a client with optional filtering
 *     tags: [Statements]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UPLOADED, PROCESSING, COMPLETED, FAILED, VALIDATED]
 *         description: Filter by statement status
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by account ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter statements uploaded after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter statements uploaded before this date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [fileName, uploadDate, status, fileSize, createdAt]
 *         description: Sort field
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort direction
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statements:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                       fileSize:
 *                         type: integer
 *                       fileType:
 *                         type: string
 *                       uploadDate:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                       clientId:
 *                         type: string
 *                       accountId:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /clients/{clientId}/bank-connections:
 *   get:
 *     summary: Get all bank connections for a client
 *     description: Retrieve all bank connections configured for a client
 *     tags: [Statements]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CONNECTED, DISCONNECTED, ERROR, SYNCING]
 *         description: Filter by connection status
 *       - in: query
 *         name: bankName
 *         schema:
 *           type: string
 *         description: Filter by bank name
 *       - in: query
 *         name: connectionType
 *         schema:
 *           type: string
 *           enum: [API, PLAID, YODLEE, MANUAL]
 *         description: Filter by connection type
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connections:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       bankName:
 *                         type: string
 *                       accountId:
 *                         type: string
 *                       connectionType:
 *                         type: string
 *                       lastSync:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /clients/{clientId}/upload-progress:
 *   get:
 *     summary: Get upload progress for client's files
 *     description: Get the current upload and processing progress for all client files
 *     tags: [Statements]
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
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fileId:
 *                     type: string
 *                   fileName:
 *                     type: string
 *                   progress:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 100
 *                   status:
 *                     type: string
 *                   error:
 *                     type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

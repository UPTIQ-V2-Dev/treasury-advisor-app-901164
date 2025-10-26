import statementController from "../../controllers/statement.controller.js";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import { statementValidation } from "../../validations/index.js";
import express from 'express';
const router = express.Router();
// Bank connection management
router
    .route('/')
    .get(auth('getStatements'), validate(statementValidation.queryBankConnections), statementController.getAllBankConnections);
router
    .route('/:connectionId')
    .get(auth('getStatements'), validate(statementValidation.syncBankConnection), statementController.getBankConnectionById)
    .patch(auth('manageStatements'), validate(statementValidation.updateBankConnection), statementController.updateBankConnection)
    .delete(auth('manageStatements'), validate(statementValidation.deleteBankConnection), statementController.deleteBankConnection);
// Bank connection operations
router
    .route('/:connectionId/sync')
    .post(auth('manageStatements'), validate(statementValidation.syncBankConnection), statementController.syncBankConnection);
router
    .route('/:connectionId/test')
    .post(auth('manageStatements'), validate(statementValidation.testBankConnection), statementController.testBankConnection);
export default router;
/**
 * @swagger
 * tags:
 *   name: Bank Connections
 *   description: Bank connection management and synchronization
 */
/**
 * @swagger
 * /bank-connections/{connectionId}/sync:
 *   post:
 *     summary: Trigger manual synchronization of bank connection
 *     description: Start a manual sync process for a specific bank connection
 *     tags: [Bank Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bank connection ID
 *     responses:
 *       "202":
 *         description: Accepted - sync started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                   description: ID of the sync task
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "400":
 *         description: Bad request - connection not in syncable state
 */
/**
 * @swagger
 * /bank-connections/{connectionId}/test:
 *   post:
 *     summary: Test bank connection
 *     description: Test the connectivity and credentials of a bank connection
 *     tags: [Bank Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bank connection ID
 *     responses:
 *       "200":
 *         description: Connection test results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isConnected:
 *                   type: boolean
 *                 lastTested:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 *                   description: Error message if connection failed
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /bank-connections:
 *   get:
 *     summary: Get all bank connections
 *     description: Retrieve all bank connections with optional filtering
 *     tags: [Bank Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by client ID
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [bankName, lastSync, status, createdAt]
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
 *                       client:
 *                         type: object
 *                       account:
 *                         type: object
 *                 total:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
/**
 * @swagger
 * /bank-connections/{connectionId}:
 *   get:
 *     summary: Get bank connection by ID
 *     description: Retrieve a specific bank connection by its ID
 *     tags: [Bank Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bank connection ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 bankName:
 *                   type: string
 *                 accountId:
 *                   type: string
 *                 connectionType:
 *                   type: string
 *                 lastSync:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                 client:
 *                   type: object
 *                 account:
 *                   type: object
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update bank connection
 *     description: Update properties of a bank connection
 *     tags: [Bank Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bank connection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bankName:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [CONNECTED, DISCONNECTED, ERROR, SYNCING]
 *               credentials:
 *                 type: object
 *               settings:
 *                 type: object
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 bankName:
 *                   type: string
 *                 accountId:
 *                   type: string
 *                 connectionType:
 *                   type: string
 *                 lastSync:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete bank connection
 *     description: Delete a bank connection and stop all associated syncing
 *     tags: [Bank Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bank connection ID
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

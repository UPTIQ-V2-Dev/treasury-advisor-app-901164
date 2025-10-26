import { bankConnectionController } from "../../controllers/index.js";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import { bankConnectionValidation } from "../../validations/index.js";
import express from 'express';
const router = express.Router();
// Bank connection CRUD operations
router
    .route('/')
    .post(auth('manageBankConnections'), validate(bankConnectionValidation.createBankConnection), bankConnectionController.createBankConnection)
    .get(auth('getBankConnections'), validate(bankConnectionValidation.getBankConnections), bankConnectionController.getBankConnections);
router
    .route('/:connectionId')
    .get(auth('getBankConnections'), validate(bankConnectionValidation.getBankConnection), bankConnectionController.getBankConnection)
    .patch(auth('manageBankConnections'), validate(bankConnectionValidation.updateBankConnection), bankConnectionController.updateBankConnection)
    .delete(auth('manageBankConnections'), validate(bankConnectionValidation.deleteBankConnection), bankConnectionController.deleteBankConnection);
// Manual synchronization endpoint
router
    .route('/:connectionId/sync')
    .post(auth('manageBankConnections'), validate(bankConnectionValidation.syncBankConnection), bankConnectionController.syncBankConnection);
export default router;
/**
 * @swagger
 * tags:
 *   name: Bank Connections
 *   description: Bank connection management for automatic statement retrieval
 */
/**
 * @swagger
 * /bank-connections:
 *   post:
 *     summary: Create a new bank connection
 *     description: Create a new bank connection for automatic statement retrieval
 *     tags: [Bank Connections]
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
 *               - accountId
 *               - bankName
 *               - connectionType
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *                 description: Client identifier
 *               accountId:
 *                 type: string
 *                 format: uuid
 *                 description: Account identifier
 *               bankName:
 *                 type: string
 *                 description: Bank name
 *               connectionType:
 *                 type: string
 *                 enum: [API, PLAID, YODLEE, MANUAL]
 *                 description: Connection type
 *               credentials:
 *                 type: object
 *                 description: Bank connection credentials (encrypted)
 *               settings:
 *                 type: object
 *                 description: Connection settings
 *             example:
 *               clientId: "client-123"
 *               accountId: "acc-456"
 *               bankName: "ABC Bank"
 *               connectionType: "API"
 *               credentials: {}
 *               settings: {}
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
 *                 clientId:
 *                   type: string
 *                 accountId:
 *                   type: string
 *                 bankName:
 *                   type: string
 *                 connectionType:
 *                   type: string
 *                 lastSync:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: Client or account not found
 *       "409":
 *         description: Active connection already exists for this account
 *
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
 *         description: Filter by client ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CONNECTED, DISCONNECTED, ERROR, SYNCING]
 *         description: Filter by connection status
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
 *         description: Sort field
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of connections
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
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
 *                   clientId:
 *                     type: string
 *                   accountId:
 *                     type: string
 *                   bankName:
 *                     type: string
 *                   connectionType:
 *                     type: string
 *                   lastSync:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
/**
 * @swagger
 * /bank-connections/{connectionId}:
 *   get:
 *     summary: Get a bank connection
 *     description: Get details of a specific bank connection
 *     tags: [Bank Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
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
 *                 clientId:
 *                   type: string
 *                 accountId:
 *                   type: string
 *                 bankName:
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
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a bank connection
 *     description: Update bank connection settings
 *     tags: [Bank Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
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
 *               connectionType:
 *                 type: string
 *                 enum: [API, PLAID, YODLEE, MANUAL]
 *               credentials:
 *                 type: object
 *               settings:
 *                 type: object
 *             example:
 *               bankName: "Updated Bank Name"
 *               settings: {"autoSync": true}
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
 *                 clientId:
 *                   type: string
 *                 accountId:
 *                   type: string
 *                 bankName:
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
 *     summary: Delete a bank connection
 *     description: Delete a bank connection and disconnect from the bank
 *     tags: [Bank Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank connection ID
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /bank-connections/{connectionId}/sync:
 *   post:
 *     summary: Trigger manual synchronization
 *     description: Trigger manual synchronization of bank connection to fetch latest data
 *     tags: [Bank Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank connection ID
 *     responses:
 *       "202":
 *         description: Accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                   description: Processing task ID for tracking sync progress
 *             example:
 *               taskId: "sync-task-456"
 *       "400":
 *         description: Cannot sync disconnected connection
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "409":
 *         description: Connection is already syncing
 */

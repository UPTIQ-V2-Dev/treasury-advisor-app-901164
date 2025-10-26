import statementController, { upload } from '../../controllers/statement.controller.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { statementValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

// Statement upload endpoint - multipart/form-data
router.route('/upload').post(
    auth('manageStatements'),
    upload.array('files', 10), // Allow up to 10 files
    validate(statementValidation.uploadStatement),
    statementController.uploadStatements
);

// Statement validation endpoint
router
    .route('/:fileId/validate')
    .get(auth('getStatements'), validate(statementValidation.validateStatement), statementController.validateStatement);

// Statement processing status endpoint
router
    .route('/:fileId/status')
    .get(
        auth('getStatements'),
        validate(statementValidation.getStatementStatus),
        statementController.getStatementStatus
    );

// Start statement parsing
router
    .route('/parse')
    .post(auth('manageStatements'), validate(statementValidation.parseStatements), statementController.parseStatements);

// Bank connection endpoints
router
    .route('/connect')
    .post(auth('manageStatements'), validate(statementValidation.connectBank), statementController.connectBank);

// Statement file operations
router
    .route('/:fileId')
    .get(auth('getStatements'), validate(statementValidation.validateStatement), statementController.getStatementById)
    .patch(
        auth('manageStatements'),
        validate(statementValidation.validateStatement),
        statementController.updateStatement
    )
    .delete(
        auth('manageStatements'),
        validate(statementValidation.deleteStatement),
        statementController.deleteStatement
    );

// Statement download endpoint
router
    .route('/:fileId/download')
    .get(auth('getStatements'), validate(statementValidation.downloadStatement), statementController.downloadStatement);

// All statements with filtering
router
    .route('/')
    .get(auth('getStatements'), validate(statementValidation.queryStatements), statementController.getAllStatements);

export default router;

/**
 * @swagger
 * tags:
 *   name: Statements
 *   description: Statement management and processing
 */

/**
 * @swagger
 * /statements/upload:
 *   post:
 *     summary: Upload bank statements for processing
 *     description: Upload one or more bank statement files for processing and analysis
 *     tags: [Statements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *               - clientId
 *               - statementPeriod
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Bank statement files (PDF, CSV, XLSX, XLS, TXT)
 *               clientId:
 *                 type: string
 *                 format: uuid
 *                 description: Client identifier
 *               statementPeriod:
 *                 type: string
 *                 description: JSON string with startDate and endDate
 *                 example: '{"startDate":"2024-01-01","endDate":"2024-01-31"}'
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   fileName:
 *                     type: string
 *                   fileSize:
 *                     type: integer
 *                   fileType:
 *                     type: string
 *                   uploadDate:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *                   clientId:
 *                     type: string
 *                   accountId:
 *                     type: string
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /statements/{fileId}/validate:
 *   get:
 *     summary: Validate uploaded statement file structure and content
 *     description: Validate the structure and content of an uploaded statement file
 *     tags: [Statements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Statement file ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid:
 *                   type: boolean
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: string
 *                 parsedTransactionCount:
 *                   type: integer
 *                 accountsFound:
 *                   type: array
 *                   items:
 *                     type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /statements/{fileId}/status:
 *   get:
 *     summary: Get current processing status of statement file
 *     description: Get the current processing status and progress of a statement file
 *     tags: [Statements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Statement file ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [UPLOADED, PROCESSING, COMPLETED, FAILED, VALIDATED]
 *                 progress:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 100
 *                 error:
 *                   type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /statements/parse:
 *   post:
 *     summary: Start parsing process for uploaded statements
 *     description: Start the parsing process for one or more uploaded statement files
 *     tags: [Statements]
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
 *             properties:
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of statement file IDs to parse
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
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /statements/connect:
 *   post:
 *     summary: Connect to bank for automatic statement retrieval
 *     description: Create a connection to a bank for automatic statement retrieval
 *     tags: [Statements]
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
 *               - bankName
 *               - accountId
 *               - connectionType
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               bankName:
 *                 type: string
 *               accountId:
 *                 type: string
 *                 format: uuid
 *               connectionType:
 *                 type: string
 *                 enum: [API, PLAID, YODLEE, MANUAL]
 *               credentials:
 *                 type: object
 *                 description: Bank connection credentials (encrypted)
 *               settings:
 *                 type: object
 *                 description: Connection settings and preferences
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
 */

/**
 * @swagger
 * /statements/{fileId}/download:
 *   get:
 *     summary: Download a statement file
 *     description: Download the original uploaded statement file
 *     tags: [Statements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Statement file ID
 *     responses:
 *       "200":
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /statements/{fileId}:
 *   delete:
 *     summary: Delete a statement file
 *     description: Delete a statement file and its associated data
 *     tags: [Statements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Statement file ID
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

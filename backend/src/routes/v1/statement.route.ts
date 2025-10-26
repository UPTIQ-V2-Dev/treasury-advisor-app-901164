import { bankConnectionController } from '../../controllers/index.ts';
import statementController, { upload } from '../../controllers/statement.controller.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { bankConnectionValidation, statementValidation } from '../../validations/index.ts';
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

// Connect to bank for automatic statement retrieval
router
    .route('/connect')
    .post(
        auth('manageBankConnections'),
        validate(bankConnectionValidation.connectToBank),
        bankConnectionController.connectToBank
    );

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

// Enhanced statement processing endpoints

// Validate bulk statements
router
    .route('/validate-bulk')
    .post(
        auth('manageStatements'),
        validate(statementValidation.validateBulkStatements),
        statementController.validateBulkStatements
    );

// Get processing queue status
router
    .route('/processing-queue')
    .get(
        auth('getStatements'),
        validate(statementValidation.getProcessingQueue),
        statementController.getProcessingQueue
    );

// Reprocess failed statements
router
    .route('/reprocess')
    .post(
        auth('manageStatements'),
        validate(statementValidation.reprocessStatements),
        statementController.reprocessStatements
    );

// Get data quality assessment
router
    .route('/data-quality/:fileId')
    .get(auth('getStatements'), validate(statementValidation.getDataQuality), statementController.getDataQuality);

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
 *     description: Establish a connection to a bank for automatic statement retrieval and processing
 *     tags: [Statements, Bank Connections]
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
 *                 description: Client identifier
 *               bankName:
 *                 type: string
 *                 description: Name of the bank to connect to
 *               accountId:
 *                 type: string
 *                 format: uuid
 *                 description: Account identifier
 *               connectionType:
 *                 type: string
 *                 enum: [API, PLAID, YODLEE, MANUAL]
 *                 description: Type of bank connection
 *               credentials:
 *                 type: object
 *                 description: Bank connection credentials (will be encrypted)
 *               settings:
 *                 type: object
 *                 description: Connection configuration settings
 *             example:
 *               clientId: "client-123"
 *               bankName: "ABC Bank"
 *               accountId: "acc-456"
 *               connectionType: "API"
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
 *                   description: Connection ID
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
 *                   enum: [CONNECTED, DISCONNECTED, ERROR, SYNCING]
 *             example:
 *               id: "conn-789"
 *               bankName: "ABC Bank"
 *               accountId: "acc-456"
 *               connectionType: "API"
 *               lastSync: "2024-01-15T10:00:00Z"
 *               status: "CONNECTED"
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: Client or account not found
 *       "409":
 *         description: Active connection already exists for this account
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

/**
 * @swagger
 * /statements/validate-bulk:
 *   post:
 *     summary: Validate multiple statement files before processing
 *     description: Validate structure and content of multiple statement files simultaneously with customizable validation rules
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
 *                 minItems: 1
 *                 maxItems: 10
 *                 description: Array of statement file IDs to validate
 *                 example: ["stmt-456", "stmt-789"]
 *               validationRules:
 *                 type: object
 *                 properties:
 *                   strictMode:
 *                     type: boolean
 *                     description: Enable strict validation mode
 *                     example: true
 *                   requireTransactionCount:
 *                     type: integer
 *                     minimum: 1
 *                     description: Minimum required transaction count
 *                     example: 10
 *                   allowedDateRange:
 *                     type: object
 *                     properties:
 *                       startDate:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-01"
 *                       endDate:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-31"
 *                     description: Allowed date range for statements
 *                 description: Optional validation configuration
 *           example:
 *             fileIds: ["stmt-456", "stmt-789"]
 *             validationRules:
 *               strictMode: true
 *               requireTransactionCount: 50
 *     responses:
 *       "200":
 *         description: Validation results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fileId:
 *                     type: string
 *                     format: uuid
 *                   isValid:
 *                     type: boolean
 *                   errors:
 *                     type: array
 *                     items:
 *                       type: string
 *                   warnings:
 *                     type: array
 *                     items:
 *                       type: string
 *                   metadata:
 *                     type: object
 *                     properties:
 *                       accountsFound:
 *                         type: array
 *                         items:
 *                           type: string
 *                       dateRange:
 *                         type: object
 *                         properties:
 *                           start:
 *                             type: string
 *                             format: date
 *                           end:
 *                             type: string
 *                             format: date
 *                       transactionCount:
 *                         type: integer
 *             example:
 *               - fileId: "stmt-456"
 *                 isValid: true
 *                 errors: []
 *                 warnings: ["Date format inconsistency"]
 *                 metadata:
 *                   accountsFound: ["123456789"]
 *                   dateRange:
 *                     start: "2024-01-01"
 *                     end: "2024-01-31"
 *                   transactionCount: 247
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /statements/processing-queue:
 *   get:
 *     summary: Get current statement processing queue status
 *     description: Retrieve the current processing queue status with file positions, wait times, and system metrics
 *     tags: [Statements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UPLOADED, PROCESSING, COMPLETED, FAILED, VALIDATED]
 *         description: Filter queue by statement status
 *         example: "PROCESSING"
 *     responses:
 *       "200":
 *         description: Processing queue status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 queue:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fileId:
 *                         type: string
 *                         format: uuid
 *                       fileName:
 *                         type: string
 *                       clientId:
 *                         type: string
 *                         format: uuid
 *                       status:
 *                         type: string
 *                         enum: [UPLOADED, PROCESSING, COMPLETED, FAILED, VALIDATED]
 *                       position:
 *                         type: integer
 *                         description: Position in queue
 *                       estimatedWaitTime:
 *                         type: integer
 *                         description: Estimated wait time in seconds
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     queueLength:
 *                       type: integer
 *                       description: Total number of files in queue
 *                     averageProcessingTime:
 *                       type: integer
 *                       description: Average processing time in seconds
 *                     systemLoad:
 *                       type: number
 *                       format: float
 *                       minimum: 0
 *                       maximum: 1
 *                       description: Current system load (0-1)
 *             example:
 *               queue:
 *                 - fileId: "stmt-456"
 *                   fileName: "statement.pdf"
 *                   clientId: "client-123"
 *                   status: "PROCESSING"
 *                   position: 2
 *                   estimatedWaitTime: 120
 *               metrics:
 *                 queueLength: 5
 *                 averageProcessingTime: 85
 *                 systemLoad: 0.6
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /statements/reprocess:
 *   post:
 *     summary: Reprocess failed or corrupted statement files
 *     description: Initiate reprocessing of failed or corrupted statement files with configurable options
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
 *                 minItems: 1
 *                 maxItems: 5
 *                 description: Array of statement file IDs to reprocess
 *                 example: ["stmt-456", "stmt-789"]
 *               options:
 *                 type: object
 *                 properties:
 *                   forceReprocess:
 *                     type: boolean
 *                     description: Force reprocessing even if not in failed state
 *                     example: true
 *                   preserveExisting:
 *                     type: boolean
 *                     description: Preserve existing processed data during reprocessing
 *                     example: false
 *                 description: Optional reprocessing configuration
 *           example:
 *             fileIds: ["stmt-456"]
 *             options:
 *               forceReprocess: true
 *               preserveExisting: false
 *     responses:
 *       "202":
 *         description: Reprocessing tasks created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of created processing task IDs
 *             example:
 *               taskIds: ["task-789", "task-890"]
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "409":
 *         description: Files not eligible for reprocessing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Files not eligible for reprocessing: statement1.pdf, statement2.pdf"
 */

/**
 * @swagger
 * /statements/data-quality/{fileId}:
 *   get:
 *     summary: Get detailed data quality assessment for processed statement
 *     description: Retrieve comprehensive data quality analysis including scores, issues, and recommendations for a processed statement
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
 *         example: "stmt-456"
 *     responses:
 *       "200":
 *         description: Data quality assessment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overallScore:
 *                   type: number
 *                   format: float
 *                   minimum: 0
 *                   maximum: 1
 *                   description: Overall data quality score
 *                 dimensions:
 *                   type: object
 *                   properties:
 *                     completeness:
 *                       type: number
 *                       format: float
 *                       minimum: 0
 *                       maximum: 1
 *                     accuracy:
 *                       type: number
 *                       format: float
 *                       minimum: 0
 *                       maximum: 1
 *                     consistency:
 *                       type: number
 *                       format: float
 *                       minimum: 0
 *                       maximum: 1
 *                     validity:
 *                       type: number
 *                       format: float
 *                       minimum: 0
 *                       maximum: 1
 *                   description: Quality scores across different dimensions
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         description: Issue type identifier
 *                       severity:
 *                         type: string
 *                         enum: [low, medium, high]
 *                         description: Issue severity level
 *                       description:
 *                         type: string
 *                         description: Human-readable issue description
 *                       affectedRecords:
 *                         type: integer
 *                         description: Number of records affected by this issue
 *                       suggestions:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Suggested remediation actions
 *                   description: Identified data quality issues
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: General recommendations for improving data quality
 *             example:
 *               overallScore: 0.85
 *               dimensions:
 *                 completeness: 0.95
 *                 accuracy: 0.88
 *                 consistency: 0.92
 *                 validity: 0.85
 *               issues:
 *                 - type: "missing_category"
 *                   severity: "medium"
 *                   description: "15 transactions missing category classification"
 *                   affectedRecords: 15
 *                   suggestions:
 *                     - "Run auto-categorization"
 *                     - "Manual review required"
 *               recommendations:
 *                 - "Improve statement quality by requesting standardized format"
 *                 - "Consider using more advanced parsing tools"
 *       "400":
 *         description: Data quality assessment not available (statement not processed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Data quality assessment only available for processed statements"
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

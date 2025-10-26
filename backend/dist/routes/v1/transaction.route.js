import { transactionController } from "../../controllers/index.js";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import { transactionValidation } from "../../validations/index.js";
import express from 'express';
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Transaction ID
 *         accountId:
 *           type: string
 *           description: Account ID
 *         clientId:
 *           type: string
 *           description: Client ID
 *         statementId:
 *           type: string
 *           description: Statement ID (optional)
 *         date:
 *           type: string
 *           format: date-time
 *           description: Transaction date
 *         description:
 *           type: string
 *           description: Transaction description
 *         amount:
 *           type: number
 *           format: float
 *           description: Transaction amount
 *         type:
 *           type: string
 *           enum: [DEBIT, CREDIT, ACH, WIRE, CHECK, TRANSFER, FEE, INTEREST, OTHER]
 *           description: Transaction type
 *         category:
 *           type: string
 *           description: Transaction category (optional)
 *         counterparty:
 *           type: string
 *           description: Counterparty name (optional)
 *         balanceAfter:
 *           type: number
 *           format: float
 *           description: Balance after transaction (optional)
 *         metadata:
 *           type: object
 *           description: Additional transaction metadata (optional)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         client:
 *           $ref: '#/components/schemas/Client'
 *         account:
 *           $ref: '#/components/schemas/ClientAccount'
 *         statement:
 *           $ref: '#/components/schemas/Statement'
 *       example:
 *         id: txn-789
 *         accountId: acc-456
 *         clientId: client-123
 *         statementId: stmt-456
 *         date: 2024-01-15T00:00:00Z
 *         description: ACH Transfer
 *         amount: -2500.00
 *         type: ACH
 *         category: Transfer
 *         counterparty: XYZ Corp
 *         balanceAfter: 147500.00
 *         createdAt: 2024-01-15T10:00:00Z
 *         updatedAt: 2024-01-15T10:00:00Z
 *
 *     TransactionAnalytics:
 *       type: object
 *       properties:
 *         summary:
 *           type: object
 *           properties:
 *             totalInflow:
 *               type: number
 *               format: float
 *             totalOutflow:
 *               type: number
 *               format: float
 *             netCashFlow:
 *               type: number
 *               format: float
 *             totalTransactions:
 *               type: integer
 *             inflowCount:
 *               type: integer
 *             outflowCount:
 *               type: integer
 *         categoryBreakdown:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               amount:
 *                 type: number
 *                 format: float
 *               count:
 *                 type: integer
 *               isInflow:
 *                 type: boolean
 *         typeBreakdown:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               amount:
 *                 type: number
 *                 format: float
 *               count:
 *                 type: integer
 *               isInflow:
 *                 type: boolean
 *         counterpartyBreakdown:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               counterparty:
 *                 type: string
 *               amount:
 *                 type: number
 *                 format: float
 *               count:
 *                 type: integer
 *               isInflow:
 *                 type: boolean
 */
/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management and analytics
 */
/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a transaction
 *     description: Create a new transaction record
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - clientId
 *               - date
 *               - description
 *               - amount
 *               - type
 *             properties:
 *               accountId:
 *                 type: string
 *               clientId:
 *                 type: string
 *               statementId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *                 format: float
 *               type:
 *                 type: string
 *                 enum: [DEBIT, CREDIT, ACH, WIRE, CHECK, TRANSFER, FEE, INTEREST, OTHER]
 *               category:
 *                 type: string
 *               counterparty:
 *                 type: string
 *               balanceAfter:
 *                 type: number
 *                 format: float
 *               metadata:
 *                 type: object
 *             example:
 *               accountId: acc-456
 *               clientId: client-123
 *               date: 2024-01-15T00:00:00Z
 *               description: ACH Transfer
 *               amount: -2500.00
 *               type: ACH
 *               category: Transfer
 *               counterparty: XYZ Corp
 *               balanceAfter: 147500.00
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   get:
 *     summary: Get transactions
 *     description: Get transactions with optional filtering, sorting, and pagination
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID (required)
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter by account ID
 *       - in: query
 *         name: type
 *         schema:
 *           oneOf:
 *             - type: string
 *               enum: [DEBIT, CREDIT, ACH, WIRE, CHECK, TRANSFER, FEE, INTEREST, OTHER]
 *             - type: array
 *               items:
 *                 type: string
 *                 enum: [DEBIT, CREDIT, ACH, WIRE, CHECK, TRANSFER, FEE, INTEREST, OTHER]
 *         description: Filter by transaction type(s)
 *       - in: query
 *         name: category
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by category/categories
 *       - in: query
 *         name: counterparty
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by counterparty
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum amount filter
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum amount filter
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Search in transaction descriptions
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. date:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         default: 10
 *         description: Maximum number of transactions
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router
    .route('/')
    .post(auth('manageTransactions'), validate(transactionValidation.createTransaction), transactionController.createTransaction)
    .get(auth('getTransactions'), validate(transactionValidation.getTransactions), transactionController.getTransactions);
/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get a transaction
 *     description: Get transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   patch:
 *     summary: Update a transaction
 *     description: Update transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *                 format: float
 *               type:
 *                 type: string
 *                 enum: [DEBIT, CREDIT, ACH, WIRE, CHECK, TRANSFER, FEE, INTEREST, OTHER]
 *               category:
 *                 type: string
 *               counterparty:
 *                 type: string
 *               balanceAfter:
 *                 type: number
 *                 format: float
 *               metadata:
 *                 type: object
 *             example:
 *               description: Updated ACH Transfer
 *               category: Updated Transfer
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Delete a transaction
 *     description: Delete transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router
    .route('/:transactionId')
    .get(auth('getTransactions'), validate(transactionValidation.getTransaction), transactionController.getTransaction)
    .patch(auth('manageTransactions'), validate(transactionValidation.updateTransaction), transactionController.updateTransaction)
    .delete(auth('manageTransactions'), validate(transactionValidation.deleteTransaction), transactionController.deleteTransaction);
/**
 * @swagger
 * /transactions/analytics/{clientId}:
 *   get:
 *     summary: Get transaction analytics
 *     description: Get comprehensive transaction analytics for a client
 *     tags: [Transactions]
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
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter analytics by account ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics period
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionAnalytics'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router
    .route('/analytics/:clientId')
    .get(auth('getTransactions'), validate(transactionValidation.getTransactionAnalytics), transactionController.getTransactionAnalytics);
/**
 * @swagger
 * /transactions/account/{accountId}:
 *   get:
 *     summary: Get transactions by account
 *     description: Get all transactions for a specific account
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. date:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         default: 10
 *         description: Maximum number of transactions
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router
    .route('/account/:accountId')
    .get(auth('getTransactions'), validate(transactionValidation.getTransactionsByAccount), transactionController.getTransactionsByAccount);
export default router;

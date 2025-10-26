import { clientController } from "../../controllers/index.js";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import { clientValidation } from "../../validations/index.js";
import express from 'express';
const router = express.Router();
// Client CRUD routes
router
    .route('/')
    .post(auth('manageClients'), validate(clientValidation.createClient), clientController.createClient)
    .get(auth('getClients'), validate(clientValidation.getClients), clientController.getClients);
router
    .route('/search')
    .get(auth('getClients'), validate(clientValidation.searchClients), clientController.searchClients);
router
    .route('/:clientId')
    .get(auth('getClients'), validate(clientValidation.getClient), clientController.getClient)
    .put(auth('manageClients'), validate(clientValidation.updateClient), clientController.updateClient)
    .delete(auth('manageClients'), validate(clientValidation.deleteClient), clientController.deleteClient);
// Client preferences route
router
    .route('/:clientId/preferences')
    .patch(auth('manageClients'), validate(clientValidation.updateClientPreferences), clientController.updateClientPreferences);
// Client accounts routes
router
    .route('/:clientId/accounts')
    .get(auth('getClients'), validate(clientValidation.getClientAccounts), clientController.getClientAccounts)
    .post(auth('manageClients'), validate(clientValidation.addClientAccount), clientController.addClientAccount);
router
    .route('/:clientId/accounts/:accountId')
    .patch(auth('manageClients'), validate(clientValidation.updateClientAccount), clientController.updateClientAccount);
export default router;
/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Client management and retrieval
 */
/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Create a client
 *     description: Create a new client record
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - businessType
 *               - industry
 *               - relationshipManagerId
 *               - businessSegment
 *               - contact
 *             properties:
 *               name:
 *                 type: string
 *                 description: Client company name
 *               businessType:
 *                 type: string
 *                 description: Type of business entity
 *               industry:
 *                 type: string
 *                 description: Industry sector
 *               relationshipManagerId:
 *                 type: integer
 *                 description: ID of the assigned relationship manager
 *               businessSegment:
 *                 type: string
 *                 enum: [small, medium, large, enterprise]
 *                 description: Business segment classification
 *               contact:
 *                 type: object
 *                 description: Contact information
 *               preferences:
 *                 type: object
 *                 description: Client preferences (optional)
 *               riskProfile:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Risk profile (optional, defaults to medium)
 *             example:
 *               name: "ABC Corporation"
 *               businessType: "Corporation"
 *               industry: "Technology"
 *               relationshipManagerId: 1
 *               businessSegment: "medium"
 *               contact: {"primaryContact": {"name": "John Doe", "email": "john@abc.com"}}
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all clients
 *     description: Retrieve a paginated list of clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by client name
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *       - in: query
 *         name: businessType
 *         schema:
 *           type: string
 *         description: Filter by business type
 *       - in: query
 *         name: businessSegment
 *         schema:
 *           type: string
 *           enum: [small, medium, large, enterprise]
 *         description: Filter by business segment
 *       - in: query
 *         name: riskProfile
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by risk profile
 *       - in: query
 *         name: relationshipManagerId
 *         schema:
 *           type: integer
 *         description: Filter by relationship manager ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field
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
 *         default: 10
 *         description: Maximum number of clients
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
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *                 total:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
/**
 * @swagger
 * /clients/search:
 *   get:
 *     summary: Search clients
 *     description: Search clients by name, industry, or business type
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
/**
 * @swagger
 * /clients/{clientId}:
 *   get:
 *     summary: Get a client
 *     description: Get client details by ID
 *     tags: [Clients]
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
 *               $ref: '#/components/schemas/Client'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Update a client
 *     description: Update client information
 *     tags: [Clients]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               businessType:
 *                 type: string
 *               industry:
 *                 type: string
 *               relationshipManagerId:
 *                 type: integer
 *               businessSegment:
 *                 type: string
 *                 enum: [small, medium, large, enterprise]
 *               contact:
 *                 type: object
 *               preferences:
 *                 type: object
 *               riskProfile:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a client
 *     description: Delete a client record
 *     tags: [Clients]
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
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "409":
 *         description: Conflict - Client has active accounts
 */
/**
 * @swagger
 * /clients/{clientId}/preferences:
 *   patch:
 *     summary: Update client preferences
 *     description: Update client preferences
 *     tags: [Clients]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               communicationChannel:
 *                 type: string
 *                 enum: [email, phone, sms, portal]
 *               reportFrequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly, quarterly]
 *               riskTolerance:
 *                 type: string
 *                 enum: [conservative, moderate, aggressive]
 *               liquidityPriority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               yieldPriority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /clients/{clientId}/accounts:
 *   get:
 *     summary: Get client accounts
 *     description: Get all accounts for a specific client
 *     tags: [Clients]
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
 *                 $ref: '#/components/schemas/ClientAccount'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   post:
 *     summary: Add client account
 *     description: Add a new account for a client
 *     tags: [Clients]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - accountType
 *               - bankName
 *               - openDate
 *             properties:
 *               accountNumber:
 *                 type: string
 *               accountType:
 *                 type: string
 *               bankName:
 *                 type: string
 *               routingNumber:
 *                 type: string
 *               openDate:
 *                 type: string
 *                 format: date-time
 *               balance:
 *                 type: number
 *               currency:
 *                 type: string
 *                 maxLength: 3
 *                 default: USD
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientAccount'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "409":
 *         description: Conflict - Account number already exists
 */
/**
 * @swagger
 * /clients/{clientId}/accounts/{accountId}:
 *   patch:
 *     summary: Update client account
 *     description: Update account information
 *     tags: [Clients]
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
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountType:
 *                 type: string
 *               bankName:
 *                 type: string
 *               routingNumber:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               balance:
 *                 type: number
 *               currency:
 *                 type: string
 *                 maxLength: 3
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientAccount'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         businessType:
 *           type: string
 *         industry:
 *           type: string
 *         businessSegment:
 *           type: string
 *         riskProfile:
 *           type: string
 *         relationshipManagerId:
 *           type: integer
 *         relationshipManager:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         contact:
 *           type: object
 *         preferences:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         ClientAccount:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ClientAccount'
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         name: "ABC Corporation"
 *         businessType: "Corporation"
 *         industry: "Technology"
 *         businessSegment: "medium"
 *         riskProfile: "medium"
 *         relationshipManagerId: 1
 *         relationshipManager: {"id": 1, "name": "John Smith", "email": "john@bank.com"}
 *         contact: {"primaryContact": {"name": "John Doe", "email": "john@abc.com"}}
 *         preferences: {}
 *         createdAt: "2024-01-15T10:00:00Z"
 *         updatedAt: "2024-01-15T10:00:00Z"
 *
 *     ClientAccount:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         accountNumber:
 *           type: string
 *         accountType:
 *           type: string
 *         bankName:
 *           type: string
 *         routingNumber:
 *           type: string
 *         isActive:
 *           type: boolean
 *         openDate:
 *           type: string
 *           format: date-time
 *         balance:
 *           type: number
 *         currency:
 *           type: string
 *         clientId:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "456e7890-e89b-12d3-a456-426614174001"
 *         accountNumber: "123456789"
 *         accountType: "Checking"
 *         bankName: "ABC Bank"
 *         routingNumber: "021000021"
 *         isActive: true
 *         openDate: "2023-01-15T00:00:00Z"
 *         balance: 150000.00
 *         currency: "USD"
 *         clientId: "123e4567-e89b-12d3-a456-426614174000"
 *         createdAt: "2024-01-15T10:00:00Z"
 *         updatedAt: "2024-01-15T10:00:00Z"
 */

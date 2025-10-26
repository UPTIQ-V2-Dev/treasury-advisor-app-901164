import { treasuryProductController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { treasuryProductValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

// Product catalog endpoints (from API spec)
router.route('/catalog').get(auth('getProducts'), treasuryProductController.getProductCatalog);

// Product management routes
router
    .route('/')
    .post(
        auth('manageProducts'),
        validate(treasuryProductValidation.createTreasuryProduct),
        treasuryProductController.createTreasuryProduct
    )
    .get(
        auth('getProducts'),
        validate(treasuryProductValidation.getTreasuryProducts),
        treasuryProductController.getTreasuryProducts
    );

// Product detail routes (from API spec)
router
    .route('/:productId')
    .get(
        auth('getProducts'),
        validate(treasuryProductValidation.getTreasuryProduct),
        treasuryProductController.getTreasuryProduct
    )
    .patch(
        auth('manageProducts'),
        validate(treasuryProductValidation.updateTreasuryProduct),
        treasuryProductController.updateTreasuryProduct
    )
    .delete(
        auth('manageProducts'),
        validate(treasuryProductValidation.deleteTreasuryProduct),
        treasuryProductController.deleteTreasuryProduct
    );

// Category and risk level filtering
router
    .route('/category/:category')
    .get(
        auth('getProducts'),
        validate(treasuryProductValidation.getProductsByCategory),
        treasuryProductController.getProductsByCategory
    );

router
    .route('/risk/:riskLevel')
    .get(
        auth('getProducts'),
        validate(treasuryProductValidation.getProductsByRiskLevel),
        treasuryProductController.getProductsByRiskLevel
    );

// Eligibility and benefits calculation
router
    .route('/:productId/eligibility')
    .post(
        auth('getProducts'),
        validate(treasuryProductValidation.checkEligibility),
        treasuryProductController.checkProductEligibility
    );

router
    .route('/:productId/benefits')
    .post(
        auth('getProducts'),
        validate(treasuryProductValidation.calculateBenefits),
        treasuryProductController.calculateEstimatedBenefits
    );

export default router;

/**
 * @swagger
 * tags:
 *   name: Treasury Products
 *   description: Treasury product management and catalog operations
 */

/**
 * @swagger
 * /products/catalog:
 *   get:
 *     summary: Get all available treasury products
 *     description: Retrieve the complete catalog of treasury products
 *     tags: [Treasury Products]
 *     security:
 *       - bearerAuth: []
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
 *                   name:
 *                     type: string
 *                   category:
 *                     type: string
 *                     enum: [investment, cash_management, credit, liquidity, yield_enhancement]
 *                   description:
 *                     type: string
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 *                   eligibilityCriteria:
 *                     type: object
 *                   pricing:
 *                     type: object
 *                   benefits:
 *                     type: array
 *                     items:
 *                       type: object
 *                   riskLevel:
 *                     type: string
 *                     enum: [low, medium, high]
 *                   liquidityFeatures:
 *                     type: array
 *                     items:
 *                       type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Get detailed information about a specific product
 *     description: Retrieve comprehensive details for a treasury product by ID
 *     tags: [Treasury Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Treasury product ID
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
 *                 name:
 *                   type: string
 *                 category:
 *                   type: string
 *                 description:
 *                   type: string
 *                 features:
 *                   type: array
 *                   items:
 *                     type: string
 *                 eligibilityCriteria:
 *                   type: object
 *                   properties:
 *                     minimumBalance:
 *                       type: number
 *                     businessSegments:
 *                       type: array
 *                       items:
 *                         type: string
 *                     riskProfiles:
 *                       type: array
 *                       items:
 *                         type: string
 *                 pricing:
 *                   type: object
 *                   properties:
 *                     yieldRate:
 *                       type: number
 *                     monthlyFee:
 *                       type: number
 *                 benefits:
 *                   type: array
 *                   items:
 *                     type: object
 *                 riskLevel:
 *                   type: string
 *                 liquidityFeatures:
 *                   type: array
 *                   items:
 *                     type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a treasury product
 *     description: Only admins can create treasury products
 *     tags: [Treasury Products]
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
 *               - category
 *               - description
 *               - features
 *               - eligibilityCriteria
 *               - pricing
 *               - benefits
 *               - riskLevel
 *               - liquidityFeatures
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [investment, cash_management, credit, liquidity, yield_enhancement]
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               eligibilityCriteria:
 *                 type: object
 *               pricing:
 *                 type: object
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: object
 *               riskLevel:
 *                 type: string
 *                 enum: [low, medium, high]
 *               liquidityFeatures:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       "201":
 *         description: Created
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     summary: Get treasury products with filters
 *     description: Retrieve treasury products with optional filtering and pagination
 *     tags: [Treasury Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [investment, cash_management, credit, liquidity, yield_enhancement]
 *         description: Filter by product category
 *       - in: query
 *         name: riskLevel
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by risk level
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         default: 10
 *         description: Maximum number of products
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
 *               type: array
 *               items:
 *                 type: object
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /products/{productId}/eligibility:
 *   post:
 *     summary: Check product eligibility for client criteria
 *     description: Evaluate if a client meets the eligibility criteria for a treasury product
 *     tags: [Treasury Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessSegment
 *               - riskProfile
 *             properties:
 *               businessSegment:
 *                 type: string
 *                 enum: [small, medium, large, enterprise]
 *               riskProfile:
 *                 type: string
 *                 enum: [low, medium, high]
 *               totalBalance:
 *                 type: number
 *               industry:
 *                 type: string
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eligible:
 *                   type: boolean
 *                 reasons:
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
 * /products/{productId}/benefits:
 *   post:
 *     summary: Calculate estimated benefits for a client
 *     description: Calculate potential savings and benefits for a client based on their current situation
 *     tags: [Treasury Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentBalance
 *             properties:
 *               currentBalance:
 *                 type: number
 *               currentYieldRate:
 *                 type: number
 *               transactionVolume:
 *                 type: number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 annualSavings:
 *                   type: number
 *                 yieldImprovement:
 *                   type: number
 *                 feeReduction:
 *                   type: number
 *                 liquidityBenefits:
 *                   type: array
 *                   items:
 *                     type: string
 *                 breakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

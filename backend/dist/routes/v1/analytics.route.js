import { analyticsController } from "../../controllers/index.js";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import { analyticsValidation } from "../../validations/index.js";
import express from 'express';
const router = express.Router();
router
    .route('/overview/:clientId')
    .get(auth('getAnalytics'), validate(analyticsValidation.getAnalyticsOverview), analyticsController.getAnalyticsOverview);
router
    .route('/cashflow/:clientId')
    .get(auth('getAnalytics'), validate(analyticsValidation.getCashFlowAnalytics), analyticsController.getCashFlowAnalytics);
router
    .route('/categories/:clientId')
    .get(auth('getAnalytics'), validate(analyticsValidation.getCategoryAnalytics), analyticsController.getCategoryAnalytics);
router
    .route('/liquidity/:clientId')
    .get(auth('getAnalytics'), validate(analyticsValidation.getLiquidityAnalytics), analyticsController.getLiquidityAnalytics);
router
    .route('/patterns/:clientId')
    .get(auth('getAnalytics'), validate(analyticsValidation.getSpendingPatterns), analyticsController.getSpendingPatterns);
router
    .route('/summary/:clientId')
    .get(auth('getAnalytics'), validate(analyticsValidation.getAnalyticsSummary), analyticsController.getAnalyticsSummary);
router
    .route('/export/:clientId')
    .get(auth('getAnalytics'), validate(analyticsValidation.exportAnalyticsData), analyticsController.exportAnalyticsData);
router
    .route('/vendors/:clientId')
    .get(auth('getAnalytics'), validate(analyticsValidation.getVendorAnalytics), analyticsController.getVendorAnalytics);
router
    .route('/trends/:clientId')
    .get(auth('getAnalytics'), validate(analyticsValidation.getTrendAnalytics), analyticsController.getTrendAnalytics);
router
    .route('/dashboard/:clientId')
    .get(auth('getAnalytics'), validate(analyticsValidation.getDashboard), analyticsController.getDashboard);
export default router;
/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Financial analytics and insights for treasury management
 */
/**
 * @swagger
 * /analytics/overview/{clientId}:
 *   get:
 *     summary: Get comprehensive analytics overview for a client
 *     description: Returns key financial metrics including cash flow, liquidity ratios, and transaction summaries
 *     tags: [Analytics]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter start date (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter end date (ISO 8601)
 *       - in: query
 *         name: categories
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by transaction categories
 *       - in: query
 *         name: transactionTypes
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [DEBIT, CREDIT, ACH, WIRE, CHECK, TRANSFER, FEE, INTEREST, OTHER]
 *         description: Filter by transaction types
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum transaction amount filter
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum transaction amount filter
 *     responses:
 *       "200":
 *         description: Analytics overview data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalInflow:
 *                   type: number
 *                   description: Total money coming in
 *                 totalOutflow:
 *                   type: number
 *                   description: Total money going out
 *                 netCashFlow:
 *                   type: number
 *                   description: Net cash flow (inflow - outflow)
 *                 averageDailyBalance:
 *                   type: number
 *                   description: Average daily account balance
 *                 liquidityRatio:
 *                   type: number
 *                   description: Liquidity ratio indicator
 *                 idleBalance:
 *                   type: number
 *                   description: Potentially optimizable idle balance
 *                 transactionCount:
 *                   type: integer
 *                   description: Total number of transactions
 *                 period:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */
/**
 * @swagger
 * /analytics/cashflow/{clientId}:
 *   get:
 *     summary: Get cash flow data with period granularity
 *     description: Returns cash flow analysis grouped by specified time period
 *     tags: [Analytics]
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
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: daily
 *         description: Time period for grouping data
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Analysis start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Analysis end date
 *     responses:
 *       "200":
 *         description: Cash flow data grouped by period
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     description: Period date (format depends on period type)
 *                   inflow:
 *                     type: number
 *                     description: Total money in for this period
 *                   outflow:
 *                     type: number
 *                     description: Total money out for this period
 *                   balance:
 *                     type: number
 *                     description: Account balance at end of period
 *                   netFlow:
 *                     type: number
 *                     description: Net cash flow for period
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /analytics/categories/{clientId}:
 *   get:
 *     summary: Get transaction category breakdown
 *     description: Returns spending analysis grouped by transaction categories with trends
 *     tags: [Analytics]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Analysis start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Analysis end date
 *     responses:
 *       "200":
 *         description: Category breakdown with trends
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                     description: Transaction category name
 *                   amount:
 *                     type: number
 *                     description: Total amount for this category
 *                   count:
 *                     type: integer
 *                     description: Number of transactions in category
 *                   percentage:
 *                     type: number
 *                     description: Percentage of total spending
 *                   trend:
 *                     type: string
 *                     enum: [up, down, stable, new]
 *                     description: Trend compared to previous period
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /analytics/liquidity/{clientId}:
 *   get:
 *     summary: Get liquidity analysis for a client
 *     description: Returns comprehensive liquidity metrics and risk indicators
 *     tags: [Analytics]
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
 *         description: Liquidity analysis data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageBalance:
 *                   type: number
 *                   description: Average account balance
 *                 minimumBalance:
 *                   type: number
 *                   description: Lowest balance recorded
 *                 maximumBalance:
 *                   type: number
 *                   description: Highest balance recorded
 *                 volatility:
 *                   type: number
 *                   description: Balance volatility coefficient (0-1)
 *                 idleDays:
 *                   type: integer
 *                   description: Number of days with idle funds
 *                 liquidityScore:
 *                   type: number
 *                   description: Overall liquidity health score (0-10)
 *                 thresholdExceeded:
 *                   type: boolean
 *                   description: Whether minimum balance threshold was breached
 *                 thresholdAmount:
 *                   type: number
 *                   description: Minimum balance threshold amount
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /analytics/patterns/{clientId}:
 *   get:
 *     summary: Get spending patterns analysis
 *     description: Returns detailed spending pattern analysis including vendor relationships and payment methods
 *     tags: [Analytics]
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
 *         description: Spending patterns data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                     description: Spending category
 *                   subcategory:
 *                     type: string
 *                     description: Detailed subcategory
 *                   averageAmount:
 *                     type: number
 *                     description: Average transaction amount
 *                   frequency:
 *                     type: string
 *                     enum: [high, medium, low]
 *                     description: Transaction frequency level
 *                   seasonality:
 *                     type: string
 *                     description: Seasonal spending pattern
 *                   vendors:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         vendorName:
 *                           type: string
 *                         totalAmount:
 *                           type: number
 *                         transactionCount:
 *                           type: integer
 *                         percentage:
 *                           type: number
 *                         paymentMethods:
 *                           type: array
 *                           items:
 *                             type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /analytics/summary/{clientId}:
 *   get:
 *     summary: Get complete analytics summary
 *     description: Returns comprehensive analytics including all major insights and metrics
 *     tags: [Analytics]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Analysis start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Analysis end date
 *     responses:
 *       "200":
 *         description: Complete analytics summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   $ref: '#/components/schemas/AnalyticsOverview'
 *                 cashFlow:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CashFlowPeriod'
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryBreakdown'
 *                 liquidity:
 *                   $ref: '#/components/schemas/LiquidityAnalysis'
 *                 patterns:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SpendingPattern'
 *                 trends:
 *                   type: object
 *                   properties:
 *                     inflow:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TrendData'
 *                     outflow:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TrendData'
 *                     balance:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TrendData'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /analytics/export/{clientId}:
 *   get:
 *     summary: Export analytics data in specified format
 *     description: Exports comprehensive analytics data in CSV, PDF, Excel, or JSON format
 *     tags: [Analytics]
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
 *           enum: [csv, pdf, excel, json]
 *         description: Export format
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data end date
 *     responses:
 *       "200":
 *         description: Exported analytics data
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: object
 *       "400":
 *         description: Invalid export format
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /analytics/vendors/{clientId}:
 *   get:
 *     summary: Get vendor analysis for a client
 *     description: Returns detailed vendor spending analysis with payment method breakdown
 *     tags: [Analytics]
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
 *         description: Vendor analysis data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   vendorName:
 *                     type: string
 *                     description: Vendor/counterparty name
 *                   totalAmount:
 *                     type: number
 *                     description: Total amount spent with vendor
 *                   transactionCount:
 *                     type: integer
 *                     description: Number of transactions with vendor
 *                   percentage:
 *                     type: number
 *                     description: Percentage of total spending
 *                   paymentMethods:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Payment methods used with vendor
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /analytics/trends/{clientId}:
 *   get:
 *     summary: Get trend analysis for specific metrics
 *     description: Returns time-series trend analysis for specified financial metrics
 *     tags: [Analytics]
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
 *         name: metric
 *         required: true
 *         schema:
 *           type: string
 *           enum: [inflow, outflow, balance, transactions]
 *         description: Metric to analyze trends for
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [3m, 6m, 12m, 24m]
 *           default: 12m
 *         description: Time period for trend analysis
 *     responses:
 *       "200":
 *         description: Trend analysis data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   period:
 *                     type: string
 *                     description: Time period label
 *                   value:
 *                     type: number
 *                     description: Metric value for period
 *                   change:
 *                     type: number
 *                     description: Absolute change from previous period
 *                   changePercent:
 *                     type: number
 *                     description: Percentage change from previous period
 *       "400":
 *         description: Invalid metric parameter
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @swagger
 * /analytics/dashboard/{clientId}:
 *   get:
 *     summary: Get comprehensive dashboard data with KPIs and visualizations
 *     description: Returns dashboard analytics including metrics, charts, KPIs, and period information with optional comparison data
 *     tags: [Analytics]
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
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 6m, 1y]
 *           default: 30d
 *         description: Time range for dashboard data
 *       - in: query
 *         name: compareMode
 *         schema:
 *           type: string
 *           enum: [previous, year_over_year, none]
 *           default: previous
 *         description: Comparison mode for KPI trends
 *     responses:
 *       "200":
 *         description: Comprehensive dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     totalInflow:
 *                       type: number
 *                       description: Total money coming in
 *                     totalOutflow:
 *                       type: number
 *                       description: Total money going out
 *                     netCashFlow:
 *                       type: number
 *                       description: Net cash flow (inflow - outflow)
 *                     averageDailyBalance:
 *                       type: number
 *                       description: Average daily account balance
 *                     liquidityRatio:
 *                       type: number
 *                       description: Liquidity ratio indicator
 *                     idleBalance:
 *                       type: number
 *                       description: Potentially optimizable idle balance
 *                     transactionCount:
 *                       type: integer
 *                       description: Total number of transactions
 *                     period:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                 charts:
 *                   type: object
 *                   properties:
 *                     cashFlow:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           inflow:
 *                             type: number
 *                           outflow:
 *                             type: number
 *                           balance:
 *                             type: number
 *                           netFlow:
 *                             type: number
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           count:
 *                             type: integer
 *                           percentage:
 *                             type: number
 *                           trend:
 *                             type: string
 *                             enum: [up, down, stable, new]
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           value:
 *                             type: number
 *                           change:
 *                             type: number
 *                           changePercent:
 *                             type: number
 *                 kpis:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: KPI name
 *                       value:
 *                         type: number
 *                         description: KPI value
 *                       unit:
 *                         type: string
 *                         description: Unit of measurement (USD, ratio, count)
 *                       trend:
 *                         type: string
 *                         enum: [up, down, stable]
 *                         description: Trend direction compared to previous period
 *                       change:
 *                         type: number
 *                         description: Percentage change from comparison period
 *                 period:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       description: Dashboard data start date
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                       description: Dashboard data end date
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */

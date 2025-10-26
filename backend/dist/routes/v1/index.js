import config from "../../config/config.js";
import adminRoute from "./admin.route.js";
import agentRoute from "./agent.route.js";
import analyticsRoute from "./analytics.route.js";
import authRoute from "./auth.route.js";
import bankConnectionRoute from "./bank-connection.route.js";
import clientStatementsRoute from "./client-statements.route.js";
import clientRoute from "./client.route.js";
import docsRoute from "./docs.route.js";
import mcpRoute from "./mcp.route.js";
import notificationRoute from "./notification.route.js";
import processingRoute from "./processing.route.js";
import recommendationRoute from "./recommendation.route.js";
import relationshipManagerRoute from "./relationship-manager.route.js";
import statementRoute from "./statement.route.js";
import transactionRoute from "./transaction.route.js";
import treasuryProductRoute from "./treasuryProduct.route.js";
import userRoute from "./user.route.js";
import workflowRoute from "./workflow.route.js";
import express from 'express';
const router = express.Router();
const defaultRoutes = [
    {
        path: '/auth',
        route: authRoute
    },
    {
        path: '/users',
        route: userRoute
    },
    {
        path: '/clients',
        route: clientRoute
    },
    {
        path: '/clients',
        route: clientStatementsRoute
    },
    {
        path: '/statements',
        route: statementRoute
    },
    {
        path: '/transactions',
        route: transactionRoute
    },
    {
        path: '/processing',
        route: processingRoute
    },
    {
        path: '/analytics',
        route: analyticsRoute
    },
    {
        path: '/products',
        route: treasuryProductRoute
    },
    {
        path: '/recommendations',
        route: recommendationRoute
    },
    {
        path: '/relationship-managers',
        route: relationshipManagerRoute
    },
    {
        path: '/mcp',
        route: mcpRoute
    },
    {
        path: '/bank-connections',
        route: bankConnectionRoute
    },
    {
        path: '/workflow',
        route: workflowRoute
    },
    {
        path: '/notifications',
        route: notificationRoute
    },
    {
        path: '/admin',
        route: adminRoute
    },
    {
        path: '/agents',
        route: agentRoute
    }
];
const devRoutes = [
    // routes available only in development mode
    {
        path: '/docs',
        route: docsRoute
    }
];
defaultRoutes.forEach(route => {
    router.use(route.path, route.route);
});
/* istanbul ignore next */
if (config.env === 'development') {
    devRoutes.forEach(route => {
        router.use(route.path, route.route);
    });
}
export default router;

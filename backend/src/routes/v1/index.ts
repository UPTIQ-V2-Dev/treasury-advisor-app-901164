import config from '../../config/config.ts';
import analyticsRoute from './analytics.route.ts';
import authRoute from './auth.route.ts';
import clientStatementsRoute from './client-statements.route.ts';
import clientRoute from './client.route.ts';
import docsRoute from './docs.route.ts';
import mcpRoute from './mcp.route.ts';
import processingRoute from './processing.route.ts';
import recommendationRoute from './recommendation.route.ts';
import relationshipManagerRoute from './relationship-manager.route.ts';
import statementRoute from './statement.route.ts';
import transactionRoute from './transaction.route.ts';
import treasuryProductRoute from './treasuryProduct.route.ts';
import userRoute from './user.route.ts';
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

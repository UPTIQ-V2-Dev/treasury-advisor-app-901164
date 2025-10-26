import { Role } from '../generated/prisma/index.js';

const allRoles = {
    [Role.USER]: [
        // Analytics permissions
        'getAnalytics',
        // Client permissions
        'getClients',
        // Statement permissions
        'getStatements',
        // Processing permissions
        'getProcessing',
        // Recommendation permissions
        'getRecommendations',
        // Transaction permissions
        'getTransactions',
        // Product permissions
        'getProducts',
        // Notification permissions
        'getNotifications',
        'manageNotifications'
    ],
    [Role.ADMIN]: [
        // Analytics permissions
        'getAnalytics',
        // Client permissions
        'getClients',
        'manageClients',
        // Statement permissions
        'getStatements',
        'manageStatements',
        // Processing permissions
        'getProcessing',
        'manageProcessing',
        // Recommendation permissions
        'getRecommendations',
        'manageRecommendations',
        // Transaction permissions
        'getTransactions',
        'manageTransactions',
        // Product permissions
        'getProducts',
        'manageProducts',
        // User management permissions
        'getUsers',
        'manageUsers',
        // Notification permissions
        'getNotifications',
        'manageNotifications'
    ]
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));

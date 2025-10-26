import { adminService } from "../services/index.js";
import pick from "../utils/pick.js";
import { z } from 'zod';
// Schema definitions
const systemLogSchema = z.object({
    id: z.string(),
    timestamp: z.string(),
    level: z.enum(['error', 'warn', 'info', 'debug']),
    service: z.string(),
    message: z.string(),
    metadata: z.any().nullable(),
    traceId: z.string().nullable()
});
const maintenanceTaskSchema = z.object({
    id: z.string(),
    operation: z.string(),
    status: z.enum(['pending', 'running', 'completed', 'failed']),
    parameters: z.any().nullable(),
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    estimatedDuration: z.number().nullable(),
    results: z.any().nullable(),
    error: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
});
const systemHealthSchema = z.object({
    status: z.enum(['healthy', 'unhealthy']),
    version: z.string(),
    uptime: z.number(),
    services: z.object({
        database: z.object({ status: z.enum(['healthy', 'unhealthy']) }),
        processing: z.object({ status: z.enum(['healthy', 'unhealthy']) }),
        storage: z.object({ status: z.enum(['healthy', 'unhealthy']) })
    }),
    metrics: z.object({
        memory: z.any(),
        cpuUsage: z.any(),
        activeConnections: z.number()
    })
});
const usageAnalyticsSchema = z.object({
    usage: z.object({
        users: z.number(),
        clients: z.number(),
        transactions: z.number(),
        statements: z.number(),
        processingTasks: z.number()
    }),
    trends: z.object({
        users: z.object({ change: z.string(), direction: z.string() }),
        clients: z.object({ change: z.string(), direction: z.string() }),
        transactions: z.object({ change: z.string(), direction: z.string() }),
        statements: z.object({ change: z.string(), direction: z.string() }),
        processingTasks: z.object({ change: z.string(), direction: z.string() })
    }),
    topUsers: z.array(z.object({
        id: z.number(),
        name: z.string().nullable(),
        email: z.string(),
        clientCount: z.number()
    }))
});
const getSystemHealthTool = {
    id: 'admin_get_system_health',
    name: 'Get System Health',
    description: 'Get comprehensive system health status including services, uptime, and metrics',
    inputSchema: z.object({}),
    outputSchema: systemHealthSchema,
    fn: async () => {
        const health = await adminService.getSystemHealth();
        return health;
    }
};
const getSystemLogsTool = {
    id: 'admin_get_system_logs',
    name: 'Get System Logs',
    description: 'Retrieve system logs with optional filtering by level, service, and time range',
    inputSchema: z.object({
        level: z.enum(['error', 'warn', 'info', 'debug']).optional(),
        service: z.string().optional(),
        startTime: z.string().optional().describe('ISO 8601 datetime string'),
        endTime: z.string().optional().describe('ISO 8601 datetime string'),
        limit: z.number().int().min(1).max(1000).optional().default(100),
        page: z.number().int().min(1).optional().default(1)
    }),
    outputSchema: z.array(systemLogSchema),
    fn: async (inputs) => {
        const filter = pick(inputs, ['level', 'service', 'startTime', 'endTime']);
        const options = pick(inputs, ['limit', 'page']);
        const logs = await adminService.getSystemLogs(filter, options);
        return logs;
    }
};
const createMaintenanceTaskTool = {
    id: 'admin_create_maintenance_task',
    name: 'Create Maintenance Task',
    description: 'Trigger a system maintenance operation such as database cleanup, cache clearing, or index rebuilding',
    inputSchema: z.object({
        operation: z.enum(['database_cleanup', 'cache_clear', 'index_rebuild']),
        parameters: z.any().optional().describe('Operation-specific parameters')
    }),
    outputSchema: z.object({
        taskId: z.string(),
        estimatedDuration: z.number()
    }),
    fn: async (inputs) => {
        const result = await adminService.createMaintenanceTask(inputs.operation, inputs.parameters);
        return result;
    }
};
const getMaintenanceTaskTool = {
    id: 'admin_get_maintenance_task',
    name: 'Get Maintenance Task',
    description: 'Get the status and details of a specific maintenance task',
    inputSchema: z.object({
        taskId: z.string().uuid()
    }),
    outputSchema: maintenanceTaskSchema,
    fn: async (inputs) => {
        const task = await adminService.getMaintenanceTaskById(inputs.taskId);
        if (!task) {
            throw new Error('Maintenance task not found');
        }
        return task;
    }
};
const getUsageAnalyticsTool = {
    id: 'admin_get_usage_analytics',
    name: 'Get Usage Analytics',
    description: 'Get system usage analytics and metrics over a specified time period',
    inputSchema: z.object({
        period: z.enum(['24h', '7d', '30d', '90d']).optional().default('7d'),
        granularity: z.enum(['hour', 'day', 'week', 'month']).optional().default('day')
    }),
    outputSchema: usageAnalyticsSchema,
    fn: async (inputs) => {
        const analytics = await adminService.getSystemUsageAnalytics(inputs.period);
        return analytics;
    }
};
const getSystemMetricsTool = {
    id: 'admin_get_system_metrics',
    name: 'Get System Metrics',
    description: 'Get current system performance metrics including memory, CPU, and active connections',
    inputSchema: z.object({}),
    outputSchema: z.object({
        memory: z.object({
            rss: z.number(),
            heapTotal: z.number(),
            heapUsed: z.number(),
            external: z.number(),
            arrayBuffers: z.number()
        }),
        cpuUsage: z.object({
            user: z.number(),
            system: z.number()
        }),
        uptime: z.number(),
        activeConnections: z.number(),
        timestamp: z.string()
    }),
    fn: async () => {
        const health = await adminService.getSystemHealth();
        return {
            memory: health.metrics.memory,
            cpuUsage: health.metrics.cpuUsage,
            uptime: health.uptime,
            activeConnections: health.metrics.activeConnections,
            timestamp: new Date().toISOString()
        };
    }
};
const getServiceStatusTool = {
    id: 'admin_get_service_status',
    name: 'Get Service Status',
    description: 'Get the health status of individual system services (database, processing, storage)',
    inputSchema: z.object({
        service: z.enum(['database', 'processing', 'storage']).optional()
    }),
    outputSchema: z.object({
        services: z.record(z.object({
            status: z.enum(['healthy', 'unhealthy']),
            lastChecked: z.string()
        }))
    }),
    fn: async (inputs) => {
        const health = await adminService.getSystemHealth();
        const timestamp = new Date().toISOString();
        if (inputs.service) {
            const serviceStatus = health.services[inputs.service];
            return {
                services: {
                    [inputs.service]: {
                        status: serviceStatus.status,
                        lastChecked: timestamp
                    }
                }
            };
        }
        return {
            services: {
                database: {
                    status: health.services.database.status,
                    lastChecked: timestamp
                },
                processing: {
                    status: health.services.processing.status,
                    lastChecked: timestamp
                },
                storage: {
                    status: health.services.storage.status,
                    lastChecked: timestamp
                }
            }
        };
    }
};
const getSystemStatsTool = {
    id: 'admin_get_system_stats',
    name: 'Get System Statistics',
    description: 'Get comprehensive system statistics including entity counts and activity metrics',
    inputSchema: z.object({
        period: z.enum(['24h', '7d', '30d', '90d']).optional().default('30d')
    }),
    outputSchema: z.object({
        period: z.string(),
        totalUsers: z.number(),
        totalClients: z.number(),
        totalTransactions: z.number(),
        totalStatements: z.number(),
        totalProcessingTasks: z.number(),
        activeUsers: z.number(),
        systemUptime: z.number(),
        generatedAt: z.string()
    }),
    fn: async (inputs) => {
        const analytics = await adminService.getSystemUsageAnalytics(inputs.period);
        const health = await adminService.getSystemHealth();
        return {
            period: inputs.period || '30d',
            totalUsers: analytics.usage.users,
            totalClients: analytics.usage.clients,
            totalTransactions: analytics.usage.transactions,
            totalStatements: analytics.usage.statements,
            totalProcessingTasks: analytics.usage.processingTasks,
            activeUsers: analytics.topUsers.length,
            systemUptime: health.uptime,
            generatedAt: new Date().toISOString()
        };
    }
};
export const adminTools = [
    getSystemHealthTool,
    getSystemLogsTool,
    createMaintenanceTaskTool,
    getMaintenanceTaskTool,
    getUsageAnalyticsTool,
    getSystemMetricsTool,
    getServiceStatusTool,
    getSystemStatsTool
];

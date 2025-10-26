import { bankConnectionService, statementService } from '../services/index.ts';
import { MCPTool } from '../types/mcp.ts';
import pick from '../utils/pick.ts';
import { z } from 'zod';

// Schema definitions
const statementSchema = z.object({
    id: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    fileType: z.string(),
    filePath: z.string().nullable(),
    uploadDate: z.string(),
    status: z.string(),
    clientId: z.string(),
    accountId: z.string().nullable(),
    period: z.any().nullable(),
    errorMessage: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
});

const bankConnectionSchema = z.object({
    id: z.string(),
    clientId: z.string(),
    accountId: z.string(),
    bankName: z.string(),
    connectionType: z.string(),
    lastSync: z.string().nullable(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string()
});

const processingTaskSchema = z.object({
    id: z.number(),
    taskId: z.string(),
    clientId: z.string(),
    statementId: z.string().nullable(),
    type: z.string(),
    status: z.string(),
    progress: z.number(),
    startTime: z.string(),
    endTime: z.string().nullable(),
    estimatedDuration: z.number().nullable(),
    currentStep: z.any().nullable(),
    steps: z.any(),
    error: z.any().nullable(),
    results: z.any().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
});

// Statement Management Tools
const getClientStatementsTool: MCPTool = {
    id: 'statement_get_by_client',
    name: 'Get Client Statements',
    description: 'Get all statements for a specific client with optional filtering',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        status: z.enum(['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED', 'VALIDATED']).optional(),
        accountId: z.string().uuid().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        sortBy: z.enum(['fileName', 'uploadDate', 'status', 'fileSize', 'createdAt']).optional(),
        sortType: z.enum(['asc', 'desc']).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        statements: z.array(statementSchema),
        total: z.number(),
        pages: z.number()
    }),
    fn: async (inputs: {
        clientId: string;
        status?: string;
        accountId?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        sortType?: string;
        limit?: number;
        page?: number;
    }) => {
        const filter = pick(inputs, ['status', 'accountId', 'startDate', 'endDate']);
        const options = pick(inputs, ['sortBy', 'sortType', 'limit', 'page']);

        filter.clientId = inputs.clientId;

        // Handle date range filter
        if (filter.startDate || filter.endDate) {
            (filter as any).uploadDate = {};
            if (filter.startDate) {
                (filter as any).uploadDate.gte = new Date(filter.startDate as string);
                delete (filter as any).startDate;
            }
            if (filter.endDate) {
                (filter as any).uploadDate.lte = new Date(filter.endDate as string);
                delete (filter as any).endDate;
            }
        }

        const result = await statementService.queryStatements(filter, options);
        return result;
    }
};

const validateStatementTool: MCPTool = {
    id: 'statement_validate',
    name: 'Validate Statement',
    description: 'Validate uploaded statement file structure and content',
    inputSchema: z.object({
        statementId: z.string().uuid()
    }),
    outputSchema: z.object({
        isValid: z.boolean(),
        errors: z.array(z.string()),
        warnings: z.array(z.string()),
        parsedTransactionCount: z.number(),
        accountsFound: z.array(z.string())
    }),
    fn: async (inputs: { statementId: string }) => {
        const result = await statementService.validateStatement(inputs.statementId);
        return result;
    }
};

const getStatementStatusTool: MCPTool = {
    id: 'statement_get_status',
    name: 'Get Statement Status',
    description: 'Get current processing status and progress of a statement file',
    inputSchema: z.object({
        statementId: z.string().uuid()
    }),
    outputSchema: z.object({
        status: z.string(),
        progress: z.number(),
        error: z.string().optional()
    }),
    fn: async (inputs: { statementId: string }) => {
        const result = await statementService.getStatementStatus(inputs.statementId);
        return result;
    }
};

const parseStatementsTool: MCPTool = {
    id: 'statement_parse',
    name: 'Parse Statements',
    description: 'Start parsing process for uploaded statement files',
    inputSchema: z.object({
        fileIds: z.array(z.string().uuid()).min(1)
    }),
    outputSchema: processingTaskSchema,
    fn: async (inputs: { fileIds: string[] }) => {
        const task = await statementService.startStatementParsing(inputs.fileIds);
        return task;
    }
};

const deleteStatementTool: MCPTool = {
    id: 'statement_delete',
    name: 'Delete Statement',
    description: 'Delete a statement file and its associated data',
    inputSchema: z.object({
        statementId: z.string().uuid()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs: { statementId: string }) => {
        await statementService.deleteStatementById(inputs.statementId);
        return { success: true };
    }
};

const getUploadProgressTool: MCPTool = {
    id: 'statement_get_upload_progress',
    name: 'Get Upload Progress',
    description: 'Get upload and processing progress for all client files',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        progress: z.array(
            z.object({
                fileId: z.string(),
                fileName: z.string(),
                progress: z.number(),
                status: z.string(),
                error: z.string().optional()
            })
        )
    }),
    fn: async (inputs: { clientId: string }) => {
        const progress = await statementService.getUploadProgress(inputs.clientId);
        return { progress };
    }
};

// Bank Connection Management Tools
const createBankConnectionTool: MCPTool = {
    id: 'bank_connection_create',
    name: 'Create Bank Connection',
    description: 'Create a connection to a bank for automatic statement retrieval',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        accountId: z.string().uuid(),
        bankName: z.string(),
        connectionType: z.enum(['API', 'PLAID', 'YODLEE', 'MANUAL']),
        credentials: z.any().optional(),
        settings: z.any().optional()
    }),
    outputSchema: bankConnectionSchema,
    fn: async (inputs: {
        clientId: string;
        accountId: string;
        bankName: string;
        connectionType: any;
        credentials?: any;
        settings?: any;
    }) => {
        const connection = await bankConnectionService.createBankConnection(inputs);
        return connection;
    }
};

const getClientBankConnectionsTool: MCPTool = {
    id: 'bank_connection_get_by_client',
    name: 'Get Client Bank Connections',
    description: 'Get all bank connections for a specific client',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        status: z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR', 'SYNCING']).optional(),
        bankName: z.string().optional(),
        connectionType: z.enum(['API', 'PLAID', 'YODLEE', 'MANUAL']).optional(),
        sortBy: z.enum(['bankName', 'lastSync', 'status', 'createdAt']).optional(),
        sortType: z.enum(['asc', 'desc']).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        connections: z.array(bankConnectionSchema),
        total: z.number(),
        pages: z.number()
    }),
    fn: async (inputs: {
        clientId: string;
        status?: string;
        bankName?: string;
        connectionType?: string;
        sortBy?: string;
        sortType?: string;
        limit?: number;
        page?: number;
    }) => {
        const filter = pick(inputs, ['status', 'bankName', 'connectionType']);
        const options = pick(inputs, ['sortBy', 'sortType', 'limit', 'page']);

        filter.clientId = inputs.clientId;

        const result = await bankConnectionService.queryBankConnections(filter, options);
        return result;
    }
};

const syncBankConnectionTool: MCPTool = {
    id: 'bank_connection_sync',
    name: 'Sync Bank Connection',
    description: 'Trigger manual synchronization of a bank connection',
    inputSchema: z.object({
        connectionId: z.string().uuid()
    }),
    outputSchema: processingTaskSchema,
    fn: async (inputs: { connectionId: string }) => {
        const task = await bankConnectionService.syncBankConnection(inputs.connectionId);
        return task;
    }
};

const testBankConnectionTool: MCPTool = {
    id: 'bank_connection_test',
    name: 'Test Bank Connection',
    description: 'Test the connectivity and credentials of a bank connection',
    inputSchema: z.object({
        connectionId: z.string().uuid()
    }),
    outputSchema: z.object({
        isConnected: z.boolean(),
        lastTested: z.string(),
        error: z.string().optional()
    }),
    fn: async (inputs: { connectionId: string }) => {
        const result = await bankConnectionService.testBankConnection(inputs.connectionId);
        return {
            ...result,
            lastTested: result.lastTested.toISOString()
        };
    }
};

const updateBankConnectionTool: MCPTool = {
    id: 'bank_connection_update',
    name: 'Update Bank Connection',
    description: 'Update properties of a bank connection',
    inputSchema: z.object({
        connectionId: z.string().uuid(),
        bankName: z.string().optional(),
        status: z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR', 'SYNCING']).optional(),
        credentials: z.any().optional(),
        settings: z.any().optional()
    }),
    outputSchema: bankConnectionSchema,
    fn: async (inputs: {
        connectionId: string;
        bankName?: string;
        status?: string;
        credentials?: any;
        settings?: any;
    }) => {
        const updateData = pick(inputs, ['bankName', 'status', 'credentials', 'settings']);
        const connection = await bankConnectionService.updateBankConnectionById(inputs.connectionId, updateData);
        return connection;
    }
};

const deleteBankConnectionTool: MCPTool = {
    id: 'bank_connection_delete',
    name: 'Delete Bank Connection',
    description: 'Delete a bank connection and stop all associated syncing',
    inputSchema: z.object({
        connectionId: z.string().uuid()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs: { connectionId: string }) => {
        await bankConnectionService.deleteBankConnectionById(inputs.connectionId);
        return { success: true };
    }
};

const getConnectionStatsTool: MCPTool = {
    id: 'bank_connection_get_stats',
    name: 'Get Connection Statistics',
    description: 'Get statistics and summary information for client bank connections',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        totalConnections: z.number(),
        activeConnections: z.number(),
        lastSyncDate: z.string().optional(),
        syncFrequency: z.record(z.number())
    }),
    fn: async (inputs: { clientId: string }) => {
        const stats = await bankConnectionService.getConnectionStats(inputs.clientId);
        return {
            ...stats,
            lastSyncDate: stats.lastSyncDate?.toISOString()
        };
    }
};

const getAllStatementsTool: MCPTool = {
    id: 'statement_get_all',
    name: 'Get All Statements',
    description: 'Get all statements with optional filtering across all clients',
    inputSchema: z.object({
        clientId: z.string().uuid().optional(),
        status: z.enum(['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED', 'VALIDATED']).optional(),
        accountId: z.string().uuid().optional(),
        fileName: z.string().optional(),
        fileType: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        sortBy: z.enum(['fileName', 'uploadDate', 'status', 'fileSize', 'createdAt']).optional(),
        sortType: z.enum(['asc', 'desc']).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        statements: z.array(statementSchema),
        total: z.number(),
        pages: z.number()
    }),
    fn: async (inputs: {
        clientId?: string;
        status?: string;
        accountId?: string;
        fileName?: string;
        fileType?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        sortType?: string;
        limit?: number;
        page?: number;
    }) => {
        const filter = pick(inputs, [
            'clientId',
            'status',
            'accountId',
            'fileName',
            'fileType',
            'startDate',
            'endDate'
        ]);
        const options = pick(inputs, ['sortBy', 'sortType', 'limit', 'page']);

        // Handle date range filter
        if (filter.startDate || filter.endDate) {
            (filter as any).uploadDate = {};
            if (filter.startDate) {
                (filter as any).uploadDate.gte = new Date(filter.startDate as string);
                delete (filter as any).startDate;
            }
            if (filter.endDate) {
                (filter as any).uploadDate.lte = new Date(filter.endDate as string);
                delete (filter as any).endDate;
            }
        }

        const result = await statementService.queryStatements(filter, options);
        return result;
    }
};

const getAllBankConnectionsTool: MCPTool = {
    id: 'bank_connection_get_all',
    name: 'Get All Bank Connections',
    description: 'Get all bank connections with optional filtering across all clients',
    inputSchema: z.object({
        clientId: z.string().uuid().optional(),
        status: z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR', 'SYNCING']).optional(),
        bankName: z.string().optional(),
        connectionType: z.enum(['API', 'PLAID', 'YODLEE', 'MANUAL']).optional(),
        sortBy: z.enum(['bankName', 'lastSync', 'status', 'createdAt']).optional(),
        sortType: z.enum(['asc', 'desc']).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        connections: z.array(bankConnectionSchema),
        total: z.number(),
        pages: z.number()
    }),
    fn: async (inputs: {
        clientId?: string;
        status?: string;
        bankName?: string;
        connectionType?: string;
        sortBy?: string;
        sortType?: string;
        limit?: number;
        page?: number;
    }) => {
        const filter = pick(inputs, ['clientId', 'status', 'bankName', 'connectionType']);
        const options = pick(inputs, ['sortBy', 'sortType', 'limit', 'page']);

        const result = await bankConnectionService.queryBankConnections(filter, options);
        return result;
    }
};

export const statementTools: MCPTool[] = [
    getClientStatementsTool,
    validateStatementTool,
    getStatementStatusTool,
    parseStatementsTool,
    deleteStatementTool,
    getUploadProgressTool,
    createBankConnectionTool,
    getClientBankConnectionsTool,
    syncBankConnectionTool,
    testBankConnectionTool,
    updateBankConnectionTool,
    deleteBankConnectionTool,
    getConnectionStatsTool,
    getAllStatementsTool,
    getAllBankConnectionsTool
];

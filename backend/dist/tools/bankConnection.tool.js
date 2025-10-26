import { bankConnectionService } from "../services/index.js";
import pick from "../utils/pick.js";
import { z } from 'zod';
// Schema definitions
const bankConnectionSchema = z.object({
    id: z.string(),
    clientId: z.string(),
    accountId: z.string(),
    bankName: z.string(),
    connectionType: z.enum(['API', 'PLAID', 'YODLEE', 'MANUAL']),
    lastSync: z.string().nullable(),
    status: z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR', 'SYNCING']),
    credentials: z.any().nullable(),
    settings: z.any().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    client: z
        .object({
        id: z.string(),
        name: z.string()
    })
        .optional(),
    account: z
        .object({
        id: z.string(),
        accountNumber: z.string(),
        bankName: z.string()
    })
        .optional()
});
const createBankConnectionTool = {
    id: 'bank_connection_create',
    name: 'Create Bank Connection',
    description: 'Create a new bank connection for automatic statement retrieval',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        accountId: z.string().uuid(),
        bankName: z.string(),
        connectionType: z.enum(['API', 'PLAID', 'YODLEE', 'MANUAL']),
        credentials: z.any().optional(),
        settings: z.any().optional()
    }),
    outputSchema: bankConnectionSchema,
    fn: async (inputs) => {
        const connection = await bankConnectionService.createBankConnection(inputs);
        return connection;
    }
};
const getBankConnectionsTool = {
    id: 'bank_connection_get_all',
    name: 'Get All Bank Connections',
    description: 'Get all bank connections with optional filters and pagination',
    inputSchema: z.object({
        clientId: z.string().optional(),
        status: z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR', 'SYNCING']).optional(),
        connectionType: z.enum(['API', 'PLAID', 'YODLEE', 'MANUAL']).optional(),
        sortBy: z.string().optional(),
        sortType: z.enum(['asc', 'desc']).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        connections: z.array(bankConnectionSchema)
    }),
    fn: async (inputs) => {
        const filter = pick(inputs, ['clientId', 'status', 'connectionType']);
        const options = pick(inputs, ['sortBy', 'sortType', 'limit', 'page']);
        const connections = await bankConnectionService.queryBankConnections(filter, options);
        return { connections };
    }
};
const getBankConnectionTool = {
    id: 'bank_connection_get_by_id',
    name: 'Get Bank Connection By ID',
    description: 'Get a single bank connection by its ID',
    inputSchema: z.object({
        connectionId: z.string().uuid()
    }),
    outputSchema: bankConnectionSchema,
    fn: async (inputs) => {
        const connection = await bankConnectionService.getBankConnectionById(inputs.connectionId);
        if (!connection) {
            throw new Error('Bank connection not found');
        }
        return connection;
    }
};
const getClientBankConnectionsTool = {
    id: 'bank_connection_get_by_client',
    name: 'Get Bank Connections By Client',
    description: 'Get all bank connections for a specific client',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        connections: z.array(bankConnectionSchema)
    }),
    fn: async (inputs) => {
        const connections = await bankConnectionService.getBankConnectionsByClientId(inputs.clientId);
        return { connections };
    }
};
const updateBankConnectionTool = {
    id: 'bank_connection_update',
    name: 'Update Bank Connection',
    description: 'Update bank connection settings',
    inputSchema: z.object({
        connectionId: z.string().uuid(),
        bankName: z.string().optional(),
        connectionType: z.enum(['API', 'PLAID', 'YODLEE', 'MANUAL']).optional(),
        credentials: z.any().optional(),
        settings: z.any().optional()
    }),
    outputSchema: bankConnectionSchema,
    fn: async (inputs) => {
        const updateBody = pick(inputs, ['bankName', 'connectionType', 'credentials', 'settings']);
        const connection = await bankConnectionService.updateBankConnectionById(inputs.connectionId, updateBody);
        return connection;
    }
};
const deleteBankConnectionTool = {
    id: 'bank_connection_delete',
    name: 'Delete Bank Connection',
    description: 'Delete a bank connection',
    inputSchema: z.object({
        connectionId: z.string().uuid()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        await bankConnectionService.deleteBankConnectionById(inputs.connectionId);
        return { success: true };
    }
};
const syncBankConnectionTool = {
    id: 'bank_connection_sync',
    name: 'Sync Bank Connection',
    description: 'Trigger manual synchronization of a bank connection to fetch latest data',
    inputSchema: z.object({
        connectionId: z.string().uuid()
    }),
    outputSchema: z.object({
        taskId: z.string(),
        message: z.string()
    }),
    fn: async (inputs) => {
        const result = await bankConnectionService.syncBankConnection(inputs.connectionId);
        return {
            taskId: result.taskId,
            message: 'Bank connection synchronization started successfully'
        };
    }
};
const getBankConnectionByAccountTool = {
    id: 'bank_connection_get_by_account',
    name: 'Get Bank Connection By Account',
    description: 'Get the active bank connection for a specific account',
    inputSchema: z.object({
        accountId: z.string().uuid()
    }),
    outputSchema: z.any(),
    fn: async (inputs) => {
        const connection = await bankConnectionService.getBankConnectionByAccountId(inputs.accountId);
        return connection;
    }
};
export const bankConnectionTools = [
    createBankConnectionTool,
    getBankConnectionsTool,
    getBankConnectionTool,
    getClientBankConnectionsTool,
    updateBankConnectionTool,
    deleteBankConnectionTool,
    syncBankConnectionTool,
    getBankConnectionByAccountTool
];

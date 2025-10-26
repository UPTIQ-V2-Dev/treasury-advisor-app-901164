import { clientService } from "../services/index.js";
import pick from "../utils/pick.js";
import { z } from 'zod';
// Schema definitions
const clientAccountSchema = z.object({
    id: z.string(),
    accountNumber: z.string(),
    accountType: z.string(),
    bankName: z.string(),
    routingNumber: z.string().nullable(),
    isActive: z.boolean(),
    openDate: z.string(),
    balance: z.number().nullable(),
    currency: z.string(),
    clientId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string()
});
const relationshipManagerSchema = z.object({
    id: z.number(),
    name: z.string().nullable(),
    email: z.string()
});
const clientSchema = z.object({
    id: z.string(),
    name: z.string(),
    businessType: z.string(),
    industry: z.string(),
    businessSegment: z.string(),
    riskProfile: z.string(),
    relationshipManagerId: z.number(),
    relationshipManager: relationshipManagerSchema,
    contact: z.any(),
    preferences: z.any(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ClientAccount: z.array(clientAccountSchema).optional()
});
const createClientTool = {
    id: 'client_create',
    name: 'Create Client',
    description: 'Create a new client record',
    inputSchema: z.object({
        name: z.string(),
        businessType: z.string(),
        industry: z.string(),
        relationshipManagerId: z.number(),
        businessSegment: z.enum(['small', 'medium', 'large', 'enterprise']),
        contact: z.any(),
        preferences: z.any().optional(),
        riskProfile: z.enum(['low', 'medium', 'high']).optional()
    }),
    outputSchema: clientSchema,
    fn: async (inputs) => {
        const client = await clientService.createClient(inputs);
        return client;
    }
};
const getClientsTool = {
    id: 'client_get_all',
    name: 'Get All Clients',
    description: 'Get all clients with optional filters and pagination',
    inputSchema: z.object({
        name: z.string().optional(),
        industry: z.string().optional(),
        businessType: z.string().optional(),
        businessSegment: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
        riskProfile: z.enum(['low', 'medium', 'high']).optional(),
        relationshipManagerId: z.number().optional(),
        sortBy: z.string().optional(),
        sortType: z.enum(['asc', 'desc']).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        clients: z.array(clientSchema),
        total: z.number(),
        pages: z.number()
    }),
    fn: async (inputs) => {
        const filter = pick(inputs, [
            'name',
            'industry',
            'businessType',
            'businessSegment',
            'riskProfile',
            'relationshipManagerId'
        ]);
        const options = pick(inputs, ['sortBy', 'sortType', 'limit', 'page']);
        const result = await clientService.queryClients(filter, options);
        return result;
    }
};
const getClientTool = {
    id: 'client_get_by_id',
    name: 'Get Client By ID',
    description: 'Get a single client by their ID',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: clientSchema,
    fn: async (inputs) => {
        const client = await clientService.getClientById(inputs.clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        return client;
    }
};
const updateClientTool = {
    id: 'client_update',
    name: 'Update Client',
    description: 'Update client information by ID',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        name: z.string().optional(),
        businessType: z.string().optional(),
        industry: z.string().optional(),
        relationshipManagerId: z.number().optional(),
        businessSegment: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
        contact: z.any().optional(),
        preferences: z.any().optional(),
        riskProfile: z.enum(['low', 'medium', 'high']).optional()
    }),
    outputSchema: clientSchema,
    fn: async (inputs) => {
        const updateBody = pick(inputs, [
            'name',
            'businessType',
            'industry',
            'relationshipManagerId',
            'businessSegment',
            'contact',
            'preferences',
            'riskProfile'
        ]);
        const client = await clientService.updateClientById(inputs.clientId, updateBody);
        return client;
    }
};
const deleteClientTool = {
    id: 'client_delete',
    name: 'Delete Client',
    description: 'Delete a client by their ID',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        await clientService.deleteClientById(inputs.clientId);
        return { success: true };
    }
};
const searchClientsTool = {
    id: 'client_search',
    name: 'Search Clients',
    description: 'Search clients by name, industry, or business type',
    inputSchema: z.object({
        query: z.string().min(1)
    }),
    outputSchema: z.object({
        clients: z.array(clientSchema)
    }),
    fn: async (inputs) => {
        const clients = await clientService.searchClients(inputs.query);
        return { clients };
    }
};
const getClientsByRMTool = {
    id: 'client_get_by_rm',
    name: 'Get Clients By Relationship Manager',
    description: 'Get all clients assigned to a relationship manager',
    inputSchema: z.object({
        relationshipManagerId: z.number()
    }),
    outputSchema: z.object({
        clients: z.array(clientSchema)
    }),
    fn: async (inputs) => {
        const clients = await clientService.getClientsByRM(inputs.relationshipManagerId);
        return { clients };
    }
};
const updateClientPreferencesTool = {
    id: 'client_update_preferences',
    name: 'Update Client Preferences',
    description: 'Update client preferences',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        communicationChannel: z.enum(['email', 'phone', 'sms', 'portal']).optional(),
        reportFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
        riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
        liquidityPriority: z.enum(['low', 'medium', 'high']).optional(),
        yieldPriority: z.enum(['low', 'medium', 'high']).optional()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        const preferences = pick(inputs, [
            'communicationChannel',
            'reportFrequency',
            'riskTolerance',
            'liquidityPriority',
            'yieldPriority'
        ]);
        await clientService.updateClientPreferences(inputs.clientId, preferences);
        return { success: true };
    }
};
const getClientAccountsTool = {
    id: 'client_get_accounts',
    name: 'Get Client Accounts',
    description: 'Get all accounts for a specific client',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        accounts: z.array(clientAccountSchema)
    }),
    fn: async (inputs) => {
        const accounts = await clientService.getClientAccounts(inputs.clientId);
        return { accounts };
    }
};
const addClientAccountTool = {
    id: 'client_add_account',
    name: 'Add Client Account',
    description: 'Add a new account for a client',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        accountNumber: z.string(),
        accountType: z.string(),
        bankName: z.string(),
        routingNumber: z.string().optional(),
        openDate: z.string(),
        balance: z.number().optional(),
        currency: z.string().length(3).optional()
    }),
    outputSchema: clientAccountSchema,
    fn: async (inputs) => {
        const accountData = {
            accountNumber: inputs.accountNumber,
            accountType: inputs.accountType,
            bankName: inputs.bankName,
            routingNumber: inputs.routingNumber,
            openDate: new Date(inputs.openDate),
            balance: inputs.balance,
            currency: inputs.currency
        };
        const account = await clientService.addClientAccount(inputs.clientId, accountData);
        return account;
    }
};
const updateClientAccountTool = {
    id: 'client_update_account',
    name: 'Update Client Account',
    description: 'Update account information',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        accountId: z.string().uuid(),
        accountType: z.string().optional(),
        bankName: z.string().optional(),
        routingNumber: z.string().optional(),
        isActive: z.boolean().optional(),
        balance: z.number().optional(),
        currency: z.string().length(3).optional()
    }),
    outputSchema: clientAccountSchema,
    fn: async (inputs) => {
        const updateData = pick(inputs, [
            'accountType',
            'bankName',
            'routingNumber',
            'isActive',
            'balance',
            'currency'
        ]);
        const account = await clientService.updateClientAccount(inputs.clientId, inputs.accountId, updateData);
        return account;
    }
};
export const clientTools = [
    createClientTool,
    getClientsTool,
    getClientTool,
    updateClientTool,
    deleteClientTool,
    searchClientsTool,
    getClientsByRMTool,
    updateClientPreferencesTool,
    getClientAccountsTool,
    addClientAccountTool,
    updateClientAccountTool
];

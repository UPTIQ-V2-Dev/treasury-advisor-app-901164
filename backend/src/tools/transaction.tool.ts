import { TransactionType } from '../generated/prisma/index.js';
import { transactionService } from '../services/index.ts';
import { MCPTool } from '../types/mcp.ts';
import pick from '../utils/pick.ts';
import { z } from 'zod';

const transactionSchema = z.object({
    id: z.string(),
    accountId: z.string(),
    clientId: z.string(),
    statementId: z.string().nullable(),
    date: z.string(),
    description: z.string(),
    amount: z.number(),
    type: z.string(),
    category: z.string().nullable(),
    counterparty: z.string().nullable(),
    balanceAfter: z.number().nullable(),
    metadata: z.any().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
});

const getTransactionsTool: MCPTool = {
    id: 'transactions_get_all',
    name: 'Get Transactions',
    description:
        'Get transactions for a client with optional filtering by account, date ranges, categories, types, amounts, and counterparties. Supports advanced filtering and pagination.',
    inputSchema: z.object({
        clientId: z.string(),
        accountId: z.string().optional(),
        type: z.union([z.nativeEnum(TransactionType), z.array(z.nativeEnum(TransactionType))]).optional(),
        category: z.union([z.string(), z.array(z.string())]).optional(),
        counterparty: z.union([z.string(), z.array(z.string())]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        minAmount: z.number().optional(),
        maxAmount: z.number().optional(),
        description: z.string().optional(),
        sortBy: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        results: z.array(transactionSchema),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
        totalResults: z.number()
    }),
    fn: async (inputs: any) => {
        const filter = pick(inputs, [
            'clientId',
            'accountId',
            'type',
            'category',
            'counterparty',
            'startDate',
            'endDate',
            'minAmount',
            'maxAmount',
            'description'
        ]);
        const options = pick(inputs, ['sortBy', 'limit', 'page']);
        return await transactionService.queryTransactions(filter, options);
    }
};

const getTransactionByIdTool: MCPTool = {
    id: 'transaction_get_by_id',
    name: 'Get Transaction by ID',
    description: 'Get detailed information about a specific transaction by its ID',
    inputSchema: z.object({
        transactionId: z.string()
    }),
    outputSchema: transactionSchema,
    fn: async (inputs: { transactionId: string }) => {
        return await transactionService.getTransactionById(inputs.transactionId);
    }
};

const getTransactionAnalyticsTool: MCPTool = {
    id: 'transaction_get_analytics',
    name: 'Get Transaction Analytics',
    description:
        'Get comprehensive transaction analytics for a client including cash flow summary, category breakdown, transaction type analysis, and top counterparties',
    inputSchema: z.object({
        clientId: z.string(),
        accountId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional()
    }),
    outputSchema: z.object({
        summary: z.object({
            totalInflow: z.number(),
            totalOutflow: z.number(),
            netCashFlow: z.number(),
            totalTransactions: z.number(),
            inflowCount: z.number(),
            outflowCount: z.number()
        }),
        categoryBreakdown: z.array(
            z.object({
                category: z.string(),
                amount: z.number(),
                count: z.number(),
                isInflow: z.boolean()
            })
        ),
        typeBreakdown: z.array(
            z.object({
                type: z.string(),
                amount: z.number(),
                count: z.number(),
                isInflow: z.boolean()
            })
        ),
        counterpartyBreakdown: z.array(
            z.object({
                counterparty: z.string().nullable(),
                amount: z.number(),
                count: z.number(),
                isInflow: z.boolean()
            })
        )
    }),
    fn: async (inputs: { clientId: string; accountId?: string; startDate?: string; endDate?: string }) => {
        const filters = pick(inputs, ['accountId', 'startDate', 'endDate']);
        return await transactionService.getTransactionAnalytics(inputs.clientId, filters);
    }
};

const getTransactionsByAccountTool: MCPTool = {
    id: 'transactions_get_by_account',
    name: 'Get Transactions by Account',
    description: 'Get all transactions for a specific account with pagination and sorting',
    inputSchema: z.object({
        accountId: z.string(),
        sortBy: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        results: z.array(transactionSchema),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
        totalResults: z.number()
    }),
    fn: async (inputs: { accountId: string; sortBy?: string; limit?: number; page?: number }) => {
        const options = pick(inputs, ['sortBy', 'limit', 'page']);
        return await transactionService.getTransactionsByAccount(inputs.accountId, options);
    }
};

const searchTransactionsByDescriptionTool: MCPTool = {
    id: 'transactions_search_by_description',
    name: 'Search Transactions by Description',
    description: 'Search transactions by description text across all accounts for a client',
    inputSchema: z.object({
        clientId: z.string(),
        searchText: z.string(),
        accountId: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        results: z.array(transactionSchema),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
        totalResults: z.number()
    }),
    fn: async (inputs: { clientId: string; searchText: string; accountId?: string; limit?: number; page?: number }) => {
        const filter = {
            clientId: inputs.clientId,
            accountId: inputs.accountId,
            description: inputs.searchText
        };
        const options = {
            sortBy: 'date:desc',
            limit: inputs.limit || 10,
            page: inputs.page || 1
        };
        return await transactionService.queryTransactions(filter, options);
    }
};

const getLargeTransactionsTool: MCPTool = {
    id: 'transactions_get_large',
    name: 'Get Large Transactions',
    description: 'Get transactions above a certain amount threshold for a client',
    inputSchema: z.object({
        clientId: z.string(),
        minAmount: z.number(),
        accountId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional()
    }),
    outputSchema: z.object({
        results: z.array(transactionSchema),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
        totalResults: z.number()
    }),
    fn: async (inputs: {
        clientId: string;
        minAmount: number;
        accountId?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }) => {
        const filter = pick(inputs, ['clientId', 'accountId', 'minAmount', 'startDate', 'endDate']);
        const options = {
            sortBy: 'amount:desc',
            limit: inputs.limit || 20,
            page: 1
        };
        return await transactionService.queryTransactions(filter, options);
    }
};

const getTransactionsByCounterpartyTool: MCPTool = {
    id: 'transactions_get_by_counterparty',
    name: 'Get Transactions by Counterparty',
    description: 'Get all transactions with a specific counterparty for a client',
    inputSchema: z.object({
        clientId: z.string(),
        counterparty: z.string(),
        accountId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        sortBy: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        results: z.array(transactionSchema),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
        totalResults: z.number()
    }),
    fn: async (inputs: any) => {
        const filter = pick(inputs, ['clientId', 'counterparty', 'accountId', 'startDate', 'endDate']);
        const options = pick(inputs, ['sortBy', 'limit', 'page']);
        return await transactionService.queryTransactions(filter, options);
    }
};

const getTransactionsByCategoryTool: MCPTool = {
    id: 'transactions_get_by_category',
    name: 'Get Transactions by Category',
    description: 'Get all transactions in specific categories for a client',
    inputSchema: z.object({
        clientId: z.string(),
        categories: z.union([z.string(), z.array(z.string())]),
        accountId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        sortBy: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        results: z.array(transactionSchema),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
        totalResults: z.number()
    }),
    fn: async (inputs: any) => {
        const filter = {
            clientId: inputs.clientId,
            category: inputs.categories,
            accountId: inputs.accountId,
            startDate: inputs.startDate,
            endDate: inputs.endDate
        };
        const options = pick(inputs, ['sortBy', 'limit', 'page']);
        return await transactionService.queryTransactions(filter, options);
    }
};

const getRecentTransactionsTool: MCPTool = {
    id: 'transactions_get_recent',
    name: 'Get Recent Transactions',
    description: 'Get the most recent transactions for a client, optionally filtered by account',
    inputSchema: z.object({
        clientId: z.string(),
        accountId: z.string().optional(),
        days: z.number().int().min(1).max(365).optional(),
        limit: z.number().int().min(1).max(100).optional()
    }),
    outputSchema: z.object({
        results: z.array(transactionSchema),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
        totalResults: z.number()
    }),
    fn: async (inputs: { clientId: string; accountId?: string; days?: number; limit?: number }) => {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (inputs.days || 30) * 24 * 60 * 60 * 1000);

        const filter = {
            clientId: inputs.clientId,
            accountId: inputs.accountId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };

        const options = {
            sortBy: 'date:desc',
            limit: inputs.limit || 20,
            page: 1
        };

        return await transactionService.queryTransactions(filter, options);
    }
};

export const transactionTools: MCPTool[] = [
    getTransactionsTool,
    getTransactionByIdTool,
    getTransactionAnalyticsTool,
    getTransactionsByAccountTool,
    searchTransactionsByDescriptionTool,
    getLargeTransactionsTool,
    getTransactionsByCounterpartyTool,
    getTransactionsByCategoryTool,
    getRecentTransactionsTool
];

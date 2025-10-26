import prisma from '../client.ts';
import { Prisma, Transaction } from '../generated/prisma/index.js';
import ApiError from '../utils/ApiError.ts';
import httpStatus from 'http-status';

/**
 * Create a transaction
 * @param {Object} transactionData
 * @returns {Promise<Transaction>}
 */
const createTransaction = async (
    transactionData: Omit<Prisma.TransactionCreateInput, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Transaction> => {
    // Verify client exists
    const client = await prisma.client.findUnique({
        where: { id: transactionData.client.connect!.id }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    // Verify account exists and belongs to client
    const account = await prisma.clientAccount.findFirst({
        where: {
            id: transactionData.account.connect!.id,
            clientId: transactionData.client.connect!.id
        }
    });
    if (!account) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Account not found or does not belong to client');
    }

    return prisma.transaction.create({
        data: transactionData,
        include: {
            client: true,
            account: true,
            statement: true
        }
    });
};

/**
 * Query for transactions
 * @param {Object} filter - MongoDB filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryTransactions = async (filter: any, options: any) => {
    const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
    const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TransactionWhereInput = {};

    // Required clientId filter
    if (filter.clientId) {
        where.clientId = filter.clientId;
    } else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Client ID is required');
    }

    // Optional filters
    if (filter.accountId) {
        where.accountId = filter.accountId;
    }

    if (filter.type) {
        if (Array.isArray(filter.type)) {
            where.type = { in: filter.type };
        } else {
            where.type = filter.type;
        }
    }

    if (filter.category) {
        if (Array.isArray(filter.category)) {
            where.category = { in: filter.category };
        } else {
            where.category = filter.category;
        }
    }

    if (filter.counterparty) {
        if (Array.isArray(filter.counterparty)) {
            where.counterparty = { in: filter.counterparty };
        } else {
            where.counterparty = { contains: filter.counterparty, mode: 'insensitive' };
        }
    }

    // Date range filters
    if (filter.startDate || filter.endDate) {
        where.date = {};
        if (filter.startDate) {
            where.date.gte = new Date(filter.startDate);
        }
        if (filter.endDate) {
            where.date.lte = new Date(filter.endDate);
        }
    }

    // Amount range filters
    if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
        where.amount = {};
        if (filter.minAmount !== undefined) {
            where.amount.gte = parseFloat(filter.minAmount);
        }
        if (filter.maxAmount !== undefined) {
            where.amount.lte = parseFloat(filter.maxAmount);
        }
    }

    // Description search
    if (filter.description) {
        where.description = { contains: filter.description, mode: 'insensitive' };
    }

    // Build orderBy clause
    let orderBy: Prisma.TransactionOrderByWithRelationInput = { date: 'desc' }; // Default sort
    if (options.sortBy) {
        const [field, order] = options.sortBy.split(':');
        orderBy = { [field]: order === 'asc' ? 'asc' : 'desc' };
    }

    const transactions = await prisma.transaction.findMany({
        where,
        include: {
            client: {
                select: {
                    id: true,
                    name: true
                }
            },
            account: {
                select: {
                    id: true,
                    accountNumber: true,
                    accountType: true,
                    bankName: true
                }
            },
            statement: {
                select: {
                    id: true,
                    fileName: true,
                    period: true
                }
            }
        },
        orderBy,
        skip,
        take: limit
    });

    const totalResults = await prisma.transaction.count({ where });
    const totalPages = Math.ceil(totalResults / limit);

    return {
        results: transactions,
        page,
        limit,
        totalPages,
        totalResults
    };
};

/**
 * Get transaction by id
 * @param {string} id
 * @returns {Promise<Transaction>}
 */
const getTransactionById = async (id: string): Promise<Transaction> => {
    const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
            client: true,
            account: true,
            statement: true
        }
    });

    if (!transaction) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
    }

    return transaction;
};

/**
 * Update transaction by id
 * @param {string} transactionId
 * @param {Object} updateBody
 * @returns {Promise<Transaction>}
 */
const updateTransactionById = async (
    transactionId: string,
    updateBody: Partial<Prisma.TransactionUpdateInput>
): Promise<Transaction> => {
    const transaction = await getTransactionById(transactionId);

    const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: updateBody,
        include: {
            client: true,
            account: true,
            statement: true
        }
    });

    return updatedTransaction;
};

/**
 * Delete transaction by id
 * @param {string} transactionId
 * @returns {Promise<Transaction>}
 */
const deleteTransactionById = async (transactionId: string): Promise<Transaction> => {
    const transaction = await getTransactionById(transactionId);

    await prisma.transaction.delete({
        where: { id: transaction.id }
    });

    return transaction;
};

/**
 * Get transaction analytics for a client
 * @param {string} clientId
 * @param {Object} filters
 * @returns {Promise<Object>}
 */
const getTransactionAnalytics = async (clientId: string, filters: any = {}) => {
    const where: Prisma.TransactionWhereInput = { clientId };

    // Apply date filters
    if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
            where.date.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            where.date.lte = new Date(filters.endDate);
        }
    }

    // Apply account filter
    if (filters.accountId) {
        where.accountId = filters.accountId;
    }

    // Get total inflow and outflow
    const totalInflow = await prisma.transaction.aggregate({
        where: { ...where, amount: { gt: 0 } },
        _sum: { amount: true },
        _count: true
    });

    const totalOutflow = await prisma.transaction.aggregate({
        where: { ...where, amount: { lt: 0 } },
        _sum: { amount: true },
        _count: true
    });

    // Get category breakdown
    const categoryBreakdown = await prisma.transaction.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } }
    });

    // Get type breakdown
    const typeBreakdown = await prisma.transaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } }
    });

    // Get counterparty breakdown (top 10)
    const counterpartyBreakdown = await prisma.transaction.groupBy({
        by: ['counterparty'],
        where: { ...where, counterparty: { not: null } },
        _sum: { amount: true },
        _count: true,
        orderBy: { counterparty: 'asc' },
        take: 10
    });

    // Sort manually by count descending
    counterpartyBreakdown.sort((a: any, b: any) => b._count - a._count);

    const netCashFlow = (totalInflow._sum.amount || 0) + (totalOutflow._sum.amount || 0);
    const totalTransactions = (totalInflow._count || 0) + (totalOutflow._count || 0);

    return {
        summary: {
            totalInflow: totalInflow._sum.amount || 0,
            totalOutflow: Math.abs(totalOutflow._sum.amount || 0),
            netCashFlow,
            totalTransactions,
            inflowCount: totalInflow._count || 0,
            outflowCount: totalOutflow._count || 0
        },
        categoryBreakdown: categoryBreakdown.map(item => ({
            category: item.category || 'Uncategorized',
            amount: item._sum.amount || 0,
            count: item._count,
            isInflow: (item._sum.amount || 0) > 0
        })),
        typeBreakdown: typeBreakdown.map(item => ({
            type: item.type,
            amount: item._sum.amount || 0,
            count: item._count,
            isInflow: (item._sum.amount || 0) > 0
        })),
        counterpartyBreakdown: counterpartyBreakdown.map(item => ({
            counterparty: item.counterparty,
            amount: item._sum?.amount || 0,
            count: item._count,
            isInflow: (item._sum?.amount || 0) > 0
        }))
    };
};

/**
 * Get transactions by account
 * @param {string} accountId
 * @param {Object} options
 * @returns {Promise<Array>}
 */
const getTransactionsByAccount = async (accountId: string, options: any = {}) => {
    const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
    const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = { accountId };

    // Build orderBy clause
    let orderBy: Prisma.TransactionOrderByWithRelationInput = { date: 'desc' }; // Default sort
    if (options.sortBy) {
        const [field, order] = options.sortBy.split(':');
        orderBy = { [field]: order === 'asc' ? 'asc' : 'desc' };
    }

    const transactions = await prisma.transaction.findMany({
        where,
        include: {
            client: {
                select: {
                    id: true,
                    name: true
                }
            },
            account: {
                select: {
                    id: true,
                    accountNumber: true,
                    accountType: true,
                    bankName: true
                }
            },
            statement: {
                select: {
                    id: true,
                    fileName: true,
                    period: true
                }
            }
        },
        orderBy,
        skip,
        take: limit
    });

    const totalResults = await prisma.transaction.count({ where });
    const totalPages = Math.ceil(totalResults / limit);

    return {
        results: transactions,
        page,
        limit,
        totalPages,
        totalResults
    };
};

export default {
    createTransaction,
    queryTransactions,
    getTransactionById,
    updateTransactionById,
    deleteTransactionById,
    getTransactionAnalytics,
    getTransactionsByAccount
};

import prisma from "../client.js";
import { ConnectionStatus, TaskStatus, TaskType } from '../generated/prisma/index.js';
import ApiError from "../utils/ApiError.js";
import httpStatus from 'http-status';
/**
 * Create bank connection
 * @param {Object} data
 * @returns {Promise<BankConnection>}
 */
const createBankConnection = async (data) => {
    // Verify client and account exist
    const account = await prisma.clientAccount.findUnique({
        where: { id: data.accountId },
        include: { client: true }
    });
    if (!account || account.clientId !== data.clientId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid client or account');
    }
    // Check for existing connection
    const existingConnection = await prisma.bankConnection.findFirst({
        where: {
            clientId: data.clientId,
            accountId: data.accountId,
            bankName: data.bankName
        }
    });
    if (existingConnection) {
        throw new ApiError(httpStatus.CONFLICT, 'Bank connection already exists for this account');
    }
    return prisma.bankConnection.create({
        data: {
            ...data,
            lastSync: new Date(),
            status: ConnectionStatus.CONNECTED
        },
        include: {
            client: true,
            account: true
        }
    });
};
/**
 * Get bank connections with filters
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<BankConnection[]>}
 */
const queryBankConnections = async (filter, options) => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';
    const [connections, total] = await Promise.all([
        prisma.bankConnection.findMany({
            where: filter,
            include: {
                client: true,
                account: true
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: sortType }
        }),
        prisma.bankConnection.count({ where: filter })
    ]);
    const pages = Math.ceil(total / limit);
    return { connections, total, pages };
};
/**
 * Get bank connection by ID
 * @param {string} id
 * @returns {Promise<BankConnection | null>}
 */
const getBankConnectionById = async (id) => {
    return await prisma.bankConnection.findUnique({
        where: { id },
        include: {
            client: true,
            account: true
        }
    });
};
/**
 * Get bank connections by client ID
 * @param {string} clientId
 * @returns {Promise<BankConnection[]>}
 */
const getBankConnectionsByClientId = async (clientId) => {
    return await prisma.bankConnection.findMany({
        where: { clientId },
        include: {
            client: true,
            account: true
        },
        orderBy: { createdAt: 'desc' }
    });
};
/**
 * Update bank connection by ID
 * @param {string} connectionId
 * @param {Object} updateBody
 * @returns {Promise<BankConnection>}
 */
const updateBankConnectionById = async (connectionId, updateBody) => {
    const connection = await getBankConnectionById(connectionId);
    if (!connection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Bank connection not found');
    }
    return prisma.bankConnection.update({
        where: { id: connectionId },
        data: updateBody,
        include: {
            client: true,
            account: true
        }
    });
};
/**
 * Delete bank connection by ID
 * @param {string} connectionId
 * @returns {Promise<void>}
 */
const deleteBankConnectionById = async (connectionId) => {
    const connection = await getBankConnectionById(connectionId);
    if (!connection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Bank connection not found');
    }
    await prisma.bankConnection.delete({
        where: { id: connectionId }
    });
};
/**
 * Trigger manual synchronization
 * @param {string} connectionId
 * @returns {Promise<ProcessingTask>}
 */
const syncBankConnection = async (connectionId) => {
    const connection = await getBankConnectionById(connectionId);
    if (!connection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Bank connection not found');
    }
    if (connection.status !== ConnectionStatus.CONNECTED) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Bank connection is not in a connected state');
    }
    // Update connection status to syncing
    await updateBankConnectionById(connectionId, {
        status: ConnectionStatus.SYNCING,
        lastSync: new Date()
    });
    // Create processing task for the sync
    const processingTask = await prisma.processingTask.create({
        data: {
            clientId: connection.clientId,
            type: TaskType.DATA_SYNC,
            status: TaskStatus.PENDING,
            steps: {
                total: 4,
                steps: [
                    { id: 1, name: 'Connection Validation', status: 'pending' },
                    { id: 2, name: 'Data Retrieval', status: 'pending' },
                    { id: 3, name: 'Data Processing', status: 'pending' },
                    { id: 4, name: 'Storage', status: 'pending' }
                ]
            },
            estimatedDuration: 180000 // 3 minutes
        }
    });
    // In a real implementation, you would trigger the actual sync process here
    // For now, we'll simulate it by updating the status back to connected after a delay
    // This would typically be handled by a background job processor
    return processingTask;
};
/**
 * Test bank connection
 * @param {string} connectionId
 * @returns {Promise<Object>}
 */
const testBankConnection = async (connectionId) => {
    const connection = await getBankConnectionById(connectionId);
    if (!connection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Bank connection not found');
    }
    // Mock connection test - in real implementation, this would test the actual connection
    const testResult = {
        isConnected: Math.random() > 0.1, // 90% success rate for demo
        lastTested: new Date(),
        error: Math.random() > 0.9 ? 'Invalid credentials' : undefined
    };
    // Update connection status based on test result
    await updateBankConnectionById(connectionId, {
        status: testResult.isConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.ERROR,
        settings: {
            ...connection.settings,
            lastTested: testResult.lastTested,
            lastTestResult: testResult
        }
    });
    return testResult;
};
/**
 * Get connection statistics
 * @param {string} clientId
 * @returns {Promise<Object>}
 */
const getConnectionStats = async (clientId) => {
    const connections = await getBankConnectionsByClientId(clientId);
    const stats = {
        totalConnections: connections.length,
        activeConnections: connections.filter(c => c.status === ConnectionStatus.CONNECTED).length,
        lastSyncDate: connections
            .filter(c => c.lastSync)
            .sort((a, b) => (b.lastSync?.getTime() || 0) - (a.lastSync?.getTime() || 0))[0]?.lastSync || undefined,
        syncFrequency: connections.reduce((freq, conn) => {
            freq[conn.status] = (freq[conn.status] || 0) + 1;
            return freq;
        }, {})
    };
    return stats;
};
export default {
    createBankConnection,
    queryBankConnections,
    getBankConnectionById,
    getBankConnectionsByClientId,
    updateBankConnectionById,
    deleteBankConnectionById,
    syncBankConnection,
    testBankConnection,
    getConnectionStats
};

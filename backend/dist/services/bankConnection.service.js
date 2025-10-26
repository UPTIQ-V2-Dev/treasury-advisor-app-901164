import prisma from "../client.js";
import { ConnectionStatus } from '../generated/prisma/index.js';
import ApiError from "../utils/ApiError.js";
import { processingService } from "./index.js";
import httpStatus from 'http-status';
/**
 * Create a bank connection
 * @param {Object} connectionData
 * @returns {Promise<BankConnection>}
 */
const createBankConnection = async (connectionData) => {
    // Verify client exists
    const client = await prisma.client.findUnique({
        where: { id: connectionData.clientId }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }
    // Verify account exists and belongs to client
    const account = await prisma.clientAccount.findFirst({
        where: {
            id: connectionData.accountId,
            clientId: connectionData.clientId
        }
    });
    if (!account) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Account not found or does not belong to client');
    }
    // Check if connection already exists for this account
    const existingConnection = await prisma.bankConnection.findFirst({
        where: {
            accountId: connectionData.accountId,
            status: ConnectionStatus.CONNECTED
        }
    });
    if (existingConnection) {
        throw new ApiError(httpStatus.CONFLICT, 'Active bank connection already exists for this account');
    }
    return prisma.bankConnection.create({
        data: {
            clientId: connectionData.clientId,
            accountId: connectionData.accountId,
            bankName: connectionData.bankName,
            connectionType: connectionData.connectionType,
            lastSync: new Date(),
            status: ConnectionStatus.CONNECTED,
            credentials: connectionData.credentials || null,
            settings: connectionData.settings || null
        },
        include: {
            client: {
                select: { id: true, name: true }
            },
            account: {
                select: { id: true, accountNumber: true, bankName: true }
            }
        }
    });
};
/**
 * Query for bank connections
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @returns {Promise<BankConnection[]>}
 */
const queryBankConnections = async (filter, options, keys = [
    'id',
    'clientId',
    'accountId',
    'bankName',
    'connectionType',
    'lastSync',
    'status',
    'createdAt',
    'updatedAt'
]) => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy;
    const sortType = options.sortType ?? 'desc';
    const connections = await prisma.bankConnection.findMany({
        where: filter,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortType } : { createdAt: 'desc' }
    });
    return connections;
};
/**
 * Get bank connection by id
 * @param {string} id
 * @returns {Promise<BankConnection | null>}
 */
const getBankConnectionById = async (id) => {
    return await prisma.bankConnection.findUnique({
        where: { id },
        include: {
            client: {
                select: { id: true, name: true }
            },
            account: {
                select: { id: true, accountNumber: true, bankName: true }
            }
        }
    });
};
/**
 * Get bank connections by client ID
 * @param {string} clientId
 * @returns {Promise<BankConnection[]>}
 */
const getBankConnectionsByClientId = async (clientId) => {
    // Verify client exists
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }
    return prisma.bankConnection.findMany({
        where: { clientId },
        include: {
            account: {
                select: { id: true, accountNumber: true, bankName: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};
/**
 * Update bank connection by id
 * @param {string} connectionId
 * @param {Object} updateBody
 * @returns {Promise<BankConnection>}
 */
const updateBankConnectionById = async (connectionId, updateBody) => {
    const connection = await getBankConnectionById(connectionId);
    if (!connection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Bank connection not found');
    }
    const updatedConnection = await prisma.bankConnection.update({
        where: { id: connectionId },
        data: updateBody,
        include: {
            client: {
                select: { id: true, name: true }
            },
            account: {
                select: { id: true, accountNumber: true, bankName: true }
            }
        }
    });
    return updatedConnection;
};
/**
 * Delete bank connection by id
 * @param {string} connectionId
 * @returns {Promise<BankConnection>}
 */
const deleteBankConnectionById = async (connectionId) => {
    const connection = await getBankConnectionById(connectionId);
    if (!connection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Bank connection not found');
    }
    await prisma.bankConnection.delete({ where: { id: connectionId } });
    return connection;
};
/**
 * Trigger manual synchronization for a bank connection
 * @param {string} connectionId
 * @returns {Promise<{ taskId: string }>}
 */
const syncBankConnection = async (connectionId) => {
    const connection = await getBankConnectionById(connectionId);
    if (!connection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Bank connection not found');
    }
    if (connection.status === ConnectionStatus.DISCONNECTED) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot sync disconnected bank connection');
    }
    if (connection.status === ConnectionStatus.SYNCING) {
        throw new ApiError(httpStatus.CONFLICT, 'Bank connection is already syncing');
    }
    // Update connection status to syncing
    await prisma.bankConnection.update({
        where: { id: connectionId },
        data: {
            status: ConnectionStatus.SYNCING,
            updatedAt: new Date()
        }
    });
    // Create a processing task for the synchronization
    const task = await processingService.createProcessingTask({
        clientId: connection.clientId,
        type: 'DATA_SYNC',
        steps: {
            1: { name: 'Authenticate Connection', description: 'Verify bank connection credentials' },
            2: { name: 'Fetch Data', description: 'Retrieve latest transactions and balances' },
            3: { name: 'Process Data', description: 'Parse and validate retrieved data' },
            4: { name: 'Update Records', description: 'Update local database with new information' }
        },
        estimatedDuration: 120000 // 2 minutes
    });
    return { taskId: task.taskId };
};
/**
 * Update connection status after sync completion
 * @param {string} connectionId
 * @param {ConnectionStatus} status
 * @param {Date} lastSync
 * @returns {Promise<BankConnection>}
 */
const updateConnectionStatus = async (connectionId, status, lastSync) => {
    const updateData = { status };
    if (lastSync && status === ConnectionStatus.CONNECTED) {
        updateData.lastSync = lastSync;
    }
    return await prisma.bankConnection.update({
        where: { id: connectionId },
        data: updateData,
        include: {
            client: {
                select: { id: true, name: true }
            },
            account: {
                select: { id: true, accountNumber: true, bankName: true }
            }
        }
    });
};
/**
 * Get bank connection by account ID
 * @param {string} accountId
 * @returns {Promise<BankConnection | null>}
 */
const getBankConnectionByAccountId = async (accountId) => {
    return await prisma.bankConnection.findFirst({
        where: {
            accountId,
            status: ConnectionStatus.CONNECTED
        },
        include: {
            client: {
                select: { id: true, name: true }
            },
            account: {
                select: { id: true, accountNumber: true, bankName: true }
            }
        }
    });
};
export default {
    createBankConnection,
    queryBankConnections,
    getBankConnectionById,
    getBankConnectionsByClientId,
    updateBankConnectionById,
    deleteBankConnectionById,
    syncBankConnection,
    updateConnectionStatus,
    getBankConnectionByAccountId
};

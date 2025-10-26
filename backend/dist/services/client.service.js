import prisma from "../client.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from 'http-status';
/**
 * Create a client
 * @param {Object} clientData
 * @returns {Promise<Client>}
 */
const createClient = async (clientData) => {
    return await prisma.client.create({
        data: {
            ...clientData,
            preferences: clientData.preferences || {},
            riskProfile: clientData.riskProfile || 'medium'
        },
        include: {
            relationshipManager: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            ClientAccount: true
        }
    });
};
/**
 * Query for clients
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @returns {Promise<{clients: Client[], total: number, pages: number}>}
 */
const queryClients = async (filter, options) => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy;
    const sortType = options.sortType ?? 'desc';
    // Build where clause
    const where = {};
    if (filter.name) {
        where.name = { contains: filter.name, mode: 'insensitive' };
    }
    if (filter.industry) {
        where.industry = { contains: filter.industry, mode: 'insensitive' };
    }
    if (filter.businessType) {
        where.businessType = { contains: filter.businessType, mode: 'insensitive' };
    }
    if (filter.businessSegment) {
        where.businessSegment = filter.businessSegment;
    }
    if (filter.riskProfile) {
        where.riskProfile = filter.riskProfile;
    }
    if (filter.relationshipManagerId) {
        where.relationshipManagerId = filter.relationshipManagerId;
    }
    const [clients, total] = await Promise.all([
        prisma.client.findMany({
            where,
            include: {
                relationshipManager: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                ClientAccount: true
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: sortBy ? { [sortBy]: sortType } : { createdAt: 'desc' }
        }),
        prisma.client.count({ where })
    ]);
    const pages = Math.ceil(total / limit);
    return { clients, total, pages };
};
/**
 * Get client by id
 * @param {string} id
 * @returns {Promise<Client | null>}
 */
const getClientById = async (id) => {
    return await prisma.client.findUnique({
        where: { id },
        include: {
            relationshipManager: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            ClientAccount: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });
};
/**
 * Update client by id
 * @param {string} clientId
 * @param {Object} updateBody
 * @returns {Promise<Client>}
 */
const updateClientById = async (clientId, updateBody) => {
    const client = await getClientById(clientId);
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }
    const updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: updateBody,
        include: {
            relationshipManager: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            ClientAccount: true
        }
    });
    return updatedClient;
};
/**
 * Delete client by id
 * @param {string} clientId
 * @returns {Promise<Client>}
 */
const deleteClientById = async (clientId) => {
    const client = await getClientById(clientId);
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }
    // Check if client has active accounts
    const activeAccounts = await prisma.clientAccount.count({
        where: { clientId, isActive: true }
    });
    if (activeAccounts > 0) {
        throw new ApiError(httpStatus.CONFLICT, 'Client has active accounts');
    }
    await prisma.client.delete({ where: { id: clientId } });
    return client;
};
/**
 * Search clients
 * @param {string} query - Search query
 * @returns {Promise<Client[]>}
 */
const searchClients = async (query) => {
    return await prisma.client.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { industry: { contains: query, mode: 'insensitive' } },
                { businessType: { contains: query, mode: 'insensitive' } }
            ]
        },
        include: {
            relationshipManager: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};
/**
 * Get clients by relationship manager
 * @param {number} rmId - Relationship Manager ID
 * @returns {Promise<Client[]>}
 */
const getClientsByRM = async (rmId) => {
    return await prisma.client.findMany({
        where: { relationshipManagerId: rmId },
        include: {
            relationshipManager: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            ClientAccount: true
        },
        orderBy: { createdAt: 'desc' }
    });
};
/**
 * Update client preferences
 * @param {string} clientId
 * @param {Object} preferences
 * @returns {Promise<void>}
 */
const updateClientPreferences = async (clientId, preferences) => {
    const client = await getClientById(clientId);
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }
    await prisma.client.update({
        where: { id: clientId },
        data: { preferences }
    });
};
/**
 * Get client accounts
 * @param {string} clientId
 * @returns {Promise<ClientAccount[]>}
 */
const getClientAccounts = async (clientId) => {
    const client = await getClientById(clientId);
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }
    return prisma.clientAccount.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' }
    });
};
/**
 * Add client account
 * @param {string} clientId
 * @param {Object} accountData
 * @returns {Promise<ClientAccount>}
 */
const addClientAccount = async (clientId, accountData) => {
    const client = await getClientById(clientId);
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }
    // Check if account number already exists
    const existingAccount = await prisma.clientAccount.findUnique({
        where: { accountNumber: accountData.accountNumber }
    });
    if (existingAccount) {
        throw new ApiError(httpStatus.CONFLICT, 'Account number already exists');
    }
    return prisma.clientAccount.create({
        data: {
            ...accountData,
            clientId,
            currency: accountData.currency || 'USD'
        }
    });
};
/**
 * Update client account
 * @param {string} clientId
 * @param {string} accountId
 * @param {Object} updateData
 * @returns {Promise<ClientAccount>}
 */
const updateClientAccount = async (clientId, accountId, updateData) => {
    const account = await prisma.clientAccount.findFirst({
        where: { id: accountId, clientId }
    });
    if (!account) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client or account not found');
    }
    const updatedAccount = await prisma.clientAccount.update({
        where: { id: accountId },
        data: updateData
    });
    return updatedAccount;
};
export default {
    createClient,
    queryClients,
    getClientById,
    updateClientById,
    deleteClientById,
    searchClients,
    getClientsByRM,
    updateClientPreferences,
    getClientAccounts,
    addClientAccount,
    updateClientAccount
};

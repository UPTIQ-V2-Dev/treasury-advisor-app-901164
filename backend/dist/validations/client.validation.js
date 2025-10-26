import Joi from 'joi';
const createClient = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        businessType: Joi.string().required(),
        industry: Joi.string().required(),
        relationshipManagerId: Joi.number().integer().required(),
        businessSegment: Joi.string().required().valid('small', 'medium', 'large', 'enterprise'),
        contact: Joi.object().required(),
        preferences: Joi.object().optional(),
        riskProfile: Joi.string().valid('low', 'medium', 'high').optional()
    })
};
const getClients = {
    query: Joi.object().keys({
        name: Joi.string().optional(),
        industry: Joi.string().optional(),
        businessType: Joi.string().optional(),
        businessSegment: Joi.string().valid('small', 'medium', 'large', 'enterprise').optional(),
        riskProfile: Joi.string().valid('low', 'medium', 'high').optional(),
        relationshipManagerId: Joi.number().integer().optional(),
        sortBy: Joi.string().optional(),
        sortType: Joi.string().valid('asc', 'desc').optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        page: Joi.number().integer().min(1).optional()
    })
};
const getClient = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    })
};
const updateClient = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    }),
    body: Joi.object()
        .keys({
        name: Joi.string().optional(),
        businessType: Joi.string().optional(),
        industry: Joi.string().optional(),
        relationshipManagerId: Joi.number().integer().optional(),
        businessSegment: Joi.string().valid('small', 'medium', 'large', 'enterprise').optional(),
        contact: Joi.object().optional(),
        preferences: Joi.object().optional(),
        riskProfile: Joi.string().valid('low', 'medium', 'high').optional()
    })
        .min(1)
};
const deleteClient = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    })
};
const searchClients = {
    query: Joi.object().keys({
        q: Joi.string().required().min(1)
    })
};
const getClientsByRM = {
    params: Joi.object().keys({
        rmId: Joi.number().integer().required()
    })
};
const updateClientPreferences = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    }),
    body: Joi.object()
        .keys({
        communicationChannel: Joi.string().valid('email', 'phone', 'sms', 'portal').optional(),
        reportFrequency: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly').optional(),
        riskTolerance: Joi.string().valid('conservative', 'moderate', 'aggressive').optional(),
        liquidityPriority: Joi.string().valid('low', 'medium', 'high').optional(),
        yieldPriority: Joi.string().valid('low', 'medium', 'high').optional()
    })
        .min(1)
};
const getClientAccounts = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    })
};
const addClientAccount = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
        accountNumber: Joi.string().required(),
        accountType: Joi.string().required(),
        bankName: Joi.string().required(),
        routingNumber: Joi.string().optional(),
        openDate: Joi.date().iso().required(),
        balance: Joi.number().optional(),
        currency: Joi.string().length(3).uppercase().optional().default('USD')
    })
};
const updateClientAccount = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required(),
        accountId: Joi.string().uuid().required()
    }),
    body: Joi.object()
        .keys({
        accountType: Joi.string().optional(),
        bankName: Joi.string().optional(),
        routingNumber: Joi.string().optional(),
        isActive: Joi.boolean().optional(),
        balance: Joi.number().optional(),
        currency: Joi.string().length(3).uppercase().optional()
    })
        .min(1)
};
export default {
    createClient,
    getClients,
    getClient,
    updateClient,
    deleteClient,
    searchClients,
    getClientsByRM,
    updateClientPreferences,
    getClientAccounts,
    addClientAccount,
    updateClientAccount
};

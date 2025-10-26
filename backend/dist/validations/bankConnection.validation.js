import { ConnectionType } from '../generated/prisma/index.js';
import Joi from 'joi';
const createBankConnection = {
    body: Joi.object().keys({
        clientId: Joi.string().required(),
        accountId: Joi.string().required(),
        bankName: Joi.string().required(),
        connectionType: Joi.string()
            .required()
            .valid(...Object.values(ConnectionType)),
        credentials: Joi.object().optional(),
        settings: Joi.object().optional()
    })
};
const getBankConnections = {
    query: Joi.object().keys({
        clientId: Joi.string(),
        status: Joi.string(),
        connectionType: Joi.string().valid(...Object.values(ConnectionType)),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};
const getBankConnection = {
    params: Joi.object().keys({
        connectionId: Joi.string().required()
    })
};
const updateBankConnection = {
    params: Joi.object().keys({
        connectionId: Joi.string().required()
    }),
    body: Joi.object()
        .keys({
        bankName: Joi.string(),
        connectionType: Joi.string().valid(...Object.values(ConnectionType)),
        credentials: Joi.object(),
        settings: Joi.object()
    })
        .min(1)
};
const deleteBankConnection = {
    params: Joi.object().keys({
        connectionId: Joi.string().required()
    })
};
const syncBankConnection = {
    params: Joi.object().keys({
        connectionId: Joi.string().required()
    })
};
const getBankConnectionsByClient = {
    params: Joi.object().keys({
        clientId: Joi.string().required()
    })
};
// For statement route's connect endpoint
const connectToBank = {
    body: Joi.object().keys({
        clientId: Joi.string().required(),
        bankName: Joi.string().required(),
        accountId: Joi.string().required(),
        connectionType: Joi.string()
            .required()
            .valid(...Object.values(ConnectionType)),
        credentials: Joi.object().optional(),
        settings: Joi.object().optional()
    })
};
export default {
    createBankConnection,
    getBankConnections,
    getBankConnection,
    updateBankConnection,
    deleteBankConnection,
    syncBankConnection,
    getBankConnectionsByClient,
    connectToBank
};

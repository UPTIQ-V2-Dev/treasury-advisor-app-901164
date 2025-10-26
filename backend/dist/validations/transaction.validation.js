import { TransactionType } from '../generated/prisma/index.js';
import Joi from 'joi';
const createTransaction = {
    body: Joi.object().keys({
        accountId: Joi.string().required(),
        clientId: Joi.string().required(),
        statementId: Joi.string().optional(),
        date: Joi.date().required(),
        description: Joi.string().required().trim(),
        amount: Joi.number().required(),
        type: Joi.string()
            .valid(...Object.values(TransactionType))
            .required(),
        category: Joi.string().optional().trim(),
        counterparty: Joi.string().optional().trim(),
        balanceAfter: Joi.number().optional(),
        metadata: Joi.object().optional()
    })
};
const getTransactions = {
    query: Joi.object().keys({
        clientId: Joi.string().required(),
        accountId: Joi.string().optional(),
        type: Joi.alternatives()
            .try(Joi.string().valid(...Object.values(TransactionType)), Joi.array().items(Joi.string().valid(...Object.values(TransactionType))))
            .optional(),
        category: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
        counterparty: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date()
            .iso()
            .when('startDate', {
            is: Joi.exist(),
            then: Joi.date().iso().min(Joi.ref('startDate'))
        })
            .optional(),
        minAmount: Joi.number().optional(),
        maxAmount: Joi.number()
            .when('minAmount', {
            is: Joi.exist(),
            then: Joi.number().min(Joi.ref('minAmount'))
        })
            .optional(),
        description: Joi.string().optional(),
        sortBy: Joi.string().optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        page: Joi.number().integer().min(1).optional()
    })
};
const getTransaction = {
    params: Joi.object().keys({
        transactionId: Joi.string().required()
    })
};
const updateTransaction = {
    params: Joi.object().keys({
        transactionId: Joi.string().required()
    }),
    body: Joi.object()
        .keys({
        description: Joi.string().trim().optional(),
        amount: Joi.number().optional(),
        type: Joi.string()
            .valid(...Object.values(TransactionType))
            .optional(),
        category: Joi.string().trim().optional(),
        counterparty: Joi.string().trim().optional(),
        balanceAfter: Joi.number().optional(),
        metadata: Joi.object().optional()
    })
        .min(1)
};
const deleteTransaction = {
    params: Joi.object().keys({
        transactionId: Joi.string().required()
    })
};
const getTransactionAnalytics = {
    params: Joi.object().keys({
        clientId: Joi.string().required()
    }),
    query: Joi.object().keys({
        accountId: Joi.string().optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date()
            .iso()
            .when('startDate', {
            is: Joi.exist(),
            then: Joi.date().iso().min(Joi.ref('startDate'))
        })
            .optional()
    })
};
const getTransactionsByAccount = {
    params: Joi.object().keys({
        accountId: Joi.string().required()
    }),
    query: Joi.object().keys({
        sortBy: Joi.string().optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        page: Joi.number().integer().min(1).optional()
    })
};
export default {
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionAnalytics,
    getTransactionsByAccount
};

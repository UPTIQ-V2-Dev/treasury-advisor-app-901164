import { StatementStatus } from '../generated/prisma/index.js';
import Joi from 'joi';
const uploadStatement = {
    body: Joi.object().keys({
        clientId: Joi.string().uuid().required(),
        statementPeriod: Joi.object()
            .keys({
            startDate: Joi.date().iso().required(),
            endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
        })
            .required()
    })
};
const validateStatement = {
    params: Joi.object().keys({
        fileId: Joi.string().uuid().required()
    })
};
const getStatementStatus = {
    params: Joi.object().keys({
        fileId: Joi.string().uuid().required()
    })
};
const parseStatements = {
    body: Joi.object().keys({
        fileIds: Joi.array().items(Joi.string().uuid()).min(1).required()
    })
};
const getClientStatements = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    }),
    query: Joi.object().keys({
        status: Joi.string()
            .valid(...Object.values(StatementStatus))
            .optional(),
        accountId: Joi.string().uuid().optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
        sortBy: Joi.string().valid('fileName', 'uploadDate', 'status', 'fileSize', 'createdAt').optional(),
        sortType: Joi.string().valid('asc', 'desc').optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        page: Joi.number().integer().min(1).optional()
    })
};
const getUploadProgress = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    })
};
const deleteStatement = {
    params: Joi.object().keys({
        fileId: Joi.string().uuid().required()
    })
};
const downloadStatement = {
    params: Joi.object().keys({
        fileId: Joi.string().uuid().required()
    })
};
const queryStatements = {
    query: Joi.object().keys({
        clientId: Joi.string().uuid().optional(),
        status: Joi.string()
            .valid(...Object.values(StatementStatus))
            .optional(),
        accountId: Joi.string().uuid().optional(),
        fileName: Joi.string().optional(),
        fileType: Joi.string().optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
        sortBy: Joi.string().valid('fileName', 'uploadDate', 'status', 'fileSize', 'createdAt').optional(),
        sortType: Joi.string().valid('asc', 'desc').optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        page: Joi.number().integer().min(1).optional()
    })
};
export default {
    uploadStatement,
    validateStatement,
    getStatementStatus,
    parseStatements,
    getClientStatements,
    getUploadProgress,
    deleteStatement,
    downloadStatement,
    queryStatements
};

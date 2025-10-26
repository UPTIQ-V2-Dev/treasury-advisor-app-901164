import { RecommendationPriority } from '../generated/prisma/index.js';
import Joi from 'joi';
const generate = {
    body: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    })
};
const getByClientId = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    })
};
const getById = {
    params: Joi.object().keys({
        recommendationId: Joi.string().uuid().required()
    })
};
const feedback = {
    body: Joi.object().keys({
        recommendationId: Joi.string().uuid().required(),
        feedback: Joi.string().valid('accepted', 'rejected', 'needs_modification', 'deferred').required(),
        reason: Joi.string().min(1).max(500),
        modifications: Joi.string().max(1000),
        implementationDate: Joi.date().iso().greater('now')
    })
};
const approve = {
    params: Joi.object().keys({
        recommendationId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
        reviewerId: Joi.string().required(),
        comments: Joi.string().max(1000)
    })
};
const reject = {
    params: Joi.object().keys({
        recommendationId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
        reviewerId: Joi.string().required(),
        reason: Joi.string().required().min(1).max(500)
    })
};
const getSummary = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    })
};
const updatePriority = {
    params: Joi.object().keys({
        recommendationId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
        priority: Joi.string()
            .valid(...Object.values(RecommendationPriority))
            .required()
    })
};
const implement = {
    params: Joi.object().keys({
        recommendationId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
        implementationDate: Joi.date().iso().required(),
        notes: Joi.string().max(1000)
    })
};
const exportRecommendations = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    }),
    query: Joi.object().keys({
        format: Joi.string().valid('pdf', 'csv', 'excel', 'json').required()
    })
};
const getHistory = {
    params: Joi.object().keys({
        clientId: Joi.string().uuid().required()
    })
};
export default {
    generate,
    getByClientId,
    getById,
    feedback,
    approve,
    reject,
    getSummary,
    updatePriority,
    implement,
    exportRecommendations,
    getHistory
};

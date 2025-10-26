import { NotificationType } from '../generated/prisma/index.js';
import Joi from 'joi';
const getNotifications = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        read: Joi.boolean(),
        type: Joi.string().valid(...Object.values(NotificationType)),
        sortBy: Joi.string().default('createdAt'),
        sortType: Joi.string().valid('asc', 'desc').default('desc')
    })
};
const getNotificationStream = {
    query: Joi.object().keys({
        types: Joi.alternatives()
            .try(Joi.array().items(Joi.string().valid(...Object.values(NotificationType))), Joi.string().valid(...Object.values(NotificationType)))
            .optional()
    })
};
const markNotificationAsRead = {
    params: Joi.object().keys({
        notificationId: Joi.string().required()
    })
};
const createNotification = {
    body: Joi.object().keys({
        userId: Joi.number().integer().required(),
        type: Joi.string()
            .valid(...Object.values(NotificationType))
            .required(),
        title: Joi.string().required(),
        message: Joi.string().required(),
        data: Joi.object().optional(),
        expiresAt: Joi.date().iso().optional()
    })
};
export default {
    getNotifications,
    getNotificationStream,
    markNotificationAsRead,
    createNotification
};

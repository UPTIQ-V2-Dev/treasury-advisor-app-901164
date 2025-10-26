import Joi from 'joi';
const triggerAgent = {
    body: Joi.object().keys({
        clientId: Joi.string().required(),
        agentType: Joi.string().required().valid('recommendation', 'analysis', 'processing'),
        context: Joi.object().required(),
        options: Joi.object()
    })
};
const getAgentTask = {
    params: Joi.object().keys({
        agentTaskId: Joi.string().required()
    })
};
const createDocumentAnalysis = {
    body: Joi.object().keys({
        fileIds: Joi.array().items(Joi.string()).required(),
        analysisType: Joi.string().required().valid('financial_patterns', 'risk_assessment', 'compliance_check'),
        clientId: Joi.string().required()
    })
};
const getAgentAnalysis = {
    params: Joi.object().keys({
        analysisTaskId: Joi.string().required()
    })
};
export default {
    triggerAgent,
    getAgentTask,
    createDocumentAnalysis,
    getAgentAnalysis
};

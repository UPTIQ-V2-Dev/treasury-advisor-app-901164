import { agentService } from "../services/index.js";
import catchAsyncWithAuth from "../utils/catchAsyncWithAuth.js";
import httpStatus from 'http-status';
const triggerAgent = catchAsyncWithAuth(async (req, res) => {
    const { clientId, agentType, context, options } = req.body;
    const agentTask = await agentService.triggerAgent(clientId, agentType, context, options);
    res.status(httpStatus.ACCEPTED).send({
        agentTaskId: agentTask.id,
        estimatedDuration: agentTask.estimatedDuration
    });
});
const getAgentTask = catchAsyncWithAuth(async (req, res) => {
    const agentTask = await agentService.getAgentTask(req.params.agentTaskId);
    res.send({
        id: agentTask.id,
        status: agentTask.status,
        progress: agentTask.progress,
        results: agentTask.results,
        startTime: agentTask.startTime,
        endTime: agentTask.endTime,
        logs: agentTask.logs
    });
});
const createDocumentAnalysis = catchAsyncWithAuth(async (req, res) => {
    const { fileIds, analysisType, clientId } = req.body;
    const agentAnalysis = await agentService.createDocumentAnalysis(fileIds, analysisType, clientId);
    res.status(httpStatus.ACCEPTED).send({
        analysisTaskId: agentAnalysis.id
    });
});
const getAgentAnalysis = catchAsyncWithAuth(async (req, res) => {
    const agentAnalysis = await agentService.getAgentAnalysis(req.params.analysisTaskId);
    res.send({
        id: agentAnalysis.id,
        status: agentAnalysis.status,
        results: agentAnalysis.results,
        confidence: agentAnalysis.confidence,
        processingTime: agentAnalysis.processingTime
    });
});
export default {
    triggerAgent,
    getAgentTask,
    createDocumentAnalysis,
    getAgentAnalysis
};

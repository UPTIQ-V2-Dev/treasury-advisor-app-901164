import { agentService } from "../services/index.js";
import { z } from 'zod';
// Define the agent task schema
const agentTaskSchema = z.object({
    id: z.string(),
    status: z.string(),
    progress: z.number(),
    results: z.any().nullable(),
    startTime: z.string(),
    endTime: z.string().nullable(),
    logs: z.array(z.string()),
    agentType: z.string(),
    estimatedDuration: z.number().nullable()
});
// Define the agent analysis schema
const agentAnalysisSchema = z.object({
    id: z.string(),
    status: z.string(),
    results: z.any().nullable(),
    confidence: z.number().nullable(),
    processingTime: z.number().nullable(),
    analysisType: z.string(),
    fileIds: z.array(z.string()),
    clientId: z.string()
});
const triggerAgentTool = {
    id: 'agent_trigger',
    name: 'Trigger AI Agent',
    description: 'Trigger AI agent for enhanced processing and recommendations',
    inputSchema: z.object({
        clientId: z.string(),
        agentType: z.enum(['recommendation', 'analysis', 'processing']),
        context: z.any(),
        options: z.any().optional()
    }),
    outputSchema: z.object({
        agentTaskId: z.string(),
        estimatedDuration: z.number()
    }),
    fn: async (inputs) => {
        const agentTask = await agentService.triggerAgent(inputs.clientId, inputs.agentType, inputs.context, inputs.options);
        return {
            agentTaskId: agentTask.id,
            estimatedDuration: agentTask.estimatedDuration
        };
    }
};
const getAgentTaskTool = {
    id: 'agent_get_task',
    name: 'Get Agent Task',
    description: 'Get AI agent task status and results',
    inputSchema: z.object({
        agentTaskId: z.string()
    }),
    outputSchema: agentTaskSchema,
    fn: async (inputs) => {
        const agentTask = await agentService.getAgentTask(inputs.agentTaskId);
        return {
            id: agentTask.id,
            status: agentTask.status,
            progress: agentTask.progress,
            results: agentTask.results,
            startTime: agentTask.startTime.toISOString(),
            endTime: agentTask.endTime?.toISOString() || null,
            logs: agentTask.logs,
            agentType: agentTask.agentType,
            estimatedDuration: agentTask.estimatedDuration
        };
    }
};
const createDocumentAnalysisTool = {
    id: 'agent_create_document_analysis',
    name: 'Create Document Analysis',
    description: 'Analyze documents using AI agents for enhanced insights',
    inputSchema: z.object({
        fileIds: z.array(z.string()),
        analysisType: z.enum(['financial_patterns', 'risk_assessment', 'compliance_check']),
        clientId: z.string()
    }),
    outputSchema: z.object({
        analysisTaskId: z.string()
    }),
    fn: async (inputs) => {
        const agentAnalysis = await agentService.createDocumentAnalysis(inputs.fileIds, inputs.analysisType, inputs.clientId);
        return {
            analysisTaskId: agentAnalysis.id
        };
    }
};
const getAgentAnalysisTool = {
    id: 'agent_get_analysis',
    name: 'Get Agent Analysis',
    description: 'Get document analysis results from AI agents',
    inputSchema: z.object({
        analysisTaskId: z.string()
    }),
    outputSchema: agentAnalysisSchema,
    fn: async (inputs) => {
        const agentAnalysis = await agentService.getAgentAnalysis(inputs.analysisTaskId);
        return {
            id: agentAnalysis.id,
            status: agentAnalysis.status,
            results: agentAnalysis.results,
            confidence: agentAnalysis.confidence,
            processingTime: agentAnalysis.processingTime,
            analysisType: agentAnalysis.analysisType,
            fileIds: agentAnalysis.fileIds,
            clientId: agentAnalysis.clientId
        };
    }
};
export const agentTools = [
    triggerAgentTool,
    getAgentTaskTool,
    createDocumentAnalysisTool,
    getAgentAnalysisTool
];

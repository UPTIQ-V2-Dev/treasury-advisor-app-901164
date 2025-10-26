import { statementService } from "../services/index.js";
import pick from "../utils/pick.js";
import { z } from 'zod';
// Schema definitions
const statementSchema = z.object({
    id: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    fileType: z.string(),
    filePath: z.string().nullable(),
    uploadDate: z.string(),
    status: z.string(),
    clientId: z.string(),
    accountId: z.string().nullable(),
    period: z.any().nullable(),
    errorMessage: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
});
const processingTaskSchema = z.object({
    id: z.number(),
    taskId: z.string(),
    clientId: z.string(),
    statementId: z.string().nullable(),
    type: z.string(),
    status: z.string(),
    progress: z.number(),
    startTime: z.string(),
    endTime: z.string().nullable(),
    estimatedDuration: z.number().nullable(),
    currentStep: z.any().nullable(),
    steps: z.any(),
    error: z.any().nullable(),
    results: z.any().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
});
// Statement Management Tools
const getClientStatementsTool = {
    id: 'statement_get_by_client',
    name: 'Get Client Statements',
    description: 'Get all statements for a specific client with optional filtering',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        status: z.enum(['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED', 'VALIDATED']).optional(),
        accountId: z.string().uuid().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        sortBy: z.enum(['fileName', 'uploadDate', 'status', 'fileSize', 'createdAt']).optional(),
        sortType: z.enum(['asc', 'desc']).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        statements: z.array(statementSchema),
        total: z.number(),
        pages: z.number()
    }),
    fn: async (inputs) => {
        const filter = pick(inputs, ['status', 'accountId', 'startDate', 'endDate']);
        const options = pick(inputs, ['sortBy', 'sortType', 'limit', 'page']);
        filter.clientId = inputs.clientId;
        // Handle date range filter
        if (filter.startDate || filter.endDate) {
            filter.uploadDate = {};
            if (filter.startDate) {
                filter.uploadDate.gte = new Date(filter.startDate);
                delete filter.startDate;
            }
            if (filter.endDate) {
                filter.uploadDate.lte = new Date(filter.endDate);
                delete filter.endDate;
            }
        }
        const result = await statementService.queryStatements(filter, options);
        return result;
    }
};
const validateStatementTool = {
    id: 'statement_validate',
    name: 'Validate Statement',
    description: 'Validate uploaded statement file structure and content',
    inputSchema: z.object({
        statementId: z.string().uuid()
    }),
    outputSchema: z.object({
        isValid: z.boolean(),
        errors: z.array(z.string()),
        warnings: z.array(z.string()),
        parsedTransactionCount: z.number(),
        accountsFound: z.array(z.string())
    }),
    fn: async (inputs) => {
        const result = await statementService.validateStatement(inputs.statementId);
        return result;
    }
};
const getStatementStatusTool = {
    id: 'statement_get_status',
    name: 'Get Statement Status',
    description: 'Get current processing status and progress of a statement file',
    inputSchema: z.object({
        statementId: z.string().uuid()
    }),
    outputSchema: z.object({
        status: z.string(),
        progress: z.number(),
        error: z.string().optional()
    }),
    fn: async (inputs) => {
        const result = await statementService.getStatementStatus(inputs.statementId);
        return result;
    }
};
const parseStatementsTool = {
    id: 'statement_parse',
    name: 'Parse Statements',
    description: 'Start parsing process for uploaded statement files',
    inputSchema: z.object({
        fileIds: z.array(z.string().uuid()).min(1)
    }),
    outputSchema: processingTaskSchema,
    fn: async (inputs) => {
        const task = await statementService.startStatementParsing(inputs.fileIds);
        return task;
    }
};
const deleteStatementTool = {
    id: 'statement_delete',
    name: 'Delete Statement',
    description: 'Delete a statement file and its associated data',
    inputSchema: z.object({
        statementId: z.string().uuid()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        await statementService.deleteStatementById(inputs.statementId);
        return { success: true };
    }
};
const getUploadProgressTool = {
    id: 'statement_get_upload_progress',
    name: 'Get Upload Progress',
    description: 'Get upload and processing progress for all client files',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        progress: z.array(z.object({
            fileId: z.string(),
            fileName: z.string(),
            progress: z.number(),
            status: z.string(),
            error: z.string().optional()
        }))
    }),
    fn: async (inputs) => {
        const progress = await statementService.getUploadProgress(inputs.clientId);
        return { progress };
    }
};
const getAllStatementsTool = {
    id: 'statement_get_all',
    name: 'Get All Statements',
    description: 'Get all statements with optional filtering across all clients',
    inputSchema: z.object({
        clientId: z.string().uuid().optional(),
        status: z.enum(['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED', 'VALIDATED']).optional(),
        accountId: z.string().uuid().optional(),
        fileName: z.string().optional(),
        fileType: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        sortBy: z.enum(['fileName', 'uploadDate', 'status', 'fileSize', 'createdAt']).optional(),
        sortType: z.enum(['asc', 'desc']).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        statements: z.array(statementSchema),
        total: z.number(),
        pages: z.number()
    }),
    fn: async (inputs) => {
        const filter = pick(inputs, [
            'clientId',
            'status',
            'accountId',
            'fileName',
            'fileType',
            'startDate',
            'endDate'
        ]);
        const options = pick(inputs, ['sortBy', 'sortType', 'limit', 'page']);
        // Handle date range filter
        if (filter.startDate || filter.endDate) {
            filter.uploadDate = {};
            if (filter.startDate) {
                filter.uploadDate.gte = new Date(filter.startDate);
                delete filter.startDate;
            }
            if (filter.endDate) {
                filter.uploadDate.lte = new Date(filter.endDate);
                delete filter.endDate;
            }
        }
        const result = await statementService.queryStatements(filter, options);
        return result;
    }
};
export const statementTools = [
    getClientStatementsTool,
    validateStatementTool,
    getStatementStatusTool,
    parseStatementsTool,
    deleteStatementTool,
    getUploadProgressTool,
    getAllStatementsTool
];

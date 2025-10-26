import { statementService } from '../services/index.ts';
import { MCPTool } from '../types/mcp.ts';
import pick from '../utils/pick.ts';
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
const getClientStatementsTool: MCPTool = {
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
    fn: async (inputs: {
        clientId: string;
        status?: string;
        accountId?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        sortType?: string;
        limit?: number;
        page?: number;
    }) => {
        const filter = pick(inputs, ['status', 'accountId', 'startDate', 'endDate']);
        const options = pick(inputs, ['sortBy', 'sortType', 'limit', 'page']);

        filter.clientId = inputs.clientId;

        // Handle date range filter
        if (filter.startDate || filter.endDate) {
            (filter as any).uploadDate = {};
            if (filter.startDate) {
                (filter as any).uploadDate.gte = new Date(filter.startDate as string);
                delete (filter as any).startDate;
            }
            if (filter.endDate) {
                (filter as any).uploadDate.lte = new Date(filter.endDate as string);
                delete (filter as any).endDate;
            }
        }

        const result = await statementService.queryStatements(filter, options);
        return result;
    }
};

const validateStatementTool: MCPTool = {
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
    fn: async (inputs: { statementId: string }) => {
        const result = await statementService.validateStatement(inputs.statementId);
        return result;
    }
};

const getStatementStatusTool: MCPTool = {
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
    fn: async (inputs: { statementId: string }) => {
        const result = await statementService.getStatementStatus(inputs.statementId);
        return result;
    }
};

const parseStatementsTool: MCPTool = {
    id: 'statement_parse',
    name: 'Parse Statements',
    description: 'Start parsing process for uploaded statement files',
    inputSchema: z.object({
        fileIds: z.array(z.string().uuid()).min(1)
    }),
    outputSchema: processingTaskSchema,
    fn: async (inputs: { fileIds: string[] }) => {
        const task = await statementService.startStatementParsing(inputs.fileIds);
        return task;
    }
};

const deleteStatementTool: MCPTool = {
    id: 'statement_delete',
    name: 'Delete Statement',
    description: 'Delete a statement file and its associated data',
    inputSchema: z.object({
        statementId: z.string().uuid()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs: { statementId: string }) => {
        await statementService.deleteStatementById(inputs.statementId);
        return { success: true };
    }
};

const getUploadProgressTool: MCPTool = {
    id: 'statement_get_upload_progress',
    name: 'Get Upload Progress',
    description: 'Get upload and processing progress for all client files',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        progress: z.array(
            z.object({
                fileId: z.string(),
                fileName: z.string(),
                progress: z.number(),
                status: z.string(),
                error: z.string().optional()
            })
        )
    }),
    fn: async (inputs: { clientId: string }) => {
        const progress = await statementService.getUploadProgress(inputs.clientId);
        return { progress };
    }
};

const getAllStatementsTool: MCPTool = {
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
    fn: async (inputs: {
        clientId?: string;
        status?: string;
        accountId?: string;
        fileName?: string;
        fileType?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        sortType?: string;
        limit?: number;
        page?: number;
    }) => {
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
            (filter as any).uploadDate = {};
            if (filter.startDate) {
                (filter as any).uploadDate.gte = new Date(filter.startDate as string);
                delete (filter as any).startDate;
            }
            if (filter.endDate) {
                (filter as any).uploadDate.lte = new Date(filter.endDate as string);
                delete (filter as any).endDate;
            }
        }

        const result = await statementService.queryStatements(filter, options);
        return result;
    }
};

// Enhanced statement processing tools
const validateBulkStatementsTool: MCPTool = {
    id: 'statement_validate_bulk',
    name: 'Validate Bulk Statements',
    description: 'Validate multiple statement files before processing with customizable validation rules',
    inputSchema: z.object({
        fileIds: z.array(z.string().uuid()).min(1).max(10),
        validationRules: z
            .object({
                strictMode: z.boolean().optional(),
                requireTransactionCount: z.number().int().min(1).optional(),
                allowedDateRange: z
                    .object({
                        startDate: z.string(),
                        endDate: z.string()
                    })
                    .optional()
            })
            .optional()
    }),
    outputSchema: z.array(
        z.object({
            fileId: z.string(),
            isValid: z.boolean(),
            errors: z.array(z.string()),
            warnings: z.array(z.string()),
            metadata: z.object({
                accountsFound: z.array(z.string()),
                dateRange: z
                    .object({
                        start: z.string(),
                        end: z.string()
                    })
                    .optional(),
                transactionCount: z.number()
            })
        })
    ),
    fn: async (inputs: {
        fileIds: string[];
        validationRules?: {
            strictMode?: boolean;
            requireTransactionCount?: number;
            allowedDateRange?: { startDate: string; endDate: string };
        };
    }) => {
        const result = await statementService.validateBulkStatements(inputs.fileIds, inputs.validationRules);
        return result;
    }
};

const getProcessingQueueTool: MCPTool = {
    id: 'statement_get_processing_queue',
    name: 'Get Processing Queue',
    description: 'Get current statement processing queue status with positions, wait times and system metrics',
    inputSchema: z.object({
        status: z.enum(['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED', 'VALIDATED']).optional()
    }),
    outputSchema: z.object({
        queue: z.array(
            z.object({
                fileId: z.string(),
                fileName: z.string(),
                clientId: z.string(),
                status: z.string(),
                position: z.number(),
                estimatedWaitTime: z.number()
            })
        ),
        metrics: z.object({
            queueLength: z.number(),
            averageProcessingTime: z.number(),
            systemLoad: z.number()
        })
    }),
    fn: async (inputs: { status?: string }) => {
        const result = await statementService.getProcessingQueue(inputs.status);
        return result;
    }
};

const reprocessStatementsTool: MCPTool = {
    id: 'statement_reprocess',
    name: 'Reprocess Statements',
    description: 'Reprocess failed or corrupted statement files with configurable options',
    inputSchema: z.object({
        fileIds: z.array(z.string().uuid()).min(1).max(5),
        options: z
            .object({
                forceReprocess: z.boolean().optional(),
                preserveExisting: z.boolean().optional()
            })
            .optional()
    }),
    outputSchema: z.object({
        taskIds: z.array(z.string())
    }),
    fn: async (inputs: {
        fileIds: string[];
        options?: {
            forceReprocess?: boolean;
            preserveExisting?: boolean;
        };
    }) => {
        const result = await statementService.reprocessStatements(inputs.fileIds, inputs.options);
        return result;
    }
};

const getDataQualityTool: MCPTool = {
    id: 'statement_get_data_quality',
    name: 'Get Data Quality Assessment',
    description:
        'Get detailed data quality assessment for processed statement including scores, issues and recommendations',
    inputSchema: z.object({
        fileId: z.string().uuid()
    }),
    outputSchema: z.object({
        overallScore: z.number(),
        dimensions: z.object({
            completeness: z.number(),
            accuracy: z.number(),
            consistency: z.number(),
            validity: z.number()
        }),
        issues: z.array(
            z.object({
                type: z.string(),
                severity: z.enum(['low', 'medium', 'high']),
                description: z.string(),
                affectedRecords: z.number(),
                suggestions: z.array(z.string())
            })
        ),
        recommendations: z.array(z.string())
    }),
    fn: async (inputs: { fileId: string }) => {
        const result = await statementService.getDataQuality(inputs.fileId);
        return result;
    }
};

export const statementTools: MCPTool[] = [
    getClientStatementsTool,
    validateStatementTool,
    getStatementStatusTool,
    parseStatementsTool,
    deleteStatementTool,
    getUploadProgressTool,
    getAllStatementsTool,
    validateBulkStatementsTool,
    getProcessingQueueTool,
    reprocessStatementsTool,
    getDataQualityTool
];

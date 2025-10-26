import prisma from '../client.ts';
import { Prisma, ProcessingTask, Statement, StatementStatus, TaskStatus, TaskType } from '../generated/prisma/index.js';
import ApiError from '../utils/ApiError.ts';
import fs from 'fs/promises';
import httpStatus from 'http-status';

/**
 * Upload and create statement record
 * @param {Object} data
 * @returns {Promise<Statement>}
 */
const createStatement = async (data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    filePath?: string;
    clientId: string;
    accountId?: string;
    period?: any;
}): Promise<Statement> => {
    return await prisma.statement.create({
        data: {
            ...data,
            status: StatementStatus.UPLOADED
        },
        include: {
            client: true,
            account: true
        }
    });
};

/**
 * Get statements with filters
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Statement[]>}
 */
const queryStatements = async (
    filter: any,
    options: {
        limit?: number;
        page?: number;
        sortBy?: string;
        sortType?: 'asc' | 'desc';
        include?: any;
    }
): Promise<{ statements: Statement[]; total: number; pages: number }> => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';
    const include = options.include ?? {
        client: true,
        account: true
    };

    const [statements, total] = await Promise.all([
        prisma.statement.findMany({
            where: filter,
            include,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: sortType }
        }),
        prisma.statement.count({ where: filter })
    ]);

    const pages = Math.ceil(total / limit);

    return { statements, total, pages };
};

/**
 * Get statement by ID
 * @param {string} id
 * @returns {Promise<Statement | null>}
 */
const getStatementById = async (id: string): Promise<Statement | null> => {
    return await prisma.statement.findUnique({
        where: { id },
        include: {
            client: true,
            account: true,
            ProcessingTask: true
        }
    });
};

/**
 * Update statement by ID
 * @param {string} statementId
 * @param {Object} updateBody
 * @returns {Promise<Statement>}
 */
const updateStatementById = async (
    statementId: string,
    updateBody: Prisma.StatementUpdateInput
): Promise<Statement> => {
    const statement = await getStatementById(statementId);
    if (!statement) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Statement not found');
    }

    return prisma.statement.update({
        where: { id: statementId },
        data: updateBody,
        include: {
            client: true,
            account: true
        }
    });
};

/**
 * Delete statement by ID
 * @param {string} statementId
 * @returns {Promise<Statement>}
 */
const deleteStatementById = async (statementId: string): Promise<void> => {
    const statement = await getStatementById(statementId);
    if (!statement) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Statement not found');
    }

    // Delete physical file if exists
    if (statement.filePath) {
        try {
            await fs.unlink(statement.filePath);
        } catch (error) {
            // File may not exist, continue with database deletion
            console.warn(`Failed to delete file ${statement.filePath}:`, error);
        }
    }

    await prisma.statement.delete({
        where: { id: statementId }
    });
};

/**
 * Get statements by client ID
 * @param {string} clientId
 * @returns {Promise<Statement[]>}
 */
const getStatementsByClientId = async (clientId: string): Promise<Statement[]> => {
    return await prisma.statement.findMany({
        where: { clientId },
        include: {
            client: true,
            account: true
        },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * Validate statement structure
 * @param {string} statementId
 * @returns {Promise<Object>}
 */
const validateStatement = async (
    statementId: string
): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    parsedTransactionCount: number;
    accountsFound: string[];
}> => {
    const statement = await getStatementById(statementId);
    if (!statement) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Statement not found');
    }

    // Mock validation logic - in real implementation, this would parse the actual file
    const validationResult = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        parsedTransactionCount: Math.floor(Math.random() * 300) + 50, // Mock data
        accountsFound: (statement as any).account ? [(statement as any).account.accountNumber] : []
    };

    // Update statement status to validated
    await updateStatementById(statementId, {
        status: StatementStatus.VALIDATED
    });

    return validationResult;
};

/**
 * Get statement processing status
 * @param {string} statementId
 * @returns {Promise<Object>}
 */
const getStatementStatus = async (
    statementId: string
): Promise<{
    status: StatementStatus;
    progress: number;
    error?: string;
}> => {
    const statement = await getStatementById(statementId);
    if (!statement) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Statement not found');
    }

    // Get latest processing task for this statement
    const processingTask = await prisma.processingTask.findFirst({
        where: { statementId },
        orderBy: { createdAt: 'desc' }
    });

    return {
        status: statement.status,
        progress: processingTask?.progress ?? 0,
        error: statement.errorMessage || undefined
    };
};

/**
 * Start statement parsing process
 * @param {string[]} fileIds
 * @returns {Promise<ProcessingTask>}
 */
const startStatementParsing = async (fileIds: string[]): Promise<ProcessingTask> => {
    // Validate all file IDs exist
    const statements = await prisma.statement.findMany({
        where: { id: { in: fileIds } },
        include: { client: true }
    });

    if (statements.length !== fileIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'One or more statement files not found');
    }

    // For simplicity, create a processing task for the first statement's client
    // In a real implementation, you might handle multiple clients differently
    const primaryStatement = statements[0];

    const processingTask = await prisma.processingTask.create({
        data: {
            clientId: primaryStatement.clientId,
            statementId: primaryStatement.id,
            type: TaskType.STATEMENT_PARSE,
            status: TaskStatus.PENDING,
            steps: {
                total: 5,
                steps: [
                    { id: 1, name: 'File Validation', status: 'pending' },
                    { id: 2, name: 'Data Extraction', status: 'pending' },
                    { id: 3, name: 'Transaction Parsing', status: 'pending' },
                    { id: 4, name: 'Data Validation', status: 'pending' },
                    { id: 5, name: 'Storage', status: 'pending' }
                ]
            },
            estimatedDuration: 300000 // 5 minutes
        }
    });

    // Update all statements to processing status
    await prisma.statement.updateMany({
        where: { id: { in: fileIds } },
        data: { status: StatementStatus.PROCESSING }
    });

    // In a real implementation, you would trigger the actual parsing process here
    // For now, we'll just return the task
    return processingTask;
};

/**
 * Get upload progress for client
 * @param {string} clientId
 * @returns {Promise<Object[]>}
 */
const getUploadProgress = async (
    clientId: string
): Promise<
    Array<{
        fileId: string;
        fileName: string;
        progress: number;
        status: string;
        error?: string;
    }>
> => {
    const statements = await prisma.statement.findMany({
        where: { clientId },
        include: {
            ProcessingTask: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return statements.map(statement => ({
        fileId: statement.id,
        fileName: statement.fileName,
        progress: statement.ProcessingTask[0]?.progress ?? (statement.status === StatementStatus.COMPLETED ? 100 : 0),
        status: statement.status,
        error: statement.errorMessage || undefined
    }));
};

/**
 * Download statement file
 * @param {string} statementId
 * @returns {Promise<Object>}
 */
const downloadStatement = async (
    statementId: string
): Promise<{
    filePath: string;
    fileName: string;
    mimeType: string;
}> => {
    const statement = await getStatementById(statementId);
    if (!statement) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Statement not found');
    }

    if (!statement.filePath) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Statement file not found');
    }

    // Check if file exists
    try {
        await fs.access(statement.filePath);
    } catch (error) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Statement file not found on disk');
    }

    const mimeType = getMimeType(statement.fileType);

    return {
        filePath: statement.filePath,
        fileName: statement.fileName,
        mimeType
    };
};

/**
 * Get MIME type from file extension
 * @param {string} fileType
 * @returns {string}
 */
const getMimeType = (fileType: string): string => {
    const mimeTypes: { [key: string]: string } = {
        pdf: 'application/pdf',
        csv: 'text/csv',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        txt: 'text/plain'
    };

    return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream';
};

/**
 * Validate multiple statement files before processing
 * @param {string[]} fileIds
 * @param {Object} validationRules
 * @returns {Promise<Object[]>}
 */
const validateBulkStatements = async (
    fileIds: string[],
    validationRules?: {
        strictMode?: boolean;
        requireTransactionCount?: number;
        allowedDateRange?: { startDate: string; endDate: string };
    }
): Promise<
    Array<{
        fileId: string;
        isValid: boolean;
        errors: string[];
        warnings: string[];
        metadata: {
            accountsFound: string[];
            dateRange?: { start: string; end: string };
            transactionCount: number;
        };
    }>
> => {
    // Validate all file IDs exist
    const statements = await prisma.statement.findMany({
        where: { id: { in: fileIds } },
        include: { account: true }
    });

    if (statements.length !== fileIds.length) {
        const foundIds = statements.map(s => s.id);
        const missingIds = fileIds.filter(id => !foundIds.includes(id));
        throw new ApiError(httpStatus.BAD_REQUEST, `Statement files not found: ${missingIds.join(', ')}`);
    }

    const validationResults = [];

    for (const statement of statements) {
        const result = {
            fileId: statement.id,
            isValid: true,
            errors: [] as string[],
            warnings: [] as string[],
            metadata: {
                accountsFound: statement.account ? [statement.account.accountNumber] : [],
                dateRange: statement.period
                    ? {
                          start: (statement.period as any)?.startDate || '2024-01-01',
                          end: (statement.period as any)?.endDate || '2024-01-31'
                      }
                    : undefined,
                transactionCount: Math.floor(Math.random() * 300) + 50 // Mock data
            }
        };

        // Apply validation rules
        if (validationRules?.strictMode) {
            if (!statement.account) {
                result.errors.push('No account associated with statement');
                result.isValid = false;
            }
            if (statement.fileSize > 10 * 1024 * 1024) {
                // 10MB
                result.warnings.push('Large file size may affect processing time');
            }
        }

        if (validationRules?.requireTransactionCount) {
            if (result.metadata.transactionCount < validationRules.requireTransactionCount) {
                result.warnings.push(`Low transaction count: ${result.metadata.transactionCount}`);
            }
        }

        // Mock additional validation checks
        if (statement.fileType === 'pdf' && Math.random() > 0.8) {
            result.warnings.push('PDF format may have parsing limitations');
        }

        if (statement.fileName.includes('draft') || statement.fileName.includes('temp')) {
            result.warnings.push('Filename suggests this may be a draft or temporary file');
        }

        validationResults.push(result);
    }

    return validationResults;
};

/**
 * Get current statement processing queue status
 * @param {string} statusFilter
 * @returns {Promise<Object>}
 */
const getProcessingQueue = async (
    statusFilter?: string
): Promise<{
    queue: Array<{
        fileId: string;
        fileName: string;
        clientId: string;
        status: string;
        position: number;
        estimatedWaitTime: number; // in seconds
    }>;
    metrics: {
        queueLength: number;
        averageProcessingTime: number; // in seconds
        systemLoad: number; // 0-1
    };
}> => {
    let whereClause: any = {
        status: {
            in: [StatementStatus.UPLOADED, StatementStatus.PROCESSING, StatementStatus.VALIDATED]
        }
    };

    if (statusFilter) {
        whereClause.status = statusFilter;
    }

    const statements = await prisma.statement.findMany({
        where: whereClause,
        include: {
            client: true,
            ProcessingTask: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { createdAt: 'asc' }
    });

    const queue = statements.map((statement, index) => ({
        fileId: statement.id,
        fileName: statement.fileName,
        clientId: statement.clientId,
        status: statement.status,
        position: index + 1,
        estimatedWaitTime: index * 90 + Math.floor(Math.random() * 60) // Mock calculation
    }));

    // Mock system metrics
    const metrics = {
        queueLength: statements.length,
        averageProcessingTime: 85, // seconds
        systemLoad: Math.random() * 0.8 + 0.1 // 0.1-0.9
    };

    return { queue, metrics };
};

/**
 * Reprocess failed or corrupted statement files
 * @param {string[]} fileIds
 * @param {Object} options
 * @returns {Promise<ProcessingTask[]>}
 */
const reprocessStatements = async (
    fileIds: string[],
    options?: {
        forceReprocess?: boolean;
        preserveExisting?: boolean;
    }
): Promise<{ taskIds: string[] }> => {
    // Validate all file IDs exist
    const statements = await prisma.statement.findMany({
        where: { id: { in: fileIds } },
        include: { client: true }
    });

    if (statements.length !== fileIds.length) {
        const foundIds = statements.map(s => s.id);
        const missingIds = fileIds.filter(id => !foundIds.includes(id));
        throw new ApiError(httpStatus.BAD_REQUEST, `Statement files not found: ${missingIds.join(', ')}`);
    }

    // Check if files are eligible for reprocessing
    const eligibleStatuses: StatementStatus[] = [StatementStatus.FAILED, StatementStatus.COMPLETED];
    if (options?.forceReprocess) {
        eligibleStatuses.push(StatementStatus.PROCESSING, StatementStatus.VALIDATED, StatementStatus.UPLOADED);
    }

    const ineligibleStatements = statements.filter(
        statement => !eligibleStatuses.includes(statement.status as StatementStatus)
    );

    if (ineligibleStatements.length > 0 && !options?.forceReprocess) {
        throw new ApiError(
            httpStatus.CONFLICT,
            `Files not eligible for reprocessing: ${ineligibleStatements.map(s => s.fileName).join(', ')}`
        );
    }

    const taskIds: string[] = [];

    // Create reprocessing tasks
    for (const statement of statements) {
        const processingTask = await prisma.processingTask.create({
            data: {
                clientId: statement.clientId,
                statementId: statement.id,
                type: TaskType.STATEMENT_PARSE,
                status: TaskStatus.PENDING,
                steps: {
                    total: 6,
                    steps: [
                        { id: 1, name: 'File Validation', status: 'pending' },
                        { id: 2, name: 'Data Extraction', status: 'pending' },
                        { id: 3, name: 'Transaction Parsing', status: 'pending' },
                        { id: 4, name: 'Data Validation', status: 'pending' },
                        { id: 5, name: 'Data Correction', status: 'pending' },
                        { id: 6, name: 'Storage', status: 'pending' }
                    ]
                },
                estimatedDuration: 420000 // 7 minutes for reprocessing
            }
        });

        taskIds.push(processingTask.taskId);

        // Update statement status
        await prisma.statement.update({
            where: { id: statement.id },
            data: {
                status: StatementStatus.PROCESSING,
                errorMessage: null // Clear previous error
            }
        });
    }

    return { taskIds };
};

/**
 * Get detailed data quality assessment for processed statement
 * @param {string} fileId
 * @returns {Promise<Object>}
 */
const getDataQuality = async (
    fileId: string
): Promise<{
    overallScore: number;
    dimensions: {
        completeness: number;
        accuracy: number;
        consistency: number;
        validity: number;
    };
    issues: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
        affectedRecords: number;
        suggestions: string[];
    }>;
    recommendations: string[];
}> => {
    const statement = await getStatementById(fileId);
    if (!statement) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Statement not found');
    }

    // Check if statement has been processed
    const processedStatuses: StatementStatus[] = [StatementStatus.COMPLETED, StatementStatus.FAILED];
    if (!processedStatuses.includes(statement.status as StatementStatus)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Data quality assessment only available for processed statements');
    }

    // Mock data quality assessment - in real implementation, this would analyze actual processed data
    const completeness = Math.random() * 0.3 + 0.7; // 0.7-1.0
    const accuracy = Math.random() * 0.3 + 0.7; // 0.7-1.0
    const consistency = Math.random() * 0.3 + 0.7; // 0.7-1.0
    const validity = Math.random() * 0.3 + 0.7; // 0.7-1.0

    const overallScore = (completeness + accuracy + consistency + validity) / 4;

    const issues = [];
    const recommendations = [];

    // Generate realistic quality issues
    if (completeness < 0.9) {
        issues.push({
            type: 'missing_data',
            severity: 'medium' as const,
            description: 'Some transaction records are missing required fields',
            affectedRecords: Math.floor(Math.random() * 20) + 5,
            suggestions: ['Request complete statement from client', 'Use data imputation techniques']
        });
        recommendations.push('Improve statement quality by requesting standardized format from client');
    }

    if (accuracy < 0.85) {
        issues.push({
            type: 'data_inconsistency',
            severity: 'high' as const,
            description: 'Detected inconsistencies in transaction amounts or dates',
            affectedRecords: Math.floor(Math.random() * 15) + 3,
            suggestions: ['Manual verification required', 'Cross-reference with source documents']
        });
        recommendations.push('Implement automated data validation rules');
    }

    if (validity < 0.8) {
        issues.push({
            type: 'format_issues',
            severity: 'low' as const,
            description: 'Some data fields do not conform to expected formats',
            affectedRecords: Math.floor(Math.random() * 25) + 10,
            suggestions: ['Apply data standardization rules', 'Update parsing logic']
        });
        recommendations.push('Consider using more advanced OCR or parsing tools');
    }

    if (statement.fileType === 'pdf' && overallScore < 0.85) {
        recommendations.push('Request statement in CSV or Excel format for better data quality');
    }

    // Add general recommendations based on overall score
    if (overallScore >= 0.9) {
        recommendations.push('Data quality is excellent - no immediate action required');
    } else if (overallScore >= 0.8) {
        recommendations.push('Data quality is good with minor improvements needed');
    } else {
        recommendations.push('Data quality needs significant improvement - consider reprocessing');
    }

    return {
        overallScore: Math.round(overallScore * 100) / 100,
        dimensions: {
            completeness: Math.round(completeness * 100) / 100,
            accuracy: Math.round(accuracy * 100) / 100,
            consistency: Math.round(consistency * 100) / 100,
            validity: Math.round(validity * 100) / 100
        },
        issues,
        recommendations
    };
};

export default {
    createStatement,
    queryStatements,
    getStatementById,
    updateStatementById,
    deleteStatementById,
    getStatementsByClientId,
    validateStatement,
    getStatementStatus,
    startStatementParsing,
    getUploadProgress,
    downloadStatement,
    validateBulkStatements,
    getProcessingQueue,
    reprocessStatements,
    getDataQuality
};

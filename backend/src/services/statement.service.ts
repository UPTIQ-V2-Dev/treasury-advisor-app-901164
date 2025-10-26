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
    downloadStatement
};

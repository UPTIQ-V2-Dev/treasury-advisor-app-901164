import { bankConnectionService, statementService } from '../services/index.ts';
import ApiError from '../utils/ApiError.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import fs from 'fs/promises';
import httpStatus from 'http-status';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (
        req: any,
        file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void
    ) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'statements');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error as Error, '');
        }
    },
    filename: (req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only specific file types for bank statements
    const allowedTypes = ['.pdf', '.csv', '.xlsx', '.xls', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(
            new ApiError(
                httpStatus.BAD_REQUEST,
                'Invalid file type. Only PDF, CSV, XLSX, XLS, and TXT files are allowed.'
            )
        );
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

const uploadStatements = catchAsyncWithAuth(async (req, res) => {
    const files = (req as any).files as Express.Multer.File[];
    if (!files || !Array.isArray(files) || files.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No files uploaded');
    }

    const { clientId, statementPeriod } = req.body;

    const statements = [];

    for (const file of files) {
        const statement = await statementService.createStatement({
            fileName: file.originalname,
            fileSize: file.size,
            fileType: path.extname(file.originalname).substring(1).toLowerCase(),
            filePath: file.path,
            clientId,
            period: statementPeriod ? JSON.parse(statementPeriod) : undefined
        });

        statements.push(statement);
    }

    res.status(httpStatus.CREATED).send(statements);
});

const validateStatement = catchAsyncWithAuth(async (req, res) => {
    const result = await statementService.validateStatement(req.params.fileId);
    res.send(result);
});

const getStatementStatus = catchAsyncWithAuth(async (req, res) => {
    const result = await statementService.getStatementStatus(req.params.fileId);
    res.send(result);
});

const parseStatements = catchAsyncWithAuth(async (req, res) => {
    const { fileIds } = req.body;
    const task = await statementService.startStatementParsing(fileIds);
    res.status(httpStatus.ACCEPTED).send({ taskId: task.taskId });
});

const getClientStatements = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const filter: any = pick(req.validatedQuery, ['status', 'accountId', 'startDate', 'endDate']);
    const options = pick(req.validatedQuery, ['sortBy', 'sortType', 'limit', 'page']);

    // Add clientId to filter
    filter.clientId = clientId;

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
    res.send(result);
});

const connectBank = catchAsyncWithAuth(async (req, res) => {
    const connectionData = pick(req.body, [
        'clientId',
        'bankName',
        'accountId',
        'connectionType',
        'credentials',
        'settings'
    ]) as any;
    const connection = await bankConnectionService.createBankConnection(connectionData);
    res.status(httpStatus.CREATED).send(connection);
});

const getClientBankConnections = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const filter: any = pick(req.validatedQuery, ['status', 'bankName', 'connectionType']);
    const options = pick(req.validatedQuery, ['sortBy', 'sortType', 'limit', 'page']);

    // Add clientId to filter
    filter.clientId = clientId;

    const result = await bankConnectionService.queryBankConnections(filter, options);
    res.send(result);
});

const syncBankConnection = catchAsyncWithAuth(async (req, res) => {
    const { connectionId } = req.params;
    const task = await bankConnectionService.syncBankConnection(connectionId);
    res.status(httpStatus.ACCEPTED).send({ taskId: task.taskId });
});

const getUploadProgress = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const progress = await statementService.getUploadProgress(clientId);
    res.send(progress);
});

const deleteStatement = catchAsyncWithAuth(async (req, res) => {
    const { fileId } = req.params;
    await statementService.deleteStatementById(fileId);
    res.status(httpStatus.NO_CONTENT).send();
});

const downloadStatement = catchAsyncWithAuth(async (req, res) => {
    const { fileId } = req.params;
    const fileInfo = await statementService.downloadStatement(fileId);

    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);

    const fileStream = require('fs').createReadStream(fileInfo.filePath);
    fileStream.pipe(res);
});

// Additional endpoints for comprehensive statement management
const getAllStatements = catchAsyncWithAuth(async (req, res) => {
    const filter: any = pick(req.validatedQuery, [
        'clientId',
        'status',
        'accountId',
        'fileName',
        'fileType',
        'startDate',
        'endDate'
    ]);
    const options = pick(req.validatedQuery, ['sortBy', 'sortType', 'limit', 'page']);

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
    res.send(result);
});

const getStatementById = catchAsyncWithAuth(async (req, res) => {
    const statement = await statementService.getStatementById(req.params.fileId);
    if (!statement) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Statement not found');
    }
    res.send(statement);
});

const updateStatement = catchAsyncWithAuth(async (req, res) => {
    const updateBody = pick(req.body, ['status', 'accountId', 'period', 'errorMessage']);
    const statement = await statementService.updateStatementById(req.params.fileId, updateBody);
    res.send(statement);
});

const getAllBankConnections = catchAsyncWithAuth(async (req, res) => {
    const filter = pick(req.validatedQuery, ['clientId', 'status', 'bankName', 'connectionType']);
    const options = pick(req.validatedQuery, ['sortBy', 'sortType', 'limit', 'page']);

    const result = await bankConnectionService.queryBankConnections(filter, options);
    res.send(result);
});

const getBankConnectionById = catchAsyncWithAuth(async (req, res) => {
    const connection = await bankConnectionService.getBankConnectionById(req.params.connectionId);
    if (!connection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Bank connection not found');
    }
    res.send(connection);
});

const updateBankConnection = catchAsyncWithAuth(async (req, res) => {
    const updateBody = pick(req.body, ['bankName', 'status', 'credentials', 'settings']);
    const connection = await bankConnectionService.updateBankConnectionById(req.params.connectionId, updateBody);
    res.send(connection);
});

const deleteBankConnection = catchAsyncWithAuth(async (req, res) => {
    await bankConnectionService.deleteBankConnectionById(req.params.connectionId);
    res.status(httpStatus.NO_CONTENT).send();
});

const testBankConnection = catchAsyncWithAuth(async (req, res) => {
    const result = await bankConnectionService.testBankConnection(req.params.connectionId);
    res.send(result);
});

const getConnectionStats = catchAsyncWithAuth(async (req, res) => {
    const stats = await bankConnectionService.getConnectionStats(req.params.clientId);
    res.send(stats);
});

const statementController = {
    uploadStatements,
    validateStatement,
    getStatementStatus,
    parseStatements,
    getClientStatements,
    connectBank,
    getClientBankConnections,
    syncBankConnection,
    getUploadProgress,
    deleteStatement,
    downloadStatement,
    getAllStatements,
    getStatementById,
    updateStatement,
    getAllBankConnections,
    getBankConnectionById,
    updateBankConnection,
    deleteBankConnection,
    testBankConnection,
    getConnectionStats
};

export { statementController };
export default statementController;

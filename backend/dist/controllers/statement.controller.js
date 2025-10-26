import { statementService } from "../services/index.js";
import ApiError from "../utils/ApiError.js";
import catchAsyncWithAuth from "../utils/catchAsyncWithAuth.js";
import pick from "../utils/pick.js";
import fs from 'fs/promises';
import httpStatus from 'http-status';
import multer from 'multer';
import path from 'path';
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'statements');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        }
        catch (error) {
            cb(error, '');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const fileFilter = (req, file, cb) => {
    // Accept only specific file types for bank statements
    const allowedTypes = ['.pdf', '.csv', '.xlsx', '.xls', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new ApiError(httpStatus.BAD_REQUEST, 'Invalid file type. Only PDF, CSV, XLSX, XLS, and TXT files are allowed.'));
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
    const files = req.files;
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
    const filter = pick(req.validatedQuery, ['status', 'accountId', 'startDate', 'endDate']);
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
    const filter = pick(req.validatedQuery, [
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
// Enhanced statement processing endpoints
const validateBulkStatements = catchAsyncWithAuth(async (req, res) => {
    const { fileIds, validationRules } = req.body;
    const result = await statementService.validateBulkStatements(fileIds, validationRules);
    res.send(result);
});
const getProcessingQueue = catchAsyncWithAuth(async (req, res) => {
    const { status } = req.validatedQuery;
    const result = await statementService.getProcessingQueue(status);
    res.send(result);
});
const reprocessStatements = catchAsyncWithAuth(async (req, res) => {
    const { fileIds, options } = req.body;
    const result = await statementService.reprocessStatements(fileIds, options);
    res.status(httpStatus.ACCEPTED).send(result);
});
const getDataQuality = catchAsyncWithAuth(async (req, res) => {
    const { fileId } = req.params;
    const result = await statementService.getDataQuality(fileId);
    res.send(result);
});
const statementController = {
    uploadStatements,
    validateStatement,
    getStatementStatus,
    parseStatements,
    getClientStatements,
    getUploadProgress,
    deleteStatement,
    downloadStatement,
    getAllStatements,
    getStatementById,
    updateStatement,
    validateBulkStatements,
    getProcessingQueue,
    reprocessStatements,
    getDataQuality
};
export { statementController };
export default statementController;

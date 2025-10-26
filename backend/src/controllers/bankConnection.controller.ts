import { bankConnectionService } from '../services/index.ts';
import ApiError from '../utils/ApiError.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import httpStatus from 'http-status';

const createBankConnection = catchAsyncWithAuth(async (req, res) => {
    const connection = await bankConnectionService.createBankConnection(req.body);
    res.status(httpStatus.CREATED).send(connection);
});

const getBankConnections = catchAsyncWithAuth(async (req, res) => {
    const filter = pick(req.validatedQuery, ['clientId', 'status', 'connectionType']);
    const options = pick(req.validatedQuery, ['sortBy', 'limit', 'page']);
    const result = await bankConnectionService.queryBankConnections(filter, options);
    res.send(result);
});

const getBankConnection = catchAsyncWithAuth(async (req, res) => {
    const connection = await bankConnectionService.getBankConnectionById(req.params.connectionId);
    if (!connection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Bank connection not found');
    }
    res.send(connection);
});

const updateBankConnection = catchAsyncWithAuth(async (req, res) => {
    const connection = await bankConnectionService.updateBankConnectionById(req.params.connectionId, req.body);
    res.send(connection);
});

const deleteBankConnection = catchAsyncWithAuth(async (req, res) => {
    await bankConnectionService.deleteBankConnectionById(req.params.connectionId);
    res.status(httpStatus.NO_CONTENT).send();
});

const syncBankConnection = catchAsyncWithAuth(async (req, res) => {
    const result = await bankConnectionService.syncBankConnection(req.params.connectionId);
    res.status(httpStatus.ACCEPTED).send(result);
});

const getBankConnectionsByClient = catchAsyncWithAuth(async (req, res) => {
    const connections = await bankConnectionService.getBankConnectionsByClientId(req.params.clientId);
    res.send(connections);
});

// For statement route's connect endpoint - creates a bank connection
const connectToBank = catchAsyncWithAuth(async (req, res) => {
    const connectionData = {
        clientId: req.body.clientId,
        accountId: req.body.accountId,
        bankName: req.body.bankName,
        connectionType: req.body.connectionType,
        credentials: req.body.credentials,
        settings: req.body.settings
    };

    const connection = await bankConnectionService.createBankConnection(connectionData);

    // Format response to match API spec
    const response = {
        id: connection.id,
        bankName: connection.bankName,
        accountId: connection.accountId,
        connectionType: connection.connectionType,
        lastSync: connection.lastSync,
        status: connection.status
    };

    res.status(httpStatus.CREATED).send(response);
});

export default {
    createBankConnection,
    getBankConnections,
    getBankConnection,
    updateBankConnection,
    deleteBankConnection,
    syncBankConnection,
    getBankConnectionsByClient,
    connectToBank
};

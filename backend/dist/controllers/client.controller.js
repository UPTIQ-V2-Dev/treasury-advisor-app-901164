import { clientService } from "../services/index.js";
import ApiError from "../utils/ApiError.js";
import catchAsyncWithAuth from "../utils/catchAsyncWithAuth.js";
import pick from "../utils/pick.js";
import httpStatus from 'http-status';
const createClient = catchAsyncWithAuth(async (req, res) => {
    const client = await clientService.createClient(req.body);
    res.status(httpStatus.CREATED).send(client);
});
const getClients = catchAsyncWithAuth(async (req, res) => {
    const filter = pick(req.validatedQuery, [
        'name',
        'industry',
        'businessType',
        'businessSegment',
        'riskProfile',
        'relationshipManagerId'
    ]);
    const options = pick(req.validatedQuery, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await clientService.queryClients(filter, options);
    res.send(result);
});
const getClient = catchAsyncWithAuth(async (req, res) => {
    const client = await clientService.getClientById(req.params.clientId);
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }
    res.send(client);
});
const updateClient = catchAsyncWithAuth(async (req, res) => {
    const client = await clientService.updateClientById(req.params.clientId, req.body);
    res.send(client);
});
const deleteClient = catchAsyncWithAuth(async (req, res) => {
    await clientService.deleteClientById(req.params.clientId);
    res.status(httpStatus.NO_CONTENT).send();
});
const searchClients = catchAsyncWithAuth(async (req, res) => {
    const { q } = req.validatedQuery;
    const clients = await clientService.searchClients(q);
    res.send(clients);
});
const getClientsByRM = catchAsyncWithAuth(async (req, res) => {
    const rmId = parseInt(req.params.rmId);
    const clients = await clientService.getClientsByRM(rmId);
    res.send(clients);
});
const updateClientPreferences = catchAsyncWithAuth(async (req, res) => {
    await clientService.updateClientPreferences(req.params.clientId, req.body);
    res.send({});
});
const getClientAccounts = catchAsyncWithAuth(async (req, res) => {
    const accounts = await clientService.getClientAccounts(req.params.clientId);
    res.send(accounts);
});
const addClientAccount = catchAsyncWithAuth(async (req, res) => {
    const account = await clientService.addClientAccount(req.params.clientId, {
        ...req.body,
        openDate: new Date(req.body.openDate)
    });
    res.status(httpStatus.CREATED).send(account);
});
const updateClientAccount = catchAsyncWithAuth(async (req, res) => {
    const account = await clientService.updateClientAccount(req.params.clientId, req.params.accountId, req.body);
    res.send(account);
});
export default {
    createClient,
    getClients,
    getClient,
    updateClient,
    deleteClient,
    searchClients,
    getClientsByRM,
    updateClientPreferences,
    getClientAccounts,
    addClientAccount,
    updateClientAccount
};

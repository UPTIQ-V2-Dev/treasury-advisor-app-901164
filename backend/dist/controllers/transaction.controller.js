import { transactionService } from "../services/index.js";
import catchAsyncWithAuth from "../utils/catchAsyncWithAuth.js";
import pick from "../utils/pick.js";
import httpStatus from 'http-status';
const createTransaction = catchAsyncWithAuth(async (req, res) => {
    const transactionData = {
        account: { connect: { id: req.body.accountId } },
        client: { connect: { id: req.body.clientId } },
        ...(req.body.statementId && { statement: { connect: { id: req.body.statementId } } }),
        date: new Date(req.body.date),
        description: req.body.description,
        amount: req.body.amount,
        type: req.body.type,
        category: req.body.category,
        counterparty: req.body.counterparty,
        balanceAfter: req.body.balanceAfter,
        metadata: req.body.metadata
    };
    const transaction = await transactionService.createTransaction(transactionData);
    res.status(httpStatus.CREATED).send(transaction);
});
const getTransactions = catchAsyncWithAuth(async (req, res) => {
    const filter = pick(req.validatedQuery, [
        'clientId',
        'accountId',
        'type',
        'category',
        'counterparty',
        'startDate',
        'endDate',
        'minAmount',
        'maxAmount',
        'description'
    ]);
    const options = pick(req.validatedQuery, ['sortBy', 'limit', 'page']);
    const result = await transactionService.queryTransactions(filter, options);
    res.send(result);
});
const getTransaction = catchAsyncWithAuth(async (req, res) => {
    const transaction = await transactionService.getTransactionById(req.params.transactionId);
    res.send(transaction);
});
const updateTransaction = catchAsyncWithAuth(async (req, res) => {
    const transaction = await transactionService.updateTransactionById(req.params.transactionId, req.body);
    res.send(transaction);
});
const deleteTransaction = catchAsyncWithAuth(async (req, res) => {
    await transactionService.deleteTransactionById(req.params.transactionId);
    res.status(httpStatus.NO_CONTENT).send();
});
const getTransactionAnalytics = catchAsyncWithAuth(async (req, res) => {
    const filter = pick(req.validatedQuery, ['accountId', 'startDate', 'endDate']);
    const analytics = await transactionService.getTransactionAnalytics(req.params.clientId, filter);
    res.send(analytics);
});
const getTransactionsByAccount = catchAsyncWithAuth(async (req, res) => {
    const options = pick(req.validatedQuery, ['sortBy', 'limit', 'page']);
    const result = await transactionService.getTransactionsByAccount(req.params.accountId, options);
    res.send(result);
});
export default {
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionAnalytics,
    getTransactionsByAccount
};

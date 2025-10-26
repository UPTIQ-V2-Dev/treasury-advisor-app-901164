import { workflowService } from '../services/index.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import httpStatus from 'http-status';

const getWorkflowTasks = catchAsyncWithAuth(async (req, res) => {
    const filter = pick(req.validatedQuery, ['status', 'type', 'assignedTo', 'clientId']);
    const options = pick(req.validatedQuery, ['sortBy', 'sortType', 'limit', 'page']);
    const tasks = await workflowService.getWorkflowTasks(filter, options);
    res.send(tasks);
});

const completeWorkflowTask = catchAsyncWithAuth(async (req, res) => {
    const { taskId } = req.params;
    const completionData = req.body;
    const userId = req.user.id.toString(); // Convert to string since workflow uses string IDs
    const userName = req.user.name || req.user.email;

    const result = await workflowService.completeWorkflowTask(taskId, completionData, userId, userName);
    res.send(result);
});

const getWorkflowAudit = catchAsyncWithAuth(async (req, res) => {
    const { clientId } = req.params;
    const filter = pick(req.validatedQuery, ['startDate', 'endDate', 'activityType']);
    const options = pick(req.validatedQuery, ['sortBy', 'sortType', 'limit', 'page']);

    const auditTrail = await workflowService.getWorkflowAudit(clientId, filter, options);
    res.send(auditTrail);
});

const createWorkflowTask = catchAsyncWithAuth(async (req, res) => {
    const taskData = req.body;
    const task = await workflowService.createWorkflowTask(taskData);
    res.status(httpStatus.CREATED).send(task);
});

export default {
    getWorkflowTasks,
    completeWorkflowTask,
    getWorkflowAudit,
    createWorkflowTask
};

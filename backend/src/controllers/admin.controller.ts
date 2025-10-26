import { adminService } from '../services/index.ts';
import ApiError from '../utils/ApiError.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import httpStatus from 'http-status';

const getSystemHealth = catchAsyncWithAuth(async (req, res) => {
    const health = await adminService.getSystemHealth();
    res.send(health);
});

const getSystemLogs = catchAsyncWithAuth(async (req, res) => {
    const filter = pick(req.validatedQuery, ['level', 'service', 'startTime', 'endTime']);
    const options = pick(req.validatedQuery, ['limit', 'page']);
    const logs = await adminService.getSystemLogs(filter, options);
    res.send(logs);
});

const createMaintenanceTask = catchAsyncWithAuth(async (req, res) => {
    const { operation, parameters } = req.body;
    const result = await adminService.createMaintenanceTask(operation, parameters);
    res.status(httpStatus.ACCEPTED).send(result);
});

const getMaintenanceTask = catchAsyncWithAuth(async (req, res) => {
    const { taskId } = req.params;
    const task = await adminService.getMaintenanceTaskById(taskId);

    if (!task) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Maintenance task not found');
    }

    res.send(task);
});

const getUsageAnalytics = catchAsyncWithAuth(async (req, res) => {
    const { period } = req.validatedQuery;
    const analytics = await adminService.getSystemUsageAnalytics(period);
    res.send(analytics);
});

export default {
    getSystemHealth,
    getSystemLogs,
    createMaintenanceTask,
    getMaintenanceTask,
    getUsageAnalytics
};

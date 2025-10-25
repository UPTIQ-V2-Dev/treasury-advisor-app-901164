import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processingService } from '../processing';

// Mock the entire API and utils
vi.mock('@/lib/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

vi.mock('@/lib/utils', () => ({
    mockApiDelay: vi.fn(() => Promise.resolve())
}));

describe('processingService', () => {
    beforeEach(() => {
        // Always use mock data to simplify testing
        vi.stubEnv('VITE_USE_MOCK_DATA', 'true');
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    describe('getProcessingTask', () => {
        it('returns processing task with correct structure', async () => {
            const result = await processingService.getProcessingTask('test-task');

            expect(result).toHaveProperty('id', 'test-task');
            expect(result).toHaveProperty('type');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('progress');
            expect(result).toHaveProperty('steps');
        });
    });

    describe('getClientProcessingTasks', () => {
        it('returns array of processing tasks', async () => {
            const result = await processingService.getClientProcessingTasks('client-1');

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            result.forEach(task => {
                expect(task).toHaveProperty('id');
                expect(task).toHaveProperty('type');
                expect(task).toHaveProperty('status');
            });
        });
    });

    describe('startProcessing', () => {
        it('returns task ID for new processing task', async () => {
            const result = await processingService.startProcessing('client-1', 'statement_parse');

            expect(result).toHaveProperty('taskId');
            expect(typeof result.taskId).toBe('string');
            expect(result.taskId).toMatch(/^mock-task-\d+$/);
        });
    });

    describe('getProcessingMetrics', () => {
        it('returns processing metrics', async () => {
            const result = await processingService.getProcessingMetrics();

            expect(result).toHaveProperty('totalTasks');
            expect(result).toHaveProperty('completedTasks');
            expect(result).toHaveProperty('failedTasks');
            expect(result).toHaveProperty('averageProcessingTime');
            expect(result).toHaveProperty('currentLoad');

            expect(typeof result.totalTasks).toBe('number');
            expect(typeof result.completedTasks).toBe('number');
            expect(typeof result.failedTasks).toBe('number');
            expect(typeof result.averageProcessingTime).toBe('number');
            expect(typeof result.currentLoad).toBe('number');
        });
    });

    describe('cancelProcessing', () => {
        it('completes without error', async () => {
            await expect(processingService.cancelProcessing('task-1')).resolves.toBeUndefined();
        });
    });

    describe('retryProcessing', () => {
        it('returns new task ID for retry', async () => {
            const result = await processingService.retryProcessing('task-1');

            expect(result).toHaveProperty('taskId');
            expect(result.taskId).toBe('retry-task-1');
        });
    });

    describe('getProcessingHistory', () => {
        it('returns paginated history', async () => {
            const result = await processingService.getProcessingHistory('client-1', 5, 10);

            expect(result).toHaveProperty('tasks');
            expect(result).toHaveProperty('total');
            expect(Array.isArray(result.tasks)).toBe(true);
            expect(typeof result.total).toBe('number');
        });
    });

    describe('subscribeToProcessingUpdates', () => {
        it('returns cleanup function', () => {
            const onUpdate = vi.fn();
            const cleanup = processingService.subscribeToProcessingUpdates('task-1', onUpdate);

            expect(typeof cleanup).toBe('function');
            expect(() => cleanup()).not.toThrow();
        });
    });

    describe('getTaskLogs', () => {
        it('returns array of log entries', async () => {
            const result = await processingService.getTaskLogs('task-1');

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(typeof result[0]).toBe('string');
            expect(result[0]).toContain('[INFO]');
        });
    });
});

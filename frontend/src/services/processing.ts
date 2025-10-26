import { api } from '@/lib/api';
import { USE_MOCK_DATA } from '@/lib/constants';
import { mockApiDelay } from '@/lib/utils';
import type { ProcessingTask, ProcessingStatus, ProcessingMetrics, RealTimeProcessingUpdate } from '@/types/processing';

const mockProcessingTask: ProcessingTask = {
    id: 'task-1',
    clientId: 'client-1',
    type: 'statement_parse',
    status: 'in_progress',
    progress: 65,
    startTime: '2024-01-15T10:00:00Z',
    estimatedDuration: 120000,
    currentStep: {
        id: 'step-3',
        name: 'Transaction Parsing',
        description: 'Extracting transaction data from uploaded statements',
        status: 'in_progress',
        startTime: '2024-01-15T10:01:30Z',
        progress: 65,
        details: 'Processing 1,247 transactions across 3 accounts'
    },
    steps: [
        {
            id: 'step-1',
            name: 'File Validation',
            description: 'Validating uploaded files and format',
            status: 'completed',
            startTime: '2024-01-15T10:00:00Z',
            endTime: '2024-01-15T10:00:30Z',
            progress: 100
        },
        {
            id: 'step-2',
            name: 'Document Processing',
            description: 'Converting documents to structured format',
            status: 'completed',
            startTime: '2024-01-15T10:00:30Z',
            endTime: '2024-01-15T10:01:30Z',
            progress: 100
        },
        {
            id: 'step-3',
            name: 'Transaction Parsing',
            description: 'Extracting transaction data from uploaded statements',
            status: 'in_progress',
            startTime: '2024-01-15T10:01:30Z',
            progress: 65,
            details: 'Processing 1,247 transactions across 3 accounts'
        },
        {
            id: 'step-4',
            name: 'Data Categorization',
            description: 'Categorizing transactions and identifying patterns',
            status: 'pending',
            progress: 0
        },
        {
            id: 'step-5',
            name: 'Analysis Generation',
            description: 'Generating financial insights and analytics',
            status: 'pending',
            progress: 0
        }
    ]
};

const mockProcessingMetrics: ProcessingMetrics = {
    totalTasks: 156,
    completedTasks: 149,
    failedTasks: 2,
    averageProcessingTime: 85000,
    currentLoad: 0.3
};

export const processingService = {
    getProcessingTask: async (taskId: string): Promise<ProcessingTask> => {
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: getProcessingTask ---', taskId);
            await mockApiDelay();
            return { ...mockProcessingTask, id: taskId };
        }

        const response = await api.get(`/processing/tasks/${taskId}`);
        return response.data;
    },

    getClientProcessingTasks: async (clientId: string): Promise<ProcessingTask[]> => {
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: getClientProcessingTasks ---', clientId);
            await mockApiDelay();
            return [
                { ...mockProcessingTask, id: 'task-1', status: 'completed', progress: 100 },
                { ...mockProcessingTask, id: 'task-2', status: 'in_progress', progress: 45 },
                { ...mockProcessingTask, id: 'task-3', status: 'queued', progress: 0 }
            ];
        }

        const response = await api.get(`/processing/clients/${clientId}/tasks`);
        return response.data;
    },

    startProcessing: async (
        clientId: string,
        type: 'statement_parse' | 'analysis' | 'recommendation_generation',
        options?: Record<string, any>
    ): Promise<{ taskId: string }> => {
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: startProcessing ---', { clientId, type, options });
            await mockApiDelay();
            return { taskId: `mock-task-${Date.now()}` };
        }

        const response = await api.post('/processing/start', {
            clientId,
            type,
            options
        });
        return response.data;
    },

    cancelProcessing: async (taskId: string): Promise<void> => {
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: cancelProcessing ---', taskId);
            await mockApiDelay();
            return;
        }

        await api.post(`/processing/tasks/${taskId}/cancel`);
    },

    retryProcessing: async (taskId: string): Promise<{ taskId: string }> => {
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: retryProcessing ---', taskId);
            await mockApiDelay();
            return { taskId: `retry-${taskId}` };
        }

        const response = await api.post(`/processing/tasks/${taskId}/retry`);
        return response.data;
    },

    getProcessingMetrics: async (): Promise<ProcessingMetrics> => {
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: getProcessingMetrics ---');
            await mockApiDelay();
            return mockProcessingMetrics;
        }

        const response = await api.get('/processing/metrics');
        return response.data;
    },

    getProcessingHistory: async (
        clientId: string,
        limit = 10,
        offset = 0
    ): Promise<{ tasks: ProcessingTask[]; total: number }> => {
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: getProcessingHistory ---', { clientId, limit, offset });
            await mockApiDelay();
            const tasks = Array.from({ length: limit }, (_, i) => ({
                ...mockProcessingTask,
                id: `history-task-${offset + i + 1}`,
                status: 'completed' as ProcessingStatus,
                progress: 100,
                endTime: '2024-01-15T10:02:30Z'
            }));
            return { tasks, total: 45 };
        }

        const response = await api.get(`/processing/clients/${clientId}/history`, {
            params: { limit, offset }
        });
        return response.data;
    },

    subscribeToProcessingUpdates: (
        taskId: string,
        onUpdate: (update: RealTimeProcessingUpdate) => void,
        onError?: (error: Error) => void
    ): (() => void) => {
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: subscribeToProcessingUpdates ---', taskId);

            const interval = setInterval(() => {
                const mockUpdate: RealTimeProcessingUpdate = {
                    taskId,
                    status: 'in_progress',
                    progress: Math.min(100, Math.floor(Math.random() * 100) + 1),
                    currentStep: 'Processing transactions...',
                    estimatedTimeRemaining: Math.floor(Math.random() * 60000),
                    message: 'Analyzing financial patterns'
                };
                onUpdate(mockUpdate);
            }, 2000);

            return () => {
                clearInterval(interval);
            };
        }

        const eventSource = new EventSource(`/api/processing/tasks/${taskId}/stream`);

        eventSource.onmessage = event => {
            try {
                const update: RealTimeProcessingUpdate = JSON.parse(event.data);
                onUpdate(update);
            } catch {
                onError?.(new Error('Failed to parse processing update'));
            }
        };

        eventSource.onerror = event => {
            onError?.(new Error('Processing update stream error'));
        };

        return () => {
            eventSource.close();
        };
    },

    getTaskLogs: async (taskId: string, level = 'info'): Promise<string[]> => {
        if (USE_MOCK_DATA) {
            console.log('--- MOCK API: getTaskLogs ---', { taskId, level });
            await mockApiDelay();
            return [
                '[INFO] Task started at 2024-01-15T10:00:00Z',
                '[INFO] File validation completed successfully',
                '[INFO] Found 3 PDF documents to process',
                '[INFO] Beginning document conversion',
                '[INFO] Document conversion completed - 1,247 transactions identified',
                '[INFO] Starting transaction parsing and categorization',
                '[WARN] Unrecognized transaction format on line 156, using fallback parser'
            ];
        }

        const response = await api.get(`/processing/tasks/${taskId}/logs`, {
            params: { level }
        });
        return response.data;
    }
};

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test-utils';
import '@testing-library/jest-dom';
import { ProcessingPage } from '../ProcessingPage';
import * as processingService from '@/services/processing';
import type { ProcessingTask } from '@/types/processing';

// Mock the processing service
vi.mock('@/services/processing', () => ({
    processingService: {
        getClientProcessingTasks: vi.fn(),
        getProcessingMetrics: vi.fn(),
        getProcessingHistory: vi.fn(),
        startProcessing: vi.fn(),
        cancelProcessing: vi.fn(),
        retryProcessing: vi.fn(),
        subscribeToProcessingUpdates: vi.fn(),
        getTaskLogs: vi.fn()
    }
}));

describe('ProcessingPage', () => {
    const mockGetClientProcessingTasks = vi.mocked(processingService.processingService.getClientProcessingTasks);
    const mockGetProcessingMetrics = vi.mocked(processingService.processingService.getProcessingMetrics);
    const mockGetProcessingHistory = vi.mocked(processingService.processingService.getProcessingHistory);
    const mockStartProcessing = vi.mocked(processingService.processingService.startProcessing);
    const mockCancelProcessing = vi.mocked(processingService.processingService.cancelProcessing);
    const mockRetryProcessing = vi.mocked(processingService.processingService.retryProcessing);
    const mockSubscribeToProcessingUpdates = vi.mocked(
        processingService.processingService.subscribeToProcessingUpdates
    );
    const mockGetTaskLogs = vi.mocked(processingService.processingService.getTaskLogs);

    const mockActiveTask: ProcessingTask = {
        id: 'task-1',
        clientId: 'd6e8f2b5-0865-485a-a63e-d083fad36462',
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
            }
        ]
    };

    const mockCompletedTask: ProcessingTask = {
        ...mockActiveTask,
        id: 'task-2',
        status: 'completed',
        progress: 100,
        endTime: '2024-01-15T10:02:30Z',
        results: {
            transactionCount: 1247,
            accountsProcessed: ['acc-1', 'acc-2', 'acc-3'],
            dataQualityScore: 0.95,
            warnings: ['Minor format inconsistency in account 2'],
            processingTime: 150000
        }
    };

    const mockMetrics = {
        totalTasks: 156,
        completedTasks: 149,
        failedTasks: 2,
        averageProcessingTime: 85000,
        currentLoad: 0.3
    };

    beforeEach(() => {
        mockGetClientProcessingTasks.mockResolvedValue([mockActiveTask, mockCompletedTask]);
        mockGetProcessingMetrics.mockResolvedValue(mockMetrics);
        mockGetProcessingHistory.mockResolvedValue({
            tasks: [mockCompletedTask],
            total: 45
        });
        mockSubscribeToProcessingUpdates.mockReturnValue(() => {});
        mockGetTaskLogs.mockResolvedValue([
            '[INFO] Task started at 2024-01-15T10:00:00Z',
            '[INFO] File validation completed successfully'
        ]);
        mockStartProcessing.mockResolvedValue({ taskId: 'new-task-id' });
        mockCancelProcessing.mockResolvedValue();
        mockRetryProcessing.mockResolvedValue({ taskId: 'retry-task-id' });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders page title and description', async () => {
        render(<ProcessingPage />);

        expect(screen.getByText('Data Processing')).toBeInTheDocument();
        expect(screen.getByText('Real-time status of statement parsing and analysis tasks')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
        mockGetClientProcessingTasks.mockReturnValue(new Promise(() => {}));

        render(<ProcessingPage />);

        expect(screen.getByText('Loading processing status...')).toBeInTheDocument();
    });

    it('displays processing metrics after loading', async () => {
        render(<ProcessingPage />);

        await waitFor(() => {
            expect(screen.getByText('Total Tasks')).toBeInTheDocument();
            expect(screen.getByText('Completed')).toBeInTheDocument();
            expect(screen.getByText('Failed')).toBeInTheDocument();
            expect(screen.getByText('Avg Duration')).toBeInTheDocument();
        });

        expect(screen.getByText(mockMetrics.totalTasks.toString())).toBeInTheDocument();
        expect(screen.getByText(mockMetrics.completedTasks.toString())).toBeInTheDocument();
        expect(screen.getByText(mockMetrics.failedTasks.toString())).toBeInTheDocument();
    });

    it('displays active tasks with progress', async () => {
        render(<ProcessingPage />);

        await waitFor(() => {
            expect(screen.getByText('Active Tasks')).toBeInTheDocument();
        });

        expect(screen.getByText('Statement parse')).toBeInTheDocument();
        expect(screen.getByText('65%')).toBeInTheDocument();
        expect(screen.getByText('Extracting transaction data from uploaded statements')).toBeInTheDocument();
    });

    it('shows processing steps with correct status icons', async () => {
        render(<ProcessingPage />);

        await waitFor(() => {
            expect(screen.getByText('Processing Steps')).toBeInTheDocument();
        });

        expect(screen.getByText('File Validation')).toBeInTheDocument();
        expect(screen.getByText('Document Processing')).toBeInTheDocument();
        expect(screen.getByText('Transaction Parsing')).toBeInTheDocument();
    });

    it('allows starting new processing tasks', async () => {
        render(<ProcessingPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /parse statements/i })).toBeInTheDocument();
        });

        const parseButton = screen.getByRole('button', { name: /parse statements/i });
        await user.click(parseButton);

        expect(mockStartProcessing).toHaveBeenCalledWith('client-1', 'statement_parse');
    });

    it('allows canceling active tasks', async () => {
        render(<ProcessingPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        });

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockCancelProcessing).toHaveBeenCalledWith('task-1');
    });

    it('displays completed tasks in history', async () => {
        render(<ProcessingPage />);

        await waitFor(() => {
            expect(screen.getByText('Task History')).toBeInTheDocument();
        });

        expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('shows task results for completed tasks', async () => {
        render(<ProcessingPage />);

        await waitFor(() => {
            expect(screen.getByText('Transactions:')).toBeInTheDocument();
        });

        expect(screen.getByText('1,247')).toBeInTheDocument();
        expect(screen.getByText('Quality Score:')).toBeInTheDocument();
        expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('allows viewing task logs', async () => {
        render(<ProcessingPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /view logs/i })).toBeInTheDocument();
        });

        const viewLogsButton = screen.getByRole('button', { name: /view logs/i });
        await user.click(viewLogsButton);

        await waitFor(() => {
            expect(mockGetTaskLogs).toHaveBeenCalledWith('task-1');
        });
    });

    it('shows retry button for failed tasks', async () => {
        const failedTask = { ...mockActiveTask, status: 'failed' as const };
        mockGetClientProcessingTasks.mockResolvedValue([failedTask]);

        render(<ProcessingPage />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
        });

        const retryButton = screen.getByRole('button', { name: /retry/i });
        await user.click(retryButton);

        expect(mockRetryProcessing).toHaveBeenCalledWith('task-1');
    });

    it('displays error messages for failed tasks', async () => {
        const failedTask: ProcessingTask = {
            ...mockActiveTask,
            status: 'failed',
            error: {
                code: 'PARSE_ERROR',
                message: 'Failed to parse statement format',
                recoverable: true
            }
        };
        mockGetClientProcessingTasks.mockResolvedValue([failedTask]);

        render(<ProcessingPage />);

        await waitFor(() => {
            expect(screen.getByText('Failed to parse statement format')).toBeInTheDocument();
        });
    });

    it('handles empty task history gracefully', async () => {
        mockGetClientProcessingTasks.mockResolvedValue([]);
        mockGetProcessingHistory.mockResolvedValue({ tasks: [], total: 0 });

        render(<ProcessingPage />);

        await waitFor(() => {
            expect(screen.getByText('No completed tasks yet')).toBeInTheDocument();
        });
    });

    it('subscribes to real-time updates for active tasks', async () => {
        render(<ProcessingPage />);

        await waitFor(() => {
            expect(mockSubscribeToProcessingUpdates).toHaveBeenCalledWith(
                'task-1',
                expect.any(Function),
                expect.any(Function)
            );
        });
    });

    it('disables start buttons when similar task is active', async () => {
        render(<ProcessingPage />);

        await waitFor(() => {
            const parseButton = screen.getByRole('button', { name: /parse statements/i });
            expect(parseButton).toBeDisabled();
        });
    });
});

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { processingService } from '@/services/processing';
import { ProcessingTask, RealTimeProcessingUpdate } from '@/types/processing';
import {
    Play,
    Square,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Activity,
    FileText,
    Database,
    BarChart3
} from 'lucide-react';

const MOCK_CLIENT_ID = 'client-1';

export const ProcessingPage = () => {
    const [selectedTask, setSelectedTask] = useState<ProcessingTask | null>(null);
    const [realTimeUpdates, setRealTimeUpdates] = useState<Record<string, RealTimeProcessingUpdate>>({});
    const [taskLogs, setTaskLogs] = useState<Record<string, string[]>>({});

    const {
        data: tasks = [],
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['processing-tasks', MOCK_CLIENT_ID],
        queryFn: () => processingService.getClientProcessingTasks(MOCK_CLIENT_ID),
        refetchInterval: 5000
    });

    const { data: metrics } = useQuery({
        queryKey: ['processing-metrics'],
        queryFn: () => processingService.getProcessingMetrics(),
        refetchInterval: 10000
    });

    const { data: history } = useQuery({
        queryKey: ['processing-history', MOCK_CLIENT_ID],
        queryFn: () => processingService.getProcessingHistory(MOCK_CLIENT_ID, 10),
        refetchInterval: 30000
    });

    useEffect(() => {
        const subscriptions: (() => void)[] = [];

        tasks
            .filter(task => ['queued', 'initializing', 'in_progress'].includes(task.status))
            .forEach(task => {
                const unsubscribe = processingService.subscribeToProcessingUpdates(
                    task.id,
                    update => {
                        setRealTimeUpdates(prev => ({
                            ...prev,
                            [task.id]: update
                        }));
                    },
                    error => {
                        console.error(`Processing update error for task ${task.id}:`, error);
                    }
                );
                subscriptions.push(unsubscribe);
            });

        return () => {
            subscriptions.forEach(unsub => unsub());
        };
    }, [tasks]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'queued':
                return <Clock className='h-4 w-4 text-blue-500' />;
            case 'initializing':
                return <Play className='h-4 w-4 text-yellow-500' />;
            case 'in_progress':
                return <Activity className='h-4 w-4 text-blue-500 animate-pulse' />;
            case 'completing':
                return <RefreshCw className='h-4 w-4 text-green-500 animate-spin' />;
            case 'completed':
                return <CheckCircle2 className='h-4 w-4 text-green-500' />;
            case 'failed':
                return <XCircle className='h-4 w-4 text-red-500' />;
            case 'cancelled':
                return <Square className='h-4 w-4 text-gray-500' />;
            default:
                return <Clock className='h-4 w-4 text-gray-500' />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'queued':
                return 'bg-blue-500';
            case 'initializing':
                return 'bg-yellow-500';
            case 'in_progress':
                return 'bg-blue-500';
            case 'completing':
                return 'bg-green-500';
            case 'completed':
                return 'bg-green-500';
            case 'failed':
                return 'bg-red-500';
            case 'cancelled':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getTaskTypeIcon = (type: string) => {
        switch (type) {
            case 'statement_parse':
                return <FileText className='h-5 w-5' />;
            case 'analysis':
                return <BarChart3 className='h-5 w-5' />;
            case 'recommendation_generation':
                return <Database className='h-5 w-5' />;
            default:
                return <Activity className='h-5 w-5' />;
        }
    };

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };

    const handleStartProcessing = async (type: ProcessingTask['type']) => {
        try {
            const { taskId } = await processingService.startProcessing(MOCK_CLIENT_ID, type);
            console.log(`Started processing task: ${taskId}`);
            refetch();
        } catch (error) {
            console.error('Failed to start processing:', error);
        }
    };

    const handleCancelTask = async (taskId: string) => {
        try {
            await processingService.cancelProcessing(taskId);
            refetch();
        } catch (error) {
            console.error('Failed to cancel task:', error);
        }
    };

    const handleRetryTask = async (taskId: string) => {
        try {
            const { taskId: newTaskId } = await processingService.retryProcessing(taskId);
            console.log(`Retrying with new task ID: ${newTaskId}`);
            refetch();
        } catch (error) {
            console.error('Failed to retry task:', error);
        }
    };

    const loadTaskLogs = async (taskId: string) => {
        if (!taskLogs[taskId]) {
            try {
                const logs = await processingService.getTaskLogs(taskId);
                setTaskLogs(prev => ({
                    ...prev,
                    [taskId]: logs
                }));
            } catch (error) {
                console.error('Failed to load task logs:', error);
            }
        }
    };

    const activeTasks = tasks.filter(task =>
        ['queued', 'initializing', 'in_progress', 'completing'].includes(task.status)
    );
    const completedTasks = tasks.filter(task => ['completed', 'failed', 'cancelled'].includes(task.status));

    if (isLoading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <div className='text-center space-y-4'>
                    <div className='animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto'></div>
                    <p className='text-muted-foreground'>Loading processing status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>Data Processing</h1>
                    <p className='text-muted-foreground'>Real-time status of statement parsing and analysis tasks</p>
                </div>
                <div className='flex gap-2'>
                    <Button
                        onClick={() => handleStartProcessing('statement_parse')}
                        size='sm'
                        disabled={activeTasks.some(t => t.type === 'statement_parse')}
                    >
                        <FileText className='h-4 w-4 mr-2' />
                        Parse Statements
                    </Button>
                    <Button
                        onClick={() => handleStartProcessing('analysis')}
                        variant='outline'
                        size='sm'
                        disabled={activeTasks.some(t => t.type === 'analysis')}
                    >
                        <BarChart3 className='h-4 w-4 mr-2' />
                        Generate Analysis
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            {metrics && (
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>Total Tasks</CardTitle>
                            <Activity className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>{metrics.totalTasks}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>Completed</CardTitle>
                            <CheckCircle2 className='h-4 w-4 text-green-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold text-green-600'>{metrics.completedTasks}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>Failed</CardTitle>
                            <XCircle className='h-4 w-4 text-red-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold text-red-600'>{metrics.failedTasks}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>Avg Duration</CardTitle>
                            <Clock className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>{formatDuration(metrics.averageProcessingTime)}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Active Tasks */}
            {activeTasks.length > 0 && (
                <div className='space-y-4'>
                    <h2 className='text-xl font-semibold'>Active Tasks</h2>
                    {activeTasks.map(task => {
                        const update = realTimeUpdates[task.id];
                        const currentProgress = update?.progress || task.progress;
                        const currentStatus = update?.status || task.status;

                        return (
                            <Card key={task.id}>
                                <CardHeader>
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-3'>
                                            {getTaskTypeIcon(task.type)}
                                            <div>
                                                <CardTitle className='text-lg capitalize'>
                                                    {task.type.replace('_', ' ')}
                                                </CardTitle>
                                                <CardDescription>
                                                    Started {new Date(task.startTime).toLocaleString()}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            {getStatusIcon(currentStatus)}
                                            <Badge
                                                variant='secondary'
                                                className={`text-white ${getStatusColor(currentStatus)}`}
                                            >
                                                {currentStatus.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className='space-y-4'>
                                        {/* Progress */}
                                        <div className='space-y-2'>
                                            <div className='flex items-center justify-between text-sm'>
                                                <span>{update?.currentStep || task.currentStep.description}</span>
                                                <span>{currentProgress}%</span>
                                            </div>
                                            <Progress
                                                value={currentProgress}
                                                className='w-full'
                                            />
                                        </div>

                                        {/* Current Step Details */}
                                        {update?.message && (
                                            <Alert>
                                                <Activity className='h-4 w-4' />
                                                <AlertDescription>{update.message}</AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Steps */}
                                        <div className='space-y-2'>
                                            <h4 className='font-medium text-sm'>Processing Steps</h4>
                                            <div className='space-y-1'>
                                                {task.steps.map(step => (
                                                    <div
                                                        key={step.id}
                                                        className='flex items-center gap-3 text-sm'
                                                    >
                                                        {step.status === 'completed' && (
                                                            <CheckCircle2 className='h-4 w-4 text-green-500' />
                                                        )}
                                                        {step.status === 'in_progress' && (
                                                            <Activity className='h-4 w-4 text-blue-500 animate-pulse' />
                                                        )}
                                                        {step.status === 'failed' && (
                                                            <XCircle className='h-4 w-4 text-red-500' />
                                                        )}
                                                        {step.status === 'pending' && (
                                                            <Clock className='h-4 w-4 text-gray-400' />
                                                        )}
                                                        <span
                                                            className={
                                                                step.status === 'completed'
                                                                    ? 'text-green-600'
                                                                    : step.status === 'in_progress'
                                                                      ? 'text-blue-600'
                                                                      : step.status === 'failed'
                                                                        ? 'text-red-600'
                                                                        : 'text-gray-500'
                                                            }
                                                        >
                                                            {step.name}
                                                        </span>
                                                        {step.details && step.status === 'in_progress' && (
                                                            <span className='text-muted-foreground'>
                                                                - {step.details}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className='flex gap-2'>
                                            {['in_progress', 'queued'].includes(currentStatus) && (
                                                <Button
                                                    variant='destructive'
                                                    size='sm'
                                                    onClick={() => handleCancelTask(task.id)}
                                                >
                                                    <Square className='h-4 w-4 mr-2' />
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    loadTaskLogs(task.id);
                                                }}
                                            >
                                                View Logs
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Recent Tasks */}
            <Tabs
                defaultValue='completed'
                className='space-y-4'
            >
                <div className='flex items-center justify-between'>
                    <h2 className='text-xl font-semibold'>Task History</h2>
                    <TabsList>
                        <TabsTrigger value='completed'>Recent ({completedTasks.length})</TabsTrigger>
                        {history && <TabsTrigger value='history'>All History ({history.total})</TabsTrigger>}
                    </TabsList>
                </div>

                <TabsContent
                    value='completed'
                    className='space-y-4'
                >
                    {completedTasks.length === 0 ? (
                        <Card>
                            <CardContent className='flex items-center justify-center py-8'>
                                <div className='text-center space-y-2'>
                                    <Activity className='h-8 w-8 text-muted-foreground mx-auto' />
                                    <p className='text-muted-foreground'>No completed tasks yet</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        completedTasks.slice(0, 5).map(task => (
                            <Card key={task.id}>
                                <CardHeader className='pb-3'>
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-3'>
                                            {getTaskTypeIcon(task.type)}
                                            <div>
                                                <CardTitle className='text-base capitalize'>
                                                    {task.type.replace('_', ' ')}
                                                </CardTitle>
                                                <CardDescription>
                                                    {new Date(task.startTime).toLocaleDateString()} •{' '}
                                                    {formatDuration(
                                                        task.endTime
                                                            ? new Date(task.endTime).getTime() -
                                                                  new Date(task.startTime).getTime()
                                                            : 0
                                                    )}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            {getStatusIcon(task.status)}
                                            <Badge
                                                variant='secondary'
                                                className={`text-white ${getStatusColor(task.status)}`}
                                            >
                                                {task.status}
                                            </Badge>
                                            {task.status === 'failed' && (
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={() => handleRetryTask(task.id)}
                                                >
                                                    <RefreshCw className='h-4 w-4 mr-2' />
                                                    Retry
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                {task.error && (
                                    <CardContent>
                                        <Alert variant='destructive'>
                                            <AlertTriangle className='h-4 w-4' />
                                            <AlertDescription>{task.error.message}</AlertDescription>
                                        </Alert>
                                    </CardContent>
                                )}
                                {task.results && (
                                    <CardContent>
                                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                                            <div>
                                                <span className='font-medium'>Transactions:</span>
                                                <div>{task.results.transactionCount}</div>
                                            </div>
                                            <div>
                                                <span className='font-medium'>Quality Score:</span>
                                                <div>{Math.round(task.results.dataQualityScore * 100)}%</div>
                                            </div>
                                            <div>
                                                <span className='font-medium'>Accounts:</span>
                                                <div>{task.results.accountsProcessed.length}</div>
                                            </div>
                                            <div>
                                                <span className='font-medium'>Duration:</span>
                                                <div>{formatDuration(task.results.processingTime)}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent
                    value='history'
                    className='space-y-4'
                >
                    {history && history.tasks.length > 0 ? (
                        history.tasks.map(task => (
                            <Card key={task.id}>
                                <CardHeader className='pb-3'>
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-3'>
                                            {getTaskTypeIcon(task.type)}
                                            <div>
                                                <CardTitle className='text-base capitalize'>
                                                    {task.type.replace('_', ' ')}
                                                </CardTitle>
                                                <CardDescription>
                                                    {new Date(task.startTime).toLocaleDateString()}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge
                                            variant='secondary'
                                            className={`text-white ${getStatusColor(task.status)}`}
                                        >
                                            {task.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className='flex items-center justify-center py-8'>
                                <p className='text-muted-foreground'>No task history available</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Task Logs Modal (simplified) */}
            {selectedTask && taskLogs[selectedTask.id] && (
                <Card className='mt-6'>
                    <CardHeader>
                        <div className='flex items-center justify-between'>
                            <CardTitle>Task Logs - {selectedTask.type}</CardTitle>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setSelectedTask(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className='h-64 w-full rounded border p-4 font-mono text-sm'>
                            {taskLogs[selectedTask.id].map((log, index) => (
                                <div
                                    key={index}
                                    className='mb-1'
                                >
                                    {log}
                                </div>
                            ))}
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

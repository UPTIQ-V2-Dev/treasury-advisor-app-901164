export interface ProcessingTask {
    id: string;
    clientId: string;
    type: 'statement_parse' | 'analysis' | 'recommendation_generation';
    status: ProcessingStatus;
    progress: number;
    startTime: string;
    endTime?: string;
    estimatedDuration?: number;
    currentStep: ProcessingStep;
    steps: ProcessingStep[];
    error?: ProcessingError;
    results?: ProcessingResults;
}

export interface ProcessingStep {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    startTime?: string;
    endTime?: string;
    progress: number;
    details?: string;
    error?: string;
}

export interface ProcessingError {
    code: string;
    message: string;
    details?: string;
    recoverable: boolean;
    retryCount?: number;
    lastRetryAt?: string;
}

export interface ProcessingResults {
    transactionCount: number;
    accountsProcessed: string[];
    dataQualityScore: number;
    warnings: string[];
    processingTime: number;
}

export type ProcessingStatus =
    | 'queued'
    | 'initializing'
    | 'in_progress'
    | 'completing'
    | 'completed'
    | 'failed'
    | 'cancelled';

export interface ProcessingMetrics {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
    currentLoad: number;
}

export interface RealTimeProcessingUpdate {
    taskId: string;
    status: ProcessingStatus;
    progress: number;
    currentStep: string;
    estimatedTimeRemaining?: number;
    message?: string;
}

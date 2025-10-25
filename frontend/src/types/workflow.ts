export interface WorkflowState {
    id: string;
    clientId: string;
    currentStep: WorkflowStep;
    progress: number;
    status: WorkflowStatus;
    history: WorkflowHistoryEntry[];
    metadata: WorkflowMetadata;
    createdAt: string;
    updatedAt: string;
}

export type WorkflowStep = 'upload' | 'processing' | 'analysis' | 'recommendations' | 'review' | 'finalized';

export type WorkflowStatus = 'in_progress' | 'completed' | 'error' | 'pending_review' | 'approved' | 'rejected';

export interface WorkflowHistoryEntry {
    step: WorkflowStep;
    status: WorkflowStatus;
    timestamp: string;
    userId?: string;
    userName?: string;
    notes?: string;
    duration?: number;
}

export interface WorkflowMetadata {
    statementCount: number;
    transactionCount: number;
    recommendationCount: number;
    processingTimeMs: number;
    reviewers: string[];
    errorCount: number;
}

export interface ProcessingStatus {
    stage: ProcessingStage;
    progress: number;
    message: string;
    estimatedTimeRemaining?: number;
    errors?: ProcessingError[];
}

export type ProcessingStage =
    | 'file_validation'
    | 'data_extraction'
    | 'transaction_parsing'
    | 'categorization'
    | 'analysis'
    | 'recommendation_generation';

export interface ProcessingError {
    code: string;
    message: string;
    severity: 'warning' | 'error' | 'critical';
    context?: Record<string, any>;
    timestamp: string;
}

export interface ApprovalRequest {
    workflowId: string;
    recommendationIds: string[];
    reviewerId: string;
    action: 'approve' | 'reject' | 'request_modifications';
    comments?: string;
    modifications?: RecommendationModification[];
}

export interface RecommendationModification {
    recommendationId: string;
    field: string;
    currentValue: any;
    proposedValue: any;
    reason: string;
}

export interface WorkflowSummary {
    totalWorkflows: number;
    activeWorkflows: number;
    completedWorkflows: number;
    errorWorkflows: number;
    averageProcessingTime: number;
    statusBreakdown: Record<WorkflowStatus, number>;
    stepBreakdown: Record<WorkflowStep, number>;
}

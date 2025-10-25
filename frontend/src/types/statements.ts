export interface Transaction {
    id: string;
    accountId: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit' | 'transfer' | 'check' | 'ach' | 'wire' | 'card';
    category?: string;
    counterparty?: string;
    balanceAfter: number;
    createdAt: string;
    updatedAt: string;
}

export interface Account {
    id: string;
    accountNumber: string;
    accountType: string;
    bankName: string;
    routingNumber?: string;
}

export interface StatementFile {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: 'pdf' | 'csv' | 'xlsx';
    uploadDate: string;
    status: StatementStatus;
    clientId: string;
    accountId?: string;
}

export interface StatementUpload {
    files: File[];
    clientId: string;
    accountIds?: string[];
    statementPeriod: {
        startDate: string;
        endDate: string;
    };
}

export interface StatementValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    parsedTransactionCount?: number;
    accountsFound?: string[];
}

export interface BankConnection {
    id: string;
    bankName: string;
    accountId: string;
    connectionType: 'api' | 'manual';
    lastSync?: string;
    status: 'connected' | 'disconnected' | 'error';
}

export type StatementStatus = 'uploaded' | 'validating' | 'parsing' | 'analyzing' | 'completed' | 'error';

export interface UploadProgress {
    fileId: string;
    fileName: string;
    progress: number;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
    error?: string;
}

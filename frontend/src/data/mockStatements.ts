import type {
    Transaction,
    Account,
    StatementFile,
    StatementValidation,
    BankConnection,
    UploadProgress
} from '@/types/statements';

export const mockAccounts: Account[] = [
    {
        id: 'acc-001',
        accountNumber: '****1234',
        accountType: 'Business Checking',
        bankName: 'First National Bank',
        routingNumber: '021000021'
    },
    {
        id: 'acc-002',
        accountNumber: '****5678',
        accountType: 'Business Savings',
        bankName: 'First National Bank',
        routingNumber: '021000021'
    }
];

export const mockTransactions: Transaction[] = [
    {
        id: 'txn-001',
        accountId: 'acc-001',
        date: '2024-12-15',
        description: 'PAYROLL DEPOSIT ACH CREDIT',
        amount: 125000.0,
        type: 'ach',
        category: 'payroll',
        counterparty: 'ADP PAYROLL SERVICES',
        balanceAfter: 450000.0,
        createdAt: '2024-12-15T10:30:00Z',
        updatedAt: '2024-12-15T10:30:00Z'
    },
    {
        id: 'txn-002',
        accountId: 'acc-001',
        date: '2024-12-14',
        description: 'OFFICE RENT PAYMENT CHECK',
        amount: -15000.0,
        type: 'check',
        category: 'rent',
        counterparty: 'DOWNTOWN PROPERTIES LLC',
        balanceAfter: 325000.0,
        createdAt: '2024-12-14T14:20:00Z',
        updatedAt: '2024-12-14T14:20:00Z'
    },
    {
        id: 'txn-003',
        accountId: 'acc-001',
        date: '2024-12-13',
        description: 'VENDOR PAYMENT - OFFICE SUPPLIES',
        amount: -2500.0,
        type: 'ach',
        category: 'office_supplies',
        counterparty: 'STAPLES BUSINESS DEPOT',
        balanceAfter: 340000.0,
        createdAt: '2024-12-13T09:15:00Z',
        updatedAt: '2024-12-13T09:15:00Z'
    },
    {
        id: 'txn-004',
        accountId: 'acc-001',
        date: '2024-12-12',
        description: 'CUSTOMER PAYMENT WIRE TRANSFER',
        amount: 75000.0,
        type: 'wire',
        category: 'customer_payment',
        counterparty: 'ACME CORPORATION',
        balanceAfter: 342500.0,
        createdAt: '2024-12-12T16:45:00Z',
        updatedAt: '2024-12-12T16:45:00Z'
    },
    {
        id: 'txn-005',
        accountId: 'acc-001',
        date: '2024-12-11',
        description: 'UTILITY PAYMENT - ELECTRICITY',
        amount: -850.0,
        type: 'ach',
        category: 'utilities',
        counterparty: 'PACIFIC GAS & ELECTRIC',
        balanceAfter: 267500.0,
        createdAt: '2024-12-11T08:30:00Z',
        updatedAt: '2024-12-11T08:30:00Z'
    }
];

export const mockStatementFiles: StatementFile[] = [
    {
        id: 'stmt-001',
        fileName: 'November_2024_Statement.pdf',
        fileSize: 2048576, // 2MB
        fileType: 'pdf',
        uploadDate: '2024-12-01T10:00:00Z',
        status: 'completed',
        clientId: 'client-001',
        accountId: 'acc-001'
    },
    {
        id: 'stmt-002',
        fileName: 'October_2024_Transactions.csv',
        fileSize: 512000, // 512KB
        fileType: 'csv',
        uploadDate: '2024-11-01T14:30:00Z',
        status: 'completed',
        clientId: 'client-001',
        accountId: 'acc-001'
    }
];

export const mockStatementValidation: StatementValidation = {
    isValid: true,
    errors: [],
    warnings: ['Some transaction descriptions are truncated and may affect categorization accuracy'],
    parsedTransactionCount: 145,
    accountsFound: ['****1234', '****5678']
};

export const mockBankConnections: BankConnection[] = [
    {
        id: 'conn-001',
        bankName: 'First National Bank',
        accountId: 'acc-001',
        connectionType: 'api',
        lastSync: '2024-12-15T06:00:00Z',
        status: 'connected'
    },
    {
        id: 'conn-002',
        bankName: 'Wells Fargo Business',
        accountId: 'acc-003',
        connectionType: 'manual',
        status: 'disconnected'
    }
];

export const mockUploadProgress: UploadProgress[] = [
    {
        fileId: 'file-001',
        fileName: 'December_2024_Statement.pdf',
        progress: 100,
        status: 'completed'
    },
    {
        fileId: 'file-002',
        fileName: 'November_2024_Transactions.csv',
        progress: 75,
        status: 'processing'
    },
    {
        fileId: 'file-003',
        fileName: 'October_2024_Statement.pdf',
        progress: 0,
        status: 'error',
        error: 'Invalid file format. Please upload PDF or CSV files only.'
    }
];

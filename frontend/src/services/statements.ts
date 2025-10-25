import { api } from '@/lib/api';
import { mockApiDelay } from '@/lib/utils';
import {
    mockStatementFiles,
    mockStatementValidation,
    mockTransactions,
    mockBankConnections,
    mockUploadProgress
} from '@/data/mockStatements';
import type {
    StatementFile,
    StatementUpload,
    StatementValidation,
    Transaction,
    BankConnection,
    UploadProgress,
    StatementStatus
} from '@/types/statements';

export const statementsService = {
    uploadStatements: async (uploadData: StatementUpload): Promise<StatementFile[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: uploadStatements ---', uploadData);
            await mockApiDelay();
            return mockStatementFiles.slice(0, uploadData.files.length);
        }

        const formData = new FormData();
        uploadData.files.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });
        formData.append('clientId', uploadData.clientId);
        formData.append('statementPeriod', JSON.stringify(uploadData.statementPeriod));

        const response = await api.post('/statements/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    validateStatement: async (fileId: string): Promise<StatementValidation> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: validateStatement ---', fileId);
            await mockApiDelay();
            return mockStatementValidation;
        }

        const response = await api.get(`/statements/${fileId}/validate`);
        return response.data;
    },

    getStatementStatus: async (fileId: string): Promise<{ status: StatementStatus; progress: number }> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getStatementStatus ---', fileId);
            await mockApiDelay();
            return { status: 'completed', progress: 100 };
        }

        const response = await api.get(`/statements/${fileId}/status`);
        return response.data;
    },

    parseStatements: async (fileIds: string[]): Promise<{ taskId: string }> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: parseStatements ---', fileIds);
            await mockApiDelay();
            return { taskId: 'mock-task-id' };
        }

        const response = await api.post('/statements/parse', { fileIds });
        return response.data;
    },

    getTransactions: async (clientId: string, accountId?: string): Promise<Transaction[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getTransactions ---', { clientId, accountId });
            await mockApiDelay();
            return accountId ? mockTransactions.filter(t => t.accountId === accountId) : mockTransactions;
        }

        const params = new URLSearchParams({ clientId });
        if (accountId) params.append('accountId', accountId);

        const response = await api.get(`/transactions?${params}`);
        return response.data;
    },

    getClientStatements: async (clientId: string): Promise<StatementFile[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getClientStatements ---', clientId);
            await mockApiDelay();
            return mockStatementFiles.filter(s => s.clientId === clientId);
        }

        const response = await api.get(`/clients/${clientId}/statements`);
        return response.data;
    },

    connectBank: async (connectionData: Omit<BankConnection, 'id' | 'lastSync'>): Promise<BankConnection> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: connectBank ---', connectionData);
            await mockApiDelay();
            return {
                id: 'new-conn-id',
                lastSync: new Date().toISOString(),
                ...connectionData
            };
        }

        const response = await api.post('/statements/connect', connectionData);
        return response.data;
    },

    getBankConnections: async (clientId: string): Promise<BankConnection[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getBankConnections ---', clientId);
            await mockApiDelay();
            return mockBankConnections;
        }

        const response = await api.get(`/clients/${clientId}/bank-connections`);
        return response.data;
    },

    syncBankConnection: async (connectionId: string): Promise<{ taskId: string }> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: syncBankConnection ---', connectionId);
            await mockApiDelay();
            return { taskId: 'sync-task-id' };
        }

        const response = await api.post(`/bank-connections/${connectionId}/sync`);
        return response.data;
    },

    getUploadProgress: async (clientId: string): Promise<UploadProgress[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getUploadProgress ---', clientId);
            await mockApiDelay();
            return mockUploadProgress;
        }

        const response = await api.get(`/clients/${clientId}/upload-progress`);
        return response.data;
    },

    deleteStatement: async (fileId: string): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: deleteStatement ---', fileId);
            await mockApiDelay();
            return;
        }

        await api.delete(`/statements/${fileId}`);
    },

    downloadStatement: async (fileId: string): Promise<Blob> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: downloadStatement ---', fileId);
            await mockApiDelay();
            return new Blob(['Mock file content'], { type: 'application/pdf' });
        }

        const response = await api.get(`/statements/${fileId}/download`, {
            responseType: 'blob'
        });
        return response.data;
    }
};

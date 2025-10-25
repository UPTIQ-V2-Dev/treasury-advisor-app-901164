import { api } from '@/lib/api';
import { mockApiDelay } from '@/lib/utils';
import { mockClients } from '@/data/mockClients';
import type { Client, CreateClientRequest, UpdateClientRequest } from '@/types/client';

export const clientsService = {
    getClients: async (page = 1, limit = 20): Promise<{ clients: Client[]; total: number; pages: number }> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getClients ---', { page, limit });
            await mockApiDelay();
            return {
                clients: mockClients.slice((page - 1) * limit, page * limit),
                total: mockClients.length,
                pages: Math.ceil(mockClients.length / limit)
            };
        }

        const response = await api.get(`/clients?page=${page}&limit=${limit}`);
        return response.data;
    },

    getClientById: async (clientId: string): Promise<Client> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getClientById ---', clientId);
            await mockApiDelay();
            const client = mockClients.find(c => c.id === clientId);
            if (!client) throw new Error('Client not found');
            return client;
        }

        const response = await api.get(`/clients/${clientId}`);
        return response.data;
    },

    createClient: async (clientData: CreateClientRequest): Promise<Client> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: createClient ---', clientData);
            await mockApiDelay();
            const newClient: Client = {
                id: `client-${Date.now()}`,
                ...clientData,
                relationshipManager: {
                    id: clientData.relationshipManagerId,
                    name: 'Mock RM',
                    email: 'rm@bank.com',
                    department: 'Commercial Banking'
                },
                accounts: [],
                riskProfile: 'medium',
                preferences: {
                    communicationChannel: 'email' as const,
                    reportFrequency: 'monthly' as const,
                    riskTolerance: 'moderate' as const,
                    liquidityPriority: 'medium' as const,
                    yieldPriority: 'medium' as const,
                    ...clientData.preferences
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            return newClient;
        }

        const response = await api.post('/clients', clientData);
        return response.data;
    },

    updateClient: async (clientData: UpdateClientRequest): Promise<Client> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: updateClient ---', clientData);
            await mockApiDelay();
            const existingClient = mockClients.find(c => c.id === clientData.id);
            if (!existingClient) throw new Error('Client not found');
            const updatedClient: Client = {
                ...existingClient,
                ...clientData,
                preferences: {
                    ...existingClient.preferences,
                    ...clientData.preferences
                },
                updatedAt: new Date().toISOString()
            };
            return updatedClient;
        }

        const response = await api.put(`/clients/${clientData.id}`, clientData);
        return response.data;
    },

    deleteClient: async (clientId: string): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: deleteClient ---', clientId);
            await mockApiDelay();
            return;
        }

        await api.delete(`/clients/${clientId}`);
    },

    searchClients: async (query: string): Promise<Client[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: searchClients ---', query);
            await mockApiDelay();
            return mockClients.filter(
                client =>
                    client.name.toLowerCase().includes(query.toLowerCase()) ||
                    client.industry.toLowerCase().includes(query.toLowerCase()) ||
                    client.businessType.toLowerCase().includes(query.toLowerCase())
            );
        }

        const response = await api.get(`/clients/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },

    getClientsByRM: async (rmId: string): Promise<Client[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getClientsByRM ---', rmId);
            await mockApiDelay();
            return mockClients.filter(client => client.relationshipManagerId === rmId);
        }

        const response = await api.get(`/relationship-managers/${rmId}/clients`);
        return response.data;
    },

    updateClientPreferences: async (clientId: string, preferences: Partial<Client['preferences']>): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: updateClientPreferences ---', { clientId, preferences });
            await mockApiDelay();
            return;
        }

        await api.patch(`/clients/${clientId}/preferences`, preferences);
    },

    getClientAccounts: async (clientId: string): Promise<Client['accounts']> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getClientAccounts ---', clientId);
            await mockApiDelay();
            const client = mockClients.find(c => c.id === clientId);
            return client?.accounts || [];
        }

        const response = await api.get(`/clients/${clientId}/accounts`);
        return response.data;
    },

    addClientAccount: async (
        clientId: string,
        accountData: Omit<Client['accounts'][0], 'id'>
    ): Promise<Client['accounts'][0]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: addClientAccount ---', { clientId, accountData });
            await mockApiDelay();
            return {
                id: `acc-${Date.now()}`,
                ...accountData
            };
        }

        const response = await api.post(`/clients/${clientId}/accounts`, accountData);
        return response.data;
    },

    updateClientAccount: async (
        clientId: string,
        accountId: string,
        accountData: Partial<Client['accounts'][0]>
    ): Promise<Client['accounts'][0]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: updateClientAccount ---', { clientId, accountId, accountData });
            await mockApiDelay();
            const client = mockClients.find(c => c.id === clientId);
            const account = client?.accounts.find(a => a.id === accountId);
            if (!account) throw new Error('Account not found');
            return { ...account, ...accountData };
        }

        const response = await api.patch(`/clients/${clientId}/accounts/${accountId}`, accountData);
        return response.data;
    }
};

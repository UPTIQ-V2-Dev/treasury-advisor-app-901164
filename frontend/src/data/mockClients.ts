import type { Client, CreateClientRequest } from '@/types/client';

export const mockClients: Client[] = [];

export const mockCreateClientRequest: CreateClientRequest = {
    name: 'New Business Client',
    businessType: 'Professional Services',
    industry: 'Consulting',
    relationshipManagerId: 'rm-001',
    businessSegment: 'small',
    contact: {
        primaryContact: {
            name: 'John Smith',
            title: 'Owner',
            email: 'john.smith@newbusiness.com',
            phone: '+1-555-0199'
        }
    }
};

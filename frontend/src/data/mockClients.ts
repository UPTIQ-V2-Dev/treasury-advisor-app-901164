import type { Client, CreateClientRequest } from '@/types/client';

export const mockClients: Client[] = [
    {
        id: '1',
        name: 'Acme Corporation',
        businessType: 'Manufacturing',
        industry: 'Industrial Equipment',
        relationshipManagerId: 'rm-001',
        relationshipManager: {
            id: 'rm-001',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@bank.com',
            phone: '+1-555-0123',
            department: 'Commercial Banking'
        },
        accounts: [
            {
                id: 'acc-001',
                accountNumber: '****1234',
                accountType: 'Business Checking',
                bankName: 'Treasury Bank',
                routingNumber: '123456789',
                isActive: true,
                openDate: '2022-01-15',
                balance: 2500000.00,
                currency: 'USD'
            }
        ],
        businessSegment: 'medium',
        riskProfile: 'medium',
        preferences: {
            communicationChannel: 'email',
            reportFrequency: 'monthly',
            riskTolerance: 'moderate',
            liquidityPriority: 'high',
            yieldPriority: 'medium'
        },
        contact: {
            primaryContact: {
                name: 'John Doe',
                title: 'CFO',
                email: 'user@example.com',
                phone: '+1-555-0199'
            },
            treasuryContact: {
                name: 'John Doe',
                title: 'CFO',
                email: 'user@example.com',
                phone: '+1-555-0199'
            }
        },
        createdAt: '2022-01-15T09:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
    }
];

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

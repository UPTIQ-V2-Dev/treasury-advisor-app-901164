import type { Client, CreateClientRequest } from '@/types/client';

export const mockClients: Client[] = [
    {
        id: '1',
        name: 'Acme Corporation',
        businessType: 'Manufacturing',
        industry: 'Industrial Equipment',
        relationshipManagerId: '3',
        relationshipManager: {
            id: '3',
            name: 'Robert Manager',
            email: 'rm@example.com',
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
                balance: 2500000.0,
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
    },
    {
        id: '2',
        name: 'Tech Innovations LLC',
        businessType: 'LLC',
        industry: 'Technology',
        relationshipManagerId: '3',
        relationshipManager: {
            id: '3',
            name: 'Robert Manager',
            email: 'rm@example.com',
            phone: '+1-555-0123',
            department: 'Commercial Banking'
        },
        accounts: [
            {
                id: 'acc-002',
                accountNumber: '****5678',
                accountType: 'Business Savings',
                bankName: 'Treasury Bank',
                routingNumber: '123456789',
                isActive: true,
                openDate: '2023-03-10',
                balance: 850000.0,
                currency: 'USD'
            }
        ],
        businessSegment: 'small',
        riskProfile: 'high',
        preferences: {
            communicationChannel: 'email',
            reportFrequency: 'weekly',
            riskTolerance: 'aggressive',
            liquidityPriority: 'medium',
            yieldPriority: 'high'
        },
        contact: {
            primaryContact: {
                name: 'Alice Johnson',
                title: 'CEO',
                email: 'alice@techinnovations.com',
                phone: '+1-555-0299'
            }
        },
        createdAt: '2023-03-10T10:00:00Z',
        updatedAt: '2024-01-20T16:45:00Z'
    },
    {
        id: '3',
        name: 'Global Enterprises Inc.',
        businessType: 'Corporation',
        industry: 'Financial Services',
        relationshipManagerId: '2',
        relationshipManager: {
            id: '2',
            name: 'Jane Smith',
            email: 'admin@example.com',
            phone: '+1-555-0456',
            department: 'Commercial Banking'
        },
        accounts: [
            {
                id: 'acc-003',
                accountNumber: '****9012',
                accountType: 'Business Checking',
                bankName: 'Treasury Bank',
                routingNumber: '123456789',
                isActive: true,
                openDate: '2021-06-01',
                balance: 5750000.0,
                currency: 'USD'
            }
        ],
        businessSegment: 'enterprise',
        riskProfile: 'low',
        preferences: {
            communicationChannel: 'phone',
            reportFrequency: 'monthly',
            riskTolerance: 'conservative',
            liquidityPriority: 'high',
            yieldPriority: 'low'
        },
        contact: {
            primaryContact: {
                name: 'Michael Roberts',
                title: 'Treasurer',
                email: 'michael@globalenterprises.com',
                phone: '+1-555-0399'
            }
        },
        createdAt: '2021-06-01T08:00:00Z',
        updatedAt: '2024-01-10T12:00:00Z'
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

import type { Client, CreateClientRequest } from '@/types/client';

export const mockClients: Client[] = [
    {
        id: 'client-001',
        name: 'TechStart Solutions Inc.',
        businessType: 'Technology Services',
        industry: 'Software Development',
        relationshipManagerId: 'rm-001',
        relationshipManager: {
            id: 'rm-001',
            name: 'Sarah Mitchell',
            email: 'sarah.mitchell@firstnational.com',
            phone: '+1-555-0123',
            department: 'Commercial Banking'
        },
        accounts: [
            {
                id: 'acc-001',
                accountNumber: '****1234',
                accountType: 'Business Checking',
                bankName: 'First National Bank',
                routingNumber: '021000021',
                isActive: true,
                openDate: '2023-06-15',
                balance: 450000,
                currency: 'USD'
            },
            {
                id: 'acc-002',
                accountNumber: '****5678',
                accountType: 'Business Savings',
                bankName: 'First National Bank',
                routingNumber: '021000021',
                isActive: true,
                openDate: '2023-08-01',
                balance: 75000,
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
                name: 'Michael Chen',
                title: 'Chief Financial Officer',
                email: 'michael.chen@techstart.com',
                phone: '+1-555-0187'
            },
            treasuryContact: {
                name: 'Jennifer Walsh',
                title: 'Controller',
                email: 'jennifer.walsh@techstart.com',
                phone: '+1-555-0188'
            },
            billingContact: {
                name: 'Michael Chen',
                email: 'accounting@techstart.com',
                address: {
                    street1: '1234 Innovation Drive',
                    street2: 'Suite 100',
                    city: 'San Francisco',
                    state: 'CA',
                    zipCode: '94107',
                    country: 'USA'
                }
            }
        },
        createdAt: '2023-06-15T10:00:00Z',
        updatedAt: '2024-12-16T08:30:00Z'
    },
    {
        id: 'client-002',
        name: 'Green Manufacturing Corp',
        businessType: 'Manufacturing',
        industry: 'Renewable Energy Equipment',
        relationshipManagerId: 'rm-002',
        relationshipManager: {
            id: 'rm-002',
            name: 'David Rodriguez',
            email: 'david.rodriguez@firstnational.com',
            phone: '+1-555-0145',
            department: 'Commercial Banking'
        },
        accounts: [
            {
                id: 'acc-003',
                accountNumber: '****9012',
                accountType: 'Business Operating',
                bankName: 'First National Bank',
                routingNumber: '021000021',
                isActive: true,
                openDate: '2022-03-20',
                balance: 1250000,
                currency: 'USD'
            }
        ],
        businessSegment: 'large',
        riskProfile: 'low',
        preferences: {
            communicationChannel: 'phone',
            reportFrequency: 'weekly',
            riskTolerance: 'conservative',
            liquidityPriority: 'high',
            yieldPriority: 'low'
        },
        contact: {
            primaryContact: {
                name: 'Robert Thompson',
                title: 'Chief Executive Officer',
                email: 'robert.thompson@greenmanufacturing.com',
                phone: '+1-555-0234'
            },
            treasuryContact: {
                name: 'Lisa Park',
                title: 'VP Finance',
                email: 'lisa.park@greenmanufacturing.com',
                phone: '+1-555-0235'
            },
            billingContact: {
                name: 'Accounts Payable',
                email: 'ap@greenmanufacturing.com',
                address: {
                    street1: '5678 Industrial Blvd',
                    city: 'Austin',
                    state: 'TX',
                    zipCode: '78745',
                    country: 'USA'
                }
            }
        },
        createdAt: '2022-03-20T14:15:00Z',
        updatedAt: '2024-12-10T11:20:00Z'
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

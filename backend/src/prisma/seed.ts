import {
    AgentTaskStatus,
    ConnectionStatus,
    ConnectionType,
    NotificationType,
    PrismaClient,
    Role,
    WorkflowActivityType,
    WorkflowTaskPriority,
    WorkflowTaskStatus,
    WorkflowTaskType
} from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin',
            password: adminPassword,
            role: Role.ADMIN,
            isEmailVerified: true
        }
    });

    console.log('✅ Created admin user:', admin.email);

    // Create relationship managers
    const rmPassword = await bcrypt.hash('rm123', 12);

    const rm1 = await prisma.user.upsert({
        where: { email: 'rm1@example.com' },
        update: {},
        create: {
            email: 'rm1@example.com',
            name: 'John Smith',
            password: rmPassword,
            role: Role.USER,
            isEmailVerified: true
        }
    });

    const rm2 = await prisma.user.upsert({
        where: { email: 'rm2@example.com' },
        update: {},
        create: {
            email: 'rm2@example.com',
            name: 'Sarah Johnson',
            password: rmPassword,
            role: Role.USER,
            isEmailVerified: true
        }
    });

    console.log('✅ Created relationship managers:', rm1.email, rm2.email);

    // Create specific user: anand@uptiq.ai
    const anandPassword = await bcrypt.hash('Uptiq@2025', 12);
    const anand = await prisma.user.upsert({
        where: { email: 'anand@uptiq.ai' },
        update: {},
        create: {
            email: 'anand@uptiq.ai',
            name: 'Anand',
            password: anandPassword,
            role: Role.USER,
            isEmailVerified: true
        }
    });

    console.log('✅ Created specific user:', anand.email);

    // Create sample clients
    const client1 = await prisma.client.upsert({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        update: {},
        create: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'ABC Corporation',
            businessType: 'Corporation',
            industry: 'Technology',
            businessSegment: 'medium',
            riskProfile: 'medium',
            relationshipManagerId: rm1.id,
            contact: {
                primaryContact: {
                    name: 'John Doe',
                    title: 'CFO',
                    email: 'john.doe@abc.com',
                    phone: '555-0123'
                },
                address: {
                    street: '123 Tech Street',
                    city: 'San Francisco',
                    state: 'CA',
                    zipCode: '94105',
                    country: 'US'
                }
            },
            preferences: {
                communicationChannel: 'email',
                reportFrequency: 'monthly',
                riskTolerance: 'moderate'
            }
        }
    });

    const client2 = await prisma.client.upsert({
        where: { id: '456e7890-e89b-12d3-a456-426614174001' },
        update: {},
        create: {
            id: '456e7890-e89b-12d3-a456-426614174001',
            name: 'XYZ Manufacturing',
            businessType: 'LLC',
            industry: 'Manufacturing',
            businessSegment: 'large',
            riskProfile: 'low',
            relationshipManagerId: rm2.id,
            contact: {
                primaryContact: {
                    name: 'Jane Smith',
                    title: 'Treasurer',
                    email: 'jane.smith@xyz.com',
                    phone: '555-0456'
                },
                address: {
                    street: '456 Industrial Way',
                    city: 'Detroit',
                    state: 'MI',
                    zipCode: '48201',
                    country: 'US'
                }
            },
            preferences: {
                communicationChannel: 'portal',
                reportFrequency: 'weekly',
                riskTolerance: 'conservative'
            }
        }
    });

    console.log('✅ Created sample clients:', client1.name, client2.name);

    // Create sample accounts
    const account1 = await prisma.clientAccount.upsert({
        where: { accountNumber: '123456789' },
        update: {},
        create: {
            accountNumber: '123456789',
            accountType: 'Checking',
            bankName: 'ABC Bank',
            routingNumber: '021000021',
            isActive: true,
            openDate: new Date('2023-01-15'),
            balance: 150000.0,
            currency: 'USD',
            clientId: client1.id
        }
    });

    const account2 = await prisma.clientAccount.upsert({
        where: { accountNumber: '987654321' },
        update: {},
        create: {
            accountNumber: '987654321',
            accountType: 'Savings',
            bankName: 'XYZ Bank',
            routingNumber: '031000053',
            isActive: true,
            openDate: new Date('2023-06-01'),
            balance: 500000.0,
            currency: 'USD',
            clientId: client2.id
        }
    });

    console.log('✅ Created sample accounts:', account1.accountNumber, account2.accountNumber);

    // Create sample treasury products
    const highYieldSavings = await prisma.treasuryProduct.upsert({
        where: { id: 'prod-1234-high-yield-savings' },
        update: {},
        create: {
            id: 'prod-1234-high-yield-savings',
            name: 'High-Yield Savings Account',
            category: 'cash_management',
            description: 'Premium savings account with competitive rates and flexible access to funds',
            features: [
                'Online account management',
                'Mobile banking app',
                'Same-day fund transfers',
                'No minimum balance fees',
                'FDIC insured up to $250,000'
            ],
            eligibilityCriteria: {
                minimumBalance: 10000,
                businessSegments: ['small', 'medium', 'large'],
                riskProfiles: ['low', 'medium']
            },
            pricing: {
                yieldRate: 0.045,
                monthlyFee: 0,
                minimumDeposit: 10000
            },
            benefits: [
                {
                    type: 'yield_improvement',
                    description: 'Higher interest rates than traditional savings',
                    estimatedValue: 450,
                    unit: 'dollars'
                },
                {
                    type: 'liquidity_access',
                    description: 'Immediate access to funds without penalties',
                    estimatedValue: 0,
                    unit: 'convenience'
                }
            ],
            riskLevel: 'low',
            liquidityFeatures: ['Same-day access', 'No withdrawal penalties', 'Online transfers']
        }
    });

    const moneyMarket = await prisma.treasuryProduct.upsert({
        where: { id: 'prod-5678-money-market' },
        update: {},
        create: {
            id: 'prod-5678-money-market',
            name: 'Business Money Market Account',
            category: 'cash_management',
            description: 'High-yield money market account with tiered interest rates and check-writing privileges',
            features: [
                'Tiered interest rates',
                'Check writing privileges',
                'Debit card access',
                'Online bill pay',
                'Monthly statements'
            ],
            eligibilityCriteria: {
                minimumBalance: 25000,
                businessSegments: ['medium', 'large', 'enterprise'],
                riskProfiles: ['low', 'medium']
            },
            pricing: {
                yieldRate: 0.052,
                monthlyFee: 15,
                minimumDeposit: 25000,
                tieredPricing: [
                    { tier: 'Tier 1', minAmount: 25000, rate: 0.052 },
                    { tier: 'Tier 2', minAmount: 100000, rate: 0.055 },
                    { tier: 'Tier 3', minAmount: 500000, rate: 0.058 }
                ]
            },
            benefits: [
                {
                    type: 'yield_improvement',
                    description: 'Higher yields with tiered rate structure',
                    estimatedValue: 650,
                    unit: 'dollars'
                },
                {
                    type: 'cash_management_efficiency',
                    description: 'Combined savings and checking features',
                    estimatedValue: 200,
                    unit: 'dollars'
                }
            ],
            riskLevel: 'low',
            liquidityFeatures: ['Check writing', 'Debit card access', 'Online transfers', 'Bill pay services']
        }
    });

    const treasuryBills = await prisma.treasuryProduct.upsert({
        where: { id: 'prod-9012-treasury-bills' },
        update: {},
        create: {
            id: 'prod-9012-treasury-bills',
            name: 'Treasury Bills Investment',
            category: 'investment',
            description: 'Short-term government securities with guaranteed returns and high liquidity',
            features: [
                'Government-backed security',
                'Predictable returns',
                'Various maturity options',
                'Secondary market liquidity',
                'Tax advantages'
            ],
            eligibilityCriteria: {
                minimumBalance: 100000,
                businessSegments: ['medium', 'large', 'enterprise'],
                riskProfiles: ['low', 'medium'],
                excludedIndustries: ['gambling', 'adult-entertainment']
            },
            pricing: {
                yieldRate: 0.048,
                transactionFee: 25,
                minimumDeposit: 100000
            },
            benefits: [
                {
                    type: 'yield_improvement',
                    description: 'Government-guaranteed returns',
                    estimatedValue: 4800,
                    unit: 'dollars'
                },
                {
                    type: 'tax_efficiency',
                    description: 'Favorable tax treatment',
                    estimatedValue: 500,
                    unit: 'dollars'
                }
            ],
            riskLevel: 'low',
            liquidityFeatures: ['Secondary market trading', 'Various maturity dates', 'Easy liquidation']
        }
    });

    const cd = await prisma.treasuryProduct.upsert({
        where: { id: 'prod-3456-certificate-deposit' },
        update: {},
        create: {
            id: 'prod-3456-certificate-deposit',
            name: 'Business Certificate of Deposit',
            category: 'investment',
            description: 'Fixed-term deposit with guaranteed returns and flexible maturity options',
            features: [
                'Fixed interest rates',
                'FDIC insured',
                'Flexible terms (3-60 months)',
                'Automatic renewal options',
                'Early withdrawal options'
            ],
            eligibilityCriteria: {
                minimumBalance: 50000,
                businessSegments: ['small', 'medium', 'large', 'enterprise'],
                riskProfiles: ['low', 'medium']
            },
            pricing: {
                yieldRate: 0.055,
                monthlyFee: 0,
                minimumDeposit: 50000,
                penaltyRate: 0.002,
                tieredPricing: [
                    { tier: '3-12 months', minAmount: 50000, rate: 0.055 },
                    { tier: '13-24 months', minAmount: 50000, rate: 0.058 },
                    { tier: '25-60 months', minAmount: 50000, rate: 0.062 }
                ]
            },
            benefits: [
                {
                    type: 'yield_improvement',
                    description: 'Higher fixed rates for longer terms',
                    estimatedValue: 2750,
                    unit: 'dollars'
                },
                {
                    type: 'guaranteed_return',
                    description: 'FDIC insured fixed returns',
                    estimatedValue: 0,
                    unit: 'security'
                }
            ],
            riskLevel: 'low',
            liquidityFeatures: ['Early withdrawal available', 'Automatic renewal options', 'Flexible terms']
        }
    });

    const creditFacility = await prisma.treasuryProduct.upsert({
        where: { id: 'prod-7890-credit-facility' },
        update: {},
        create: {
            id: 'prod-7890-credit-facility',
            name: 'Business Line of Credit',
            category: 'credit',
            description: 'Flexible credit facility for working capital and cash flow management',
            features: [
                'Revolving credit line',
                'Interest-only payments',
                'Flexible draw schedule',
                'Competitive rates',
                'Online account management'
            ],
            eligibilityCriteria: {
                minimumBalance: 0,
                businessSegments: ['medium', 'large', 'enterprise'],
                riskProfiles: ['low', 'medium', 'high'],
                excludedIndustries: ['real-estate-speculation', 'cryptocurrency'],
                creditRatingMin: 'BBB'
            },
            pricing: {
                yieldRate: 0.075,
                monthlyFee: 50,
                transactionFee: 10
            },
            benefits: [
                {
                    type: 'cash_flow_management',
                    description: 'Improved cash flow flexibility',
                    estimatedValue: 5000,
                    unit: 'dollars'
                },
                {
                    type: 'opportunity_cost_savings',
                    description: 'Access to funds when needed',
                    estimatedValue: 2000,
                    unit: 'dollars'
                }
            ],
            riskLevel: 'medium',
            liquidityFeatures: ['On-demand access', 'Flexible repayment', 'Online draws']
        }
    });

    console.log(
        '✅ Created sample treasury products:',
        [highYieldSavings.name, moneyMarket.name, treasuryBills.name, cd.name, creditFacility.name].join(', ')
    );

    // Create sample bank connections
    const bankConnection1 = await prisma.bankConnection.upsert({
        where: { id: 'conn-abc123-api' },
        update: {},
        create: {
            id: 'conn-abc123-api',
            clientId: client1.id,
            accountId: account1.id,
            bankName: 'ABC Bank',
            connectionType: ConnectionType.API,
            lastSync: new Date(),
            status: ConnectionStatus.CONNECTED,
            settings: {
                autoSync: true,
                syncFrequency: 'daily',
                includeTransactions: true,
                includeBalance: true
            }
        }
    });

    const bankConnection2 = await prisma.bankConnection.upsert({
        where: { id: 'conn-xyz456-plaid' },
        update: {},
        create: {
            id: 'conn-xyz456-plaid',
            clientId: client2.id,
            accountId: account2.id,
            bankName: 'XYZ Bank',
            connectionType: ConnectionType.PLAID,
            lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
            status: ConnectionStatus.CONNECTED,
            settings: {
                autoSync: true,
                syncFrequency: 'weekly',
                includeTransactions: true,
                includeBalance: true,
                categorization: true
            }
        }
    });

    console.log('✅ Created sample bank connections:', bankConnection1.id, bankConnection2.id);

    // Create sample workflow tasks
    const workflowTask1 = await prisma.workflowTask.upsert({
        where: { id: 'workflow-task-001' },
        update: {},
        create: {
            id: 'workflow-task-001',
            type: WorkflowTaskType.RECOMMENDATION_APPROVAL,
            status: WorkflowTaskStatus.PENDING,
            priority: WorkflowTaskPriority.HIGH,
            clientId: client1.id,
            clientName: client1.name,
            assignedTo: admin.id.toString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            metadata: {
                recommendationId: 'rec-001',
                productType: 'High-Yield Savings',
                estimatedBenefit: 4500,
                confidence: 0.92
            }
        }
    });

    const workflowTask2 = await prisma.workflowTask.upsert({
        where: { id: 'workflow-task-002' },
        update: {},
        create: {
            id: 'workflow-task-002',
            type: WorkflowTaskType.CLIENT_REVIEW,
            status: WorkflowTaskStatus.IN_PROGRESS,
            priority: WorkflowTaskPriority.MEDIUM,
            clientId: client2.id,
            clientName: client2.name,
            assignedTo: rm2.id.toString(),
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            metadata: {
                reviewType: 'annual_review',
                lastReviewDate: '2023-12-01',
                riskProfileUpdate: true
            }
        }
    });

    const workflowTask3 = await prisma.workflowTask.upsert({
        where: { id: 'workflow-task-003' },
        update: {},
        create: {
            id: 'workflow-task-003',
            type: WorkflowTaskType.STATEMENT_REVIEW,
            status: WorkflowTaskStatus.COMPLETED,
            priority: WorkflowTaskPriority.LOW,
            clientId: client1.id,
            clientName: client1.name,
            assignedTo: rm1.id.toString(),
            resolution: 'approved',
            comments: 'Statement processed successfully with no issues',
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            completedBy: rm1.id.toString(),
            metadata: {
                statementPeriod: '2024-01',
                transactionCount: 247,
                dataQualityScore: 95
            }
        }
    });

    console.log('✅ Created sample workflow tasks:', workflowTask1.id, workflowTask2.id, workflowTask3.id);

    // Create sample workflow audit entries
    const auditEntry1 = await prisma.workflowAudit.upsert({
        where: { id: 'audit-001' },
        update: {},
        create: {
            id: 'audit-001',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            activityType: WorkflowActivityType.TASK_CREATED,
            userId: admin.id.toString(),
            userName: admin.name || 'Admin',
            description: 'Created recommendation approval task for ABC Corporation',
            changes: [
                {
                    field: 'status',
                    oldValue: null,
                    newValue: 'PENDING'
                }
            ],
            metadata: {
                taskId: workflowTask1.id,
                taskType: WorkflowTaskType.RECOMMENDATION_APPROVAL,
                priority: WorkflowTaskPriority.HIGH
            },
            clientId: client1.id
        }
    });

    const auditEntry2 = await prisma.workflowAudit.upsert({
        where: { id: 'audit-002' },
        update: {},
        create: {
            id: 'audit-002',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            activityType: WorkflowActivityType.TASK_COMPLETED,
            userId: rm1.id.toString(),
            userName: rm1.name || 'John Smith',
            description: 'Completed statement review task for ABC Corporation',
            changes: [
                {
                    field: 'status',
                    oldValue: 'IN_PROGRESS',
                    newValue: 'COMPLETED'
                },
                {
                    field: 'resolution',
                    oldValue: null,
                    newValue: 'approved'
                }
            ],
            metadata: {
                taskId: workflowTask3.id,
                taskType: WorkflowTaskType.STATEMENT_REVIEW,
                resolution: 'approved',
                dataQualityScore: 95
            },
            clientId: client1.id
        }
    });

    const auditEntry3 = await prisma.workflowAudit.upsert({
        where: { id: 'audit-003' },
        update: {},
        create: {
            id: 'audit-003',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            activityType: WorkflowActivityType.CLIENT_UPDATED,
            userId: rm2.id.toString(),
            userName: rm2.name || 'Sarah Johnson',
            description: 'Updated risk profile for XYZ Manufacturing during client review',
            changes: [
                {
                    field: 'riskProfile',
                    oldValue: 'medium',
                    newValue: 'low'
                }
            ],
            metadata: {
                taskId: workflowTask2.id,
                reviewType: 'annual_review',
                riskProfileChange: true
            },
            clientId: client2.id
        }
    });

    console.log('✅ Created sample workflow audit entries:', auditEntry1.id, auditEntry2.id, auditEntry3.id);

    // Create sample notifications
    const notification1 = await prisma.notification.upsert({
        where: { id: 'notif-001-processing-complete' },
        update: {},
        create: {
            id: 'notif-001-processing-complete',
            type: NotificationType.PROCESSING_COMPLETE,
            title: 'Statement Processing Complete',
            message: 'Processing completed successfully for ABC Corporation statements',
            data: {
                clientId: client1.id,
                clientName: client1.name,
                taskId: 'task-456',
                transactionCount: 247,
                processingTime: '5 minutes'
            },
            read: false,
            userId: admin.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
    });

    const notification2 = await prisma.notification.upsert({
        where: { id: 'notif-002-recommendation-ready' },
        update: {},
        create: {
            id: 'notif-002-recommendation-ready',
            type: NotificationType.RECOMMENDATION_READY,
            title: 'New Recommendation Available',
            message: 'High-priority recommendation generated for XYZ Manufacturing',
            data: {
                clientId: client2.id,
                clientName: client2.name,
                recommendationId: 'rec-789',
                priority: 'HIGH',
                estimatedBenefit: 15000,
                productType: 'Money Market Account'
            },
            read: false,
            userId: rm2.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
    });

    const notification3 = await prisma.notification.upsert({
        where: { id: 'notif-003-workflow-task' },
        update: {},
        create: {
            id: 'notif-003-workflow-task',
            type: NotificationType.WORKFLOW_TASK_ASSIGNED,
            title: 'New Task Assigned',
            message: 'Recommendation approval task has been assigned to you',
            data: {
                taskId: workflowTask1.id,
                taskType: 'RECOMMENDATION_APPROVAL',
                clientId: client1.id,
                clientName: client1.name,
                priority: 'HIGH',
                dueDate: workflowTask1.dueDate?.toISOString()
            },
            read: true,
            userId: admin.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
    });

    const notification4 = await prisma.notification.upsert({
        where: { id: 'notif-004-statement-uploaded' },
        update: {},
        create: {
            id: 'notif-004-statement-uploaded',
            type: NotificationType.STATEMENT_UPLOADED,
            title: 'Statement Uploaded',
            message: 'New bank statement has been uploaded for processing',
            data: {
                clientId: client1.id,
                clientName: client1.name,
                fileName: 'statement_jan_2024.pdf',
                fileSize: 524288,
                uploadDate: new Date().toISOString()
            },
            read: false,
            userId: rm1.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
    });

    const notification5 = await prisma.notification.upsert({
        where: { id: 'notif-005-system-alert' },
        update: {},
        create: {
            id: 'notif-005-system-alert',
            type: NotificationType.SYSTEM_ALERT,
            title: 'System Maintenance Scheduled',
            message: 'Scheduled maintenance window on Sunday 2:00 AM - 4:00 AM EST',
            data: {
                maintenanceType: 'routine_maintenance',
                startTime: '2024-02-04T07:00:00Z',
                endTime: '2024-02-04T09:00:00Z',
                affectedServices: ['processing', 'analytics'],
                impact: 'minimal'
            },
            read: false,
            userId: admin.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
    });

    console.log(
        '✅ Created sample notifications:',
        [notification1.id, notification2.id, notification3.id, notification4.id, notification5.id].join(', ')
    );

    // Create sample system logs
    const systemLog1 = await prisma.systemLog.upsert({
        where: { id: 'log-001-info-startup' },
        update: {},
        create: {
            id: 'log-001-info-startup',
            level: 'info',
            service: 'api',
            message: 'System startup completed successfully',
            metadata: {
                startupTime: '2.5s',
                version: '1.0.0',
                environment: 'development'
            },
            traceId: 'trace-001'
        }
    });

    const systemLog2 = await prisma.systemLog.upsert({
        where: { id: 'log-002-warn-performance' },
        update: {},
        create: {
            id: 'log-002-warn-performance',
            level: 'warn',
            service: 'processing',
            message: 'Processing task took longer than expected',
            metadata: {
                taskId: 'task-456',
                expectedTime: '5m',
                actualTime: '12m',
                clientId: client1.id
            },
            traceId: 'trace-002'
        }
    });

    const systemLog3 = await prisma.systemLog.upsert({
        where: { id: 'log-003-error-database' },
        update: {},
        create: {
            id: 'log-003-error-database',
            level: 'error',
            service: 'database',
            message: 'Connection timeout to database',
            metadata: {
                error: 'ETIMEDOUT',
                retryAttempt: 3,
                connectionPool: 'primary'
            },
            traceId: 'trace-003'
        }
    });

    console.log('✅ Created sample system logs:', [systemLog1.id, systemLog2.id, systemLog3.id].join(', '));

    // Create sample maintenance tasks
    const maintenanceTask1 = await prisma.maintenanceTask.upsert({
        where: { id: 'maint-001-cleanup' },
        update: {},
        create: {
            id: 'maint-001-cleanup',
            operation: 'database_cleanup',
            status: 'completed',
            parameters: {
                olderThan: '30d',
                tables: ['system_logs', 'temp_data']
            },
            startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            endTime: new Date(Date.now() - 55 * 60 * 1000), // 55 minutes ago
            estimatedDuration: 300, // 5 minutes
            results: {
                recordsDeleted: 1500,
                spaceSaved: '750MB',
                tablesOptimized: ['system_logs', 'temp_data']
            }
        }
    });

    const maintenanceTask2 = await prisma.maintenanceTask.upsert({
        where: { id: 'maint-002-cache' },
        update: {},
        create: {
            id: 'maint-002-cache',
            operation: 'cache_clear',
            status: 'pending',
            parameters: {
                cacheType: 'redis',
                pattern: '*'
            },
            estimatedDuration: 30
        }
    });

    console.log('✅ Created sample maintenance tasks:', [maintenanceTask1.id, maintenanceTask2.id].join(', '));

    // Create sample agent tasks
    const agentTask1 = await prisma.agentTask.upsert({
        where: { id: 'agent-task-001' },
        update: {},
        create: {
            id: 'agent-task-001',
            clientId: client1.id,
            agentType: 'recommendation',
            status: AgentTaskStatus.COMPLETED,
            progress: 100,
            results: {
                recommendations: [
                    {
                        type: 'cash_optimization',
                        title: 'High-Yield Savings Opportunity',
                        description: 'Move excess cash to high-yield savings account',
                        estimatedBenefit: 15000,
                        confidence: 0.92,
                        priority: 'high'
                    }
                ],
                insights: [
                    {
                        type: 'pattern_analysis',
                        description: 'Seasonal cash flow patterns detected',
                        impact: 'medium'
                    }
                ],
                confidence: 0.9
            },
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
            logs: [
                'Agent task created for client ABC Corporation',
                'Agent type: recommendation',
                'Starting recommendation agent processing',
                'Processing client data...',
                'Analyzing recommendation patterns...',
                'recommendation agent processing completed successfully'
            ],
            context: {
                transactionData: true,
                riskProfile: 'medium',
                includeForecasting: true
            },
            options: {
                includeForecasting: true
            },
            estimatedDuration: 120
        }
    });

    const agentTask2 = await prisma.agentTask.upsert({
        where: { id: 'agent-task-002' },
        update: {},
        create: {
            id: 'agent-task-002',
            clientId: client2.id,
            agentType: 'analysis',
            status: AgentTaskStatus.RUNNING,
            progress: 65,
            results: undefined,
            startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            endTime: undefined,
            logs: [
                'Agent task created for client XYZ Manufacturing',
                'Agent type: analysis',
                'Starting analysis agent processing',
                'Processing client data...',
                'Analyzing analysis patterns...'
            ],
            context: {
                analysisType: 'comprehensive',
                timeRange: '6months',
                includeRisk: true
            },
            estimatedDuration: 180
        }
    });

    console.log('✅ Created sample agent tasks:', [agentTask1.id, agentTask2.id].join(', '));

    // Create sample agent analyses
    const agentAnalysis1 = await prisma.agentAnalysis.upsert({
        where: { id: 'agent-analysis-001' },
        update: {},
        create: {
            id: 'agent-analysis-001',
            clientId: client1.id,
            fileIds: ['stmt-456', 'stmt-789'],
            analysisType: 'financial_patterns',
            status: AgentTaskStatus.COMPLETED,
            results: {
                filesAnalyzed: 2,
                analysisType: 'financial_patterns',
                insights: [
                    {
                        type: 'cash_flow',
                        description: 'Strong seasonal patterns identified in Q4',
                        confidence: 0.91,
                        impact: 'high'
                    },
                    {
                        type: 'vendor_analysis',
                        description: 'Top 3 vendors represent 60% of expenses',
                        confidence: 0.88,
                        impact: 'medium'
                    }
                ],
                patterns: [
                    {
                        pattern: 'seasonal_spike',
                        category: 'operational_expenses',
                        period: 'Q4',
                        increase: 0.25
                    }
                ],
                anomalies: [],
                recommendations: [
                    'Consider negotiating volume discounts with top vendors',
                    'Plan for seasonal cash requirements'
                ]
            },
            confidence: 0.89,
            processingTime: 180
        }
    });

    const agentAnalysis2 = await prisma.agentAnalysis.upsert({
        where: { id: 'agent-analysis-002' },
        update: {},
        create: {
            id: 'agent-analysis-002',
            clientId: client2.id,
            fileIds: ['stmt-123'],
            analysisType: 'risk_assessment',
            status: AgentTaskStatus.RUNNING,
            results: undefined,
            confidence: undefined,
            processingTime: undefined
        }
    });

    console.log('✅ Created sample agent analyses:', [agentAnalysis1.id, agentAnalysis2.id].join(', '));
}

main()
    .catch(e => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

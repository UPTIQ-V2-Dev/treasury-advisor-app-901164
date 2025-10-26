import { PrismaClient, Role } from '../generated/prisma/index.js';
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
}

main()
    .catch(e => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

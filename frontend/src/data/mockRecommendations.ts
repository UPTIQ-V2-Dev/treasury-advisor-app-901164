import type { TreasuryProduct, Recommendation, RecommendationSummary } from '@/types/recommendations';

export const mockTreasuryProducts: TreasuryProduct[] = [
    {
        id: 'prod-001',
        name: 'Automated Investment Sweep',
        category: 'investment',
        description: 'Automatically sweeps idle funds above a specified threshold into interest-bearing investments',
        features: [
            'Daily sweep monitoring',
            'Customizable threshold settings',
            'Multiple investment options',
            'Real-time reporting'
        ],
        eligibilityCriteria: {
            minimumBalance: 250000,
            accountTypes: ['Business Checking', 'Operating Account']
        },
        pricing: {
            monthlyFee: 50,
            yieldRate: 4.2
        },
        benefits: [
            {
                type: 'yield_improvement',
                description: 'Earn interest on idle cash balances',
                estimatedValue: 2.0,
                unit: 'percentage'
            }
        ],
        riskLevel: 'low',
        liquidityFeatures: ['Same-day access', 'No withdrawal penalties']
    },
    {
        id: 'prod-002',
        name: 'ACH Origination Service',
        category: 'payments',
        description: 'Electronic payment processing for vendor payments and payroll',
        features: ['Batch payment processing', 'Same-day ACH available', 'Payment scheduling', 'Detailed reporting'],
        eligibilityCriteria: {
            minimumTransactionVolume: 50
        },
        pricing: {
            transactionFee: 0.25,
            monthlyFee: 25
        },
        benefits: [
            {
                type: 'cost_reduction',
                description: 'Reduce check processing costs',
                estimatedValue: 3500,
                unit: 'dollars'
            },
            {
                type: 'efficiency_gain',
                description: 'Automate payment processing',
                estimatedValue: 10,
                unit: 'hours'
            }
        ],
        riskLevel: 'low',
        liquidityFeatures: ['Immediate processing confirmation']
    },
    {
        id: 'prod-003',
        name: 'Remote Deposit Capture',
        category: 'collections',
        description: 'Deposit checks electronically from your office location',
        features: ['Mobile and desktop capture', 'Same-day availability', 'Duplicate detection', 'Exception handling'],
        eligibilityCriteria: {
            minimumTransactionVolume: 25
        },
        pricing: {
            monthlyFee: 30,
            transactionFee: 0.15
        },
        benefits: [
            {
                type: 'efficiency_gain',
                description: 'Faster fund availability by 2 days',
                estimatedValue: 2,
                unit: 'hours'
            }
        ],
        riskLevel: 'low',
        liquidityFeatures: ['Accelerated fund availability']
    },
    {
        id: 'prod-004',
        name: 'Controlled Disbursement Account',
        category: 'cash_management',
        description: 'Optimize payment timing and cash flow management',
        features: [
            'Morning funding notification',
            'Precise cash positioning',
            'Check clearing control',
            'Detailed reporting'
        ],
        eligibilityCriteria: {
            minimumBalance: 100000,
            businessSegments: ['medium', 'large', 'enterprise']
        },
        pricing: {
            monthlyFee: 75
        },
        benefits: [
            {
                type: 'efficiency_gain',
                description: 'Improved payment timing control',
                estimatedValue: 15000,
                unit: 'dollars'
            }
        ],
        riskLevel: 'medium',
        liquidityFeatures: ['Same-day funding notifications']
    }
];

export const mockRecommendations: Recommendation[] = [
    {
        id: 'rec-001',
        clientId: 'client-001',
        productId: 'prod-001',
        product: mockTreasuryProducts[0],
        priority: 'high',
        rationale: {
            primaryTrigger: 'Sustained idle balances above $280,000 for 45+ days',
            supportingFactors: [
                'Average daily balance of $342,500 exceeds operational needs',
                'Low volatility (0.24) indicates stable cash position',
                'Minimal interest currently earned on idle funds'
            ],
            dataInsights: [
                '82% of daily balances exceed the recommended threshold',
                'Potential annual yield improvement of $11,200'
            ],
            businessImpact:
                'Implementing sweep account could generate additional $11,200 annually while maintaining operational liquidity',
            riskConsiderations: [
                'Ensure adequate buffer for unexpected cash needs',
                'Monitor sweep thresholds during seasonal fluctuations'
            ]
        },
        estimatedBenefit: {
            yieldIncrease: 2.0,
            annualSavings: 11200,
            confidence: 'high',
            assumptions: ['Current yield rate: 0.1%', 'Proposed yield rate: 4.2%', 'Average swept amount: $280,000']
        },
        implementation: {
            complexity: 'low',
            timeframe: '1-2 weeks',
            prerequisites: ['Account documentation completion', 'Risk tolerance confirmation'],
            nextSteps: ['Schedule account setup meeting', 'Configure sweep thresholds', 'Test sweep functionality'],
            accountSetup: {
                suggestedStructure: 'Primary operating account with sweep to investment account',
                sweepRules: [
                    {
                        sourceAccount: 'Operating Account ****1234',
                        targetAccount: 'Investment Sweep Account',
                        threshold: 250000,
                        frequency: 'daily',
                        sweepAmount: 'excess'
                    }
                ]
            }
        },
        supportingData: [
            {
                transactionId: 'txn-001',
                date: '2024-12-15',
                amount: 125000,
                description: 'Large payroll deposit increasing idle balance',
                relevance: 'Demonstrates recurring cash inflows that remain idle'
            }
        ],
        confidence: 95,
        status: 'pending',
        createdAt: '2024-12-16T10:00:00Z'
    },
    {
        id: 'rec-002',
        clientId: 'client-001',
        productId: 'prod-002',
        product: mockTreasuryProducts[1],
        priority: 'medium',
        rationale: {
            primaryTrigger: '80% of payments processed via manual checks',
            supportingFactors: [
                '18 vendor payments per month averaging $2,500',
                'High check processing costs and delays',
                'Manual reconciliation overhead'
            ],
            dataInsights: [
                'Current check processing cost: ~$2.50 per transaction',
                'ACH processing cost: ~$0.25 per transaction',
                'Potential monthly savings: $40-50'
            ],
            businessImpact: 'Streamline vendor payments while reducing processing costs and improving cash flow timing'
        },
        estimatedBenefit: {
            costReduction: 3500,
            efficiencyGain: '10 hours monthly processing time saved',
            confidence: 'medium',
            assumptions: [
                'Processing 180 payments annually',
                'Current cost per check: $2.50',
                'ACH cost per transaction: $0.25'
            ]
        },
        implementation: {
            complexity: 'medium',
            timeframe: '2-4 weeks',
            prerequisites: [
                'Vendor ACH authorization collection',
                'Payment system integration',
                'Staff training on new processes'
            ],
            nextSteps: [
                'Vendor outreach for ACH authorization',
                'Payment system configuration',
                'Parallel processing trial period'
            ]
        },
        supportingData: [
            {
                transactionId: 'txn-002',
                date: '2024-12-14',
                amount: -15000,
                description: 'Manual check payment to vendor',
                relevance: 'Example of payment that could be automated via ACH'
            }
        ],
        confidence: 80,
        status: 'pending',
        createdAt: '2024-12-16T10:00:00Z'
    },
    {
        id: 'rec-003',
        clientId: 'client-001',
        productId: 'prod-003',
        product: mockTreasuryProducts[2],
        priority: 'medium',
        rationale: {
            primaryTrigger: 'High volume of customer check deposits with weekend delays',
            supportingFactors: [
                '24 customer payments per month via check',
                'Weekend deposits delayed until Monday',
                'Average deposit amount: $11,875'
            ],
            dataInsights: [
                'Weekend deposits represent ~30% of monthly volume',
                'Average delay: 2 business days for weekend deposits'
            ],
            businessImpact: 'Accelerate cash availability and reduce deposit processing overhead'
        },
        estimatedBenefit: {
            efficiencyGain: 'Faster fund availability by 1-2 days',
            confidence: 'medium',
            assumptions: [
                'Current weekend deposit delays',
                '30% of deposits occur on weekends',
                'Remote capture enables same-day availability'
            ]
        },
        implementation: {
            complexity: 'low',
            timeframe: '1-2 weeks',
            prerequisites: [
                'Remote capture equipment setup',
                'Staff training on capture procedures',
                'Security protocols establishment'
            ],
            nextSteps: ['Equipment delivery and installation', 'Staff training sessions', 'Pilot testing period']
        },
        supportingData: [
            {
                transactionId: 'txn-004',
                date: '2024-12-12',
                amount: 75000,
                description: 'Large customer payment via check',
                relevance: 'Example of deposit that would benefit from remote capture'
            }
        ],
        confidence: 75,
        status: 'pending',
        createdAt: '2024-12-16T10:00:00Z'
    }
];

export const mockRecommendationSummary: RecommendationSummary = {
    totalRecommendations: 3,
    highPriorityCount: 1,
    totalEstimatedSavings: 14700,
    categoryCounts: {
        investment: 1,
        payments: 1,
        collections: 1,
        cash_management: 0
    },
    statusCounts: {
        pending: 3,
        approved: 0,
        rejected: 0,
        implemented: 0
    }
};

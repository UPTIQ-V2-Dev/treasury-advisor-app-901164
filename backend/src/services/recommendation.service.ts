import prisma from '../client.ts';
import { Recommendation, RecommendationPriority, TreasuryProduct } from '../generated/prisma/index.js';
import ApiError from '../utils/ApiError.ts';
import httpStatus from 'http-status';

/**
 * Generate AI-driven recommendations for a client
 * @param {string} clientId
 * @returns {Promise<string>} taskId for tracking recommendation generation
 */
const generateRecommendations = async (clientId: string): Promise<string> => {
    // Verify client exists
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
            ClientAccount: true,
            Transaction: {
                take: 100,
                orderBy: { date: 'desc' }
            }
        }
    });

    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    // Create processing task for recommendation generation
    const task = await prisma.processingTask.create({
        data: {
            clientId: clientId,
            type: 'RECOMMENDATION_GENERATION',
            status: 'PENDING',
            steps: {
                steps: [
                    { id: 'analyze_profile', name: 'Analyze Client Profile', status: 'pending' },
                    { id: 'assess_liquidity', name: 'Assess Liquidity Needs', status: 'pending' },
                    { id: 'evaluate_products', name: 'Evaluate Treasury Products', status: 'pending' },
                    { id: 'generate_recommendations', name: 'Generate Recommendations', status: 'pending' },
                    { id: 'calculate_benefits', name: 'Calculate Estimated Benefits', status: 'pending' }
                ]
            }
        }
    });

    // Start async recommendation generation process
    setImmediate(async () => {
        try {
            await processRecommendationGeneration(clientId, task.taskId);
        } catch (error) {
            await prisma.processingTask.update({
                where: { taskId: task.taskId },
                data: {
                    status: 'FAILED',
                    progress: 0,
                    endTime: new Date(),
                    error: { message: (error as Error).message }
                }
            });
        }
    });

    return task.taskId;
};

/**
 * Process recommendation generation (AI simulation)
 */
const processRecommendationGeneration = async (clientId: string, taskId: string): Promise<void> => {
    // Update task status
    await prisma.processingTask.update({
        where: { taskId },
        data: { status: 'RUNNING', progress: 10 }
    });

    // Get client data with analytics
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
            ClientAccount: true,
            Transaction: {
                take: 500,
                orderBy: { date: 'desc' }
            }
        }
    });

    if (!client) {
        throw new Error('Client not found');
    }

    // Simulate AI analysis steps
    const steps = [
        { progress: 20, step: 'analyze_profile' },
        { progress: 40, step: 'assess_liquidity' },
        { progress: 60, step: 'evaluate_products' },
        { progress: 80, step: 'generate_recommendations' },
        { progress: 100, step: 'calculate_benefits' }
    ];

    for (const { progress, step } of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
        await prisma.processingTask.update({
            where: { taskId },
            data: {
                progress,
                currentStep: { id: step, status: 'running' }
            }
        });
    }

    // Get available products
    const products = await prisma.treasuryProduct.findMany();

    // Generate AI-driven recommendations based on client profile
    const recommendations = generateAIRecommendations(client, products);

    // Save recommendations
    for (const rec of recommendations) {
        await prisma.recommendation.create({
            data: {
                clientId,
                productId: rec.productId,
                priority: rec.priority,
                rationale: rec.rationale,
                estimatedBenefit: rec.estimatedBenefit,
                implementation: rec.implementation,
                supportingData: rec.supportingData,
                confidence: rec.confidence,
                status: 'PENDING'
            }
        });
    }

    // Complete task
    await prisma.processingTask.update({
        where: { taskId },
        data: {
            status: 'COMPLETED',
            progress: 100,
            endTime: new Date(),
            results: {
                recommendationsGenerated: recommendations.length,
                highPriorityCount: recommendations.filter(r => r.priority === 'HIGH').length,
                totalEstimatedBenefit: recommendations.reduce(
                    (sum, r) => sum + (r.estimatedBenefit.annualSavings || 0),
                    0
                )
            }
        }
    });
};

/**
 * AI-driven recommendation generation logic
 */
const generateAIRecommendations = (client: any, products: TreasuryProduct[]): any[] => {
    const recommendations = [];

    // Calculate client metrics
    const totalBalance = client.ClientAccount.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
    const avgMonthlyFlow = calculateAverageMonthlyFlow(client.Transaction);
    const liquidityRatio = totalBalance / Math.max(avgMonthlyFlow, 1);

    // Recommendation logic based on client profile

    // 1. High-yield savings for excess liquidity
    if (liquidityRatio > 3 && totalBalance > 100000) {
        const savingsProduct = products.find(p => p.category === 'savings' || p.name.toLowerCase().includes('savings'));
        if (savingsProduct) {
            recommendations.push({
                productId: savingsProduct.id,
                priority: 'HIGH' as RecommendationPriority,
                rationale: {
                    reason: 'Excess liquidity detected',
                    analysis: `Client has ${liquidityRatio.toFixed(1)}x monthly cash flow in liquid assets. Moving excess to high-yield savings can improve returns.`,
                    keyFactors: ['High liquidity ratio', 'Substantial balance', 'Conservative risk profile match']
                },
                estimatedBenefit: {
                    annualSavings: totalBalance * 0.025, // 2.5% yield improvement
                    description: 'Additional annual interest income from high-yield savings',
                    paybackPeriod: 'Immediate'
                },
                implementation: {
                    timeline: '1-2 weeks',
                    steps: ['Open high-yield savings account', 'Transfer excess funds', 'Set up automatic transfers'],
                    requirements: ['Minimum balance verification', 'Account opening documentation']
                },
                supportingData: [
                    { metric: 'Current liquidity ratio', value: liquidityRatio.toFixed(1) },
                    { metric: 'Excess liquidity', value: totalBalance - avgMonthlyFlow * 2 },
                    { metric: 'Current yield', value: '0.1%' },
                    { metric: 'Projected yield', value: '2.6%' }
                ],
                confidence: 0.92
            });
        }
    }

    // 2. Cash management solutions for active accounts
    if (client.Transaction.length > 50 && avgMonthlyFlow > 50000) {
        const cashMgmtProduct = products.find(p => p.category === 'cash_management');
        if (cashMgmtProduct) {
            recommendations.push({
                productId: cashMgmtProduct.id,
                priority: 'MEDIUM' as RecommendationPriority,
                rationale: {
                    reason: 'High transaction volume and cash flow',
                    analysis: `Client processes ${client.Transaction.length} transactions with $${avgMonthlyFlow.toLocaleString()} monthly flow. Automated cash management can optimize idle balances.`,
                    keyFactors: [
                        'High transaction volume',
                        'Significant cash flow',
                        'Operational efficiency opportunity'
                    ]
                },
                estimatedBenefit: {
                    annualSavings: avgMonthlyFlow * 12 * 0.015, // 1.5% on average balances
                    description: 'Savings from automated cash sweep and optimization',
                    paybackPeriod: '2-3 months'
                },
                implementation: {
                    timeline: '3-4 weeks',
                    steps: ['Account analysis', 'Cash management setup', 'Automated sweep configuration'],
                    requirements: ['Current banking relationship review', 'Cash flow pattern analysis']
                },
                supportingData: [
                    { metric: 'Monthly transactions', value: client.Transaction.length },
                    { metric: 'Average monthly flow', value: `$${avgMonthlyFlow.toLocaleString()}` },
                    { metric: 'Idle cash opportunity', value: `$${(totalBalance * 0.3).toLocaleString()}` }
                ],
                confidence: 0.78
            });
        }
    }

    // 3. Investment solutions for conservative growth
    if (client.riskProfile === 'medium' || client.riskProfile === 'low') {
        const investmentProduct = products.find(p => p.category === 'investment' && p.riskLevel === 'low');
        if (investmentProduct && totalBalance > 250000) {
            recommendations.push({
                productId: investmentProduct.id,
                priority: client.riskProfile === 'low' ? 'LOW' : ('MEDIUM' as RecommendationPriority),
                rationale: {
                    reason: 'Conservative investment opportunity',
                    analysis: `Client's risk profile and balance size make them suitable for conservative investment products that can provide better returns than traditional deposits.`,
                    keyFactors: [
                        'Appropriate risk profile',
                        'Sufficient balance for minimums',
                        'Conservative growth objective'
                    ]
                },
                estimatedBenefit: {
                    annualSavings: totalBalance * 0.035, // 3.5% potential return
                    description: 'Additional annual return from conservative investment allocation',
                    paybackPeriod: '6-12 months'
                },
                implementation: {
                    timeline: '4-6 weeks',
                    steps: ['Investment suitability review', 'Product documentation', 'Portfolio setup'],
                    requirements: ['Investment policy review', 'Risk tolerance confirmation', 'Regulatory compliance']
                },
                supportingData: [
                    { metric: 'Risk profile', value: client.riskProfile },
                    { metric: 'Investment balance', value: `$${(totalBalance * 0.6).toLocaleString()}` },
                    { metric: 'Expected annual return', value: '3.5-4.2%' }
                ],
                confidence: 0.65
            });
        }
    }

    // 4. Credit facilities for cash flow optimization
    if (hasSeasonalCashFlow(client.Transaction) && avgMonthlyFlow > 100000) {
        const creditProduct = products.find(p => p.category === 'credit');
        if (creditProduct) {
            recommendations.push({
                productId: creditProduct.id,
                priority: 'MEDIUM' as RecommendationPriority,
                rationale: {
                    reason: 'Seasonal cash flow patterns detected',
                    analysis:
                        'Client shows seasonal cash flow variations. A revolving credit facility could smooth cash management and reduce the need for excess cash reserves.',
                    keyFactors: [
                        'Seasonal cash flow patterns',
                        'Strong credit profile',
                        'Cash optimization opportunity'
                    ]
                },
                estimatedBenefit: {
                    annualSavings: totalBalance * 0.02, // 2% from reduced cash requirements
                    description: 'Savings from reduced cash holdings and optimized working capital',
                    paybackPeriod: '3-6 months'
                },
                implementation: {
                    timeline: '6-8 weeks',
                    steps: ['Credit application', 'Financial review', 'Facility setup'],
                    requirements: ['Credit analysis', 'Financial statements', 'Collateral assessment']
                },
                supportingData: [
                    { metric: 'Cash flow volatility', value: 'High seasonal variation' },
                    { metric: 'Facility utilization estimate', value: '25-40%' },
                    { metric: 'Interest cost vs. opportunity cost', value: 'Net positive' }
                ],
                confidence: 0.71
            });
        }
    }

    return recommendations;
};

/**
 * Helper function to calculate average monthly cash flow
 */
const calculateAverageMonthlyFlow = (transactions: any[]): number => {
    if (transactions.length === 0) return 0;

    const totalFlow = transactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
    const monthsSpan = Math.max(1, transactions.length / 30); // Approximate months
    return totalFlow / monthsSpan;
};

/**
 * Helper function to detect seasonal cash flow patterns
 */
const hasSeasonalCashFlow = (transactions: any[]): boolean => {
    if (transactions.length < 90) return false;

    // Simple seasonal detection - look for significant monthly variations
    const monthlyTotals: { [month: string]: number } = {};

    transactions.forEach(txn => {
        const month = new Date(txn.date).toISOString().substring(0, 7); // YYYY-MM
        monthlyTotals[month] = (monthlyTotals[month] || 0) + Math.abs(txn.amount);
    });

    const values = Object.values(monthlyTotals);
    if (values.length < 3) return false;

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Consider seasonal if standard deviation is > 30% of average
    return stdDev / avg > 0.3;
};

/**
 * Query recommendations for a client
 * @param {string} clientId
 * @param {Object} options - Query options
 * @returns {Promise<Recommendation[]>}
 */
const getRecommendationsByClientId = async (clientId: string): Promise<Recommendation[]> => {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    return prisma.recommendation.findMany({
        where: { clientId },
        include: {
            product: true,
            client: {
                select: {
                    id: true,
                    name: true,
                    businessType: true,
                    riskProfile: true
                }
            }
        },
        orderBy: [
            { priority: 'asc' }, // HIGH first (enum order)
            { createdAt: 'desc' }
        ]
    });
};

/**
 * Get recommendation by ID
 * @param {string} recommendationId
 * @returns {Promise<Recommendation>}
 */
const getRecommendationById = async (recommendationId: string): Promise<Recommendation> => {
    const recommendation = await prisma.recommendation.findUnique({
        where: { id: recommendationId },
        include: {
            product: true,
            client: {
                select: {
                    id: true,
                    name: true,
                    businessType: true,
                    riskProfile: true
                }
            }
        }
    });

    if (!recommendation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Recommendation not found');
    }

    return recommendation;
};

/**
 * Provide feedback on a recommendation
 * @param {string} recommendationId
 * @param {Object} feedbackData
 * @returns {Promise<void>}
 */
const provideFeedback = async (
    recommendationId: string,
    feedbackData: {
        feedback: string;
        reason?: string;
        modifications?: string;
        implementationDate?: string;
    }
): Promise<void> => {
    const recommendation = await prisma.recommendation.findUnique({
        where: { id: recommendationId }
    });

    if (!recommendation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Recommendation not found');
    }

    await prisma.recommendation.update({
        where: { id: recommendationId },
        data: {
            feedback: {
                type: feedbackData.feedback,
                reason: feedbackData.reason,
                modifications: feedbackData.modifications,
                implementationDate: feedbackData.implementationDate,
                providedAt: new Date().toISOString()
            },
            updatedAt: new Date()
        }
    });
};

/**
 * Approve a recommendation
 * @param {string} recommendationId
 * @param {string} reviewerId
 * @param {string} comments
 * @returns {Promise<void>}
 */
const approveRecommendation = async (
    recommendationId: string,
    reviewerId: string,
    comments?: string
): Promise<void> => {
    const recommendation = await prisma.recommendation.findUnique({
        where: { id: recommendationId }
    });

    if (!recommendation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Recommendation not found');
    }

    if (recommendation.status !== 'PENDING') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Only pending recommendations can be approved');
    }

    await prisma.recommendation.update({
        where: { id: recommendationId },
        data: {
            status: 'APPROVED',
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            notes: comments
        }
    });
};

/**
 * Reject a recommendation
 * @param {string} recommendationId
 * @param {string} reviewerId
 * @param {string} reason
 * @returns {Promise<void>}
 */
const rejectRecommendation = async (recommendationId: string, reviewerId: string, reason: string): Promise<void> => {
    const recommendation = await prisma.recommendation.findUnique({
        where: { id: recommendationId }
    });

    if (!recommendation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Recommendation not found');
    }

    if (recommendation.status !== 'PENDING') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Only pending recommendations can be rejected');
    }

    await prisma.recommendation.update({
        where: { id: recommendationId },
        data: {
            status: 'REJECTED',
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            notes: reason
        }
    });
};

/**
 * Get recommendation summary for a client
 * @param {string} clientId
 * @returns {Promise<Object>}
 */
const getRecommendationSummary = async (
    clientId: string
): Promise<{
    totalRecommendations: number;
    highPriorityCount: number;
    totalEstimatedSavings: number;
    categoryCounts: { [key: string]: number };
    statusCounts: { [key: string]: number };
}> => {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    const recommendations = await prisma.recommendation.findMany({
        where: { clientId },
        include: { product: true }
    });

    const totalRecommendations = recommendations.length;
    const highPriorityCount = recommendations.filter(r => r.priority === 'HIGH').length;
    const totalEstimatedSavings = recommendations.reduce((sum, r) => {
        const benefit = r.estimatedBenefit as any;
        return sum + (benefit?.annualSavings || 0);
    }, 0);

    const categoryCounts: { [key: string]: number } = {};
    const statusCounts: { [key: string]: number } = {};

    recommendations.forEach(r => {
        // Category counts
        const category = r.product.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        // Status counts
        const status = r.status.toLowerCase();
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
        totalRecommendations,
        highPriorityCount,
        totalEstimatedSavings,
        categoryCounts,
        statusCounts
    };
};

/**
 * Update recommendation priority
 * @param {string} recommendationId
 * @param {RecommendationPriority} priority
 * @returns {Promise<void>}
 */
const updateRecommendationPriority = async (
    recommendationId: string,
    priority: RecommendationPriority
): Promise<void> => {
    const recommendation = await prisma.recommendation.findUnique({
        where: { id: recommendationId }
    });

    if (!recommendation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Recommendation not found');
    }

    await prisma.recommendation.update({
        where: { id: recommendationId },
        data: { priority }
    });
};

/**
 * Mark recommendation as implemented
 * @param {string} recommendationId
 * @param {string} implementationDate
 * @param {string} notes
 * @returns {Promise<void>}
 */
const implementRecommendation = async (
    recommendationId: string,
    implementationDate: string,
    notes?: string
): Promise<void> => {
    const recommendation = await prisma.recommendation.findUnique({
        where: { id: recommendationId }
    });

    if (!recommendation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Recommendation not found');
    }

    if (recommendation.status !== 'APPROVED') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Only approved recommendations can be marked as implemented');
    }

    await prisma.recommendation.update({
        where: { id: recommendationId },
        data: {
            status: 'IMPLEMENTED',
            implementedAt: new Date(implementationDate),
            notes: notes || recommendation.notes
        }
    });
};

/**
 * Export recommendations data for a client
 * @param {string} clientId
 * @param {string} format
 * @returns {Promise<any>}
 */
const exportRecommendations = async (clientId: string, format: string): Promise<any> => {
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, name: true }
    });

    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    const recommendations = await prisma.recommendation.findMany({
        where: { clientId },
        include: { product: true },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
    });

    const exportData = {
        client: client,
        exportDate: new Date().toISOString(),
        format: format,
        recommendations: recommendations.map(r => ({
            id: r.id,
            product: r.product.name,
            category: r.product.category,
            priority: r.priority,
            status: r.status,
            confidence: r.confidence,
            rationale: r.rationale,
            estimatedBenefit: r.estimatedBenefit,
            implementation: r.implementation,
            createdAt: r.createdAt,
            reviewedAt: r.reviewedAt,
            implementedAt: r.implementedAt,
            notes: r.notes
        }))
    };

    // For now, return the data structure - in production, this would generate PDF/CSV/Excel files
    if (format === 'json') {
        return exportData;
    } else {
        // Return structured data that can be converted to other formats
        return {
            ...exportData,
            summary: await getRecommendationSummary(clientId)
        };
    }
};

/**
 * Get historical recommendations for a client (all recommendations regardless of status)
 * @param {string} clientId
 * @returns {Promise<Recommendation[]>}
 */
const getHistoricalRecommendations = async (clientId: string): Promise<Recommendation[]> => {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
    }

    return prisma.recommendation.findMany({
        where: { clientId },
        include: {
            product: true,
            client: {
                select: {
                    id: true,
                    name: true,
                    businessType: true,
                    riskProfile: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export default {
    generateRecommendations,
    getRecommendationsByClientId,
    getRecommendationById,
    provideFeedback,
    approveRecommendation,
    rejectRecommendation,
    getRecommendationSummary,
    updateRecommendationPriority,
    implementRecommendation,
    exportRecommendations,
    getHistoricalRecommendations
};

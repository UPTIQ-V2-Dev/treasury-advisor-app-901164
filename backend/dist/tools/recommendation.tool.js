import { recommendationService } from "../services/index.js";
import { z } from 'zod';
// Schema definitions
const treasuryProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    description: z.string(),
    features: z.array(z.string()),
    eligibilityCriteria: z.any(),
    pricing: z.any(),
    benefits: z.array(z.any()),
    riskLevel: z.string(),
    liquidityFeatures: z.array(z.string())
});
const clientSummarySchema = z.object({
    id: z.string(),
    name: z.string(),
    businessType: z.string(),
    riskProfile: z.string()
});
const recommendationSchema = z.object({
    id: z.string(),
    clientId: z.string(),
    productId: z.string(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    rationale: z.any(),
    estimatedBenefit: z.any(),
    implementation: z.any(),
    supportingData: z.array(z.any()),
    confidence: z.number(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'IMPLEMENTED']),
    reviewedBy: z.string().nullable(),
    reviewedAt: z.string().nullable(),
    implementedAt: z.string().nullable(),
    notes: z.string().nullable(),
    feedback: z.any().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    product: treasuryProductSchema,
    client: clientSummarySchema
});
const recommendationSummarySchema = z.object({
    totalRecommendations: z.number(),
    highPriorityCount: z.number(),
    totalEstimatedSavings: z.number(),
    categoryCounts: z.record(z.number()),
    statusCounts: z.record(z.number())
});
const getRecommendationsByClientTool = {
    id: 'recommendation_get_by_client',
    name: 'Get Recommendations by Client',
    description: 'Get all recommendations for a specific client',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        recommendations: z.array(recommendationSchema)
    }),
    fn: async (inputs) => {
        const recommendations = await recommendationService.getRecommendationsByClientId(inputs.clientId);
        return { recommendations };
    }
};
const generateRecommendationsTool = {
    id: 'recommendation_generate',
    name: 'Generate AI Recommendations',
    description: 'Generate AI-driven recommendations for a client based on their analytics and profile',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        taskId: z.string()
    }),
    fn: async (inputs) => {
        const taskId = await recommendationService.generateRecommendations(inputs.clientId);
        return { taskId };
    }
};
const getRecommendationByIdTool = {
    id: 'recommendation_get_by_id',
    name: 'Get Recommendation Details',
    description: 'Get detailed information about a specific recommendation',
    inputSchema: z.object({
        recommendationId: z.string().uuid()
    }),
    outputSchema: recommendationSchema,
    fn: async (inputs) => {
        const recommendation = await recommendationService.getRecommendationById(inputs.recommendationId);
        return recommendation;
    }
};
const provideFeedbackTool = {
    id: 'recommendation_provide_feedback',
    name: 'Provide Recommendation Feedback',
    description: 'Submit client feedback on a recommendation',
    inputSchema: z.object({
        recommendationId: z.string().uuid(),
        feedback: z.enum(['accepted', 'rejected', 'needs_modification', 'deferred']),
        reason: z.string().optional(),
        modifications: z.string().optional(),
        implementationDate: z.string().datetime().optional()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        await recommendationService.provideFeedback(inputs.recommendationId, {
            feedback: inputs.feedback,
            reason: inputs.reason,
            modifications: inputs.modifications,
            implementationDate: inputs.implementationDate
        });
        return { success: true };
    }
};
const approveRecommendationTool = {
    id: 'recommendation_approve',
    name: 'Approve Recommendation',
    description: 'Approve a recommendation for implementation',
    inputSchema: z.object({
        recommendationId: z.string().uuid(),
        reviewerId: z.string(),
        comments: z.string().optional()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        await recommendationService.approveRecommendation(inputs.recommendationId, inputs.reviewerId, inputs.comments);
        return { success: true };
    }
};
const rejectRecommendationTool = {
    id: 'recommendation_reject',
    name: 'Reject Recommendation',
    description: 'Reject a recommendation with a specified reason',
    inputSchema: z.object({
        recommendationId: z.string().uuid(),
        reviewerId: z.string(),
        reason: z.string()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        await recommendationService.rejectRecommendation(inputs.recommendationId, inputs.reviewerId, inputs.reason);
        return { success: true };
    }
};
const getRecommendationSummaryTool = {
    id: 'recommendation_get_summary',
    name: 'Get Recommendation Summary',
    description: 'Get summary statistics of recommendations for a client',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: recommendationSummarySchema,
    fn: async (inputs) => {
        const summary = await recommendationService.getRecommendationSummary(inputs.clientId);
        return summary;
    }
};
const updateRecommendationPriorityTool = {
    id: 'recommendation_update_priority',
    name: 'Update Recommendation Priority',
    description: 'Update the priority level of a recommendation',
    inputSchema: z.object({
        recommendationId: z.string().uuid(),
        priority: z.enum(['HIGH', 'MEDIUM', 'LOW'])
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        await recommendationService.updateRecommendationPriority(inputs.recommendationId, inputs.priority);
        return { success: true };
    }
};
const implementRecommendationTool = {
    id: 'recommendation_implement',
    name: 'Mark Recommendation as Implemented',
    description: 'Mark an approved recommendation as implemented',
    inputSchema: z.object({
        recommendationId: z.string().uuid(),
        implementationDate: z.string().datetime(),
        notes: z.string().optional()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        await recommendationService.implementRecommendation(inputs.recommendationId, inputs.implementationDate, inputs.notes);
        return { success: true };
    }
};
const exportRecommendationsTool = {
    id: 'recommendation_export',
    name: 'Export Recommendations',
    description: 'Export recommendation report for a client in specified format',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        format: z.enum(['pdf', 'csv', 'excel', 'json'])
    }),
    outputSchema: z.object({
        exportData: z.any()
    }),
    fn: async (inputs) => {
        const exportData = await recommendationService.exportRecommendations(inputs.clientId, inputs.format);
        return { exportData };
    }
};
const getHistoricalRecommendationsTool = {
    id: 'recommendation_get_history',
    name: 'Get Historical Recommendations',
    description: 'Get all historical recommendations for a client regardless of status',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        recommendations: z.array(recommendationSchema)
    }),
    fn: async (inputs) => {
        const recommendations = await recommendationService.getHistoricalRecommendations(inputs.clientId);
        return { recommendations };
    }
};
const analyzeRecommendationOpportunityTool = {
    id: 'recommendation_analyze_opportunity',
    name: 'Analyze Recommendation Opportunity',
    description: 'Analyze potential recommendation opportunities for a client without generating formal recommendations',
    inputSchema: z.object({
        clientId: z.string().uuid()
    }),
    outputSchema: z.object({
        opportunities: z.array(z.object({
            category: z.string(),
            opportunity: z.string(),
            priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
            estimatedImpact: z.string(),
            requirements: z.array(z.string())
        }))
    }),
    fn: () => {
        // This would be a lighter analysis tool that doesn't create formal recommendations
        // For now, we'll return mock analysis data
        const opportunities = [
            {
                category: 'cash_management',
                opportunity: 'Automated cash sweep optimization',
                priority: 'HIGH',
                estimatedImpact: 'High - potential for significant yield improvement',
                requirements: ['Account analysis', 'Cash flow patterns', 'Risk tolerance assessment']
            },
            {
                category: 'investment',
                opportunity: 'Conservative investment allocation',
                priority: 'MEDIUM',
                estimatedImpact: 'Medium - moderate yield enhancement with controlled risk',
                requirements: ['Investment policy review', 'Regulatory compliance', 'Portfolio allocation']
            }
        ];
        return { opportunities };
    }
};
const getRecommendationMetricsTool = {
    id: 'recommendation_get_metrics',
    name: 'Get Recommendation Metrics',
    description: 'Get comprehensive metrics and analytics about recommendations for a client',
    inputSchema: z.object({
        clientId: z.string().uuid(),
        includeImplementedSavings: z.boolean().optional()
    }),
    outputSchema: z.object({
        metrics: z.object({
            totalRecommendations: z.number(),
            pendingCount: z.number(),
            approvedCount: z.number(),
            implementedCount: z.number(),
            rejectedCount: z.number(),
            averageConfidence: z.number(),
            totalPotentialSavings: z.number(),
            realizedSavings: z.number(),
            implementationRate: z.number(),
            averageDaysToApproval: z.number().optional(),
            averageDaysToImplementation: z.number().optional(),
            topCategories: z.array(z.object({
                category: z.string(),
                count: z.number(),
                totalSavings: z.number()
            }))
        })
    }),
    fn: async (inputs) => {
        // Get historical recommendations
        const recommendations = await recommendationService.getHistoricalRecommendations(inputs.clientId);
        // Calculate additional metrics
        const totalRecommendations = recommendations.length;
        const pendingCount = recommendations.filter(r => r.status === 'PENDING').length;
        const approvedCount = recommendations.filter(r => r.status === 'APPROVED').length;
        const implementedCount = recommendations.filter(r => r.status === 'IMPLEMENTED').length;
        const rejectedCount = recommendations.filter(r => r.status === 'REJECTED').length;
        const averageConfidence = totalRecommendations > 0
            ? recommendations.reduce((sum, r) => sum + r.confidence, 0) / totalRecommendations
            : 0;
        const totalPotentialSavings = recommendations.reduce((sum, r) => {
            const benefit = r.estimatedBenefit;
            return sum + (benefit?.annualSavings || 0);
        }, 0);
        const realizedSavings = recommendations
            .filter(r => r.status === 'IMPLEMENTED')
            .reduce((sum, r) => {
            const benefit = r.estimatedBenefit;
            return sum + (benefit?.annualSavings || 0);
        }, 0);
        const implementationRate = totalRecommendations > 0 ? implementedCount / totalRecommendations : 0;
        // Calculate top categories
        const categoryData = {};
        recommendations.forEach(r => {
            const category = r.product?.category || 'unknown';
            const benefit = r.estimatedBenefit;
            const savings = benefit?.annualSavings || 0;
            if (!categoryData[category]) {
                categoryData[category] = { count: 0, totalSavings: 0 };
            }
            categoryData[category].count++;
            categoryData[category].totalSavings += savings;
        });
        const topCategories = Object.entries(categoryData)
            .map(([category, data]) => ({
            category,
            count: data.count,
            totalSavings: data.totalSavings
        }))
            .sort((a, b) => b.totalSavings - a.totalSavings)
            .slice(0, 5);
        return {
            metrics: {
                totalRecommendations,
                pendingCount,
                approvedCount,
                implementedCount,
                rejectedCount,
                averageConfidence: Math.round(averageConfidence * 100) / 100,
                totalPotentialSavings,
                realizedSavings,
                implementationRate: Math.round(implementationRate * 100) / 100,
                topCategories
            }
        };
    }
};
export const recommendationTools = [
    getRecommendationsByClientTool,
    generateRecommendationsTool,
    getRecommendationByIdTool,
    provideFeedbackTool,
    approveRecommendationTool,
    rejectRecommendationTool,
    getRecommendationSummaryTool,
    updateRecommendationPriorityTool,
    implementRecommendationTool,
    exportRecommendationsTool,
    getHistoricalRecommendationsTool,
    analyzeRecommendationOpportunityTool,
    getRecommendationMetricsTool
];

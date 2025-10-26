import Joi from 'joi';
const createTreasuryProduct = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        category: Joi.string()
            .required()
            .valid('investment', 'cash_management', 'credit', 'liquidity', 'yield_enhancement'),
        description: Joi.string().required(),
        features: Joi.array().items(Joi.string()).required(),
        eligibilityCriteria: Joi.object()
            .keys({
            minimumBalance: Joi.number().min(0).optional(),
            businessSegments: Joi.array()
                .items(Joi.string().valid('small', 'medium', 'large', 'enterprise'))
                .optional(),
            riskProfiles: Joi.array()
                .items(Joi.string().valid('low', 'medium', 'high'))
                .optional(),
            excludedIndustries: Joi.array().items(Joi.string()).optional(),
            creditRatingMin: Joi.string().optional(),
            geographicRestrictions: Joi.array().items(Joi.string()).optional()
        })
            .required(),
        pricing: Joi.object()
            .keys({
            yieldRate: Joi.number().min(0).max(1).optional(),
            monthlyFee: Joi.number().min(0).optional(),
            transactionFee: Joi.number().min(0).optional(),
            minimumDeposit: Joi.number().min(0).optional(),
            penaltyRate: Joi.number().min(0).optional(),
            tieredPricing: Joi.array()
                .items(Joi.object().keys({
                tier: Joi.string().required(),
                minAmount: Joi.number().required(),
                rate: Joi.number().required()
            }))
                .optional()
        })
            .required(),
        benefits: Joi.array()
            .items(Joi.object().keys({
            type: Joi.string().required(),
            description: Joi.string().required(),
            estimatedValue: Joi.number().optional(),
            unit: Joi.string().optional()
        }))
            .required(),
        riskLevel: Joi.string().required().valid('low', 'medium', 'high'),
        liquidityFeatures: Joi.array().items(Joi.string()).required()
    })
};
const getTreasuryProducts = {
    query: Joi.object().keys({
        category: Joi.string().valid('investment', 'cash_management', 'credit', 'liquidity', 'yield_enhancement'),
        riskLevel: Joi.string().valid('low', 'medium', 'high'),
        name: Joi.string(),
        sortBy: Joi.string(),
        sortType: Joi.string().valid('asc', 'desc'),
        limit: Joi.number().integer().min(1).max(100),
        page: Joi.number().integer().min(1)
    })
};
const getTreasuryProduct = {
    params: Joi.object().keys({
        productId: Joi.string().uuid().required()
    })
};
const updateTreasuryProduct = {
    params: Joi.object().keys({
        productId: Joi.string().uuid().required()
    }),
    body: Joi.object()
        .keys({
        name: Joi.string(),
        category: Joi.string().valid('investment', 'cash_management', 'credit', 'liquidity', 'yield_enhancement'),
        description: Joi.string(),
        features: Joi.array().items(Joi.string()),
        eligibilityCriteria: Joi.object().keys({
            minimumBalance: Joi.number().min(0).optional(),
            businessSegments: Joi.array()
                .items(Joi.string().valid('small', 'medium', 'large', 'enterprise'))
                .optional(),
            riskProfiles: Joi.array()
                .items(Joi.string().valid('low', 'medium', 'high'))
                .optional(),
            excludedIndustries: Joi.array().items(Joi.string()).optional(),
            creditRatingMin: Joi.string().optional(),
            geographicRestrictions: Joi.array().items(Joi.string()).optional()
        }),
        pricing: Joi.object().keys({
            yieldRate: Joi.number().min(0).max(1).optional(),
            monthlyFee: Joi.number().min(0).optional(),
            transactionFee: Joi.number().min(0).optional(),
            minimumDeposit: Joi.number().min(0).optional(),
            penaltyRate: Joi.number().min(0).optional(),
            tieredPricing: Joi.array()
                .items(Joi.object().keys({
                tier: Joi.string().required(),
                minAmount: Joi.number().required(),
                rate: Joi.number().required()
            }))
                .optional()
        }),
        benefits: Joi.array().items(Joi.object().keys({
            type: Joi.string().required(),
            description: Joi.string().required(),
            estimatedValue: Joi.number().optional(),
            unit: Joi.string().optional()
        })),
        riskLevel: Joi.string().valid('low', 'medium', 'high'),
        liquidityFeatures: Joi.array().items(Joi.string())
    })
        .min(1)
};
const deleteTreasuryProduct = {
    params: Joi.object().keys({
        productId: Joi.string().uuid().required()
    })
};
const getProductsByCategory = {
    params: Joi.object().keys({
        category: Joi.string()
            .required()
            .valid('investment', 'cash_management', 'credit', 'liquidity', 'yield_enhancement')
    })
};
const getProductsByRiskLevel = {
    params: Joi.object().keys({
        riskLevel: Joi.string().required().valid('low', 'medium', 'high')
    })
};
const checkEligibility = {
    params: Joi.object().keys({
        productId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
        clientId: Joi.string().uuid().optional(),
        businessSegment: Joi.string().required().valid('small', 'medium', 'large', 'enterprise'),
        riskProfile: Joi.string().required().valid('low', 'medium', 'high'),
        totalBalance: Joi.number().min(0).optional(),
        industry: Joi.string().optional()
    })
};
const calculateBenefits = {
    params: Joi.object().keys({
        productId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
        clientId: Joi.string().uuid().optional(),
        currentBalance: Joi.number().required().min(0),
        currentYieldRate: Joi.number().min(0).max(1).optional(),
        transactionVolume: Joi.number().min(0).optional()
    })
};
export default {
    createTreasuryProduct,
    getTreasuryProducts,
    getTreasuryProduct,
    updateTreasuryProduct,
    deleteTreasuryProduct,
    getProductsByCategory,
    getProductsByRiskLevel,
    checkEligibility,
    calculateBenefits
};

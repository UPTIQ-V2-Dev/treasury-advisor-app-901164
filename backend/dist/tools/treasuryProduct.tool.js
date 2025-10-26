import { treasuryProductService } from "../services/index.js";
import pick from "../utils/pick.js";
import { z } from 'zod';
// Schema definitions
const eligibilityCriteriaSchema = z.object({
    minimumBalance: z.number().optional(),
    businessSegments: z.array(z.string()).optional(),
    riskProfiles: z.array(z.string()).optional(),
    excludedIndustries: z.array(z.string()).optional(),
    creditRatingMin: z.string().optional(),
    geographicRestrictions: z.array(z.string()).optional()
});
const pricingSchema = z.object({
    yieldRate: z.number().optional(),
    monthlyFee: z.number().optional(),
    transactionFee: z.number().optional(),
    minimumDeposit: z.number().optional(),
    penaltyRate: z.number().optional(),
    tieredPricing: z
        .array(z.object({
        tier: z.string(),
        minAmount: z.number(),
        rate: z.number()
    }))
        .optional()
});
const benefitSchema = z.object({
    type: z.string(),
    description: z.string(),
    estimatedValue: z.number().optional(),
    unit: z.string().optional()
});
const treasuryProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    description: z.string(),
    features: z.array(z.string()),
    eligibilityCriteria: eligibilityCriteriaSchema,
    pricing: pricingSchema,
    benefits: z.array(benefitSchema),
    riskLevel: z.string(),
    liquidityFeatures: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string()
});
const createTreasuryProductTool = {
    id: 'treasury_product_create',
    name: 'Create Treasury Product',
    description: 'Create a new treasury product in the catalog',
    inputSchema: z.object({
        name: z.string(),
        category: z.enum(['investment', 'cash_management', 'credit', 'liquidity', 'yield_enhancement']),
        description: z.string(),
        features: z.array(z.string()),
        eligibilityCriteria: eligibilityCriteriaSchema,
        pricing: pricingSchema,
        benefits: z.array(benefitSchema),
        riskLevel: z.enum(['low', 'medium', 'high']),
        liquidityFeatures: z.array(z.string())
    }),
    outputSchema: treasuryProductSchema,
    fn: async (inputs) => {
        const product = await treasuryProductService.createTreasuryProduct(inputs);
        return product;
    }
};
const getProductCatalogTool = {
    id: 'treasury_product_get_catalog',
    name: 'Get Treasury Product Catalog',
    description: 'Get all available treasury products in the catalog',
    inputSchema: z.object({}),
    outputSchema: z.object({
        products: z.array(treasuryProductSchema)
    }),
    fn: async () => {
        const products = await treasuryProductService.getProductCatalog();
        return { products };
    }
};
const getTreasuryProductTool = {
    id: 'treasury_product_get_by_id',
    name: 'Get Treasury Product By ID',
    description: 'Get detailed information about a specific treasury product',
    inputSchema: z.object({
        productId: z.string().uuid()
    }),
    outputSchema: treasuryProductSchema,
    fn: async (inputs) => {
        const product = await treasuryProductService.getTreasuryProductById(inputs.productId);
        if (!product) {
            throw new Error('Treasury product not found');
        }
        return product;
    }
};
const getTreasuryProductsTool = {
    id: 'treasury_product_get_all',
    name: 'Get Treasury Products',
    description: 'Get treasury products with optional filters and pagination',
    inputSchema: z.object({
        category: z.enum(['investment', 'cash_management', 'credit', 'liquidity', 'yield_enhancement']).optional(),
        riskLevel: z.enum(['low', 'medium', 'high']).optional(),
        name: z.string().optional(),
        sortBy: z.string().optional(),
        sortType: z.enum(['asc', 'desc']).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
    }),
    outputSchema: z.object({
        products: z.array(treasuryProductSchema)
    }),
    fn: async (inputs) => {
        const filter = pick(inputs, ['category', 'riskLevel', 'name']);
        const options = pick(inputs, ['sortBy', 'sortType', 'limit', 'page']);
        const products = await treasuryProductService.queryTreasuryProducts(filter, options);
        return { products };
    }
};
const updateTreasuryProductTool = {
    id: 'treasury_product_update',
    name: 'Update Treasury Product',
    description: 'Update treasury product information by ID',
    inputSchema: z.object({
        productId: z.string().uuid(),
        name: z.string().optional(),
        category: z.enum(['investment', 'cash_management', 'credit', 'liquidity', 'yield_enhancement']).optional(),
        description: z.string().optional(),
        features: z.array(z.string()).optional(),
        eligibilityCriteria: eligibilityCriteriaSchema.optional(),
        pricing: pricingSchema.optional(),
        benefits: z.array(benefitSchema).optional(),
        riskLevel: z.enum(['low', 'medium', 'high']).optional(),
        liquidityFeatures: z.array(z.string()).optional()
    }),
    outputSchema: treasuryProductSchema,
    fn: async (inputs) => {
        const updateBody = pick(inputs, [
            'name',
            'category',
            'description',
            'features',
            'eligibilityCriteria',
            'pricing',
            'benefits',
            'riskLevel',
            'liquidityFeatures'
        ]);
        const product = await treasuryProductService.updateTreasuryProductById(inputs.productId, updateBody);
        return product;
    }
};
const deleteTreasuryProductTool = {
    id: 'treasury_product_delete',
    name: 'Delete Treasury Product',
    description: 'Delete a treasury product by its ID',
    inputSchema: z.object({
        productId: z.string().uuid()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        await treasuryProductService.deleteTreasuryProductById(inputs.productId);
        return { success: true };
    }
};
const getProductsByCategoryTool = {
    id: 'treasury_product_get_by_category',
    name: 'Get Products By Category',
    description: 'Get treasury products filtered by category',
    inputSchema: z.object({
        category: z.enum(['investment', 'cash_management', 'credit', 'liquidity', 'yield_enhancement'])
    }),
    outputSchema: z.object({
        products: z.array(treasuryProductSchema)
    }),
    fn: async (inputs) => {
        const products = await treasuryProductService.getProductsByCategory(inputs.category);
        return { products };
    }
};
const getProductsByRiskLevelTool = {
    id: 'treasury_product_get_by_risk_level',
    name: 'Get Products By Risk Level',
    description: 'Get treasury products filtered by risk level',
    inputSchema: z.object({
        riskLevel: z.enum(['low', 'medium', 'high'])
    }),
    outputSchema: z.object({
        products: z.array(treasuryProductSchema)
    }),
    fn: async (inputs) => {
        const products = await treasuryProductService.getProductsByRiskLevel(inputs.riskLevel);
        return { products };
    }
};
const checkProductEligibilityTool = {
    id: 'treasury_product_check_eligibility',
    name: 'Check Product Eligibility',
    description: 'Check if a client meets the eligibility criteria for a treasury product',
    inputSchema: z.object({
        productId: z.string().uuid(),
        businessSegment: z.enum(['small', 'medium', 'large', 'enterprise']),
        riskProfile: z.enum(['low', 'medium', 'high']),
        totalBalance: z.number().min(0).optional(),
        industry: z.string().optional()
    }),
    outputSchema: z.object({
        eligible: z.boolean(),
        reasons: z.array(z.string())
    }),
    fn: async (inputs) => {
        const clientData = pick(inputs, ['businessSegment', 'riskProfile', 'totalBalance', 'industry']);
        const result = await treasuryProductService.checkProductEligibility(inputs.productId, clientData);
        return result;
    }
};
const calculateEstimatedBenefitsTool = {
    id: 'treasury_product_calculate_benefits',
    name: 'Calculate Estimated Benefits',
    description: 'Calculate estimated benefits and savings for a client based on a treasury product',
    inputSchema: z.object({
        productId: z.string().uuid(),
        currentBalance: z.number().min(0),
        currentYieldRate: z.number().min(0).max(1).optional(),
        transactionVolume: z.number().min(0).optional()
    }),
    outputSchema: z.object({
        annualSavings: z.number(),
        yieldImprovement: z.number(),
        feeReduction: z.number(),
        liquidityBenefits: z.array(z.string()),
        breakdown: z.array(z.object({
            type: z.string(),
            description: z.string(),
            value: z.number()
        }))
    }),
    fn: async (inputs) => {
        const clientData = pick(inputs, ['currentBalance', 'currentYieldRate', 'transactionVolume']);
        const benefits = await treasuryProductService.calculateEstimatedBenefits(inputs.productId, clientData);
        return benefits;
    }
};
export const treasuryProductTools = [
    createTreasuryProductTool,
    getProductCatalogTool,
    getTreasuryProductTool,
    getTreasuryProductsTool,
    updateTreasuryProductTool,
    deleteTreasuryProductTool,
    getProductsByCategoryTool,
    getProductsByRiskLevelTool,
    checkProductEligibilityTool,
    calculateEstimatedBenefitsTool
];

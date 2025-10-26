import prisma from "../client.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from 'http-status';
/**
 * Create a treasury product
 * @param {Object} productData
 * @returns {Promise<TreasuryProduct>}
 */
const createTreasuryProduct = async (productData) => {
    return await prisma.treasuryProduct.create({
        data: productData
    });
};
/**
 * Query for treasury products
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @returns {Promise<TreasuryProduct[]>}
 */
const queryTreasuryProducts = async (filter, options, keys = [
    'id',
    'name',
    'category',
    'description',
    'features',
    'eligibilityCriteria',
    'pricing',
    'benefits',
    'riskLevel',
    'liquidityFeatures',
    'createdAt',
    'updatedAt'
]) => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy;
    const sortType = options.sortType ?? 'desc';
    const products = await prisma.treasuryProduct.findMany({
        where: filter,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortType } : { createdAt: 'desc' }
    });
    return products;
};
/**
 * Get all treasury products (catalog)
 * @returns {Promise<TreasuryProduct[]>}
 */
const getProductCatalog = async () => {
    return await prisma.treasuryProduct.findMany({
        orderBy: {
            category: 'asc'
        }
    });
};
/**
 * Get treasury product by id
 * @param {string} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<TreasuryProduct, Key> | null>}
 */
const getTreasuryProductById = async (id, keys = [
    'id',
    'name',
    'category',
    'description',
    'features',
    'eligibilityCriteria',
    'pricing',
    'benefits',
    'riskLevel',
    'liquidityFeatures',
    'createdAt',
    'updatedAt'
]) => {
    return (await prisma.treasuryProduct.findUnique({
        where: { id },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }));
};
/**
 * Update treasury product by id
 * @param {string} productId
 * @param {Object} updateBody
 * @returns {Promise<TreasuryProduct>}
 */
const updateTreasuryProductById = async (productId, updateBody, keys = ['id', 'name', 'category', 'description']) => {
    const product = await getTreasuryProductById(productId, ['id']);
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Treasury product not found');
    }
    const updatedProduct = await prisma.treasuryProduct.update({
        where: { id: productId },
        data: updateBody,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    });
    return updatedProduct;
};
/**
 * Delete treasury product by id
 * @param {string} productId
 * @returns {Promise<TreasuryProduct>}
 */
const deleteTreasuryProductById = async (productId) => {
    const product = await getTreasuryProductById(productId);
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Treasury product not found');
    }
    await prisma.treasuryProduct.delete({
        where: { id: productId }
    });
    return product;
};
/**
 * Get products by category
 * @param {string} category
 * @returns {Promise<TreasuryProduct[]>}
 */
const getProductsByCategory = async (category) => {
    return await prisma.treasuryProduct.findMany({
        where: { category },
        orderBy: { name: 'asc' }
    });
};
/**
 * Get products by risk level
 * @param {string} riskLevel
 * @returns {Promise<TreasuryProduct[]>}
 */
const getProductsByRiskLevel = async (riskLevel) => {
    return await prisma.treasuryProduct.findMany({
        where: { riskLevel },
        orderBy: { name: 'asc' }
    });
};
/**
 * Check product eligibility for a client
 * @param {string} productId
 * @param {Object} clientData
 * @returns {Promise<{eligible: boolean, reasons: string[]}>}
 */
const checkProductEligibility = async (productId, clientData) => {
    const product = await getTreasuryProductById(productId);
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Treasury product not found');
    }
    const eligibilityCriteria = product.eligibilityCriteria;
    const reasons = [];
    let eligible = true;
    // Check minimum balance requirement
    if (eligibilityCriteria.minimumBalance && clientData.totalBalance) {
        if (clientData.totalBalance < eligibilityCriteria.minimumBalance) {
            eligible = false;
            reasons.push(`Minimum balance requirement not met (required: $${eligibilityCriteria.minimumBalance})`);
        }
    }
    // Check business segment requirement
    if (eligibilityCriteria.businessSegments && eligibilityCriteria.businessSegments.length > 0) {
        if (!eligibilityCriteria.businessSegments.includes(clientData.businessSegment)) {
            eligible = false;
            reasons.push(`Business segment not eligible (required: ${eligibilityCriteria.businessSegments.join(', ')})`);
        }
    }
    // Check risk profile compatibility
    if (eligibilityCriteria.riskProfiles && eligibilityCriteria.riskProfiles.length > 0) {
        if (!eligibilityCriteria.riskProfiles.includes(clientData.riskProfile)) {
            eligible = false;
            reasons.push(`Risk profile not compatible (required: ${eligibilityCriteria.riskProfiles.join(', ')})`);
        }
    }
    // Check industry restrictions
    if (eligibilityCriteria.excludedIndustries && clientData.industry) {
        if (eligibilityCriteria.excludedIndustries.includes(clientData.industry)) {
            eligible = false;
            reasons.push(`Industry not eligible for this product`);
        }
    }
    return { eligible, reasons };
};
/**
 * Calculate estimated benefits for a client
 * @param {string} productId
 * @param {Object} clientData
 * @returns {Promise<any>}
 */
const calculateEstimatedBenefits = async (productId, clientData) => {
    const product = await getTreasuryProductById(productId);
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Treasury product not found');
    }
    const pricing = product.pricing;
    const benefits = product.benefits;
    const estimatedBenefits = {
        annualSavings: 0,
        yieldImprovement: 0,
        feeReduction: 0,
        liquidityBenefits: product.liquidityFeatures || [],
        breakdown: []
    };
    // Calculate yield improvement
    if (pricing.yieldRate && clientData.currentYieldRate !== undefined) {
        const yieldDifference = pricing.yieldRate - clientData.currentYieldRate;
        if (yieldDifference > 0) {
            estimatedBenefits.yieldImprovement = clientData.currentBalance * yieldDifference;
            estimatedBenefits.annualSavings += estimatedBenefits.yieldImprovement;
            estimatedBenefits.breakdown.push({
                type: 'yield_improvement',
                description: `${(yieldDifference * 100).toFixed(2)}% yield improvement`,
                value: estimatedBenefits.yieldImprovement
            });
        }
    }
    // Calculate fee reduction
    if (pricing.monthlyFee !== undefined && clientData.transactionVolume) {
        const currentFees = clientData.transactionVolume * 0.25; // Assumed current fee
        const newFees = pricing.monthlyFee * 12;
        if (currentFees > newFees) {
            estimatedBenefits.feeReduction = currentFees - newFees;
            estimatedBenefits.annualSavings += estimatedBenefits.feeReduction;
            estimatedBenefits.breakdown.push({
                type: 'fee_reduction',
                description: 'Reduced transaction and maintenance fees',
                value: estimatedBenefits.feeReduction
            });
        }
    }
    // Add other benefits from product definition
    benefits.forEach(benefit => {
        if (benefit.type === 'cash_management_efficiency') {
            estimatedBenefits.breakdown.push({
                type: benefit.type,
                description: benefit.description,
                value: benefit.estimatedValue || 0
            });
        }
    });
    return estimatedBenefits;
};
export default {
    createTreasuryProduct,
    queryTreasuryProducts,
    getProductCatalog,
    getTreasuryProductById,
    updateTreasuryProductById,
    deleteTreasuryProductById,
    getProductsByCategory,
    getProductsByRiskLevel,
    checkProductEligibility,
    calculateEstimatedBenefits
};

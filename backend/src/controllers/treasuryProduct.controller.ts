import { treasuryProductService } from '../services/index.ts';
import ApiError from '../utils/ApiError.ts';
import catchAsync from '../utils/catchAsync.ts';
import pick from '../utils/pick.ts';
import httpStatus from 'http-status';

const createTreasuryProduct = catchAsync(async (req, res) => {
    const product = await treasuryProductService.createTreasuryProduct(req.body);
    res.status(httpStatus.CREATED).send(product);
});

const getTreasuryProducts = catchAsync(async (req, res) => {
    const filter = pick(req.validatedQuery, ['category', 'riskLevel', 'name']);
    const options = pick(req.validatedQuery, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await treasuryProductService.queryTreasuryProducts(filter, options);
    res.send(result);
});

const getTreasuryProduct = catchAsync(async (req, res) => {
    const product = await treasuryProductService.getTreasuryProductById(req.params.productId);
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Treasury product not found');
    }
    res.send(product);
});

const getProductCatalog = catchAsync(async (req, res) => {
    const products = await treasuryProductService.getProductCatalog();
    res.send(products);
});

const updateTreasuryProduct = catchAsync(async (req, res) => {
    const product = await treasuryProductService.updateTreasuryProductById(req.params.productId, req.body);
    res.send(product);
});

const deleteTreasuryProduct = catchAsync(async (req, res) => {
    await treasuryProductService.deleteTreasuryProductById(req.params.productId);
    res.status(httpStatus.NO_CONTENT).send();
});

const getProductsByCategory = catchAsync(async (req, res) => {
    const products = await treasuryProductService.getProductsByCategory(req.params.category);
    res.send(products);
});

const getProductsByRiskLevel = catchAsync(async (req, res) => {
    const products = await treasuryProductService.getProductsByRiskLevel(req.params.riskLevel);
    res.send(products);
});

const checkProductEligibility = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const clientData = pick(req.body, ['businessSegment', 'riskProfile', 'totalBalance', 'industry']) as {
        businessSegment: string;
        riskProfile: string;
        totalBalance?: number;
        industry?: string;
    };

    const eligibilityResult = await treasuryProductService.checkProductEligibility(productId, clientData);
    res.send(eligibilityResult);
});

const calculateEstimatedBenefits = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const clientData = pick(req.body, ['currentBalance', 'currentYieldRate', 'transactionVolume']) as {
        currentBalance: number;
        currentYieldRate?: number;
        transactionVolume?: number;
    };

    const benefits = await treasuryProductService.calculateEstimatedBenefits(productId, clientData);
    res.send(benefits);
});

export default {
    createTreasuryProduct,
    getTreasuryProducts,
    getTreasuryProduct,
    getProductCatalog,
    updateTreasuryProduct,
    deleteTreasuryProduct,
    getProductsByCategory,
    getProductsByRiskLevel,
    checkProductEligibility,
    calculateEstimatedBenefits
};

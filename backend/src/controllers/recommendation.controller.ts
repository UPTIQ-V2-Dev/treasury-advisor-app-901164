import { recommendationService } from '../services/index.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import { Request, Response } from 'express';
import httpStatus from 'http-status';

/**
 * Get all recommendations for a client
 */
const getRecommendationsByClientId = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { clientId } = req.params;
    const recommendations = await recommendationService.getRecommendationsByClientId(clientId);
    res.json(recommendations);
});

/**
 * Generate new recommendations for a client
 */
const generateRecommendations = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { clientId } = req.body;
    const taskId = await recommendationService.generateRecommendations(clientId);
    res.status(httpStatus.ACCEPTED).json({ taskId });
});

/**
 * Get detailed recommendation information
 */
const getRecommendationById = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { recommendationId } = req.params;
    const recommendation = await recommendationService.getRecommendationById(recommendationId);
    res.json(recommendation);
});

/**
 * Provide feedback on a recommendation
 */
const provideFeedback = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { recommendationId, feedback, reason, modifications, implementationDate } = req.body;
    await recommendationService.provideFeedback(recommendationId, {
        feedback,
        reason,
        modifications,
        implementationDate
    });
    res.status(httpStatus.OK).json({});
});

/**
 * Approve a recommendation
 */
const approveRecommendation = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { recommendationId } = req.params;
    const { reviewerId, comments } = req.body;
    await recommendationService.approveRecommendation(recommendationId, reviewerId, comments);
    res.status(httpStatus.OK).json({});
});

/**
 * Reject a recommendation
 */
const rejectRecommendation = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { recommendationId } = req.params;
    const { reviewerId, reason } = req.body;
    await recommendationService.rejectRecommendation(recommendationId, reviewerId, reason);
    res.status(httpStatus.OK).json({});
});

/**
 * Get recommendation summary for a client
 */
const getRecommendationSummary = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { clientId } = req.params;
    const summary = await recommendationService.getRecommendationSummary(clientId);
    res.json(summary);
});

/**
 * Update recommendation priority
 */
const updateRecommendationPriority = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { recommendationId } = req.params;
    const { priority } = req.body;
    await recommendationService.updateRecommendationPriority(recommendationId, priority);
    res.status(httpStatus.OK).json({});
});

/**
 * Mark recommendation as implemented
 */
const implementRecommendation = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { recommendationId } = req.params;
    const { implementationDate, notes } = req.body;
    await recommendationService.implementRecommendation(recommendationId, implementationDate, notes);
    res.status(httpStatus.OK).json({});
});

/**
 * Export recommendations for a client
 */
const exportRecommendations = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { clientId } = req.params;
    const { format } = req.query as { format: string };
    const exportData = await recommendationService.exportRecommendations(clientId, format);

    // Set appropriate headers for the export format
    if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="recommendations-${clientId}.json"`);
    } else if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="recommendations-${clientId}.csv"`);
    } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="recommendations-${clientId}.pdf"`);
    } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="recommendations-${clientId}.xlsx"`);
    }

    res.json(exportData);
});

/**
 * Get historical recommendations for a client
 */
const getHistoricalRecommendations = catchAsyncWithAuth(async (req: Request, res: Response) => {
    const { clientId } = req.params;
    const recommendations = await recommendationService.getHistoricalRecommendations(clientId);
    res.json(recommendations);
});

export default {
    getRecommendationsByClientId,
    generateRecommendations,
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

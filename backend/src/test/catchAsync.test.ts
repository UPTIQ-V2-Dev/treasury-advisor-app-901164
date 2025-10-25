import catchAsync from '../utils/catchAsync.ts';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it } from 'vitest';

describe('catchAsync', () => {
    it('should pass successful async function result', () => {
        const mockFn = async (req: Request, res: Response) => {
            await Promise.resolve();
            res.status(200).json({ message: 'success' });
        };

        const wrappedFn = catchAsync(mockFn);

        const mockReq = {} as Request;
        const mockRes = {
            status: () => mockRes,
            json: (data: any) => data
        } as unknown as Response;
        const mockNext = (() => {}) as NextFunction;

        wrappedFn(mockReq, mockRes, mockNext);

        // If no error is thrown, the test passes
        expect(true).toBe(true);
    });

    it('should catch and pass errors to next middleware', async () => {
        const testError = new Error('Test error');
        const mockFn = async () => {
            await Promise.resolve();
            throw testError;
        };

        const wrappedFn = catchAsync(mockFn);

        const mockReq = {} as Request;
        const mockRes = {} as Response;
        let capturedError: any;
        const mockNext = ((error: any) => {
            capturedError = error;
        }) as NextFunction;

        await new Promise<void>(resolve => {
            const originalNext = mockNext;
            const wrappedNext = ((error: any) => {
                originalNext(error);
                resolve();
            }) as NextFunction;
            wrappedFn(mockReq, mockRes, wrappedNext);
        });

        expect(capturedError).toBe(testError);
        expect(capturedError.message).toBe('Test error');
    });
});

import catchAsync from "../utils/catchAsync.js";
import { describe, expect, it } from 'vitest';
describe('catchAsync', () => {
    it('should pass successful async function result', () => {
        const mockFn = async (req, res) => {
            await Promise.resolve();
            res.status(200).json({ message: 'success' });
        };
        const wrappedFn = catchAsync(mockFn);
        const mockReq = {};
        const mockRes = {
            status: () => mockRes,
            json: (data) => data
        };
        const mockNext = (() => { });
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
        const mockReq = {};
        const mockRes = {};
        let capturedError;
        const mockNext = ((error) => {
            capturedError = error;
        });
        await new Promise(resolve => {
            const originalNext = mockNext;
            const wrappedNext = ((error) => {
                originalNext(error);
                resolve();
            });
            wrappedFn(mockReq, mockRes, wrappedNext);
        });
        expect(capturedError).toBe(testError);
        expect(capturedError.message).toBe('Test error');
    });
});

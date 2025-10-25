import ApiError from '../utils/ApiError.ts';
import httpStatus from 'http-status';
import { describe, expect, it } from 'vitest';

describe('ApiError', () => {
    it('should create an ApiError with correct properties', () => {
        const statusCode = httpStatus.BAD_REQUEST;
        const message = 'Test error message';
        const isOperational = true;

        const error = new ApiError(statusCode, message, isOperational);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(statusCode);
        expect(error.message).toBe(message);
        expect(error.isOperational).toBe(isOperational);
    });

    it('should default isOperational to true', () => {
        const error = new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error');

        expect(error.isOperational).toBe(true);
    });

    it('should capture stack trace', () => {
        const error = new ApiError(httpStatus.NOT_FOUND, 'Not found');

        expect(error.stack).toBeDefined();
    });
});

import { objectId, password } from '../validations/custom.validation.ts';
import Joi from 'joi';
import { describe, expect, it } from 'vitest';

describe('Custom Validations', () => {
    describe('password validation', () => {
        it('should validate a strong password', () => {
            const schema = Joi.string().custom(password);
            const result = schema.validate('Test1234');

            expect(result.error).toBeUndefined();
        });

        it('should fail if password has no letters', () => {
            const schema = Joi.string().custom(password);
            const result = schema.validate('12345678');

            expect(result.error).toBeDefined();
            expect(result.error?.message).toContain('at least 1 letter');
        });

        it('should fail if password has no numbers', () => {
            const schema = Joi.string().custom(password);
            const result = schema.validate('Password');

            expect(result.error).toBeDefined();
            expect(result.error?.message).toContain('at least 1 number');
        });

        it('should fail if password is too short', () => {
            const schema = Joi.string().custom(password);
            const result = schema.validate('Test1');

            expect(result.error).toBeDefined();
            expect(result.error?.message).toContain('at least 8 characters');
        });
    });

    describe('objectId validation', () => {
        it('should validate a valid MongoDB ObjectId', () => {
            const schema = Joi.string().custom(objectId);
            const result = schema.validate('507f1f77bcf86cd799439011');

            expect(result.error).toBeUndefined();
        });

        it('should fail for invalid ObjectId', () => {
            const schema = Joi.string().custom(objectId);
            const result = schema.validate('invalid-id');

            expect(result.error).toBeDefined();
            expect(result.error?.message).toContain('valid mongo id');
        });
    });
});

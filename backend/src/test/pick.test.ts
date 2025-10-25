import pick from '../utils/pick.ts';
import { describe, expect, it } from 'vitest';

describe('pick', () => {
    it('should pick specified keys from object', () => {
        const obj = {
            name: 'John',
            age: 30,
            email: 'john@example.com',
            role: 'admin'
        };

        const result = pick(obj, ['name', 'email']);

        expect(result).toEqual({
            name: 'John',
            email: 'john@example.com'
        });
        expect(result).not.toHaveProperty('age');
        expect(result).not.toHaveProperty('role');
    });

    it('should return empty object if no keys specified', () => {
        const obj = { a: 1, b: 2 };
        const result = pick(obj, []);

        expect(result).toEqual({});
    });

    it('should handle non-existent keys gracefully', () => {
        const obj = { a: 1, b: 2 };
        const result = pick(obj, ['a', 'c' as keyof typeof obj]);

        expect(result).toEqual({ a: 1 });
        expect(result).not.toHaveProperty('c');
    });

    it('should work with nested objects', () => {
        const obj = {
            user: { name: 'John' },
            settings: { theme: 'dark' },
            notifications: true
        };

        const result = pick(obj, ['user', 'notifications']);

        expect(result).toEqual({
            user: { name: 'John' },
            notifications: true
        });
    });
});

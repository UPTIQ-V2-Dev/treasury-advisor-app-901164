import { afterAll, afterEach, beforeAll } from 'vitest';

// Global test setup
beforeAll(() => {
    // Add any global setup here (e.g., initialize test database)
    process.env.NODE_ENV = 'test';
});

// Cleanup after each test
afterEach(() => {
    // Add cleanup logic here if needed
});

// Global test teardown
afterAll(() => {
    // Add any global teardown here (e.g., close database connections)
});

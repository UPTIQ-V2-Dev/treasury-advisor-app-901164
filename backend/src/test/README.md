# Backend Testing

This directory contains the test files for the backend application using Vitest.

## Structure

```
src/test/
├── setup.ts              # Global test setup and teardown
├── ApiError.test.ts      # Tests for ApiError utility
├── pick.test.ts          # Tests for pick utility
├── catchAsync.test.ts    # Tests for catchAsync utility
└── validation.test.ts    # Tests for custom validations
```

## Running Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:ci

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

## Writing Tests

Example test structure:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
    it('should do something', () => {
        const result = myFunction();
        expect(result).toBe(expectedValue);
    });
});
```

## Test Coverage

Coverage reports are generated in the `coverage/` directory when running `pnpm test:coverage`.

## Configuration

Test configuration is defined in `vitest.config.ts` at the root of the backend directory.

# Treasury Solutions Advisor - Frontend Implementation Plan

## Project Overview

A React 19 + Vite + ShadCN + Tailwind v4 application that analyzes business bank statements to recommend treasury products and account configurations for relationship managers and treasury specialists.

## Tech Stack

- **React 19** with modern features
- **Vite** for build tooling
- **ShadCN/ui** for component library
- **Tailwind CSS v4** for styling
- **TypeScript** for type safety
- **Vitest** + React Testing Library for testing
- **MSW** for API mocking

## Page-by-Page Implementation Plan

### 1. Authentication & Layout

#### Pages:

- **Login Page (`/login`)** - SSO/role-based authentication for Admins and Relationship Managers
- **App Shell** - Main layout wrapper
- **Clients Page (`/clients`)** - Client management for Relationship Managers

#### Components:

- `src/components/auth/LoginForm.tsx` - Authentication form
- `src/components/layout/AppShell.tsx` - Main layout with sidebar
- `src/components/layout/Header.tsx` - Top navigation with user info
- `src/components/layout/Sidebar.tsx` - Navigation menu
- `src/components/layout/StepIndicator.tsx` - Progress indicator

#### Utils:

- `src/lib/auth.ts` - Authentication utilities
- `src/lib/storage.ts` - Secure token storage

#### Types:

- `src/types/auth.ts` - User and role types

#### API Endpoints:

- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh

---

### 2. Statement Upload Page (`/upload`)

#### Components:

- `src/components/upload/FileUploadZone.tsx` - Drag & drop file upload
- `src/components/upload/BankConnectionModal.tsx` - API connection modal
- `src/components/upload/UploadProgress.tsx` - Upload progress indicator
- `src/components/upload/FilePreview.tsx` - Preview uploaded files

#### Utils:

- `src/lib/fileValidation.ts` - File format validation
- `src/lib/uploadUtils.ts` - File processing utilities

#### Types:

- `src/types/upload.ts` - File upload and validation types

#### API Endpoints:

- `POST /statements/upload` - File upload
- `GET /statements/validate` - File validation
- `POST /statements/connect` - Bank API connection

---

### 3. Data Processing Page (`/processing`)

#### Components:

- `src/components/processing/ProcessingLoader.tsx` - Animated processing indicator
- `src/components/processing/ParsingProgress.tsx` - Step-by-step parsing progress
- `src/components/processing/ErrorModal.tsx` - Processing error handling

#### Utils:

- `src/lib/processingUtils.ts` - Processing state management

#### Types:

- `src/types/processing.ts` - Processing states and errors

#### API Endpoints:

- `GET /statements/status/:id` - Processing status
- `POST /statements/parse` - Parse uploaded statements

---

### 4. Analysis Dashboard (`/dashboard`) - Relationship Manager View

#### Components:

- `src/components/dashboard/MetricsCards.tsx` - Key financial metrics cards for RM clients
- `src/components/dashboard/CashFlowChart.tsx` - Inflow/outflow visualization
- `src/components/dashboard/LiquidityHeatmap.tsx` - Liquidity analysis chart
- `src/components/dashboard/TransactionTable.tsx` - Transaction data table
- `src/components/dashboard/CategoryFilters.tsx` - Date and category filters
- `src/components/dashboard/IdleBalanceAlert.tsx` - Idle balance notifications
- `src/components/dashboard/ClientSelector.tsx` - Client selection dropdown for RMs

#### Utils:

- `src/lib/chartUtils.ts` - Chart configuration and data formatting
- `src/lib/dateUtils.ts` - Date range utilities
- `src/lib/formatters.ts` - Currency and number formatting

#### Types:

- `src/types/analytics.ts` - Dashboard data and metrics types
- `src/types/transactions.ts` - Transaction data types

#### API Endpoints:

- `GET /analytics/overview/:clientId` - Dashboard metrics
- `GET /analytics/cashflow/:clientId` - Cash flow data
- `GET /transactions/:clientId` - Transaction details

---

### 5. Recommendations Page (`/recommendations`)

#### Components:

- `src/components/recommendations/ProductCard.tsx` - Treasury product recommendation cards
- `src/components/recommendations/BenefitTag.tsx` - Financial benefit indicators
- `src/components/recommendations/RationaleModal.tsx` - Detailed recommendation rationale
- `src/components/recommendations/ComparisonTable.tsx` - Side-by-side product comparison
- `src/components/recommendations/TransactionDrillDown.tsx` - Supporting transaction details

#### Utils:

- `src/lib/recommendationUtils.ts` - Recommendation scoring and sorting
- `src/lib/benefitCalculations.ts` - Financial benefit calculations

#### Types:

- `src/types/recommendations.ts` - Product and recommendation types
- `src/types/products.ts` - Treasury product catalog types

#### API Endpoints:

- `GET /recommendations/:clientId` - Get recommendations
- `GET /products/catalog` - Treasury product catalog
- `POST /recommendations/feedback` - User feedback on recommendations

---

### 6. Review & Export Page (`/review`)

#### Components:

- `src/components/review/RecommendationSummary.tsx` - Summary of all recommendations
- `src/components/review/ApprovalWorkflow.tsx` - Admin review and approval
- `src/components/review/ReportPreview.tsx` - Client report preview
- `src/components/review/ExportOptions.tsx` - Export format selection
- `src/components/review/AuditLog.tsx` - Review history tracking

#### Utils:

- `src/lib/reportGenerator.ts` - PDF/HTML report generation
- `src/lib/exportUtils.ts` - Export functionality

#### Types:

- `src/types/reports.ts` - Report and export types
- `src/types/workflow.ts` - Approval workflow types

#### API Endpoints:

- `GET /reports/preview/:clientId` - Report preview
- `POST /reports/generate` - Generate downloadable report
- `POST /workflow/approve` - Approve recommendations

---

### 7. Configuration Page (`/settings`) - Admin Only

#### Components:

- `src/components/settings/ThresholdConfig.tsx` - Business rule configuration
- `src/components/settings/ProductRules.tsx` - Product eligibility rules
- `src/components/settings/UserManagement.tsx` - User role management

#### Utils:

- `src/lib/configUtils.ts` - Configuration management

#### Types:

- `src/types/config.ts` - Configuration and settings types

#### API Endpoints:

- `GET /config/rules` - Get business rules
- `PUT /config/rules` - Update business rules
- `GET /users` - User management

---

## Common Components & Utilities

### Shared Components:

- `src/components/ui/` - ShadCN components (Button, Card, Dialog, etc.)
- `src/components/common/LoadingSpinner.tsx`
- `src/components/common/ErrorBoundary.tsx`
- `src/components/common/DataTable.tsx`
- `src/components/common/Charts/` - Reusable chart components

### Global Utils:

- `src/lib/api.ts` - API client configuration
- `src/lib/constants.ts` - Application constants
- `src/lib/validation.ts` - Form validation schemas
- `src/lib/errorHandling.ts` - Global error handling
- `src/hooks/` - Custom React hooks

### Global Types:

- `src/types/api.ts` - API response types
- `src/types/common.ts` - Shared utility types

---

## Testing Strategy

### Test Structure

```
src/
├── __tests__/          # Global test utilities
├── components/
│   ├── auth/
│   │   ├── LoginForm.test.tsx
│   │   └── __tests__/
│   ├── dashboard/
│   │   ├── MetricsCards.test.tsx
│   │   └── __tests__/
└── pages/
    ├── Dashboard.test.tsx
    └── __tests__/
```

### Testing Framework Setup

- **Vitest** configuration in `vite.config.ts`
- **React Testing Library** for component testing
- **MSW** for API mocking
- **Test utilities** in `src/test-utils.tsx`

### Test Categories

#### 1. Component Tests

**Location:** `src/components/**/*.test.tsx`

**Key Test Cases:**

- **Upload Components:**
    - File drag & drop functionality
    - File validation (format, size)
    - Progress indicator updates
    - Error state handling

- **Dashboard Components:**
    - Metrics card rendering with correct data
    - Chart interactions and tooltips
    - Filter functionality (date ranges, categories)
    - Loading and empty states

- **Recommendation Components:**
    - Product card display and interactions
    - Benefit calculations accuracy
    - Modal open/close functionality
    - Comparison table sorting

#### 2. Page Tests

**Location:** `src/pages/**/*.test.tsx`

**Test Patterns:**

```tsx
// Example: Dashboard page test
describe('Dashboard Page', () => {
    it('renders metrics cards after data loads', async () => {
        render(<Dashboard />, { wrapper: TestProviders });
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Total Inflow')).toBeInTheDocument();
        });
    });

    it('handles API errors gracefully', async () => {
        server.use(
            rest.get('/api/analytics/overview/:id', (req, res, ctx) => {
                return res(ctx.status(500));
            })
        );
        render(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
        });
    });
});
```

#### 3. Hook Tests

**Location:** `src/hooks/**/*.test.ts`

**Custom Hooks to Test:**

- `useAuth()` - Authentication state management
- `useUpload()` - File upload logic
- `useAnalytics()` - Dashboard data fetching
- `useRecommendations()` - Recommendation logic

#### 4. Service Tests

**Location:** `src/lib/**/*.test.ts`

**Service Functions:**

- API client error handling
- File validation logic
- Chart data formatting
- Report generation
- Benefit calculations

#### 5. Integration Tests

**Location:** `src/__tests__/integration/`

**End-to-End Workflows:**

- Complete upload → processing → dashboard flow
- Recommendation generation and approval workflow
- Error handling across page transitions

### API Mocking Strategy

#### MSW Setup

**File:** `src/mocks/handlers.ts`

```tsx
export const handlers = [
    rest.post('/api/auth/login', (req, res, ctx) => {
        return res(ctx.json({ token: 'mock-token', user: mockUser }));
    }),
    rest.get('/api/analytics/overview/:id', (req, res, ctx) => {
        return res(ctx.json(mockDashboardData));
    }),
    rest.get('/api/recommendations/:id', (req, res, ctx) => {
        return res(ctx.json(mockRecommendations));
    })
];
```

#### Mock Data

**Files:** `src/mocks/data/`

- `mockTransactions.ts` - Sample transaction data
- `mockRecommendations.ts` - Sample treasury recommendations
- `mockAnalytics.ts` - Dashboard analytics data

### Test Utilities

#### Custom Render Function

**File:** `src/test-utils.tsx`

```tsx
export function renderWithProviders(ui: ReactElement, { preloadedState = {}, ...renderOptions } = {}) {
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryProvider>
                <AuthProvider>
                    <Router>{children}</Router>
                </AuthProvider>
            </QueryProvider>
        );
    }
    return render(ui, { wrapper: Wrapper, ...renderOptions });
}
```

### Form Validation Tests

**Focus Areas:**

- File upload validation (format, size limits)
- Configuration form validation
- Error message display
- Field-level and form-level validation

### State Management Tests

- Authentication state transitions
- Upload progress state updates
- Dashboard data loading states
- Recommendation selection state

### Accessibility Tests

- Keyboard navigation
- Screen reader compatibility
- ARIA attributes
- Color contrast compliance

### Performance Tests

- Component render performance
- Large dataset handling
- Memory leak detection
- Bundle size optimization

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

- Authentication & routing setup
- Layout components
- API client configuration
- Basic testing setup

### Phase 2: Upload & Processing (Week 2)

- File upload functionality
- Processing workflow
- Error handling
- Upload-related tests

### Phase 3: Dashboard & Analytics (Week 3)

- Analytics dashboard
- Chart components
- Data visualization
- Dashboard tests

### Phase 4: Recommendations (Week 4)

- Recommendation display
- Product comparison
- Rationale modals
- Recommendation tests

### Phase 5: Review & Export (Week 5)

- Report generation
- Approval workflow
- Export functionality
- Integration tests

### Phase 6: Admin Features (Week 6)

- Configuration management
- User administration
- Security features
- Comprehensive testing

---

## Success Criteria

### Functional Requirements

- ✅ Upload workflow completion rate > 95%
- ✅ Dashboard load time < 3 seconds
- ✅ Recommendation generation < 60 seconds
- ✅ Report export success rate > 98%

### Technical Requirements

- ✅ Test coverage > 85%
- ✅ Bundle size < 2MB initial load
- ✅ Lighthouse score > 90
- ✅ WCAG 2.1 AA compliance

### User Experience

- ✅ NPS score > 8/10
- ✅ Task completion rate > 90%
- ✅ Error recovery rate > 95%
- ✅ Mobile responsiveness score > 90%

This plan provides a structured approach to building the treasury solutions advisor application with comprehensive testing coverage and clear success metrics.

# Paylocity Benefits Dashboard — Test Automation

Playwright + TypeScript test suite covering UI and API testing for the Paylocity Benefits Dashboard application.

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
npx playwright install chromium
```

## Running Tests

### All tests
```bash
npx playwright test
```

### UI tests only
```bash
npx playwright test tests/e2e/
```

### API tests only
```bash
npx playwright test tests/api/
```

### Specific test file
```bash
npx playwright test tests/e2e/login.spec.ts
```

### With HTML report
```bash
npx playwright test --reporter=html
npx playwright show-report
```

### Headed mode (see the browser)
```bash
npx playwright test tests/e2e/ --headed
```

## Project Structure

```
tests/
├── api/
│   └── employees.api.spec.ts   # API tests (GET, POST, PUT, DELETE)
├── e2e/
│   ├── login.spec.ts           # UI login tests
│   └── employees.spec.ts       # UI employee CRUD tests
├── fixtures/
│   └── auth.fixture.ts         # Shared authenticated session fixture
├── helpers/
│   └── constants.ts            # Config, credentials, business logic helpers
└── pages/
    ├── LoginPage.ts             # Login page POM
    ├── DashboardPage.ts         # Benefits dashboard POM
    └── EmployeeModal.ts         # Add/Edit employee modal POM
```

## Test Coverage

### UI Tests
- **Login**: valid/invalid credentials, empty fields, password masking, redirect when unauthenticated
- **Add Employee**: modal open, employee creation, benefits calculation, validation (empty fields, over-limit dependants)
- **Edit Employee**: name change, recalculation after dependant update
- **Delete Employee**: deletion flow, confirmation dialog, cancel behaviour

### API Tests
- **Authentication**: missing/invalid/valid auth header
- **GET /api/Employees**: list all, field validation
- **GET /api/Employees/{id}**: by valid ID, 404 for missing, 400 for invalid UUID
- **POST /api/Employees**: create, salary/benefits/net calculation, validation (missing fields, dependant limits, max field lengths)
- **PUT /api/Employees**: update name, recalculate after dependant change, validation
- **DELETE /api/Employees/{id}**: delete existing, 404 for missing

## Business Logic

| Rule | Value |
|------|-------|
| Salary per paycheck | $2,000 |
| Paychecks per year | 26 |
| Employee benefits cost/year | $1,000 |
| Dependant cost/year | $500 |
| Max dependants | 32 |

**Benefits cost per paycheck** = (1000 + dependants × 500) / 26  
**Net pay** = 2000 − benefits cost per paycheck

## Application URL

`https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod`

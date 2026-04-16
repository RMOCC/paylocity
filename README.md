# Paylocity Benefits Dashboard — Test Automation

Playwright + TypeScript test suite for the Paylocity Benefits Dashboard.  
Target: `https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod`

## Setup & running

```bash
npm install
npx playwright install chromium
```

```bash
npx playwright test                          # all tests
npx playwright test tests/e2e/               # UI only
npx playwright test tests/api/               # API only
npx playwright test tests/e2e/login.spec.ts  # single file
npx playwright test tests/e2e/ --headed      # with visible browser
npx playwright show-report                   # open HTML report
```

## What is tested and why

### UI (`tests/e2e/`)

**Login** — covers the only entry point to the app: valid credentials redirect to dashboard, invalid username/password/empty fields show an error, password field is masked, unauthenticated access to `/Benefits` redirects to login.

**Add employee** — modal opens on button click, new employee appears in the table with an incremented count, benefits calculation is correct (salary / benefitsCost / net), empty firstName or lastName prevents submission, dependants > 32 are rejected.

**Edit employee** — firstName change is persisted, changing dependants recalculates benefitsCost in the table.

**Delete employee** — row is removed and count decrements, cancelling the confirmation dialog keeps the employee.

### API (`tests/api/`)

**Auth** — 401 without header, 401 with invalid token, 200 with valid header. All endpoints share the same auth mechanism so testing one is enough.

**GET /api/Employees** — returns a 200 array, each item has the required fields (id, firstName, lastName, dependants, salary, gross, benefitsCost, net).

**GET /api/Employees/:id** — found by valid ID, 404 for unknown UUID, 400/404 for malformed ID.

**POST /api/Employees** — creates employee and echoes fields back, salary/benefitsCost/net are calculated correctly (0, 2, 3 dependants), missing firstName or lastName returns 400, dependants boundary: 32 accepted, 33 and −1 rejected, name longer than 50 chars returns 400.

**PUT /api/Employees** — firstName update persisted, benefits recalculated after dependants change, invalid dependants return 400.

**DELETE /api/Employees/:id** — deletes employee and subsequent GET returns 404, 404 for unknown ID.

## What was consciously not tested

| Area | What | Why |
|------|------|-----|
| UI | lastName edit | Follows the same code path as firstName; covered implicitly |
| UI | Error message wording | Wording is a copy/UX decision, not a functional contract |
| UI | Field length limits | Covered exhaustively at API level; duplicating in UI adds noise |
| UI | `gross` field value | It is `salary × 26`, a display aggregation; the underlying salary and net are verified |
| UI | Cross-browser | No browser-specific features in this app; Chromium is sufficient |
| API | PUT with non-existent ID | Undocumented behavior (404 or upsert?); asserting an undefined contract would be brittle |
| API | 400 response body content | Error message format is not part of the tested contract; status code is enough |

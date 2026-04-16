
# Paylocity Benefits Dashboard — Test Automation

Playwright + TypeScript test suite for the Paylocity Benefits Dashboard.  
Target: https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod

---

## Setup & running

npm install  
npx playwright install chromium  

npx playwright test                          # all tests  
npx playwright test tests/e2e/               # UI only  
npx playwright test tests/api/               # API only  
npx playwright test tests/e2e/login.spec.ts  # single file  
npx playwright test tests/e2e/ --headed      # with visible browser  
npx playwright show-report                   # open HTML report  

---

## What is tested and why

### UI (tests/e2e/)

⚠️ UI application currently returns "Forbidden", therefore UI tests are intentionally skipped.

Login — covers entry point: valid credentials redirect to dashboard, invalid/empty credentials show error, password is masked, unauthenticated access redirects to login.

Add employee — modal behavior, table update, correct calculations, validation of required fields and dependants limit.

Edit employee — verifies update persistence and recalculation.

Delete employee — verifies removal and cancel behavior.

---

### API (tests/api/)

Auth — verifies behavior for missing, invalid, and valid tokens.

GET /api/Employees — validates response structure and required fields.

GET /api/Employees/:id — verifies retrieval, unknown ID handling, and malformed input handling.

POST /api/Employees — validates creation, business logic calculations, boundary values, and invalid inputs.

PUT /api/Employees — verifies updates and recalculations.

DELETE /api/Employees/:id — verifies deletion behavior and unknown ID handling.

---

## Known Issues (Detected Bugs)

### Authentication is not enforced  
Severity: Critical  

Steps to reproduce:  
1. Send GET request to /api/Employees without Authorization header  

Expected:  
401 Unauthorized  

Actual:  
200 OK with full data  

Impact:  
Unauthorized access to sensitive employee data  

---

### Salary and Gross values are swapped  
Severity: High  

Steps to reproduce:  
1. Create employee via POST /api/Employees  
2. Inspect response  

Expected:  
salary = 2000 (per paycheck)  
gross = 52000 (annual)  

Actual:  
salary = 52000  
gross = 2000  

Impact:  
Incorrect financial calculations and misleading data  

---

### DELETE does not consistently remove employee  
Severity: High  

Steps to reproduce:  
1. Create employee  
2. Delete employee  
3. Fetch employee by ID  

Expected:  
404 Not Found  

Actual:  
200 OK (employee still exists in some cases)  

Impact:  
Data inconsistency and potential payroll errors  

---

### Invalid ID returns 500 instead of client error  
Severity: Medium  

Steps to reproduce:  
1. Call GET /api/Employees/not-a-uuid  

Expected:  
400 or 404  

Actual:  
500 Internal Server Error  

Impact:  
Missing input validation and server instability  

---

### Invalid dependants type is not validated correctly  
Severity: Medium  

Steps to reproduce:  
1. Send POST with dependants = 1.5  

Expected:  
400 Bad Request  

Actual:  
405 Method Not Allowed  

Impact:  
Inconsistent validation logic  

---

### DELETE unknown ID returns 200  
Severity: Medium  

Steps to reproduce:  
1. Delete non-existent employee ID  

Expected:  
404 Not Found  

Actual:  
200 OK  

Impact:  
API contract inconsistency  

---

## What was consciously not tested

UI — lastName edit → same logic as firstName  
UI — error message wording → UX concern  
UI — field length limits → covered at API level  
UI — gross field → derived value (salary × 26)  
UI — cross-browser → no browser-specific behavior  

API — PUT non-existent ID → undefined contract  
API — error response body → status code sufficient  
```

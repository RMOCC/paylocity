import { test, expect } from '../fixtures/auth.fixture';
import { EmployeeModal } from '../pages/EmployeeModal';
import { calculateBenefitsCost, parseCurrency } from '../helpers/constants';
import { createEmployee, deleteEmployee, authHeaders, API_URL } from '../helpers/api';
import { CREDENTIALS } from '../helpers/constants';

// Synchronous factory — generates data only, no HTTP call
function buildEmployee(overrides: Record<string, unknown> = {}) {
  const s = Date.now();
  return { firstName: `Jan${s}`, lastName: `Novak${s}`, dependants: 2, username: CREDENTIALS.username, ...overrides };
}

test('employee created via API is visible in UI', async ({ authenticatedDashboard: dashboard, page, request }) => {
  const employee = buildEmployee();

  const res = await request.post(API_URL, { headers: authHeaders, data: employee });
  expect(res.ok()).toBeTruthy();

  await dashboard.goto();
  await expect(page.locator(`text=${employee.firstName}`)).toBeVisible();

  await deleteEmployee(request, (await res.json()).id);
});

test('API-created employee with 3 dependants shows correct payroll breakdown in dashboard', async ({
  authenticatedDashboard: dashboard,
  page,
  request,
}) => {
  const employee = buildEmployee({ dependants: 3 });

  const res = await request.post(API_URL, { headers: authHeaders, data: employee });
  expect(res.ok()).toBeTruthy();

  await dashboard.goto();

  const data = await dashboard.getEmployeeData(employee.firstName as string, employee.lastName as string);

  const annualBenefits = 1000 + 3 * 500;                                        // $2,500
  expect(parseCurrency(data.salary)).toBeCloseTo(2000, 2);                       // per paycheck
  expect(parseCurrency(data.gross)).toBeCloseTo(2000 * 26, 2);                   // $52,000 annual
  expect(parseCurrency(data.benefitsCost)).toBeCloseTo(annualBenefits / 26, 2);  // ≈ $96.15 per paycheck
  expect(parseCurrency(data.net)).toBeCloseTo(2000 - annualBenefits / 26, 2);    // ≈ $1,903.85

  await deleteEmployee(request, (await res.json()).id);
});

test('employee deleted via API disappears from dashboard', async ({ authenticatedDashboard: dashboard, page, request }) => {
  const employee = buildEmployee();

  const res = await request.post(API_URL, { headers: authHeaders, data: employee });
  expect(res.ok()).toBeTruthy();
  const { id } = await res.json();

  await dashboard.goto();
  await expect(page.locator(`text=${employee.firstName}`)).toBeVisible();

  await deleteEmployee(request, id);

  await dashboard.goto();
  await expect(page.locator(`text=${employee.firstName}`)).not.toBeVisible();
});

test('employee created via UI is retrievable via API', async ({ authenticatedDashboard: dashboard, page, request }) => {
  const emp = buildEmployee();
  const modal = new EmployeeModal(page);

  await dashboard.openAddModal();
  await modal.submit(emp);
  await modal.waitForClose();

  const employees = await (await request.get(API_URL, { headers: authHeaders })).json();
  const found = employees.find((e: any) => e.firstName === emp.firstName);

  expect(found).toBeDefined();
  expect(found.lastName).toBe(emp.lastName);
  expect(found.benefitsCost).toBeCloseTo(calculateBenefitsCost(2), 2);

  await deleteEmployee(request, found.id);
});

test('employee edited via UI reflects in API response', async ({ authenticatedDashboard: dashboard, page, request }) => {
  const employee = buildEmployee({ dependants: 0 });

  const res = await request.post(API_URL, { headers: authHeaders, data: employee });
  expect(res.ok()).toBeTruthy();
  const { id } = await res.json();
  const modal = new EmployeeModal(page);

  await dashboard.goto();
  await dashboard.openEditModal(employee.firstName as string, employee.lastName as string);
  await modal.waitForOpen();
  await modal.dependantsInput.fill('3');
  await modal.save();
  await modal.waitForClose();

  const updated = await (await request.get(`${API_URL}/${id}`, { headers: authHeaders })).json();
  expect(updated.dependants).toBe(3);
  expect(updated.benefitsCost).toBeCloseTo(calculateBenefitsCost(3), 2);

  await deleteEmployee(request, id);
});

import { test, expect } from '../fixtures/auth.fixture';
import { EmployeeModal } from '../pages/EmployeeModal';
import { calculateBenefitsCost, parseCurrency } from '../helpers/constants';
import { createEmployee, deleteEmployee, authHeaders, API_URL } from '../helpers/api';

function unique(prefix: string) {
  return `${prefix}${Date.now()}`;
}

test('API-created employee with 3 dependants shows correct payroll breakdown in dashboard', async ({
  authenticatedDashboard: dashboard,
  page,
  request,
}) => {
  const s = Date.now();
  const employee = await (await createEmployee(request, {
    firstName: `Jan${s}`,
    lastName:  `Novak${s}`,
    dependants: 3,
  })).json();

  await dashboard.goto();

  const data = await dashboard.getEmployeeData(employee.firstName, employee.lastName);

  const annualBenefits = 1000 + 3 * 500;                                        // $2,500
  expect(parseCurrency(data.salary)).toBeCloseTo(2000, 2);                       // per paycheck
  expect(parseCurrency(data.gross)).toBeCloseTo(2000 * 26, 2);                   // $52,000 annual
  expect(parseCurrency(data.benefitsCost)).toBeCloseTo(annualBenefits / 26, 2);  // ≈ $96.15 per paycheck
  expect(parseCurrency(data.net)).toBeCloseTo(2000 - annualBenefits / 26, 2);    // ≈ $1,903.85

  await deleteEmployee(request, employee.id);
});

test('employee created via API appears in dashboard', async ({ authenticatedDashboard: dashboard, page, request }) => {
  const firstName = unique('Api');
  const employee = await (await createEmployee(request, { firstName, lastName: 'Created' })).json();

  await dashboard.goto();
  await expect(page.locator('#employeesTable')).toContainText(firstName);

  await deleteEmployee(request, employee.id);
});

test('employee deleted via API disappears from dashboard', async ({ authenticatedDashboard: dashboard, page, request }) => {
  const firstName = unique('Del');
  const employee = await (await createEmployee(request, { firstName, lastName: 'ByApi' })).json();

  await dashboard.goto();
  await expect(page.locator('#employeesTable')).toContainText(firstName);

  await deleteEmployee(request, employee.id);

  await dashboard.goto();
  await expect(page.locator('#employeesTable')).not.toContainText(firstName);
});

test('employee created via UI is retrievable via API', async ({ authenticatedDashboard: dashboard, page, request }) => {
  const firstName = unique('Ui');
  const emp = { firstName, lastName: 'Created', dependants: 2 };
  const modal = new EmployeeModal(page);

  await dashboard.openAddModal();
  await modal.submit(emp);
  await modal.waitForClose();

  const employees = await (await request.get(API_URL, { headers: authHeaders })).json();
  const found = employees.find((e: any) => e.firstName === firstName);

  expect(found).toBeDefined();
  expect(found.lastName).toBe('Created');
  expect(found.benefitsCost).toBeCloseTo(calculateBenefitsCost(2), 2);

  await deleteEmployee(request, found.id);
});

test('employee edited via UI reflects in API response', async ({ authenticatedDashboard: dashboard, page, request }) => {
  const firstName = unique('Edit');
  const employee = await (await createEmployee(request, { firstName, lastName: 'Before', dependants: 0 })).json();
  const modal = new EmployeeModal(page);

  await dashboard.goto();
  await dashboard.openEditModal(firstName, 'Before');
  await modal.waitForOpen();
  await modal.dependantsInput.fill('3');
  await modal.save();
  await modal.waitForClose();

  const updated = await (await request.get(`${API_URL}/${employee.id}`, { headers: authHeaders })).json();
  expect(updated.dependants).toBe(3);
  expect(updated.benefitsCost).toBeCloseTo(calculateBenefitsCost(3), 2);

  await deleteEmployee(request, employee.id);
});

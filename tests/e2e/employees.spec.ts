import { test, expect } from '../fixtures/auth.fixture';
import { EmployeeModal, EmployeeData } from '../pages/EmployeeModal';
import { calculateBenefitsCost, calculateGross, calculateNet, BENEFITS, parseCurrency } from '../helpers/constants';
import { createEmployee, deleteEmployee, authHeaders, API_URL } from '../helpers/api';

function generateEmployee(overrides?: Partial<EmployeeData>): EmployeeData {
  const s = Date.now();
  return { firstName: `Jan${s}`, lastName: `Novak${s}`, dependants: 2, ...overrides };
}

async function findEmployeeByName(request: any, firstName: string) {
  const list = await (await request.get(API_URL, { headers: authHeaders })).json();
  return list.find((e: any) => e.firstName === firstName);
}

test.describe('Add Employee', () => {
  test('opens modal on button click', async ({ authenticatedDashboard: dashboard, page }) => {
    await dashboard.openAddModal();
    await expect(new EmployeeModal(page).modal).toBeVisible();
  });

  test('adds employee and updates table', async ({ authenticatedDashboard: dashboard, page, request }) => {
    const emp = generateEmployee();
    const before = await dashboard.addEmployeeCount();
    const modal = new EmployeeModal(page);

    await dashboard.openAddModal();
    await modal.submit(emp);
    await modal.waitForClose();

    await expect(page.locator('#employeesTable')).toContainText(emp.firstName);
    expect(await dashboard.addEmployeeCount()).toBe(before + 1);

    const created = await findEmployeeByName(request, emp.firstName);
    await deleteEmployee(request, created.id);
  });

  test('calculates benefits correctly', async ({ authenticatedDashboard: dashboard, page, request }) => {
    const emp = generateEmployee({ dependants: 2 });
    const modal = new EmployeeModal(page);

    await dashboard.openAddModal();
    await modal.submit(emp);
    await modal.waitForClose();

    const data = await dashboard.getEmployeeData(emp.firstName, emp.lastName);
    expect(parseCurrency(data.salary)).toBeCloseTo(BENEFITS.salaryPerPaycheck, 2);
    expect(parseCurrency(data.gross)).toBeCloseTo(calculateGross(), 2);
    expect(parseCurrency(data.benefitsCost)).toBeCloseTo(calculateBenefitsCost(2), 2);
    expect(parseCurrency(data.net)).toBeCloseTo(calculateNet(2), 2);

    const created = await findEmployeeByName(request, emp.firstName);
    await deleteEmployee(request, created.id);
  });

  // Validation — modal stays open, count unchanged
  test('rejects empty first name', async ({ authenticatedDashboard: dashboard, page }) => {
    const before = await dashboard.addEmployeeCount();
    await dashboard.openAddModal();
    await new EmployeeModal(page).submit({ firstName: '', lastName: 'Test', dependants: 0 });
    expect(await dashboard.addEmployeeCount()).toBe(before);
  });

  test('rejects empty last name', async ({ authenticatedDashboard: dashboard, page }) => {
    const before = await dashboard.addEmployeeCount();
    await dashboard.openAddModal();
    await new EmployeeModal(page).submit({ firstName: 'Test', lastName: '', dependants: 0 });
    expect(await dashboard.addEmployeeCount()).toBe(before);
  });

  test('rejects whitespace-only first name', async ({ authenticatedDashboard: dashboard, page }) => {
    const before = await dashboard.addEmployeeCount();
    await dashboard.openAddModal();
    await new EmployeeModal(page).submit({ firstName: '   ', lastName: 'Test', dependants: 0 });
    expect(await dashboard.addEmployeeCount()).toBe(before);
  });

  test('rejects whitespace-only last name', async ({ authenticatedDashboard: dashboard, page }) => {
    const before = await dashboard.addEmployeeCount();
    await dashboard.openAddModal();
    await new EmployeeModal(page).submit({ firstName: 'Test', lastName: '   ', dependants: 0 });
    expect(await dashboard.addEmployeeCount()).toBe(before);
  });

  test('rejects more than 32 dependants', async ({ authenticatedDashboard: dashboard, page }) => {
    const emp = generateEmployee({ dependants: 33 });
    await dashboard.openAddModal();
    await new EmployeeModal(page).submit(emp);
    await expect(page.locator('#employeesTable')).not.toContainText(emp.firstName);
  });

  // Dependants boundary — create via UI, verify calculation
  for (const dependants of [0, 32]) {
    test(`accepts ${dependants} dependants and calculates correctly`, async ({ authenticatedDashboard: dashboard, page, request }) => {
      const emp = generateEmployee({ dependants });
      const modal = new EmployeeModal(page);

      await dashboard.openAddModal();
      await modal.submit(emp);
      await modal.waitForClose();

      const data = await dashboard.getEmployeeData(emp.firstName, emp.lastName);
      expect(parseCurrency(data.benefitsCost)).toBeCloseTo(calculateBenefitsCost(dependants), 2);
      expect(parseCurrency(data.net)).toBeCloseTo(calculateNet(dependants), 2);

      const created = await findEmployeeByName(request, emp.firstName);
      await deleteEmployee(request, created.id);
    });
  }
});

test.describe('Edit Employee', () => {
  let employee: any;

  // Fast API setup — no browser needed to create test data
  test.beforeEach(async ({ request }) => {
    employee = await (await createEmployee(request, generateEmployee())).json();
  });

  test.afterEach(async ({ request }) => {
    await deleteEmployee(request, employee.id);
  });

  test('updates first name', async ({ authenticatedDashboard: dashboard, page }) => {
    const modal = new EmployeeModal(page);
    await dashboard.goto();
    await dashboard.openEditModal(employee.firstName, employee.lastName);
    await modal.waitForOpen();
    await modal.firstNameInput.fill('Jana');
    await modal.save();
    await modal.waitForClose();

    await expect(page.locator('#employeesTable')).toContainText('Jana');
  });

  test('recalculates benefits after dependant change', async ({ authenticatedDashboard: dashboard, page }) => {
    const modal = new EmployeeModal(page);
    await dashboard.goto();
    await dashboard.openEditModal(employee.firstName, employee.lastName);
    await modal.waitForOpen();
    await modal.dependantsInput.fill('5');
    await modal.save();
    await modal.waitForClose();

    const data = await dashboard.getEmployeeData(employee.firstName, employee.lastName);
    expect(parseCurrency(data.benefitsCost)).toBeCloseTo(calculateBenefitsCost(5), 2);
    expect(parseCurrency(data.net)).toBeCloseTo(calculateNet(5), 2);
  });
});

test.describe('Delete Employee', () => {
  test('removes employee from table', async ({ authenticatedDashboard: dashboard, page, request }) => {
    const employee = await (await createEmployee(request, generateEmployee())).json();

    await dashboard.goto();
    const before = await dashboard.addEmployeeCount();
    await dashboard.openDeleteModal(employee.firstName, employee.lastName);
    await dashboard.confirmDelete();

    await expect(page.locator('#employeesTable')).not.toContainText(employee.firstName);
    expect(await dashboard.addEmployeeCount()).toBe(before - 1);
  });

  test('confirmation dialog cancel keeps employee', async ({ authenticatedDashboard: dashboard, page, request }) => {
    const employee = await (await createEmployee(request, generateEmployee())).json();

    await dashboard.goto();
    await dashboard.openDeleteModal(employee.firstName, employee.lastName);
    await expect(page.locator('#deleteModal')).toBeVisible();
    await page.locator('#deleteModal [data-dismiss="modal"]').click();
    await expect(page.locator('#employeesTable')).toContainText(employee.firstName);

    await deleteEmployee(request, employee.id);
  });
});

import { test, expect } from '../fixtures/auth.fixture';
import { EmployeeModal } from '../pages/EmployeeModal';
import { calculateBenefitsCost, calculateNet, BENEFITS } from '../helpers/constants';

const EMPLOYEE = { firstName: 'Jan', lastName: 'Novak', dependants: 2 };

function uniqueEmployee() {
  const s = Date.now();
  return { firstName: `Test${s}`, lastName: `User${s}`, dependants: 1 };
}

function parseCurrency(value: string | null): number {
  return parseFloat(value!.replace(/[^0-9.]/g, ''));
}

test.describe('Add Employee', () => {
  test('opens modal on button click', async ({ authenticatedDashboard: dashboard, page }) => {
    await dashboard.openAddModal();
    const modal = new EmployeeModal(page);
    await expect(modal.modal).toBeVisible();
  });

  test('adds employee and updates table', async ({ authenticatedDashboard: dashboard, page }) => {
    const emp = uniqueEmployee();
    const before = await dashboard.addEmployeeCount();

    await dashboard.openAddModal();
    await new EmployeeModal(page).submit(emp);

    await expect(page.locator('#employeesTable')).toContainText(emp.firstName);
    expect(await dashboard.addEmployeeCount()).toBe(before + 1);

    await dashboard.openDeleteModal(emp.firstName, emp.lastName);
    await dashboard.confirmDelete();
  });

  test('calculates benefits correctly', async ({ authenticatedDashboard: dashboard, page }) => {
    await dashboard.openAddModal();
    await new EmployeeModal(page).submit(EMPLOYEE);

    const data = await dashboard.getEmployeeData(EMPLOYEE.firstName, EMPLOYEE.lastName);
    expect(parseCurrency(data.salary)).toBeCloseTo(BENEFITS.salaryPerPaycheck, 2);
    expect(parseCurrency(data.benefitsCost)).toBeCloseTo(calculateBenefitsCost(EMPLOYEE.dependants), 2);
    expect(parseCurrency(data.net)).toBeCloseTo(calculateNet(EMPLOYEE.dependants), 2);

    await dashboard.openDeleteModal(EMPLOYEE.firstName, EMPLOYEE.lastName);
    await dashboard.confirmDelete();
  });

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

  test('rejects more than 32 dependants', async ({ authenticatedDashboard: dashboard, page }) => {
    await dashboard.openAddModal();
    await new EmployeeModal(page).submit({ firstName: 'Over', lastName: 'Limit', dependants: 33 });
    await expect(page.locator('#employeesTable')).not.toContainText('Over');
  });
});

test.describe('Edit Employee', () => {
  test.beforeEach(async ({ authenticatedDashboard: dashboard, page }) => {
    await dashboard.openAddModal();
    await new EmployeeModal(page).submit(EMPLOYEE);
  });

  test.afterEach(async ({ authenticatedDashboard: dashboard, page }) => {
    for (const firstName of [EMPLOYEE.firstName, 'Jane']) {
      try {
        await dashboard.openDeleteModal(firstName, EMPLOYEE.lastName);
        await dashboard.confirmDelete();
      } catch {}
    }
  });

  test('updates first name', async ({ authenticatedDashboard: dashboard, page }) => {
    await dashboard.openEditModal(EMPLOYEE.firstName, EMPLOYEE.lastName);
    const modal = new EmployeeModal(page);
    await modal.waitForOpen();
    await modal.firstNameInput.fill('Jane');
    await modal.save();
    await modal.waitForClose();
    await expect(page.locator('#employeesTable')).toContainText('Jane');
  });

  test('recalculates benefits after dependant change', async ({ authenticatedDashboard: dashboard, page }) => {
    await dashboard.openEditModal(EMPLOYEE.firstName, EMPLOYEE.lastName);
    const modal = new EmployeeModal(page);
    await modal.waitForOpen();
    await modal.dependantsInput.fill('3');
    await modal.save();
    await modal.waitForClose();

    const data = await dashboard.getEmployeeData(EMPLOYEE.firstName, EMPLOYEE.lastName);
    expect(parseCurrency(data.benefitsCost)).toBeCloseTo(calculateBenefitsCost(3), 2);
  });
});

test.describe('Delete Employee', () => {
  test('removes employee from table', async ({ authenticatedDashboard: dashboard, page }) => {
    const emp = uniqueEmployee();
    await dashboard.openAddModal();
    await new EmployeeModal(page).submit(emp);

    const before = await dashboard.addEmployeeCount();
    await dashboard.openDeleteModal(emp.firstName, emp.lastName);
    await dashboard.confirmDelete();

    await expect(page.locator('#employeesTable')).not.toContainText(emp.firstName);
    expect(await dashboard.addEmployeeCount()).toBe(before - 1);
  });

  test('confirmation dialog cancel keeps employee', async ({ authenticatedDashboard: dashboard, page }) => {
    const emp = uniqueEmployee();
    await dashboard.openAddModal();
    await new EmployeeModal(page).submit(emp);

    await dashboard.openDeleteModal(emp.firstName, emp.lastName);
    await expect(page.locator('#deleteModal')).toBeVisible();
    await page.locator('[data-dismiss="modal"]').last().click();
    await expect(page.locator('#employeesTable')).toContainText(emp.firstName);

    await dashboard.openDeleteModal(emp.firstName, emp.lastName);
    await dashboard.confirmDelete();
  });
});

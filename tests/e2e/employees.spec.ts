import { test, expect } from '../fixtures/auth.fixture';
import { EmployeeModal } from '../pages/EmployeeModal';
import { calculateBenefitsCost, calculateNet, BENEFITS, parseCurrency } from '../helpers/constants';

const EMPLOYEE = { firstName: 'Jan', lastName: 'Novak', dependants: 2 };

function uniqueEmployee() {
  const s = Date.now();
  return { firstName: `Test${s}`, lastName: `User${s}`, dependants: 1 };
}

test.describe('Add Employee', () => {
  test('opens modal on button click', async ({ authenticatedDashboard: dashboard, page }) => {
    await dashboard.openAddModal();
    await expect(new EmployeeModal(page).modal).toBeVisible();
  });

  test('adds employee and updates table', async ({ authenticatedDashboard: dashboard, page }) => {
    const emp = uniqueEmployee();
    const before = await dashboard.addEmployeeCount();
    const modal = new EmployeeModal(page);

    await dashboard.openAddModal();
    await modal.submit(emp);
    await modal.waitForClose();

    await expect(page.locator('#employeesTable')).toContainText(emp.firstName);
    expect(await dashboard.addEmployeeCount()).toBe(before + 1);

    await dashboard.openDeleteModal(emp.firstName, emp.lastName);
    await dashboard.confirmDelete();
  });

  test('calculates benefits correctly', async ({ authenticatedDashboard: dashboard, page }) => {
    const modal = new EmployeeModal(page);

    await dashboard.openAddModal();
    await modal.submit(EMPLOYEE);
    await modal.waitForClose();

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
    const modal = new EmployeeModal(page);
    await dashboard.openAddModal();
    await modal.submit(EMPLOYEE);
    await modal.waitForClose();
  });

  test.afterEach(async ({ authenticatedDashboard: dashboard }) => {
    for (const firstName of [EMPLOYEE.firstName, 'Jane']) {
      if (await dashboard.employeeExists(firstName, EMPLOYEE.lastName)) {
        await dashboard.openDeleteModal(firstName, EMPLOYEE.lastName);
        await dashboard.confirmDelete();
      }
    }
  });

  test('updates first name', async ({ authenticatedDashboard: dashboard, page }) => {
    const modal = new EmployeeModal(page);
    await dashboard.openEditModal(EMPLOYEE.firstName, EMPLOYEE.lastName);
    await modal.waitForOpen();
    await modal.firstNameInput.fill('Jane');
    await modal.save();
    await modal.waitForClose();

    await expect(page.locator('#employeesTable')).toContainText('Jane');
  });

  test('recalculates benefits after dependant change', async ({ authenticatedDashboard: dashboard, page }) => {
    const modal = new EmployeeModal(page);
    await dashboard.openEditModal(EMPLOYEE.firstName, EMPLOYEE.lastName);
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
    const modal = new EmployeeModal(page);

    await dashboard.openAddModal();
    await modal.submit(emp);
    await modal.waitForClose();

    const before = await dashboard.addEmployeeCount();
    await dashboard.openDeleteModal(emp.firstName, emp.lastName);
    await dashboard.confirmDelete();

    await expect(page.locator('#employeesTable')).not.toContainText(emp.firstName);
    expect(await dashboard.addEmployeeCount()).toBe(before - 1);
  });

  test('confirmation dialog cancel keeps employee', async ({ authenticatedDashboard: dashboard, page }) => {
    const emp = uniqueEmployee();
    const modal = new EmployeeModal(page);

    await dashboard.openAddModal();
    await modal.submit(emp);
    await modal.waitForClose();

    await dashboard.openDeleteModal(emp.firstName, emp.lastName);
    await expect(page.locator('#deleteModal')).toBeVisible();
    await page.locator('#deleteModal [data-dismiss="modal"]').click();
    await expect(page.locator('#employeesTable')).toContainText(emp.firstName);

    await dashboard.openDeleteModal(emp.firstName, emp.lastName);
    await dashboard.confirmDelete();
  });
});

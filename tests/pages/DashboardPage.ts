import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly employeeRows: Locator;

  constructor(private page: Page) {
    this.employeeRows = page.locator('#employeesTable tbody tr');
  }

  async goto() {
    await this.page.goto('/Benefits');
  }

  async addEmployeeCount(): Promise<number> {
    return this.employeeRows.count();
  }

  async openAddModal() {
    await this.page.locator('#add').click();
  }

  async openEditModal(firstName: string, lastName: string) {
    await this.rowFor(firstName, lastName).locator('.fa-edit').click();
  }

  async openDeleteModal(firstName: string, lastName: string) {
    await this.rowFor(firstName, lastName).locator('.fa-times').click();
  }

  async confirmDelete() {
    await this.page.locator('#deleteEmployee').click();
  }

  async getEmployeeData(firstName: string, lastName: string) {
    const cells = this.rowFor(firstName, lastName).locator('td');
    return {
      salary:       await cells.nth(4).textContent(),
      benefitsCost: await cells.nth(6).textContent(),
      net:          await cells.nth(7).textContent(),
    };
  }

  private rowFor(firstName: string, lastName: string): Locator {
    return this.page
      .locator('#employeesTable tbody tr')
      .filter({ hasText: firstName })
      .filter({ hasText: lastName });
  }
}

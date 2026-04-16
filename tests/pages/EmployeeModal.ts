import { Page, Locator } from '@playwright/test';

export interface EmployeeData {
  firstName: string;
  lastName: string;
  dependants: number;
}

export class EmployeeModal {
  readonly modal: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly dependantsInput: Locator;

  constructor(private page: Page) {
    this.modal           = page.locator('#employeeModal');
    this.firstNameInput  = page.locator('#firstName');
    this.lastNameInput   = page.locator('#lastName');
    this.dependantsInput = page.locator('#dependants');
  }

  async waitForOpen() {
    await this.modal.waitFor({ state: 'visible' });
  }

  async waitForClose() {
    await this.modal.waitFor({ state: 'hidden' });
  }

  async fill(data: EmployeeData) {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.dependantsInput.fill(String(data.dependants));
  }

  async save() {
    await this.page.locator('#addEmployee').click();
  }

  // Fills and clicks save. Does NOT wait for close — call waitForClose() explicitly on success paths.
  async submit(data: EmployeeData) {
    await this.fill(data);
    await this.save();
  }
}

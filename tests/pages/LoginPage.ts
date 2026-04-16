import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly errorMessage: Locator;

  constructor(private page: Page) {
    this.errorMessage = page.locator('.validation-summary-errors');
  }

  async goto() {
    await this.page.goto('/Account/Login');
  }

  async login(username: string, password: string) {
    await this.page.locator('#Username').fill(username);
    await this.page.locator('#Password').fill(password);
    await this.page.locator('button[type="submit"]').click();
  }
}

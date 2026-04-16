import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CREDENTIALS } from '../helpers/constants';

export const test = base.extend<{ authenticatedDashboard: DashboardPage }>({
  authenticatedDashboard: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';

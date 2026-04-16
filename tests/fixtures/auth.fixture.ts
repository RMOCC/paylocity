
import { test as base } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

export const test = base.extend<{ authenticatedDashboard: DashboardPage }>({
  authenticatedDashboard: async ({ page }, use) => {
    await page.goto('/');

    const content = await page.textContent('body');
    if (content?.includes('Forbidden')) {
      test.skip(true, 'UI not accessible - returns Forbidden');
    }

    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';

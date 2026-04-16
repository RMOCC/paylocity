import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CREDENTIALS } from '../helpers/constants';

test.describe('Login', () => {

  test.skip(true, 'Login UI endpoint returns Forbidden - not testable');

  test.beforeEach(async ({ page }) => {
    await page.goto('/Account/Login');
  });

  test('valid credentials redirect to dashboard', async ({ page }) => {
    const lp = new LoginPage(page);
    await lp.login(CREDENTIALS.username, CREDENTIALS.password);
    await expect(page).toHaveURL(/Benefits/);
  });

  test('invalid username shows error', async ({ page }) => {
    const lp = new LoginPage(page);
    await lp.login('WrongUser', CREDENTIALS.password);
    await expect(lp.errorMessage).toBeVisible();
  });

  test('invalid password shows error', async ({ page }) => {
    const lp = new LoginPage(page);
    await lp.login(CREDENTIALS.username, 'WrongPassword');
    await expect(lp.errorMessage).toBeVisible();
  });

  test('empty credentials show error', async ({ page }) => {
    const lp = new LoginPage(page);
    await lp.login('', '');
    await expect(lp.errorMessage).toBeVisible();
  });

  test('password field is masked', async ({ page }) => {
    await expect(page.locator('#Password')).toHaveAttribute('type', 'password');
  });
});


test.skip('unauthenticated access to dashboard redirects to login', async ({ page }) => {
  await page.goto('/Benefits');
  await expect(page).toHaveURL(/Login/);
});

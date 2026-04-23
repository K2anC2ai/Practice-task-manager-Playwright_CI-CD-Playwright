import { test, expect } from '@playwright/test';

/**
 * Auth Test Suite
 * ไม่ใช้ storageState เพราะ test เหล่านี้ต้องการ fresh session
 * จึง override ด้วย storageState: undefined
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('TC-AUTH-01: login สำเร็จ redirect ไป /tasks', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill('test@taskmanager.dev');
    await page.getByTestId('login-password').fill('Test@1234');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/tasks');
  });

  test('TC-AUTH-02: login ด้วย password ผิด แสดง error', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill('test@taskmanager.dev');
    await page.getByTestId('login-password').fill('wrongpassword');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('TC-AUTH-03: register user ใหม่ auto-login แล้ว redirect /tasks', async ({ page }) => {
    const ts = Date.now();
    await page.goto('/register');
    await page.getByTestId('register-name').fill('New Tester');
    await page.getByTestId('register-email').fill(`tester_${ts}@test.dev`);
    await page.getByTestId('register-password').fill('Password@123');
    await page.getByTestId('register-submit').click();
    await expect(page).toHaveURL('/tasks');
  });

  test('TC-AUTH-04: เข้า /tasks โดยไม่ login → redirect /login', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page).toHaveURL('/login');
  });

  test('TC-AUTH-05: logout redirect กลับ /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill('test@taskmanager.dev');
    await page.getByTestId('login-password').fill('Test@1234');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/tasks');

    await page.getByTestId('logout-btn').click();
    await expect(page).toHaveURL('/login');
  });

  test('TC-AUTH-06: register email ซ้ำ แสดง error', async ({ page }) => {
    await page.goto('/register');
    await page.getByTestId('register-name').fill('Duplicate');
    await page.getByTestId('register-email').fill('test@taskmanager.dev');
    await page.getByTestId('register-password').fill('Password@123');
    await page.getByTestId('register-submit').click();
    await expect(page.getByTestId('register-error')).toBeVisible();
  });
});

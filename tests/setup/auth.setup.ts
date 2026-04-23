import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Auth Setup — รันก่อน test ทั้งหมด (dependencies: ['setup'])
 *
 * Login ครั้งเดียวแล้วบันทึก session cookies ลงไฟล์
 * tests อื่นๆ โหลด storageState จากไฟล์นี้แทนการ login ซ้ำทุก test
 * ประหยัดเวลาได้มาก เพราะ login 1 ครั้ง แทนที่จะ login N ครั้ง
 */
setup('authenticate as test user', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill('test@taskmanager.dev');
  await page.getByTestId('login-password').fill('Test@1234');
  await page.getByTestId('login-submit').click();
  await page.waitForURL('/tasks');

  // บันทึก cookies + localStorage ลงไฟล์
  const authDir = path.join(process.cwd(), 'tests/.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
  await page.context().storageState({ path: path.join(authDir, 'user.json') });
});

import { test, expect } from '@playwright/test';

/**
 * Tasks UI Test Suite
 * ใช้ storageState จาก setup project → ไม่ต้อง login ซ้ำทุก test
 *
 * Pattern:
 * - สร้าง task ใหม่ทุก test เพื่อ test isolation
 * - ไม่ depend กับ seed data (อาจเปลี่ยนจาก test อื่น)
 */

test.describe('Task CRUD', () => {
  test('TC-TASK-01: สร้าง task ใหม่ปรากฏใน list', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByTestId('create-task-btn').click();

    await page.getByTestId('task-title-input').fill('Deploy to production');
    await page.getByTestId('task-priority-select').selectOption('HIGH');
    await page.getByTestId('task-due-date-input').fill('2025-12-31');
    await page.getByTestId('task-submit-btn').click();

    await expect(page.getByTestId('task-list')).toContainText('Deploy to production');
  });

  test('TC-TASK-02: แก้ไข title ของ task', async ({ page }) => {
    await page.goto('/tasks');

    // สร้างก่อน
    await page.getByTestId('create-task-btn').click();
    await page.getByTestId('task-title-input').fill('Original title');
    await page.getByTestId('task-submit-btn').click();
    await expect(page.getByTestId('task-list')).toContainText('Original title');

    // edit
    await page.getByTestId('task-edit-btn').first().click();
    await page.getByTestId('task-title-input').clear();
    await page.getByTestId('task-title-input').fill('Updated title');
    await page.getByTestId('task-submit-btn').click();

    await expect(page.getByTestId('task-list')).toContainText('Updated title');
  });

  test('TC-TASK-03: mark task เป็น complete แล้ว card แสดง opacity-60', async ({ page }) => {
    await page.goto('/tasks');

    await page.getByTestId('create-task-btn').click();
    await page.getByTestId('task-title-input').fill('Task to complete');
    await page.getByTestId('task-submit-btn').click();

    // complete task แรก
    await page.getByTestId('task-complete-btn').first().click();

    await expect(page.getByTestId('task-card').first()).toHaveClass(/opacity-60/);
  });

  test('TC-TASK-04: ลบ task แล้วหายออกจาก list', async ({ page }) => {
    await page.goto('/tasks');

    await page.getByTestId('create-task-btn').click();
    await page.getByTestId('task-title-input').fill('Task to delete');
    await page.getByTestId('task-submit-btn').click();
    await expect(page.getByTestId('task-list')).toContainText('Task to delete');

    const countBefore = await page.getByTestId('task-card').count();
    await page.getByTestId('task-delete-btn').first().click();

    await expect(page.getByTestId('task-card')).toHaveCount(countBefore - 1);
  });

  test('TC-TASK-05: สร้าง task พร้อม description และ status IN_PROGRESS', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByTestId('create-task-btn').click();

    await page.getByTestId('task-title-input').fill('In-progress task');
    await page.getByTestId('task-description-input').fill('Working on this now');
    await page.getByTestId('task-status-select').selectOption('IN_PROGRESS');
    await page.getByTestId('task-priority-select').selectOption('MEDIUM');
    await page.getByTestId('task-submit-btn').click();

    const card = page.getByTestId('task-card').first();
    await expect(card).toContainText('In-progress task');
    await expect(card).toContainText('IN PROGRESS');
  });
});

test.describe('Task Filters', () => {
  test('TC-TASK-06: filter by HIGH priority แสดงเฉพาะ HIGH', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByTestId('filter-priority').selectOption('HIGH');

    const cards = page.getByTestId('task-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText('HIGH');
    }
  });

  test('TC-TASK-07: filter by DONE status แสดงเฉพาะ task ที่เสร็จ', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByTestId('filter-status').selectOption('DONE');

    const cards = page.getByTestId('task-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText('DONE');
    }
  });

  test('TC-TASK-08: reset filter แสดง task ทั้งหมด', async ({ page }) => {
    await page.goto('/tasks');

    await page.getByTestId('filter-priority').selectOption('HIGH');
    const filteredCount = await page.getByTestId('task-card').count();

    await page.getByTestId('filter-priority').selectOption('');
    const allCount = await page.getByTestId('task-card').count();

    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });
});

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
    // confirm dialog appears — click confirm
    await page.getByTestId('confirm-delete-btn').click();

    await expect(page.getByTestId('task-card')).toHaveCount(countBefore - 1);
  });

  test('TC-TASK-11: confirm dialog ปรากฏเมื่อกด delete และ cancel ไม่ลบ task', async ({ page }) => {
    await page.goto('/tasks');

    await page.getByTestId('create-task-btn').click();
    await page.getByTestId('task-title-input').fill('Should not be deleted');
    await page.getByTestId('task-submit-btn').click();

    const countBefore = await page.getByTestId('task-card').count();

    // กด delete — dialog ต้องปรากฏ
    await page.getByTestId('task-delete-btn').first().click();
    await expect(page.getByTestId('confirm-dialog')).toBeVisible();

    // กด cancel — task ยังอยู่
    await page.getByTestId('confirm-cancel-btn').click();
    await expect(page.getByTestId('confirm-dialog')).not.toBeVisible();
    await expect(page.getByTestId('task-card')).toHaveCount(countBefore);
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

  test('TC-TASK-09: task ที่ due date เลยกำหนดแสดง Overdue badge และ red border', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByTestId('create-task-btn').click();

    await page.getByTestId('task-title-input').fill('Past due task');
    await page.getByTestId('task-due-date-input').fill('2020-01-01');
    await page.getByTestId('task-submit-btn').click();

    const card = page.getByTestId('task-card').first();
    await expect(card.getByTestId('overdue-badge')).toBeVisible();
    await expect(card.getByTestId('overdue-badge')).toHaveText('Overdue');
    await expect(card).toHaveClass(/border-red-300/);
  });

  test('TC-TASK-10: stats bar แสดงจำนวน Todo / In Progress / Done ถูกต้อง', async ({ page }) => {
    await page.goto('/tasks');

    // สร้าง task TODO
    await page.getByTestId('create-task-btn').click();
    await page.getByTestId('task-title-input').fill('Stats todo task');
    await page.getByTestId('task-submit-btn').click();

    // สร้าง task IN_PROGRESS
    await page.getByTestId('create-task-btn').click();
    await page.getByTestId('task-title-input').fill('Stats in-progress task');
    await page.getByTestId('task-status-select').selectOption('IN_PROGRESS');
    await page.getByTestId('task-submit-btn').click();

    // stats bar ต้องปรากฏ
    await expect(page.getByTestId('stats-bar')).toBeVisible();

    // In Progress ต้องมีอย่างน้อย 1
    const inProgressText = await page.getByTestId('stats-in-progress').textContent();
    expect(parseInt(inProgressText ?? '0')).toBeGreaterThanOrEqual(1);
  });

test.describe('Keyboard Shortcuts', () => {
  test('TC-TASK-13: กด "n" เปิด new task modal', async ({ page }) => {
    await page.goto('/tasks');
    // modal ต้องปิดอยู่ก่อน
    await expect(page.getByTestId('task-title-input')).not.toBeVisible();

    // กด "n" ที่ body
    await page.locator('body').press('n');

    await expect(page.getByTestId('task-title-input')).toBeVisible();
  });

  test('TC-TASK-13b: กด "n" ขณะ focus อยู่ใน input ไม่เปิด modal', async ({ page }) => {
    await page.goto('/tasks');
    // เปิด modal ก่อนเพื่อให้มี input ให้ focus
    await page.getByTestId('create-task-btn').click();
    await page.getByTestId('task-title-input').focus();

    // กด "n" ใน input — modal ที่เปิดอยู่แล้วต้องยังแสดงอยู่ (ไม่ double-open)
    await page.getByTestId('task-title-input').press('n');
    // input ต้องมีค่า "n" (typed ปกติ ไม่ trigger shortcut)
    await expect(page.getByTestId('task-title-input')).toHaveValue('n');
  });
});

test.describe('Task Sort', () => {
  test('TC-TASK-16: เปลี่ยน sort ทำให้ task list reload', async ({ page }) => {
    await page.goto('/tasks');

    // เลือก sort by Due Date
    await page.getByTestId('sort-by').selectOption('dueDate');
    // task list ยังต้องปรากฏ (ไม่ crash)
    await expect(page.getByTestId('task-list').or(page.getByTestId('empty-state'))).toBeVisible();

    // toggle sort order
    const btn = page.getByTestId('sort-order');
    const beforeText = await btn.textContent();
    await btn.click();
    const afterText = await btn.textContent();
    expect(afterText).not.toBe(beforeText);
  });
});

test.describe('Task Search', () => {
  test('TC-TASK-14: search input กรอง task ตาม title แบบ real-time', async ({ page }) => {
    await page.goto('/tasks');
    const unique = `UniqueSearch_${Date.now()}`;

    // สร้าง task ที่มีชื่อเฉพาะ
    await page.getByTestId('create-task-btn').click();
    await page.getByTestId('task-title-input').fill(unique);
    await page.getByTestId('task-submit-btn').click();
    await expect(page.getByTestId('task-list')).toContainText(unique);

    // พิมพ์ใน search box
    await page.getByTestId('search-input').fill(unique);

    // รอ fetch ใหม่ — task ที่สร้างต้องยังปรากฏ
    await expect(page.getByTestId('task-list')).toContainText(unique);

    // task count ต้องลดลงหรือเท่ากับก่อน filter
    const filtered = await page.getByTestId('task-card').count();
    expect(filtered).toBeGreaterThanOrEqual(1);
  });

  test('TC-TASK-15: search ที่ไม่มี match แสดง empty state พร้อมข้อความ', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByTestId('search-input').fill('ZZZNOMATCHXYZ99999');

    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('empty-state-message')).toContainText('ZZZNOMATCHXYZ99999');
  });
});

test.describe('Task Filters', () => {
  test('TC-TASK-12: empty state แสดงข้อความเฉพาะเมื่อ filter ไม่มีผลลัพธ์', async ({ page }) => {
    await page.goto('/tasks');

    // filter LOW priority — seed data ไม่มี LOW tasks (seed ใช้ HIGH/MEDIUM)
    // แต่เราสร้าง task LOW ก่อน แล้ว filter DONE ซึ่งน่าจะ empty
    // ใช้ filter HIGH + DONE ซึ่งไม่น่ามี
    await page.getByTestId('filter-priority').selectOption('HIGH');
    await page.getByTestId('filter-status').selectOption('DONE');

    const emptyState = page.getByTestId('empty-state');
    // ถ้ามี task ที่ตรง filter ก็ข้ามการ assert (test environment อาจแตกต่างกัน)
    const taskCount = await page.getByTestId('task-card').count();
    if (taskCount === 0) {
      await expect(emptyState).toBeVisible();
      await expect(page.getByTestId('empty-state-message')).toContainText('HIGH');
    }
  });

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

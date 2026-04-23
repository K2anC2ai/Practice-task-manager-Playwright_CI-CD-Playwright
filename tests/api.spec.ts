import { test, expect } from '@playwright/test';

/**
 * API Test Suite — ทดสอบ REST endpoints โดยตรง
 *
 * ใช้ storageState จาก setup project ทำให้ request มี session cookies
 * และผ่าน auth middleware ได้โดยไม่ต้อง login ใน browser
 */

test.describe('Tasks API — authenticated', () => {

  test('TC-API-01: GET /api/tasks คืน paginated response', async ({ request }) => {
    const res = await request.get('/api/tasks');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.total).toBe('number');
    expect(typeof body.page).toBe('number');
    expect(typeof body.totalPages).toBe('number');
  });

  test('TC-API-02: POST /api/tasks สร้าง task และคืน 201', async ({ request }) => {
    const res = await request.post('/api/tasks', {
      data: { title: 'API created task', priority: 'HIGH' },
    });
    expect(res.status()).toBe(201);
    const task = await res.json();
    expect(task.title).toBe('API created task');
    expect(task.priority).toBe('HIGH');
    expect(task.id).toBeTruthy();
  });

  test('TC-API-03: POST /api/tasks ไม่มี title คืน 400', async ({ request }) => {
    const res = await request.post('/api/tasks', {
      data: { priority: 'LOW' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('TC-API-04: PUT /api/tasks/:id update status เป็น DONE', async ({ request }) => {
    // สร้าง task ก่อน
    const createRes = await request.post('/api/tasks', {
      data: { title: 'Task to update' },
    });
    const { id } = await createRes.json();

    const res = await request.put(`/api/tasks/${id}`, {
      data: { status: 'DONE' },
    });
    expect(res.status()).toBe(200);
    const updated = await res.json();
    expect(updated.status).toBe('DONE');
  });

  test('TC-API-05: DELETE /api/tasks/:id ลบ task และคืน success', async ({ request }) => {
    const createRes = await request.post('/api/tasks', {
      data: { title: 'Task to delete via API' },
    });
    const { id } = await createRes.json();

    const res = await request.delete(`/api/tasks/${id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('TC-API-06: PUT task ที่ไม่มีอยู่คืน 404', async ({ request }) => {
    const res = await request.put('/api/tasks/nonexistent-id-12345', {
      data: { status: 'DONE' },
    });
    expect(res.status()).toBe(404);
  });

  test('TC-API-07: GET /api/tasks?priority=HIGH filter ถูกต้อง', async ({ request }) => {
    const res = await request.get('/api/tasks?priority=HIGH');
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    data.forEach((t: { priority: string }) => {
      expect(t.priority).toBe('HIGH');
    });
  });

  test('TC-API-11: GET /api/tasks?search= filter by title', async ({ request }) => {
    const unique = `SearchMe_${Date.now()}`;
    await request.post('/api/tasks', { data: { title: unique } });

    const res = await request.get(`/api/tasks?search=${unique}`);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(1);
    data.forEach((t: { title: string }) => {
      expect(t.title).toContain(unique);
    });
  });

  test('TC-API-12: GET /api/tasks?search=xxx ที่ไม่มีผลลัพธ์คืน data ว่าง', async ({ request }) => {
    const res = await request.get('/api/tasks?search=ZZZNOMATCHXYZ99999');
    expect(res.status()).toBe(200);
    const { data, total } = await res.json();
    expect(data).toEqual([]);
    expect(total).toBe(0);
  });

  test('TC-API-14: GET /api/tasks?sortBy=dueDate&sortOrder=asc เรียงลำดับถูกต้อง', async ({ request }) => {
    // สร้าง tasks ที่มี dueDate ต่างกัน
    await request.post('/api/tasks', { data: { title: 'Sort task A', dueDate: '2025-01-01' } });
    await request.post('/api/tasks', { data: { title: 'Sort task B', dueDate: '2025-06-01' } });

    const res = await request.get('/api/tasks?sortBy=dueDate&sortOrder=asc&limit=100');
    expect(res.status()).toBe(200);
    const { data } = await res.json();

    // กรองเฉพาะ task ที่มี dueDate
    const withDueDate = data.filter((t: { dueDate: string | null }) => t.dueDate !== null);
    for (let i = 1; i < withDueDate.length; i++) {
      expect(new Date(withDueDate[i].dueDate).getTime()).toBeGreaterThanOrEqual(new Date(withDueDate[i - 1].dueDate).getTime());
    }
  });

  test('TC-API-13: GET /api/tasks?page=1&limit=2 คืน max 2 tasks', async ({ request }) => {
    // สร้าง tasks มากพอ
    for (let i = 0; i < 3; i++) {
      await request.post('/api/tasks', { data: { title: `Paged task ${i}` } });
    }

    const res = await request.get('/api/tasks?page=1&limit=2');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(2);
    expect(body.totalPages).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Tasks API — unauthenticated', () => {
  // override storageState เป็น empty → request ไม่มี session
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC-API-08: GET /api/tasks ไม่ login คืน 401', async ({ request }) => {
    const res = await request.get('/api/tasks');
    expect(res.status()).toBe(401);
  });

  test('TC-API-09: POST /api/tasks ไม่ login คืน 401', async ({ request }) => {
    const res = await request.post('/api/tasks', {
      data: { title: 'Should fail' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Register API', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC-API-10: POST /api/register สร้าง user ใหม่คืน 201', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post('/api/register', {
      data: { name: 'API Tester', email: `api_${ts}@test.dev`, password: 'Pass@1234' },
    });
    expect(res.status()).toBe(201);
    const user = await res.json();
    expect(user.email).toContain('@test.dev');
  });

  test('TC-API-11: POST /api/register email ซ้ำคืน 409', async ({ request }) => {
    const res = await request.post('/api/register', {
      data: { name: 'Dup', email: 'test@taskmanager.dev', password: 'Pass@1234' },
    });
    expect(res.status()).toBe(409);
  });
});

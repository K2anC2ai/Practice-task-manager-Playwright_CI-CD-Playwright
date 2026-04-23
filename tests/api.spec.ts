import { test, expect } from '@playwright/test';

/**
 * API Test Suite — ทดสอบ REST endpoints โดยตรง
 *
 * ใช้ storageState จาก setup project ทำให้ request มี session cookies
 * และผ่าน auth middleware ได้โดยไม่ต้อง login ใน browser
 */

test.describe('Tasks API — authenticated', () => {
  let createdTaskId: string;

  test('TC-API-01: GET /api/tasks คืน array', async ({ request }) => {
    const res = await request.get('/api/tasks');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
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
    createdTaskId = task.id;
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
    const tasks = await res.json();
    tasks.forEach((t: { priority: string }) => {
      expect(t.priority).toBe('HIGH');
    });
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

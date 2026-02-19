const { test, expect } = require('@playwright/test');
const { TEST_DATE, PREFIX } = require('../helpers/test-constants');

test.describe('Daily Notes API', () => {
  const memoContent = `${PREFIX}memo_${Date.now()}`;
  const todoContent = `${PREFIX}todo_${Date.now()}`;

  test.beforeAll(async ({ request }) => {
    // Clean slate — remove any leftover test file from previous runs
    await request.delete(`/api/vm/delete?path=00.Daily/${TEST_DATE}.md`);
  });

  test('POST /api/daily/:date creates a memo', async ({ request }) => {
    const res = await request.post(`/api/daily/${TEST_DATE}`, {
      data: {
        content: memoContent,
        tags: ['e2e-test'],
        section: '메모',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok || body.success).toBeTruthy();
  });

  test('GET /api/daily/:date returns the note', async ({ request }) => {
    const res = await request.get(`/api/daily/${TEST_DATE}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.body).toContain(memoContent);
  });

  test('POST /api/daily/:date creates a todo', async ({ request }) => {
    const res = await request.post(`/api/daily/${TEST_DATE}`, {
      data: {
        content: todoContent,
        tags: [],
        section: '오늘할일',
        priority: '높음',
      },
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/daily/:date/todos returns todo items', async ({ request }) => {
    const res = await request.get(`/api/daily/${TEST_DATE}/todos`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.todos).toBeDefined();
    expect(Array.isArray(body.todos)).toBe(true);
    // Find our specific todo by exact content
    const found = body.todos.find((t) => t.text.includes(todoContent));
    expect(found).toBeTruthy();
    expect(found.done).toBe(false);
  });

  test('POST /api/todo/toggle toggles a todo', async ({ request }) => {
    const listRes = await request.get(`/api/daily/${TEST_DATE}/todos`);
    const { todos } = await listRes.json();
    const target = todos.find((t) => t.text.includes(todoContent));
    expect(target).toBeTruthy();

    // Toggle it
    const res = await request.post('/api/todo/toggle', {
      data: { date: TEST_DATE, lineIndex: target.lineIndex },
    });
    expect(res.status()).toBe(200);

    // Verify toggled
    const afterRes = await request.get(`/api/daily/${TEST_DATE}/todos`);
    const after = await afterRes.json();
    const toggled = after.todos.find((t) => t.text.includes(todoContent));
    expect(toggled).toBeTruthy();
    expect(toggled.done).toBe(true);
  });

  test('GET /api/daily/:date returns 404 for nonexistent date', async ({ request }) => {
    const res = await request.get('/api/daily/2099-01-01');
    expect(res.status()).toBe(404);
  });

  test.afterAll(async ({ request }) => {
    await request.delete(`/api/vm/delete?path=00.Daily/${TEST_DATE}.md`);
  });
});

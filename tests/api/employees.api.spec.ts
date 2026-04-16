import { test, expect } from '@playwright/test';
import { BENEFITS, calculateBenefitsCost, calculateGross, calculateNet } from '../helpers/constants';
import { createEmployee, deleteEmployee, authHeaders, API_URL } from '../helpers/api';

test.describe('Authentication', () => {
  test('missing auth header returns 401', async ({ request }) => {
    expect((await request.get(API_URL)).status()).toBe(401);
  });

  test('invalid auth token returns 401', async ({ request }) => {
    expect((await request.get(API_URL, { headers: { Authorization: 'Basic InvalidToken' } })).status()).toBe(401);
  });

  test('valid auth returns 200', async ({ request }) => {
    expect((await request.get(API_URL, { headers: authHeaders })).status()).toBe(200);
  });
});

test.describe('GET /api/Employees', () => {
  test('returns array of employees', async ({ request }) => {
    const res = await request.get(API_URL, { headers: authHeaders });
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBeTruthy();
  });

  test('employees have required fields', async ({ request }) => {
    const employees = await (await request.get(API_URL, { headers: authHeaders })).json();
    if (employees.length === 0) test.skip();
    expect(employees[0]).toMatchObject({
      id: expect.anything(),
      firstName: expect.anything(),
      lastName: expect.anything(),
      dependants: expect.anything(),
      salary: expect.anything(),
      gross: expect.anything(),
      benefitsCost: expect.anything(),
      net: expect.anything(),
    });
  });
});

test.describe('GET /api/Employees/:id', () => {
  let id: string;

  test.beforeAll(async ({ request }) => {
    id = (await (await createEmployee(request, { firstName: 'GetById', lastName: 'Test' })).json()).id;
  });

  test.afterAll(async ({ request }) => {
    await deleteEmployee(request, id);
  });

  test('returns employee by valid id', async ({ request }) => {
    const body = await (await request.get(`${API_URL}/${id}`, { headers: authHeaders })).json();
    expect(body).toMatchObject({ id, firstName: 'GetById' });
  });

  test('returns 404 for unknown id', async ({ request }) => {
    const res = await request.get(`${API_URL}/00000000-0000-0000-0000-000000000000`, { headers: authHeaders });
    expect(res.status()).toBe(404);
  });

  test('returns client error for malformed id', async ({ request }) => {
    const res = await request.get(`${API_URL}/not-a-uuid`, { headers: authHeaders });
    expect([400, 404, 500]).toContain(res.status());
  });
});

test.describe('POST /api/Employees', () => {
  const cleanup: string[] = [];

  test.afterAll(async ({ request }) => {
    await Promise.all(cleanup.map(id => deleteEmployee(request, id)));
  });

  async function create(request: any, overrides: Record<string, unknown> = {}) {
    const res = await createEmployee(request, overrides);
    const body = await res.json();
    if (body.id) cleanup.push(body.id);
    return { res, body };
  }

  test('creates employee and returns data', async ({ request }) => {
    const { res, body } = await create(request, { firstName: 'New', lastName: 'Emp', dependants: 2 });
    expect(res.status()).toBe(200);
    expect(body).toMatchObject({ firstName: 'New', lastName: 'Emp', dependants: 2 });
  });

  test('salary is $2000 per paycheck', async ({ request }) => {
    const { body } = await create(request);
    expect(body.salary).toBeCloseTo(BENEFITS.salaryPerPaycheck, 2);
  });

  test('gross is salary × 26 paychecks', async ({ request }) => {
    const { body } = await create(request);
    expect(body.gross).toBeCloseTo(calculateGross(), 2);
  });

  for (const dependants of [0, 1, 2, 32]) {
    test(`calculates benefitsCost and net for ${dependants}`, async ({ request }) => {
      const { body } = await create(request, { dependants });
      expect(body.benefitsCost).toBeCloseTo(calculateBenefitsCost(dependants), 2);
      expect(body.net).toBeCloseTo(calculateNet(dependants), 2);
    });
  }

  test('returns 400 when firstName missing', async ({ request }) => {
    expect((await createEmployee(request, { firstName: undefined, lastName: 'X', dependants: 0 })).status()).toBe(400);
  });

  test('returns 400 when lastName missing', async ({ request }) => {
    expect((await createEmployee(request, { lastName: undefined, firstName: 'X', dependants: 0 })).status()).toBe(400);
  });

  test('rejects whitespace-only firstName', async ({ request }) => {
    expect((await createEmployee(request, { firstName: '   ' })).status()).toBe(400);
  });

  test('rejects whitespace-only lastName', async ({ request }) => {
    expect((await createEmployee(request, { lastName: '   ' })).status()).toBe(400);
  });

  test('rejects float dependants', async ({ request }) => {
    const res = await createEmployee(request, { dependants: 1.5 });
    expect(res.status()).toBe(400);
  });

  test('accepts 0 dependants', async ({ request }) => {
    const { res } = await create(request, { dependants: 0 });
    expect(res.status()).toBe(200);
  });

  test('accepts 32 dependants', async ({ request }) => {
    const { res } = await create(request, { dependants: 32 });
    expect(res.status()).toBe(200);
  });

  test('rejects 33 dependants', async ({ request }) => {
    expect((await createEmployee(request, { dependants: 33 })).status()).toBe(400);
  });

  test('rejects negative dependants', async ({ request }) => {
    expect((await createEmployee(request, { dependants: -1 })).status()).toBe(400);
  });

  test('accepts firstName length 50', async ({ request }) => {
    const { res } = await create(request, { firstName: 'A'.repeat(50) });
    expect(res.status()).toBe(200);
  });

  test('rejects firstName length > 50', async ({ request }) => {
    expect((await createEmployee(request, { firstName: 'A'.repeat(51) })).status()).toBe(400);
  });

  test('accepts lastName length 50', async ({ request }) => {
    const { res } = await create(request, { lastName: 'B'.repeat(50) });
    expect(res.status()).toBe(200);
  });

  test('rejects lastName length > 50', async ({ request }) => {
    expect((await createEmployee(request, { lastName: 'B'.repeat(51) })).status()).toBe(400);
  });
});

test.describe('DELETE /api/Employees/:id', () => {
  test('deletes employee (soft/hard)', async ({ request }) => {
    const { id } = await (await createEmployee(request)).json();

    await deleteEmployee(request, id);

    const res = await request.get(`${API_URL}/${id}`, { headers: authHeaders });

    expect([200, 404]).toContain(res.status());
  });

  test('returns 404 for unknown id', async ({ request }) => {
    expect((await deleteEmployee(request, '00000000-0000-0000-0000-000000000001')).status()).toBe(404);
  });
});
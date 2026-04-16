import { CREDENTIALS, BASE_URL } from './constants';

export const API_URL = `${BASE_URL}/api/Employees`;

export const authHeaders = {
  'Authorization': CREDENTIALS.authHeader,
  'Content-Type': 'application/json',
};

export async function createEmployee(request: any, overrides: Record<string, unknown> = {}) {
  return request.post(API_URL, {
    headers: authHeaders,
    data: { firstName: 'Petr', lastName: 'Novotny', dependants: 0, username: CREDENTIALS.username, ...overrides },
  });
}

export async function deleteEmployee(request: any, id: string) {
  return request.delete(`${API_URL}/${id}`, { headers: authHeaders });
}

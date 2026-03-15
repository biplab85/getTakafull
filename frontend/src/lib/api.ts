const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface FetchOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(rest.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...rest,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw { status: res.status, ...error };
  }

  return res.json();
}

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  register: (data: Record<string, string>) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  logout: (token: string) =>
    apiFetch('/auth/logout', { method: 'POST', token }),

  getUser: (token: string) =>
    apiFetch('/auth/user', { token }),

  updateProfile: (token: string, data: FormData) => {
    data.append('_method', 'PUT');
    return apiFetch('/auth/profile', { method: 'POST', token, body: data });
  },

  updatePassword: (token: string, data: Record<string, string>) =>
    apiFetch('/auth/password', { method: 'PUT', token, body: JSON.stringify(data) }),

  sendOtp: (email: string) =>
    apiFetch('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) }),

  verifyOtp: (email: string, otp: string) =>
    apiFetch('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),

  forgotPassword: (email: string) =>
    apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
};

// Dashboard API
export const dashboardApi = {
  stats: (token: string) =>
    apiFetch('/dashboard/stats', { token }),

  pendingVotes: (token: string) =>
    apiFetch('/dashboard/pending-votes', { token }),

  recentClaims: (token: string) =>
    apiFetch('/dashboard/recent-claims', { token }),
};

// Groups API
export const groupsApi = {
  myGroups: (token: string) =>
    apiFetch('/groups/my', { token }),

  joinedGroups: (token: string) =>
    apiFetch('/groups/joined', { token }),

  create: (token: string, data: Record<string, unknown>) =>
    apiFetch('/groups', { method: 'POST', token, body: JSON.stringify(data) }),

  show: (token: string, id: number) =>
    apiFetch(`/groups/${id}`, { token }),

  showByToken: (groupToken: string) =>
    apiFetch(`/groups/token/${groupToken}`),

  join: (token: string, id: number, data?: Record<string, unknown>) =>
    apiFetch(`/groups/${id}/join`, { method: 'POST', token, body: JSON.stringify(data || {}) }),

  invite: (token: string, id: number, emails: string[]) =>
    apiFetch(`/groups/${id}/invite`, { method: 'POST', token, body: JSON.stringify({ emails }) }),

  claims: (token: string, id: number) =>
    apiFetch(`/groups/${id}/claims`, { token }),
};

// Payments API
export const paymentsApi = {
  createCheckout: (token: string, groupId: number, formData?: Record<string, unknown>) =>
    apiFetch<{ checkout_url: string; session_id: string }>(`/groups/${groupId}/checkout`, {
      method: 'POST', token, body: JSON.stringify({ form_data: formData || {} }),
    }),

  verifySession: (token: string, groupId: number, sessionId: string) =>
    apiFetch<{ message: string; group_id: number }>(`/groups/${groupId}/verify-session`, {
      method: 'POST', token, body: JSON.stringify({ session_id: sessionId }),
    }),

  history: (token: string) =>
    apiFetch('/payments/history', { token }),
};

// Claims API
export const claimsApi = {
  create: (token: string, data: FormData) =>
    apiFetch('/claims', { method: 'POST', token, body: data }),

  show: (token: string, id: number) =>
    apiFetch(`/claims/${id}`, { token }),

  review: (token: string, id: number, data: { decision: string; reason?: string }) =>
    apiFetch(`/claims/${id}/review`, { method: 'POST', token, body: JSON.stringify(data) }),

  vote: (token: string, id: number, data: { decision: string; comment?: string }) =>
    apiFetch(`/claims/${id}/vote`, { method: 'POST', token, body: JSON.stringify(data) }),
};

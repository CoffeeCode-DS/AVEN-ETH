const TOKEN_KEY = "aven_eth_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError(
      "Can't reach the AVEN-ETH server. Make sure the backend is running on port 4000.",
      0
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new ApiError(data?.error || "Something went wrong. Please try again.", res.status);
  }
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),

  freelancers: () => request("/users/freelancers"),

  dashboard: () => request("/dashboard"),

  agreements: () => request("/agreements"),
  agreement: (id) => request(`/agreements/${id}`),
  createAgreement: (payload) => request("/agreements", { method: "POST", body: payload }),
  fundEscrow: (id) => request(`/agreements/${id}/fund`, { method: "POST" }),
  startProject: (id) => request(`/agreements/${id}/start`, { method: "POST" }),
  workAction: (id, action) => request(`/agreements/${id}/work/${action}`, { method: "POST" }),
  submitWork: (id, payload) => request(`/agreements/${id}/submit`, { method: "POST", body: payload }),
  approve: (id) => request(`/agreements/${id}/approve`, { method: "POST" }),
  requestRevision: (id, feedback) =>
    request(`/agreements/${id}/revision`, { method: "POST", body: { feedback } }),
  reject: (id, reason) => request(`/agreements/${id}/reject`, { method: "POST", body: { reason } }),

  transactions: () => request("/transactions"),

  blockchain: (limit) => request(`/blockchain${limit ? `?limit=${limit}` : ""}`),
  verifyBlockchain: () => request("/blockchain/verify"),
  tamperBlock: (blockNumber, newAmount) =>
    request("/blockchain/tamper", { method: "POST", body: { blockNumber, newAmount } }),
  restoreBlockchain: () => request("/blockchain/restore", { method: "POST" }),

  notifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),
};

import api from './api';

export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (payload) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },
  me: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  updateProfile: async (patch) => {
    const res = await api.put('/auth/profile', patch);
    return res.data;
  },
  changePassword: async (payload) => {
    const res = await api.put('/auth/password', payload);
    return res.data;
  },
  updatePreferences: async (payload) => {
    const res = await api.put('/auth/preferences', payload);
    return res.data;
  },
};

export const bootstrapApi = {
  loadAll: async () => {
    const res = await api.get('/bootstrap');
    return res.data.data;
  },
};

export const ordersApi = {
  list: async (params = {}) => {
    const res = await api.get('/orders', { params });
    return res.data.data;
  },
  create: async (payload) => {
    const res = await api.post('/orders', payload);
    return res.data;
  },
  update: async (id, payload) => {
    const res = await api.put(`/orders/${id}`, payload);
    return res.data.data;
  },
  updateStatus: async (id, status, remarks) => {
    const res = await api.patch(`/orders/${id}/status`, { status, remarks });
    return res.data.data;
  },
  assignStaff: async (id, staffId, remarks) => {
    const res = await api.patch(`/orders/${id}/assign`, { staffId, remarks });
    return res.data.data;
  },
  updateExpectedDate: async (id, expectedCompletionDate) => {
    const res = await api.patch(`/orders/${id}/expected-date`, {
      expectedCompletionDate,
    });
    return res.data.data;
  },
  cancel: async (id, reason) => {
    const res = await api.post(`/orders/${id}/cancel`, { reason });
    return res.data.data;
  },
};

export const customersApi = {
  create: async (payload) => {
    const res = await api.post('/customers', payload);
    return res.data.data;
  },
  update: async (id, payload) => {
    const res = await api.put(`/customers/${id}`, payload);
    return res.data.data;
  },
};

export const servicesApi = {
  create: async (payload) => {
    const res = await api.post('/services', payload);
    return res.data.data;
  },
  update: async (id, payload) => {
    const res = await api.put(`/services/${id}`, payload);
    return res.data.data;
  },
  toggleStatus: async (id) => {
    const res = await api.patch(`/services/${id}/toggle`);
    return res.data.data;
  },
};

export const staffApi = {
  create: async (payload) => {
    const res = await api.post('/staff', payload);
    return res.data.data;
  },
  update: async (id, payload) => {
    const res = await api.put(`/staff/${id}`, payload);
    return res.data.data;
  },
  toggleStatus: async (id) => {
    const res = await api.patch(`/staff/${id}/toggle`);
    return res.data.data;
  },
};

export const paymentsApi = {
  list: async () => {
    const res = await api.get('/payments');
    return res.data.data;
  },
  record: async (payload) => {
    const res = await api.post('/payments', payload);
    return res.data.data;
  },
  update: async (id, payload) => {
    const res = await api.put(`/payments/${id}`, payload);
    return res.data.data;
  },
};

export const inventoryApi = {
  create: async (payload) => {
    const res = await api.post('/inventory', payload);
    return res.data.data;
  },
  update: async (id, payload) => {
    const res = await api.put(`/inventory/${id}`, payload);
    return res.data.data;
  },
  updateStock: async (id, deltaOrExact, mode = 'delta') => {
    const res = await api.patch(`/inventory/${id}/stock`, {
      deltaOrExact,
      mode,
    });
    return res.data.data;
  },
  archive: async (id) => {
    const res = await api.delete(`/inventory/${id}`);
    return res.data.data;
  },
};

export const settingsApi = {
  get: async () => {
    const res = await api.get('/settings');
    return res.data.data;
  },
  update: async (payload) => {
    const res = await api.put('/settings', payload);
    return res.data.data;
  },
};

export const notificationsApi = {
  list: async () => {
    const res = await api.get('/notifications');
    return res.data.data;
  },
  markRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Returns true only when a real user token exists (not guest/default)
export const isLoggedIn = () => {
  const token = localStorage.getItem('wardrobe_token');
  const userId = localStorage.getItem('wardrobe_user_id');
  return !!(
    token && token !== 'undefined' && token !== 'null' && token.trim() !== '' &&
    userId && userId !== 'undefined' && userId !== 'null' && userId !== 'default-user'
  );
};

// Attach JWT token or User ID from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wardrobe_token');
  const userId = localStorage.getItem('wardrobe_user_id');

  if (token && token !== 'undefined' && token !== 'null') {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId && userId !== 'undefined' && userId !== 'null') {
    config.headers['user-id'] = userId;
  } else {
    config.headers['user-id'] = 'default-user';
  }
  return config;
});

// Auto-recover on 401 stale token errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('wardrobe_token');
      localStorage.removeItem('wardrobe_user_id');
      localStorage.removeItem('wardrobe_user_name');
      localStorage.removeItem('wardrobe_user_role');
    }
    return Promise.reject(error);
  }
);

// Wardrobe APIs
export const fetchWardrobeItems = async (category = 'All', search = '') => {
  const response = await api.get('/wardrobe', {
    params: { category, search },
  });
  return response.data;
};

export const fetchWardrobeItemById = async (id) => {
  const response = await api.get(`/wardrobe/${id}`);
  return response.data;
};

export const createWardrobeItem = async (formData) => {
  const response = await api.post('/wardrobe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateWardrobeItem = async (id, formData) => {
  const response = await api.put(`/wardrobe/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteWardrobeItem = async (id) => {
  const response = await api.delete(`/wardrobe/${id}`);
  return response.data;
};

// Wear Tracking APIs
export const recordWear = async (data) => {
  const response = await api.post('/wear', data);
  return response.data;
};

export const fetchTodayOutfit = async () => {
  const response = await api.get('/wear/today');
  return response.data;
};

export const fetchWearHistory = async (params = {}) => {
  const response = await api.get('/wear/history', { params });
  return response.data;
};

export const deleteTodayOutfit = async () => {
  const response = await api.delete('/wear/today');
  return response.data;
};

// Weekly Planner APIs
export const fetchWeeklyPlanner = async () => {
  const response = await api.get('/planner/week');
  return response.data;
};

export const updatePlannerDay = async (data) => {
  const response = await api.post('/planner', data);
  return response.data;
};

export const removePlannerDay = async (day) => {
  const response = await api.delete(`/planner/${day}`);
  return response.data;
};

// AI & Recommendation APIs
export const scanOutfitImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/ai/scan-outfit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const fetchRecommendation = async () => {
  const response = await api.get('/ai/recommendation');
  return response.data;
};

// Saved Combos APIs
export const fetchSavedCombos = async () => {
  const response = await api.get('/combos');
  return response.data;
};

export const createSavedCombo = async (data) => {
  const response = await api.post('/combos', data);
  return response.data;
};

export const deleteSavedCombo = async (id) => {
  const response = await api.delete(`/combos/${id}`);
  return response.data;
};

// User Auth APIs
export const registerUser = async (data) => {
  const response = await api.post('/auth/register', data);
  if (response.data.token) {
    localStorage.setItem('wardrobe_token', response.data.token);
    localStorage.setItem('wardrobe_user_id', response.data.user._id);
    localStorage.setItem('wardrobe_user_name', response.data.user.name);
    localStorage.setItem('wardrobe_user_role', response.data.user.role || 'user');
  }
  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post('/auth/login', data);
  if (response.data.token) {
    localStorage.setItem('wardrobe_token', response.data.token);
    localStorage.setItem('wardrobe_user_id', response.data.user._id);
    localStorage.setItem('wardrobe_user_name', response.data.user.name);
    localStorage.setItem('wardrobe_user_role', response.data.user.role || 'user');
  }
  return response.data;
};

export const getMeUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('wardrobe_token');
  localStorage.removeItem('wardrobe_user_id');
  localStorage.removeItem('wardrobe_user_name');
  localStorage.removeItem('wardrobe_user_role');
};

// Superadmin APIs
export const adminGetUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const adminGetUserWardrobe = async (userId) => {
  const response = await api.get(`/admin/users/${userId}/wardrobe`);
  return response.data;
};

export const adminGetUserHistory = async (userId) => {
  const response = await api.get(`/admin/users/${userId}/history`);
  return response.data;
};

export const adminDeleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const adminUpdateUserRole = async (userId, role) => {
  const response = await api.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const adminResetUserPassword = async (userId, newPassword) => {
  const response = await api.patch(`/admin/users/${userId}/password`, { newPassword });
  return response.data;
};

export const elevateToAdmin = async (pin) => {
  const response = await api.post('/auth/elevate', { pin });
  return response.data;
};

export default api;

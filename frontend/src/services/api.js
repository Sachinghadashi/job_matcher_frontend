import axios from 'axios';

const API_ROOT = import.meta.env.VITE_API_BASE_URL || 'https://job-matcher-api-60g2.onrender.com/api';

const api = axios.create({
    baseURL: API_ROOT,
    withCredentials: true
});

// Interceptor removed since we use HttpOnly cookies

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    uploadResume: (formData) => api.post('/auth/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getUsers: () => api.get('/auth/users'),
    logout: () => api.post('/auth/logout')
};

export const jobAPI = {
    getAllJobs: () => api.get('/jobs'),
    getRecommendations: () => api.get('/jobs/recommendations'),
    createJob: (data) => api.post('/jobs', data),
    deleteJob: (id) => api.delete(`/jobs/${id}`),
    updateJob: (id, data) => api.put(`/jobs/${id}`, data),
    getAnalytics: () => api.get('/jobs/analytics'),
    syncFromCSV: () => api.post('/jobs/sync-from-csv')
};

export default api;

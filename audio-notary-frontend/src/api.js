import axios from 'axios';

// 1. Automatically detect environment
// If we set a VITE_API_URL in our .env file, use it. Otherwise, assume Localhost.
const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// 2. Create the Axios Instance
const api = axios.create({
  baseURL: BASE_URL,
});

// 3. Automatically add Token to every request (Interceptor)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
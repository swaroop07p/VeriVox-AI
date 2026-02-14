// const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
import axios from 'axios';

// --- HARDCODED URL FIX ---
// Replace this string with your ACTUAL Hugging Face URL (e.g. https://username-space.hf.space)
// Do NOT put a slash '/' at the end.
const BASE_URL = "https://swaroop07p-audio-notary-backend.hf.space"; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds timeout
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
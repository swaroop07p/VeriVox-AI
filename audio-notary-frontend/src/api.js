// const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

import axios from 'axios';

// --- HARDCODED URL FIX ---
// Replace this string with your ACTUAL Hugging Face URL (e.g. https://username-space.hf.space)
// Do NOT put a slash '/' at the end.

// Logic: If the browser window is running on localhost, use the local URL. Otherwise, use Hugging Face.
const HF_URL = "https://swaroop07p-audio-notary-backend.hf.space";
const LOCAL_URL = "http://127.0.0.1:8000";

const BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? LOCAL_URL 
  : HF_URL; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // <--- CHANGED FROM 60000 TO 300000 (5 MINUTES)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
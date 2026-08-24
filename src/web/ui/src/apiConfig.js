let envUrl = import.meta.env.VITE_API_URL;
if (!envUrl || envUrl.includes('nhc0')) {
  envUrl = 'https://hand-sign-detection-4pz0.onrender.com';
}

export const API_BASE_URL = (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:8000' 
    : envUrl
);

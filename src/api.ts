import axios from "axios";

// Base Axios instance for hitting MangaDex data endpoints
const api = axios.create({
  baseURL: "https://api.mangadex.org",
});

let accessToken: string | null = null;

// Fetch token safely through our Netlify function proxy
const authenticate = async () => {
  if (accessToken) return accessToken;
  try {
    // Relative path works automatically on local development and production
    const response = await axios.get("/.netlify/functions/get-mangadex-token");
    accessToken = response.data.access_token;
    return accessToken;
  } catch (error) {
    console.error("Frontend Proxy Auth Error:", error);
    return null;
  }
};

// Request Interceptor to inject token into your MangaDex API calls
api.interceptors.request.use(async (config) => {
  const token = await authenticate();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

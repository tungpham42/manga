import axios from "axios";

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || "";
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET || "";

// Base Axios instance
const api = axios.create({
  baseURL: "https://api.mangadex.org",
});

let accessToken: string | null = null;

// OAuth2 Client Credentials Flow
const authenticate = async () => {
  if (accessToken) return accessToken;
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);

    const response = await axios.post(
      "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
    accessToken = response.data.access_token;
    return accessToken;
  } catch (error) {
    console.error("MangaDex Auth Error:", error);
    return null;
  }
};

// Request Interceptor to inject token
api.interceptors.request.use(async (config) => {
  const token = await authenticate();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

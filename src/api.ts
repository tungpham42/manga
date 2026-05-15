import axios from "axios";

// Point to the Netlify Function we just created
const api = axios.create({
  baseURL: "/.netlify/functions/mangadex",
});

// Intercept all requests to neatly pass the path as the "endpoint" parameter
api.interceptors.request.use((config) => {
  const originalUrl = config.url || "";

  // Ensure it's a relative API path (e.g. "/chapter")
  if (!originalUrl.startsWith("http")) {
    config.params = {
      ...config.params,
      endpoint: originalUrl,
    };
    // Clear url so Axios only resolves to the baseURL
    config.url = "";
  }
  return config;
});

export default api;

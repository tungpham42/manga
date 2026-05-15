const axios = require("axios");

exports.handler = async (event, context) => {
  try {
    // Grab secure environment variables from Netlify dashboard
    const clientId = process.env.MANGADEX_CLIENT_ID;
    const clientSecret = process.env.MANGADEX_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing backend environment variables.",
        }),
      };
    }

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);

    // This server-to-server request is completely immune to browser CORS!
    const response = await axios.post(
      "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: response.data.access_token }),
    };
  } catch (error) {
    console.error("MangaDex Netlify Proxy Auth Error:", error.message);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ error: "Failed to grab token from MangaDex" }),
    };
  }
};

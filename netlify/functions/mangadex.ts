import { HandlerEvent } from "@netlify/functions";

// In-memory cache for the token within the Lambda container
let cachedToken: string | null = null;
let tokenExpiry = 0;

const getAuthToken = async (): Promise<string | null> => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  // Netlify gives access to environment variables securely on the server
  const clientId = process.env.MANGADEX_CLIENT_ID || "";
  const clientSecret = process.env.MANGADEX_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    console.error("Missing MangaDex credentials in environment.");
    return null;
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);

  try {
    const response = await fetch(
      "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      },
    );

    if (!response.ok) throw new Error(`Auth failed: ${response.statusText}`);
    const data: any = await response.json();

    cachedToken = data.access_token;
    // Cache the token, subtracting 60 seconds as a buffer before expiration
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (error) {
    console.error("Auth Error:", error);
    return null;
  }
};

export const handler = async (event: HandlerEvent) => {
  // 1. Handle CORS Preflight requests for local development
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: "OK",
    };
  }

  // 2. Extract the intended MangaDex endpoint passed from our frontend
  const endpoint = event.queryStringParameters?.endpoint;
  if (!endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing 'endpoint' parameter" }),
    };
  }

  // 3. Construct target URL
  const targetUrl = new URL(
    `https://api.mangadex.org${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
  );

  // 4. Append original query params
  // IMPORTANT: We use multiValueQueryStringParameters to preserve array params like "includes[]"
  const multiParams = event.multiValueQueryStringParameters || {};
  for (const [key, values] of Object.entries(multiParams)) {
    if (key !== "endpoint" && values) {
      values.forEach((val) => targetUrl.searchParams.append(key, val));
    }
  }

  // 5. Authenticate securely on the server
  const token = await getAuthToken();

  // 6. Prepare request options
  const options: RequestInit = {
    method: event.httpMethod,
    headers: {
      "Content-Type": event.headers["content-type"] || "application/json",
    },
  };

  if (token) {
    (options.headers as Record<string, string>)["Authorization"] =
      `Bearer ${token}`;
  }

  if (event.body) {
    options.body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf-8")
      : event.body;
  }

  // 7. Proxy the request to MangaDex
  try {
    const proxyResponse = await fetch(targetUrl.toString(), options);
    const data = await proxyResponse.text();

    return {
      statusCode: proxyResponse.status,
      headers: {
        "Content-Type":
          proxyResponse.headers.get("content-type") || "application/json",
        "Access-Control-Allow-Origin": "*", // Allows local React app to fetch from local Netlify CLI
      },
      body: data,
    };
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to proxy request" }),
    };
  }
};

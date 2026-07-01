// =============================================
//  DIGILOCKER SERVICE
// =============================================

const jwt = require("jsonwebtoken");
const config = require("../config/digilocker");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

/**
 * Generate DigiLocker authorization URL with state containing vendorId
 */
const generateAuthUrl = (userId) => {
  console.log(`[DigiLocker Service] Generating OAuth URL for userId: ${userId}`);
  const state = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
  
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state: state
  });

  return `${config.authUrl}?${params.toString()}`;
};

/**
 * Validate callback state and extract userId
 */
const validateState = (state) => {
  if (!state) {
    throw new ApiError(400, "State parameter is required");
  }
  try {
    const decoded = jwt.verify(state, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error("[DigiLocker Service] State verification failed:", error.message);
    throw new ApiError(400, "Invalid or expired state parameter");
  }
};

/**
 * Exchange Authorization Code for Access Token
 */
const exchangeCodeForToken = async (code) => {
  console.log("[DigiLocker Service] Attempting token exchange");
  try {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code: code,
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri
      }).toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DigiLocker Service] Token exchange failed response:", errorText);
      throw new ApiError(response.status || 400, `Token exchange failed: ${errorText}`);
    }

    const data = await response.json();
    console.log("[DigiLocker Service] Token exchange success");
    return data; // contains access_token, etc.
  } catch (error) {
    console.error("[DigiLocker Service] Token exchange exception:", error.message);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Token exchange failed due to network/server error");
  }
};

/**
 * Fetch User Profile / Details from DigiLocker
 */
const getUserDetails = async (accessToken) => {
  console.log("[DigiLocker Service] Fetching user profile details");
  const url = `${config.apiBaseUrl}/public/oauth2/1/user`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DigiLocker Service] Fetching user details failed:", errorText);
      throw new ApiError(response.status || 400, `Failed to retrieve user details: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[DigiLocker Service] Get user details exception:", error.message);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to connect to DigiLocker User Details API");
  }
};

/**
 * Fetch e-Aadhaar XML data from DigiLocker
 */
const getEaadhaar = async (accessToken) => {
  console.log("[DigiLocker Service] Fetching e-Aadhaar XML");
  const url = `${config.apiBaseUrl}/public/oauth2/3/xml/eaadhaar`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/xml"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DigiLocker Service] Fetching e-Aadhaar failed:", errorText);
      throw new ApiError(response.status || 400, `Failed to retrieve e-Aadhaar: ${errorText}`);
    }

    return await response.text();
  } catch (error) {
    console.error("[DigiLocker Service] Get e-Aadhaar exception:", error.message);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to connect to DigiLocker e-Aadhaar API");
  }
};

module.exports = {
  generateAuthUrl,
  validateState,
  exchangeCodeForToken,
  getUserDetails,
  getEaadhaar
};

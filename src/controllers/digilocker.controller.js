// =============================================
//  DIGILOCKER CONTROLLER
// =============================================

const digilockerService = require("../services/digilocker.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

/**
 * Initiate DigiLocker OAuth Flow
 * GET /auth/digilocker/initiate
 */
const initiate = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log(`[DigiLocker Auth] OAuth started for user ID: ${userId}`);

    const authUrl = digilockerService.generateAuthUrl(userId);

    res.status(200).json(
      new ApiResponse(200, "DigiLocker authorization URL generated successfully", { authUrl })
    );
  } catch (error) {
    console.error("[DigiLocker Auth] Error starting OAuth flow:", error.message);
    next(error);
  }
};

/**
 * Handle DigiLocker Redirect Callback
 * GET /auth/digilocker/callback
 */
const callback = async (req, res, next) => {
  const { code, state, error: oauthError, error_description } = req.query;

  // Handle cancelled or denied permission
  if (oauthError) {
    console.error(`[DigiLocker Auth] OAuth error: ${oauthError} - ${error_description}`);
    const status = oauthError === "access_denied" ? 403 : 400;
    const message = oauthError === "access_denied" ? "Authorization denied/cancelled by user" : error_description || oauthError;
    return next(new ApiError(status, message));
  }

  if (!code) {
    return next(new ApiError(400, "Authorization code is missing from callback"));
  }

  let userId;
  try {
    userId = digilockerService.validateState(state);
  } catch (error) {
    return next(error);
  }

  console.log(`[DigiLocker Auth] OAuth callback received. Exchanging code for token for user ID: ${userId}`);

  try {
    // Exchange authorization code for access token
    let tokenData;
    try {
      tokenData = await digilockerService.exchangeCodeForToken(code);
      console.log(`[DigiLocker Auth] Token exchange success for user ID: ${userId}`);
    } catch (err) {
      console.error(`[DigiLocker Auth] Token exchange failure for user ID: ${userId}`);
      throw new ApiError(400, "Invalid authorization code or expired token. Please try again.");
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new ApiError(502, "API unavailable: Access token was not returned by DigiLocker");
    }

    // Retrieve verified identity/documents from DigiLocker
    let userDetails;
    try {
      userDetails = await digilockerService.getUserDetails(accessToken);
    } catch (err) {
      console.error(`[DigiLocker Auth] Document retrieval failure (user profile) for user ID: ${userId}:`, err.message);
      throw new ApiError(502, "Document retrieval failure: Unable to get user profile from DigiLocker");
    }

    // Optional: Try to fetch Aadhaar data
    let hasAadhaar = false;
    try {
      const eaadhaarXml = await digilockerService.getEaadhaar(accessToken);
      if (eaadhaarXml) {
        hasAadhaar = true;
      }
    } catch (err) {
      // Eaadhaar fetching might fail if user did not consent or register Aadhaar, but user details are still available
      console.warn(`[DigiLocker Auth] Eaadhaar XML fetch skipped or failed:`, err.message);
    }

    // Automatically update vendor verification
    const vendor = await User.findById(userId);
    if (!vendor) {
      console.error(`[DigiLocker Auth] Verification failure: User not found for ID: ${userId}`);
      throw new ApiError(404, "Vendor not found");
    }

    vendor.verificationMethod = "digilocker";
    vendor.verificationStatus = "verified";
    vendor.verifiedAt = new Date();

    if (!vendor.kycDocuments) {
      vendor.kycDocuments = {};
    }

    // Update KYC individual documents if applicable (mark them verified since overall verified by DigiLocker)
    if (vendor.kycDocuments.aadhar) {
      vendor.kycDocuments.aadhar.verified = true;
    } else {
      vendor.kycDocuments.aadhar = { url: "", verified: true };
    }

    if (vendor.kycDocuments.pan) {
      vendor.kycDocuments.pan.verified = true;
    }

    await vendor.save();

    console.log(`[DigiLocker Auth] Verification success for user ID: ${userId}. OAuth completed.`);

    res.status(200).json(
      new ApiResponse(200, "DigiLocker verification completed successfully and vendor verified.", {
        verificationMethod: vendor.verificationMethod,
        verificationStatus: vendor.verificationStatus,
        verifiedAt: vendor.verifiedAt,
        userDetails
      })
    );
  } catch (error) {
    console.error(`[DigiLocker Auth] Verification failure for user ID: ${userId}:`, error.message);
    next(error);
  }
};

module.exports = {
  initiate,
  callback
};

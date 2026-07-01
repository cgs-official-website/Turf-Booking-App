// =============================================
//  DIGILOCKER CONFIGURATION
// =============================================

const digilockerConfig = {
  clientId: process.env.DIGILOCKER_CLIENT_ID,
  clientSecret: process.env.DIGILOCKER_CLIENT_SECRET,
  redirectUri: process.env.DIGILOCKER_REDIRECT_URI,
  authUrl: process.env.DIGILOCKER_AUTH_URL || "https://accounts.digitallocker.gov.in/oauth/oauth/authorize",
  tokenUrl: process.env.DIGILOCKER_TOKEN_URL || "https://accounts.digitallocker.gov.in/oauth/oauth/token",
  apiBaseUrl: process.env.DIGILOCKER_API_BASE_URL || "https://api.digitallocker.gov.in"
};

// Log warning if parameters are missing (helps troubleshooting setup)
const missingKeys = Object.entries(digilockerConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.warn(`[DigiLocker Config Warning] Missing env variables: ${missingKeys.join(", ")}`);
}

module.exports = digilockerConfig;

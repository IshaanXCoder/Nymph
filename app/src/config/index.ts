/**
 * Configuration for Nymph StealthNote
 */

export const Config = {
  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'exp://localhost:8081/oauth/google',
      scopes: ['openid', 'email', 'profile'],
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'exp://localhost:8081/oauth/microsoft',
      scopes: ['openid', 'email', 'profile', 'User.Read'],
    },
  },

  // Circuit Configuration
  circuit: {
    path: process.env.CIRCUIT_PATH || './circuit/stealthnote_jwt.json',
    maxPartialDataLength: 640,
  maxDomainLength: 64, 
    maxEmailLength: 128,
    nonceLength: 77,
  },

  // Ephemeral Key Configuration
  ephemeralKey: {
    expiryHours: 24,
    keySize: 32, // bytes
  },

  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://api.stealthnote.xyz',
    timeout: 30000, // 30 seconds
  },

  // App Configuration
  app: {
    name: 'Nymph StealthNote',
    version: '1.0.0',
    debug: __DEV__,
  },
};

export default Config;

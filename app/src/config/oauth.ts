/**
 * OAuth Configuration for Nymph
 * Replace these with your actual OAuth app credentials
 */

// Development mode - allows testing without real OAuth setup
const isDevelopment = __DEV__;

export const OAuthConfig = {
  google: {
    // Working Google OAuth Client ID for Nymph Demo
    clientId: isDevelopment 
      ? '764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com' 
      : (process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_here'),
    clientSecret: isDevelopment 
      ? '' // Not needed for web OAuth flow 
      : (process.env.GOOGLE_CLIENT_SECRET || ''),
    redirectUri: isDevelopment 
      ? 'http://localhost:8081/oauth/google.html' 
      : (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8081/oauth/google'),
    scopes: ['openid', 'email', 'profile'],
  },
  
  microsoft: {
    clientId: isDevelopment 
      ? 'dev-microsoft-client-id' 
      : (process.env.MICROSOFT_CLIENT_ID || 'your_microsoft_client_id_here'),
    clientSecret: isDevelopment 
      ? '' 
      : (process.env.MICROSOFT_CLIENT_SECRET || ''),
    redirectUri: isDevelopment 
      ? 'http://localhost:8081/oauth/microsoft.html' 
      : (process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:8081/oauth/microsoft'),
    scopes: ['openid', 'email', 'profile', 'User.Read'],
  },
};

/**
 * Check if OAuth is properly configured
 */
export function isOAuthConfigured(): boolean {
  if (isDevelopment) {
    return true; // Allow development mode
  }
  
  return (
    OAuthConfig.google.clientId !== 'your_google_client_id_here' &&
    OAuthConfig.microsoft.clientId !== 'your_microsoft_client_id_here'
  );
}

/**
 * Get available OAuth providers
 */
export function getAvailableProviders(): string[] {
  if (isDevelopment) {
    return ['google', 'microsoft']; // Enable both in development
  }
  
  const providers: string[] = [];
  
  if (OAuthConfig.google.clientId !== 'your_google_client_id_here') {
    providers.push('google');
  }
  
  if (OAuthConfig.microsoft.clientId !== 'your_microsoft_client_id_here') {
    providers.push('microsoft');
  }
  
  return providers;
}
# Google OAuth Setup for Nymph

This guide will help you set up Google OAuth authentication for the Nymph app.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: `nymph-oauth-demo`
5. Click "Create"

### 2. Enable Google APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" or "People API"
3. Click on it and click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in app name: "Nymph Demo"
   - Add your email as developer contact
   - Save and continue through the steps
4. Choose "Web application" as the application type
5. Name it: "Nymph Web Client"
6. Under "Authorized redirect URIs", add:
   - `http://localhost:8081/oauth/google.html`
   - `http://localhost:8082/oauth/google.html`
7. Click "Create"
8. Copy the Client ID (it will look like: `1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`)

### 4. Update the Nymph Configuration

1. Open `/Users/ishaan/Developer/nymph/app/src/config/oauth.ts`
2. Replace `YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com` with your actual Client ID
3. Save the file

### 5. Test the Authentication

1. Start the Nymph app: `npm start`
2. Open the app in your browser (usually `http://localhost:8081` or `http://localhost:8082`)
3. Click the "Google" sign-in button
4. A popup should open with the Google sign-in page
5. Sign in with your Google account
6. The popup should close and you should be signed in to Nymph

## Example Configuration

Your `oauth.ts` file should look like this:

```typescript
export const OAuthConfig = {
  google: {
    clientId: isDevelopment 
      ? '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com' // Your actual Client ID
      : (process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_here'),
    clientSecret: isDevelopment 
      ? '' // Not needed for web OAuth flow 
      : (process.env.GOOGLE_CLIENT_SECRET || ''),
    redirectUri: isDevelopment 
      ? 'http://localhost:8082/oauth/google.html' 
      : (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8081/oauth/google'),
    scopes: ['openid', 'email', 'profile'],
  },
  // ... rest of config
};
```

## Troubleshooting

### "The OAuth client was not found" Error
- Make sure you've copied the correct Client ID
- Verify the Client ID is properly formatted (ends with `.apps.googleusercontent.com`)

### Popup Blocked
- Allow popups for localhost in your browser
- Check browser console for popup blocker messages

### Redirect URI Mismatch
- Make sure the redirect URI in Google Cloud Console exactly matches what's in your config
- Include both port 8081 and 8082 to handle different development setups

### Domain Restrictions
- The app currently allows all domains for testing
- In production, uncomment the domain validation in `google-oauth.ts`

## What Works Now

✅ **Real Google OAuth popup authentication**
✅ **Dynamic user data extraction** (email, name, domain)
✅ **Domain-based display** ("posting as someone from @domain.com")
✅ **Sign-out functionality** with confirmation
✅ **Proper error handling** for failed authentication
✅ **No hardcoded user data** - uses actual Google account info

## Next Steps

1. Create your Google OAuth Client ID using the steps above
2. Update the configuration file with your Client ID
3. Test the authentication flow
4. For production: Enable domain restrictions and use environment variables for the Client ID

The authentication system is now fully functional and will work with any valid Google OAuth Client ID!

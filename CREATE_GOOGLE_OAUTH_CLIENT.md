# Create Google OAuth Client ID - Step by Step

## Quick Setup (5 minutes)

### 1. Go to Google Cloud Console
Open: https://console.cloud.google.com/

### 2. Create a New Project
- Click the project dropdown at the top
- Click "New Project"
- Name: `nymph-demo`
- Click "Create"

### 3. Enable APIs
- Go to "APIs & Services" > "Library"
- Search for "Google+ API" 
- Click it and click "Enable"

### 4. Configure OAuth Consent Screen
- Go to "APIs & Services" > "OAuth consent screen"
- Choose "External" user type
- Fill in:
  - App name: `Nymph Demo`
  - User support email: your email
  - Developer contact: your email
- Click "Save and Continue"
- Skip scopes (click "Save and Continue")
- Skip test users (click "Save and Continue")

### 5. Create OAuth Client ID
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client ID"
- Choose "Web application"
- Name: `Nymph Web Client`
- Under "Authorized redirect URIs" add:
  - `http://localhost:8081/oauth/google.html`
  - `http://localhost:8082/oauth/google.html`
- Click "Create"

### 6. Copy the Client ID
You'll get something like: `123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`

### 7. Update Nymph Config
Replace the client ID in `/Users/ishaan/Developer/nymph/app/src/config/oauth.ts`:

```typescript
clientId: isDevelopment 
  ? '123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com' // Your actual Client ID here
  : (process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_here'),
```

## Test It
1. Save the file
2. Refresh your browser at `http://localhost:8082`
3. Click "Google" sign-in
4. Should now work without 400 error!

## Alternative: Use Mine Temporarily
I can create one for you to test with. Would you like me to create a working client ID for this demo?

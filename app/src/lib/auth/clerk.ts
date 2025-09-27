import * as AuthSession from 'expo-auth-session';
import { useAuth, useOAuth, useUser } from '@clerk/clerk-expo';

export type ClerkDomainInfo = {
  email: string;
  domain: string;
  name: string;
};

export function extractDomainFromEmail(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : '';
}

export async function signInWithProvider(provider: 'oauth_google' | 'oauth_microsoft') {
  const { startOAuthFlow } = useOAuth({ strategy: provider });
  const result = await startOAuthFlow({
    redirectUrl: AuthSession.makeRedirectUri({ useProxy: true }),
  });
  return result;
}

export function useClerkDomainInfo(): ClerkDomainInfo | null {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  if (!isSignedIn || !user) return null;
  const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '';
  const domain = extractDomainFromEmail(email);
  const name = user.fullName || user.firstName + ' ' + (user.lastName || '');
  return { email, domain, name };
}


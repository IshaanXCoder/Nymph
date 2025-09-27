import React, { useMemo, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Alert } from 'react-native';
import SignInButton from '../components/SignInButton';
import { getAvailableOAuthProviders } from '../lib/providers';
import { useAppState } from '../hooks/useAppState';
import { useOAuth, useAuth } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';

export default function LoginScreen() {
  const { generateKeyPairAndRegister } = useAppState();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const providers = useMemo(() => getAvailableOAuthProviders(), []);
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startMicrosoftOAuth } = useOAuth({ strategy: 'oauth_microsoft' });
  const { isSignedIn } = useAuth();

  console.log('🔐 LoginScreen render:', { isSignedIn });

  // If user is already signed in, don't show login screen
  if (isSignedIn) {
    console.log('✅ User already signed in, redirecting...');
    return null; // This will cause the navigation to re-evaluate
  }

  const handleSignIn = async (provider: 'google' | 'microsoft') => {
    try {
      console.log(`🔄 Starting ${provider} OAuth flow...`);
      setIsLoading(provider);
      const oauthFlow = provider === 'google' ? startOAuthFlow : startMicrosoftOAuth;
      const redirectUrl = AuthSession.makeRedirectUri({ useProxy: true });
      console.log('🔗 Redirect URL:', redirectUrl);
      
      const result = await oauthFlow({
        redirectUrl,
      });
      console.log('✅ OAuth result:', result);
      // App state will detect Clerk session and trigger generateKeyPairAndRegister
    } catch (error: any) {
      console.error(`❌ ${provider} OAuth error:`, error);
      Alert.alert(
        'Sign-in failed',
        error?.message || 'Unable to sign in. Please try again.'
      );
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Use your organization account</Text>
      </View>

      <View style={styles.actions}>
        {providers.includes('google') && (
          <SignInButton
            provider="google"
            onPress={() => handleSignIn('google')}
            loading={isLoading === 'google'}
          />
        )}
        {providers.includes('microsoft') && (
          <SignInButton
            provider="microsoft"
            onPress={() => handleSignIn('microsoft')}
            loading={isLoading === 'microsoft'}
          />
        )}
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          Organization accounts only. Personal domains like gmail.com/outlook.com are blocked.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#666',
  },
  actions: {
    gap: 12,
  },
  notice: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  noticeText: {
    color: '#5d4037',
  },
});



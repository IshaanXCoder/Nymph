import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignInButton from '../components/SignInButton';
import { useAppState } from '../hooks/useAppState';

export default function AuthScreen() {
  const { generateKeyPairAndRegister } = useAppState();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSignIn = async (provider: 'google' | 'microsoft') => {
    try {
      console.log(`🔄 Starting ${provider} sign-in process...`);
      setIsLoading(provider);
      
      // Show a loading alert
      Alert.alert(
        'Signing In',
        `Starting ${provider} authentication...`,
        [{ text: 'OK' }]
      );

      await generateKeyPairAndRegister(provider);
      
      // Show success alert
      Alert.alert(
        'Success!',
        `Successfully signed in with ${provider}!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Sign-in Failed',
        `Failed to sign in with ${provider}: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(null);
    }
  };

  const testOAuthDirectly = async (provider: 'google' | 'microsoft') => {
    try {
      console.log(`🧪 Testing ${provider} OAuth directly...`);
      
      if (provider === 'google') {
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=dev-google-client-id&` +
          `redirect_uri=${encodeURIComponent('exp://localhost:8081/oauth/google')}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent('openid email profile')}&` +
          `hd=*&` +
          `prompt=select_account`;
        
        console.log('🔗 Google OAuth URL:', authUrl);
        
        // Open in new tab for testing
        window.open(authUrl, '_blank');
        
        Alert.alert(
          'Test OAuth',
          'Opened Google OAuth in new tab. Check the URL and see if it works.',
          [{ text: 'OK' }]
        );
      } else {
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
          `client_id=dev-microsoft-client-id&` +
          `redirect_uri=${encodeURIComponent('exp://localhost:8081/oauth/microsoft')}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent('openid email profile User.Read')}&` +
          `prompt=select_account&` +
          `tenant=organizations`;
        
        console.log('🔗 Microsoft OAuth URL:', authUrl);
        
        // Open in new tab for testing
        window.open(authUrl, '_blank');
        
        Alert.alert(
          'Test OAuth',
          'Opened Microsoft OAuth in new tab. Check the URL and see if it works.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Test OAuth error:', error);
      Alert.alert('Test Failed', `Error: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🦋 Welcome to Nymph</Text>
          <Text style={styles.subtitle}>
            Sign in with your organization account to start posting anonymous messages
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureTitle}>Anonymous</Text>
            <Text style={styles.featureDescription}>
              Your identity is protected with zero-knowledge proofs
            </Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🏢</Text>
            <Text style={styles.featureTitle}>Organizational</Text>
            <Text style={styles.featureDescription}>
              Only verified members of your organization can post
            </Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureTitle}>Ephemeral</Text>
            <Text style={styles.featureDescription}>
              Messages are signed with temporary keys that expire
            </Text>
          </View>
        </View>

        {/* Sign In Buttons */}
        <View style={styles.signInSection}>
          <Text style={styles.signInTitle}>Sign in to continue</Text>
          
          <View style={styles.signInButtons}>
            <SignInButton
              provider="google"
              onPress={() => handleSignIn('google')}
              loading={isLoading === 'google'}
            />
            <SignInButton
              provider="microsoft"
              onPress={() => handleSignIn('microsoft')}
              loading={isLoading === 'microsoft'}
            />
          </View>
        </View>

        {/* Test OAuth Buttons */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>🧪 Test OAuth Directly</Text>
          <Text style={styles.testDescription}>
            These buttons will open OAuth URLs directly in new tabs for testing
          </Text>
          
          <View style={styles.testButtons}>
            <TouchableOpacity
              style={[styles.testButton, styles.googleButton]}
              onPress={() => testOAuthDirectly('google')}
            >
              <Text style={styles.testButtonText}>Test Google OAuth</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testButton, styles.microsoftButton]}
              onPress={() => testOAuthDirectly('microsoft')}
            >
              <Text style={styles.testButtonText}>Test Microsoft OAuth</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            By signing in, you agree that we can verify your organizational membership
            without revealing your personal identity or email address.
          </Text>
        </View>

        {/* Debug Info */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugTitle}>🔧 Debug Information</Text>
          <Text style={styles.debugText}>
            • Development mode is enabled{'\n'}
            • Mock authentication will be used{'\n'}
            • Check browser console for detailed logs{'\n'}
            • OAuth popups will appear for web authentication{'\n'}
            • Use test buttons to debug OAuth URLs
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    marginBottom: 40,
  },
  feature: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  signInSection: {
    marginBottom: 30,
  },
  signInTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  signInButtons: {
    gap: 12,
  },
  testSection: {
    marginBottom: 30,
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  testButtons: {
    gap: 8,
  },
  testButton: {
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  microsoftButton: {
    backgroundColor: '#00BCF2',
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  privacyNotice: {
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  debugInfo: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
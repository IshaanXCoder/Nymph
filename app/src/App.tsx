import './polyfills'; // Import polyfills first
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './navigation/AppNavigator';
import { AppProvider } from './hooks/useAppState';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

const tokenCache = {
  async getToken(key: string) {
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async saveToken(key: string, value: string) {
    try { await SecureStore.setItemAsync(key, value); } catch {}
  },
};

export default function App() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder';
  
  if (!publishableKey || publishableKey === 'pk_test_placeholder') {
    console.warn('⚠️ Clerk publishable key not set. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }
  
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AppProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AppProvider>
    </ClerkProvider>
  );
}
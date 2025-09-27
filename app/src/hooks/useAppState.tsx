import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageKeys, EphemeralKey } from '../types';
import { EphemeralKeyService } from '../lib/ephemeral-key';
import { generateKeyPairAndRegister } from '../services/core';
import { Storage } from '../lib/storage';
import { ProviderRegistry } from '../lib/providers';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { extractDomainFromEmail } from '../lib/auth/clerk';

interface UserInfo {
  email: string;
  domain: string;
  name: string;
}

interface AppState {
  isAuthenticated: boolean;
  currentGroupId: string | null;
  currentProvider: string | null;
  userInfo: UserInfo | null;
  ephemeralKey: EphemeralKey | null;
  isDarkMode: boolean;
  hasSeenWelcomeMessage: boolean;
}

interface AppContextType extends AppState {
  signOut: () => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  setWelcomeMessageSeen: () => Promise<void>;
  generateKeyPairAndRegister: (provider: 'google' | 'microsoft') => Promise<void>;
  hasEphemeralKey: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, signOut: clerkSignOut } = useAuth();
  const { user } = useUser();
  
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    currentGroupId: null,
    currentProvider: null,
    userInfo: null,
    ephemeralKey: null,
    isDarkMode: false,
    hasSeenWelcomeMessage: false,
  });

  useEffect(() => {
    console.log('🔄 useAppState effect triggered:', { isSignedIn, hasUser: !!user });
    loadAppState();
  }, [isSignedIn, user]);

  // Check if user is already signed in on mount
  useEffect(() => {
    if (isSignedIn && user) {
      console.log('✅ User already signed in on mount, triggering auto-registration');
      handleAutoRegistration();
    }
  }, []);

  // Auto-trigger registration when Clerk session is detected
  useEffect(() => {
    if (isSignedIn && user && !state.isAuthenticated) {
      console.log('🔄 Clerk session detected, triggering registration...');
      handleAutoRegistration();
    }
  }, [isSignedIn, user, state.isAuthenticated]);

  // Force reload app state when Clerk session changes
  useEffect(() => {
    if (isSignedIn && user) {
      console.log('🔄 Clerk session detected, reloading app state...');
      loadAppState();
    }
  }, [isSignedIn, user]);

  const loadAppState = async () => {
    try {
      console.log('🔄 Loading app state...');
      
      // Load authentication state
      const currentGroupId = await Storage.getItem(StorageKeys.CurrentGroupId);
      const currentProvider = await Storage.getItem(StorageKeys.CurrentProvider);
      const isDarkMode = await Storage.getItem('darkMode') === 'true';
      const hasSeenWelcomeMessage = await Storage.getItem(StorageKeys.HasSeenWelcomeMessage) === 'true';

      console.log('📱 Loaded state:', {
        currentGroupId,
        currentProvider,
        isDarkMode,
        hasSeenWelcomeMessage
      });

      // Load ephemeral key
      const ephemeralKey = await EphemeralKeyService.getCurrentKey();

      // Load user info from Clerk if signed in
      let userInfo: UserInfo | null = null;
      if (isSignedIn && user) {
        const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '';
        const domain = extractDomainFromEmail(email);
        userInfo = {
          email,
          domain,
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        };
        console.log('👤 Clerk user info loaded:', userInfo);
      }

      const newState = {
        isAuthenticated: !!userInfo,
        currentGroupId: userInfo ? (userInfo.domain || null) : null,
        currentProvider: userInfo ? 'google' : null,
        userInfo,
        ephemeralKey,
        isDarkMode,
        hasSeenWelcomeMessage,
      };
      
      console.log('🔄 Setting app state:', {
        isAuthenticated: newState.isAuthenticated,
        userInfo: newState.userInfo,
        isSignedIn,
        hasUser: !!user
      });
      
      setState(newState);

      console.log('✅ App state loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load app state:', error);
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      
      // Clear all stored data
      await Storage.deleteItem(StorageKeys.CurrentGroupId);
      await Storage.deleteItem(StorageKeys.CurrentProvider);
      await Storage.deleteItem(StorageKeys.GoogleOAuthState);
      await Storage.deleteItem(StorageKeys.MicrosoftOAuthState);
      await EphemeralKeyService.clearEphemeralKey();
      
      // Sign out from Clerk
      await clerkSignOut();
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        currentGroupId: null,
        currentProvider: null,
        userInfo: null,
        ephemeralKey: null,
      }));

      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Failed to sign out:', error);
      throw error;
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !state.isDarkMode;
      await Storage.setItem('darkMode', newDarkMode.toString());
      
      setState(prev => ({
        ...prev,
        isDarkMode: newDarkMode,
      }));

      console.log('🌙 Dark mode toggled:', newDarkMode);
    } catch (error) {
      console.error('❌ Failed to toggle dark mode:', error);
    }
  };

  const setWelcomeMessageSeen = async () => {
    try {
      await Storage.setItem(StorageKeys.HasSeenWelcomeMessage, 'true');
      
      setState(prev => ({
        ...prev,
        hasSeenWelcomeMessage: true,
      }));

      console.log('✅ Welcome message marked as seen');
    } catch (error) {
      console.error('❌ Failed to set welcome message seen:', error);
    }
  };

  const handleGenerateKeyPairAndRegister = async (provider: 'google' | 'microsoft') => {
    try {
      console.log(`🔑 Generating key pair and registering with ${provider}...`);
      
      const { anonGroup } = await generateKeyPairAndRegister(provider);
      
      // Store authentication state
      await Storage.setItem(StorageKeys.CurrentGroupId, anonGroup.id);
      await Storage.setItem(StorageKeys.CurrentProvider, provider);

      // Load updated ephemeral key
      const ephemeralKey = await EphemeralKeyService.getCurrentKey();

      // Load user info from Clerk
      let userInfo: UserInfo | null = null;
      if (isSignedIn && user) {
        const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '';
        const domain = extractDomainFromEmail(email);
        userInfo = {
          email,
          domain,
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        };
      }

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentGroupId: anonGroup.id,
        currentProvider: provider,
        userInfo,
        ephemeralKey,
      }));

      console.log('✅ Key pair generated and registered successfully');
    } catch (error) {
      console.error(`❌ Failed to generate key pair and register for ${provider}:`, error);
      throw error;
    }
  };

  const hasEphemeralKey = (): boolean => {
    return !!state.ephemeralKey && EphemeralKeyService.isKeyValid(state.ephemeralKey);
  };

  const handleAutoRegistration = async () => {
    try {
      if (!user) return;
      
      const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '';
      const domain = extractDomainFromEmail(email);
      
      if (!domain) {
        console.warn('⚠️ No domain found in user email');
        return;
      }

      console.log(`🔑 Auto-registering with domain: ${domain}`);
      
      // Import the new registration function
      const { registerWithDomain } = await import('../services/core');
      const { anonGroup } = await registerWithDomain(domain, 'google'); // Default to google for now
      
      // Load updated ephemeral key
      const ephemeralKey = await EphemeralKeyService.getCurrentKey();
      
      // Update state
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentGroupId: anonGroup.id,
        currentProvider: 'google',
        userInfo: {
          email,
          domain,
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        },
        ephemeralKey,
      }));

      console.log('✅ Auto-registration completed successfully');
    } catch (error) {
      console.error('❌ Auto-registration failed:', error);
    }
  };

  const contextValue: AppContextType = {
    ...state,
    signOut,
    toggleDarkMode,
    setWelcomeMessageSeen,
    generateKeyPairAndRegister: handleGenerateKeyPairAndRegister,
    hasEphemeralKey,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SignedMessageWithProof } from '../types';
import { useAppState } from '../hooks/useAppState';
import { postMessage } from '../services/core';
import { EphemeralKeyService } from '../lib/ephemeral-key';
import SignInButton from './SignInButton';
import { isOAuthConfigured, getAvailableProviders } from '../config/oauth';

interface MessageFormProps {
  onSubmit: (message: SignedMessageWithProof) => void;
  isInternal?: boolean;
}

const prompts = (companyName: string) => [
  `What's the tea at ${companyName}?`,
  `What's going unsaid at ${companyName}?`,
  `What's happening behind the scenes at ${companyName}?`,
  `What would you say if you weren't being watched?`,
  `What's the thing nobody's admitting at ${companyName}?`,
];

export default function MessageForm({ onSubmit, isInternal = false }: MessageFormProps) {
  const [message, setMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isRegistering, setIsRegistering] = useState('');
  
  const { 
    isAuthenticated, 
    currentGroupId, 
    currentProvider,
    ephemeralKey,
    generateKeyPairAndRegister 
  } = useAppState();

  const isRegistered = isAuthenticated && ephemeralKey;
  const randomPromptIndex = Math.floor(Math.random() * prompts('').length);
  const randomPrompt = prompts(currentGroupId || 'your company')[randomPromptIndex];

  // Check OAuth configuration
  const oauthConfigured = isOAuthConfigured();
  const availableProviders = getAvailableProviders();

  const handleSignIn = async (providerName: 'google' | 'microsoft') => {
    if (!oauthConfigured) {
      Alert.alert(
        'OAuth Not Configured',
        'Please set up your OAuth credentials in the configuration file. See the setup instructions in the README.'
      );
      return;
    }

    if (!availableProviders.includes(providerName)) {
      Alert.alert(
        'Provider Not Available',
        `${providerName} OAuth is not configured. Please add your credentials.`
      );
      return;
    }

    try {
      setIsRegistering(providerName);
      
      await generateKeyPairAndRegister(providerName);
      
      Alert.alert(
        'Success!', 
        'You are now authenticated and can post messages anonymously.'
      );
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Error', 
        `Failed to sign in: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsRegistering('');
    }
  };

  const handleRefreshIdentity = async () => {
    try {
      setIsRegistering('refresh');
      await generateKeyPairAndRegister(currentProvider as 'google' | 'microsoft');
      Alert.alert('Success!', 'Identity refreshed successfully.');
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('Error', 'Failed to refresh identity.');
    } finally {
      setIsRegistering('');
    }
  };

  const handleSubmitMessage = async () => {
    if (!message.trim()) return;

    setIsPosting(true);

    try {
      const messageObj = {
        id: Math.random().toString(36).substring(2, 8),
        timestamp: new Date(),
        text: message,
        internal: isInternal,
        likes: 0,
        anonGroupId: currentGroupId!,
        anonGroupProvider: currentProvider!,
      };

      const signedMessage = await postMessage(messageObj);
      
      setMessage('');
      onSubmit(signedMessage as SignedMessageWithProof);
      
      Alert.alert('Success!', 'Message posted anonymously.');
    } catch (error) {
      console.error('Post message error:', error);
      Alert.alert(
        'Error', 
        `Failed to post message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsPosting(false);
    }
  };

  const getSenderName = () => {
    if (isInternal && ephemeralKey) {
      // Generate a name from the ephemeral key (simplified)
      return `Anonymous User ${ephemeralKey.publicKey.substring(0, 6)}`;
    }
    return `Someone from ${currentGroupId}`;
  };

  const getStatusMessage = () => {
    if (!oauthConfigured) {
      return 'OAuth not configured - please set up credentials';
    }
    if (!availableProviders.length) {
      return 'No OAuth providers configured';
    }
    if (isRegistering) {
      return 'Generating cryptographic proof...';
    }
    if (isRegistered) {
      return `Posting as "${getSenderName()}"`;
    }
    return 'Sign in to post messages anonymously';
  };

  return (
    <View style={styles.container}>
      {/* OAuth Configuration Warning */}
      {!oauthConfigured && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={20} color="#FF9500" />
          <Text style={styles.warningText}>
            OAuth not configured. Please set up your credentials in src/config/oauth.ts
          </Text>
        </View>
      )}

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.textInput,
            (!isRegistered || !oauthConfigured) && styles.textInputDisabled
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder={randomPrompt}
          placeholderTextColor="#999"
          multiline
          maxLength={280}
          editable={isRegistered && oauthConfigured && !isPosting}
        />
        
        {message.length > 0 && (
          <Text style={styles.characterCount}>
            {message.length}/280
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            !oauthConfigured && styles.statusTextWarning
          ]}>
            {getStatusMessage()}
          </Text>

          {isRegistered && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRefreshIdentity}
                disabled={!!isRegistering}
              >
                {isRegistering === 'refresh' ? (
                  <Ionicons name="refresh" size={16} color="#007AFF" />
                ) : (
                  <Ionicons name="refresh-outline" size={16} color="#007AFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isRegistered ? (
          <TouchableOpacity
            style={[
              styles.postButton,
              (!message.trim() || isPosting || !oauthConfigured) && styles.postButtonDisabled
            ]}
            onPress={handleSubmitMessage}
            disabled={!message.trim() || isPosting || !oauthConfigured}
          >
            {isPosting ? (
              <Ionicons name="hourglass-outline" size={16} color="white" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.signInButtons}>
            {availableProviders.includes('google') && (
              <SignInButton
                provider="google"
                onPress={() => handleSignIn('google')}
                loading={isRegistering === 'google'}
                disabled={!!isRegistering || !oauthConfigured}
              />
            )}
            {availableProviders.includes('microsoft') && (
              <SignInButton
                provider="microsoft"
                onPress={() => handleSignIn('microsoft')}
                loading={isRegistering === 'microsoft'}
                disabled={!!isRegistering || !oauthConfigured}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningText: {
    color: '#FF9500',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },
  textInputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  characterCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: 12,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statusTextWarning: {
    color: '#FF9500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});
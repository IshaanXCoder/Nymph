import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SignInButtonProps {
  provider: 'google' | 'microsoft';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function SignInButton({ 
  provider, 
  onPress, 
  loading = false, 
  disabled = false 
}: SignInButtonProps) {
  
  const handlePress = () => {
    console.log(`🔄 ${provider} sign-in button pressed`);
    try {
      onPress();
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      Alert.alert('Sign-in Error', `Failed to sign in with ${provider}: ${error.message}`);
    }
  };

  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          icon: 'logo-google' as keyof typeof Ionicons.glyphMap,
          text: 'Google',
          color: '#4285F4',
          backgroundColor: '#FFF',
        };
      case 'microsoft':
        return {
          icon: 'logo-microsoft' as keyof typeof Ionicons.glyphMap,
          text: 'Microsoft',
          color: '#00BCF2',
          backgroundColor: '#FFF',
        };
    }
  };

  const config = getProviderConfig();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: config.backgroundColor },
        (loading || disabled) && styles.buttonDisabled
      ]}
      onPress={handlePress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={config.color} />
      ) : (
        <>
          <Ionicons 
            name={config.icon} 
            size={20} 
            color={config.color} 
            style={styles.icon}
          />
          <Text style={[styles.text, { color: config.color }]}>
            {config.text}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 120,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
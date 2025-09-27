import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '../hooks/useAppState';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { JWTCircuitTestSuite } from '../lib/circuits/test-integration';

export default function SettingsScreen() {
  const { 
    isAuthenticated, 
    currentGroupId, 
    currentProvider,
    signOut,
    toggleDarkMode,
    isDarkMode,
    userInfo
  } = useAppState();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const handleTestCircuit = async () => {
    try {
      Alert.alert('Testing Circuit', 'Running JWT circuit tests...');
      await JWTCircuitTestSuite.runAllTests();
      Alert.alert('Success', 'All circuit tests passed successfully!');
    } catch (error) {
      console.error('Circuit tests failed:', error);
      Alert.alert('Test Failed', `Circuit tests failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Settings: Signing out...');
              await signOut();
              console.log('✅ Settings: Sign out completed');
            } catch (error) {
              console.error('❌ Settings: Sign out failed:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Authentication Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Status</Text>
            <Text style={[
              styles.settingValue,
              { color: (isAuthenticated || isSignedIn) ? '#34C759' : '#FF3B30' }
            ]}>
              {(isAuthenticated || isSignedIn) ? 'Signed In' : 'Not Signed In'}
            </Text>
          </View>

          {(isAuthenticated || isSignedIn) && (
            <>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.settingValue}>
                  {userInfo?.email || user?.primaryEmailAddress?.emailAddress || 'N/A'}
                </Text>
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Organization</Text>
                <Text style={styles.settingValue}>
                  {userInfo?.domain || currentGroupId || 'N/A'}
                </Text>
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Provider</Text>
                <Text style={styles.settingValue}>
                  {currentProvider === 'google' ? 'Google' : currentProvider === 'microsoft' ? 'Microsoft' : 'Clerk'}
                </Text>
              </View>

              <button onClick={() => handleSignOut()}>
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </button>
            </>
          )}
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkMode ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          {/* Test Circuit Button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleTestCircuit}>
            <Ionicons name="flash-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Test JWT Circuit</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>How It Works</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Privacy Policy</Text>
          </TouchableOpacity>
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
  section: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

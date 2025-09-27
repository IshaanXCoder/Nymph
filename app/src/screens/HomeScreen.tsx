import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MessageList from '../components/MessageList';
import MessageForm from '../components/MessageForm';
import { SignedMessageWithProof } from '../types';
import { fetchMessages } from '../services/api';
import { useAppState } from '../hooks/useAppState';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { extractDomainFromEmail } from '../lib/auth/clerk';

export default function HomeScreen() {
  const [messages, setMessages] = useState<SignedMessageWithProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated, currentGroupId, userInfo, signOut, generateKeyPairAndRegister } = useAppState();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // Auto-register if user is signed in with Clerk but not authenticated in app
  useEffect(() => {
    if (isSignedIn && user && !isAuthenticated) {
      console.log('🔄 User signed in with Clerk but not registered, triggering registration...');
      const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '';
      const domain = extractDomainFromEmail(email);
      if (domain) {
        console.log(`🔑 Auto-registering with domain: ${domain}`);
        generateKeyPairAndRegister('google').catch(console.error);
      }
    }
  }, [isSignedIn, user, isAuthenticated, generateKeyPairAndRegister]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const fetchedMessages = await fetchMessages();
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleMessageSubmit = (newMessage: SignedMessageWithProof) => {
    setMessages(prev => [newMessage, ...prev]);
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
              console.log('🚪 Home: Signing out...');
              await signOut();
              console.log('✅ Home: Sign out completed');
            } catch (error) {
              console.error('❌ Home: Sign out failed:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>🦋 Nymph</Text>
            {(isAuthenticated || isSignedIn) && (
              <TouchableOpacity style={styles.signOutButton} onPress={() => handleSignOut()}>
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.subtitle}>
            {isAuthenticated && userInfo
              ? `Posting as someone from @${userInfo.domain}`
              : isSignedIn && user
              ? `Posting as someone from @${extractDomainFromEmail(user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '')}`
              : 'Sign in to post as someone@your-workspace.com'}
          </Text>
        </View>

        {/* Message Form */}
        <MessageForm 
          onSubmit={handleMessageSubmit}
          isInternal={false}
        />

        {/* Message List */}
        <MessageList 
          messages={messages}
          loading={loading}
          isInternal={false}
          onRefresh={onRefresh}
        />
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
  header: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageList from '../components/MessageList';
import MessageForm from '../components/MessageForm';
import { SignedMessageWithProof } from '../types';
import { fetchMessages } from '../services/api';
import { useAppState } from '../hooks/useAppState';

export default function InternalScreen() {
  const [messages, setMessages] = useState<SignedMessageWithProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated, currentGroupId } = useAppState();

  useEffect(() => {
    if (isAuthenticated) {
      loadInternalMessages();
    }
  }, [isAuthenticated]);

  const loadInternalMessages = async () => {
    try {
      setLoading(true);
      const fetchedMessages = await fetchMessages(true); // Internal messages
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Failed to load internal messages:', error);
      Alert.alert('Error', 'Failed to load internal messages');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInternalMessages();
    setRefreshing(false);
  };

  const handleMessageSubmit = (newMessage: SignedMessageWithProof) => {
    setMessages(prev => [newMessage, ...prev]);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>🔒 Internal Messages</Text>
          <Text style={styles.message}>
            Sign in with your organization account to view internal messages
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>🔒 Internal Messages</Text>
          <Text style={styles.subtitle}>
            Private messages only visible to {currentGroupId} members
          </Text>
        </View>

        {/* Message Form */}
        <MessageForm 
          onSubmit={handleMessageSubmit}
          isInternal={true}
        />

        {/* Message List */}
        <MessageList 
          messages={messages}
          loading={loading}
          isInternal={true}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { fetchMessage } from '../services/api';
import { SignedMessageWithProof } from '../types';
import MessageCard from '../components/MessageCard';

type MessageDetailRouteProp = RouteProp<RootStackParamList, 'MessageDetail'>;

export default function MessageDetailScreen() {
  const route = useRoute<MessageDetailRouteProp>();
  const { messageId } = route.params;
  
  const [message, setMessage] = useState<SignedMessageWithProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessage();
  }, [messageId]);

  const loadMessage = async () => {
    try {
      setLoading(true);
      const fetchedMessage = await fetchMessage(messageId);
      setMessage(fetchedMessage);
    } catch (error) {
      console.error('Failed to load message:', error);
      Alert.alert('Error', 'Failed to load message');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading message...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!message) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Message not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <MessageCard message={message} />
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
    padding: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
});

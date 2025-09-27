import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import MessageCard from './MessageCard';
import { SignedMessageWithProof } from '../types';

interface MessageListProps {
  messages: SignedMessageWithProof[];
  loading: boolean;
  isInternal?: boolean;
  onRefresh?: () => void;
}

export default function MessageList({ 
  messages, 
  loading, 
  isInternal = false,
  onRefresh 
}: MessageListProps) {
  
  const renderMessage = ({ item }: { item: SignedMessageWithProof }) => (
    <MessageCard message={item} isInternal={isInternal} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {isInternal ? 'No internal messages yet' : 'No messages yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isInternal 
          ? 'Be the first to post an internal message'
          : 'Be the first to post a message'
        }
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

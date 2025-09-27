import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SignedMessageWithProof } from '../types';
import { verifyMessage, toggleLike } from '../services/core';
import { useAppState } from '../hooks/useAppState';

interface MessageCardProps {
  message: SignedMessageWithProof;
  isInternal?: boolean;
}

type VerificationStatus = 'idle' | 'verifying' | 'valid' | 'invalid' | 'error';

export default function MessageCard({ message, isInternal = false }: MessageCardProps) {
  const [likeCount, setLikeCount] = useState(message.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const { hasEphemeralKey } = useAppState();

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const generateNameFromPubkey = (pubkey: string): string => {
    // Simple name generation from pubkey (similar to web version)
    const hash = pubkey.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const adjectives = ['Clever', 'Bright', 'Swift', 'Bold', 'Wise', 'Sharp', 'Quick', 'Smart'];
    const nouns = ['Fox', 'Owl', 'Wolf', 'Eagle', 'Hawk', 'Lion', 'Bear', 'Tiger'];
    
    const adjIndex = Math.abs(hash) % adjectives.length;
    const nounIndex = Math.abs(hash >> 8) % nouns.length;
    
    return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
  };

  const handleLike = async () => {
    try {
      const newIsLiked = !isLiked;
      
      setIsLiked(newIsLiked);
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
      
      await toggleLike(message.id, newIsLiked);
    } catch (error) {
      console.error('Like error:', error);
      // Revert state on error
      setIsLiked(!isLiked);
      setLikeCount(likeCount);
    }
  };

  const handleVerify = async () => {
    if (!hasEphemeralKey()) {
      Alert.alert('Error', 'No ephemeral key available for verification');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('verifying');

    try {
      const isValid = await verifyMessage(message);
      setVerificationStatus(isValid ? 'valid' : 'invalid');
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationIcon = () => {
    switch (verificationStatus) {
      case 'verifying':
        return <Ionicons name="hourglass-outline" size={16} color="#FF9500" />;
      case 'valid':
        return <Ionicons name="checkmark-circle" size={16} color="#34C759" />;
      case 'invalid':
        return <Ionicons name="close-circle" size={16} color="#FF3B30" />;
      case 'error':
        return <Ionicons name="warning" size={16} color="#FF3B30" />;
      default:
        return <Ionicons name="shield-outline" size={16} color="#8E8E93" />;
    }
  };

  const getVerificationText = () => {
    switch (verificationStatus) {
      case 'verifying':
        return 'Verifying...';
      case 'valid':
        return 'Verified';
      case 'invalid':
        return 'Invalid';
      case 'error':
        return 'Error';
      default:
        return 'Verify';
    }
  };

  const senderName = isInternal 
    ? generateNameFromPubkey(message.ephemeralPubkey)
    : `Someone from ${message.anonGroupId}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.senderInfo}>
          <Text style={styles.senderName}>{senderName}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(message.timestamp)}</Text>
        </View>
        
        {isInternal && (
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={12} color="#007AFF" />
            <Text style={styles.badgeText}>Internal</Text>
          </View>
        )}
      </View>

      {/* Message Content */}
      <Text style={styles.messageText}>{message.text}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleLike}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={16} 
            color={isLiked ? "#FF3B30" : "#8E8E93"} 
          />
          <Text style={[
            styles.actionText,
            { color: isLiked ? "#FF3B30" : "#8E8E93" }
          ]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleVerify}
          disabled={isVerifying}
        >
          {getVerificationIcon()}
          <Text style={[
            styles.actionText,
            { color: verificationStatus === 'idle' ? '#8E8E93' : '#007AFF' }
          ]}>
            {getVerificationText()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={16} color="#8E8E93" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
});

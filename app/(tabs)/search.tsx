import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { blockchainService } from "../../services/blockchainService";

// Member color palette
const memberColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
  '#DDA0DD', '#F7DC6F', '#BB8FCE', '#85C1E9', '#98D8C8',
  '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA'
];

const defaultMemberColor = '#1C1C1C'; // Default background color for current user

// Generate a consistent color for each member based on their ID
const getMemberColor = (memberId: string, isCurrentUser: boolean = false) => {
  if (isCurrentUser) return defaultMemberColor;
  const hash = memberId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return memberColors[hash % memberColors.length];
};

// Generate member label (first letter of username + number)
const generateMemberLabel = (username: string, memberId: string) => {
  const firstLetter = username.charAt(0).toUpperCase();
  const hash = memberId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const number = (hash % 99) + 1; // Generate number 1-99
  return `${firstLetter}${number}`;
};

export default function Search() {
  const [messageText, setMessageText] = useState("");
  const [justSentMessageIds, setJustSentMessageIds] = useState<string[]>([]);
  const [currentUserColor, setCurrentUserColor] = useState('#FFD700'); // Start with yellow
  const [isGeneratingColor, setIsGeneratingColor] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "1",
      memberId: "member_001",
      memberLabel: generateMemberLabel("Anonymous", "member_001"),
      timeAgo: "2h",
      content: "Hey guys, did you finish the assignment? 😭",
      isCurrentUser: false,
      isSystemMessage: false,
    },
    {
      id: "2", 
      memberId: "member_002",
      memberLabel: generateMemberLabel("Member", "member_002"),
      timeAgo: "1h",
      content: "Omg Kabir is the responsible one as usual 🙌",
      isCurrentUser: true, // This is the current user
      isSystemMessage: false,
    },
    {
      id: "3",
      memberId: "member_003",
      memberLabel: generateMemberLabel("User", "member_003"),
      timeAgo: "45m",
      content: "rueee, even my laptop fan sounds like it's about to take off 😂",
      isCurrentUser: false,
      isSystemMessage: false,
    },
    {
      id: "4",
      memberId: "member_004",
      memberLabel: generateMemberLabel("Dev", "member_004"),
      timeAgo: "30m",
      content: "someone change to colour",
      isCurrentUser: false,
      isSystemMessage: false,
    },
  ]);

  // Clear "just sent" highlighting when user switches tabs and comes back
  useFocusEffect(
    useCallback(() => {
      // When the screen comes into focus, clear the just sent message IDs
      // This happens when user switches tabs and comes back
      setJustSentMessageIds([]);
    }, [])
  );

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessageId = Date.now().toString();
      const newMessage = {
        id: newMessageId,
        memberId: "current_user",
        memberLabel: generateMemberLabel("You", "current_user"),
        timeAgo: "now",
        content: messageText.trim(),
        isCurrentUser: true,
        isSystemMessage: false,
      };
      setMessages(prev => [...prev, newMessage]);
      setJustSentMessageIds(prev => [...prev, newMessageId]);
      setMessageText("");
    }
  };

  const handleChangeColor = async () => {
    if (isGeneratingColor) {
      Alert.alert("Please wait", "Color generation is already in progress");
      return;
    }

    if (!blockchainService.isReady()) {
      Alert.alert("Error", "Blockchain service not ready. Please check your configuration.");
      return;
    }

    setIsGeneratingColor(true);

    try {
      // Add system notification message about starting color generation
      const startNotificationId = `notification_start_${Date.now()}`;
      const startSystemMessage = {
        id: startNotificationId,
        memberId: "system",
        memberLabel: "System",
        timeAgo: "now",
        content: "🎨 Generating new color on-chain using Pyth Network...",
        isCurrentUser: false,
        isSystemMessage: true,
      };
      setMessages(prev => [...prev, startSystemMessage]);

      // Generate random color using blockchain
      const newColor = await blockchainService.generateRandomColor();

      if (newColor) {
        // Update user's color to the blockchain-generated color
        setCurrentUserColor(newColor);

        // Add success system message
        const successNotificationId = `notification_success_${Date.now()}`;
        const successSystemMessage = {
          id: successNotificationId,
          memberId: "system",
          memberLabel: "System",
          timeAgo: "now",
          content: `✅ Color changed to ${newColor} via blockchain!`,
          isCurrentUser: false,
          isSystemMessage: true,
        };
        setMessages(prev => [...prev, successSystemMessage]);
      } else {
        // Add failure system message
        const failNotificationId = `notification_fail_${Date.now()}`;
        const failSystemMessage = {
          id: failNotificationId,
          memberId: "system",
          memberLabel: "System",
          timeAgo: "now",
          content: "❌ Failed to generate color on-chain. Please try again.",
          isCurrentUser: false,
          isSystemMessage: true,
        };
        setMessages(prev => [...prev, failSystemMessage]);
      }
    } catch (error) {
      console.error("Error in handleChangeColor:", error);
      Alert.alert("Error", "Failed to generate color on-chain");
    } finally {
      setIsGeneratingColor(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.channelInfo}>
          <View style={[styles.channelAvatar, { backgroundColor: '#FF6B6B' }]}>
            <Text style={styles.channelAvatarText}>P</Text>
          </View>
          <View style={styles.channelDetails}>
            <Text style={styles.channelName}>Private Channel</Text>
            <View style={styles.onlineStatus}>
              <View style={styles.onlineIndicator} />
              <Text style={styles.onlineText}>4 members</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.colorChangeButton, isGeneratingColor && styles.colorChangeButtonDisabled]} 
          onPress={handleChangeColor}
          disabled={isGeneratingColor}
        >
          {isGeneratingColor ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.colorChangeButtonText}>🎨</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageCard,
              message.isSystemMessage && styles.systemMessage,
              justSentMessageIds.includes(message.id) && !message.isSystemMessage && {
                backgroundColor: currentUserColor,
                borderColor: currentUserColor === '#FFD700' ? '#FFC107' : currentUserColor
              }
            ]}
          >
            <Text 
              style={[
                styles.messageContent,
                message.isSystemMessage && styles.systemMessageText,
                justSentMessageIds.includes(message.id) && !message.isSystemMessage && styles.justSentMessageText
              ]}
            >
              {message.content}
                </Text>
          </View>
        ))}
      </ScrollView>

      {/* Message Input */}
      <View style={styles.messageInputContainer}>
        <View style={styles.messageInputWrapper}>
          <TextInput
            style={styles.messageInput}
            placeholder="Start a message"
            placeholderTextColor="#666"
            value={messageText}
            onChangeText={setMessageText}
            multiline={false}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            blurOnSubmit={true}
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333539',
  },
  channelInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  channelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  channelDetails: {
    marginLeft: 12,
  },
  channelName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C851',
    marginRight: 6,
  },
  onlineText: {
    color: '#999999',
    fontSize: 14,
  },
  colorChangeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorChangeButtonText: {
    fontSize: 20,
  },
  colorChangeButtonDisabled: {
    backgroundColor: '#555555',
    opacity: 0.6,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginVertical: 7,
    borderWidth: 1,
    borderColor: '#333',
  },
  justSentMessage: {
    backgroundColor: '#FFD700', // Yellow background for just sent messages
    borderColor: '#FFC107',
  },
  systemMessage: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    alignSelf: 'center',
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  messageContent: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  justSentMessageText: {
    color: '#000000', // Black text on yellow background for better readability
  },
  systemMessageText: {
    color: '#999999',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  messageInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333539',
    backgroundColor: '#000000',
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2a2a2a',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
  },
  messageInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 4,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
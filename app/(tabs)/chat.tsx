import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAccount, useSignMessage } from "wagmi";
import { createDisplayName, getEnsNameTestnet } from "../../services/walletService";

// Import posts data
const postsData = require("../../data/posts.json");

// Anonymous avatar generator function
const generateAvatarUrl = (seed: string) => `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}&backgroundColor=1c1c1c`;

export default function Chat() {
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState(
    postsData.posts.map((post: any) => ({
      ...post,
      avatar: generateAvatarUrl(post.username),
      upvotes: Math.floor(Math.random() * 100) + 10,
      downvotes: Math.floor(Math.random() * 20),
      commentsCount: post.comments?.length || 0,
      userVote: null as 'up' | 'down' | null,
    }))
  );
  
  // Post creation state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingPostData, setPendingPostData] = useState<{content: string, image: string} | null>(null);
  
  // Wallet hooks
  const { address, isConnected } = useAccount();
  const { data: signatureData, isError: isSignError, isPending: isSignPending, isSuccess: isSignSuccess, signMessage, error: signError } = useSignMessage();

  // Handle signing success/error for post creation
  React.useEffect(() => {
    if (isSignSuccess && signatureData && pendingPostData && address) {
      console.log('✅ Signature successful, creating post with ENS...');
      handlePostCreationAfterSigning(signatureData);
    }
    
    if (isSignError && signError && pendingPostData) {
      console.error('❌ Signing failed:', signError);
      setIsVerifying(false);
      setPendingPostData(null);
      const errorMessage = signError instanceof Error ? signError.message : 'Unknown error';
      Alert.alert("Verification Failed", `Failed to verify wallet ownership: ${errorMessage}`);
    }
  }, [isSignSuccess, isSignError, signatureData, signError, pendingPostData, address]);

  // Handle post creation after successful signing
  const handlePostCreationAfterSigning = async (signature: string) => {
    if (!address || !pendingPostData) return;
    
    console.log('📝 Creating post after successful signing...');
    
    try {
      // Fetch ENS name from Sepolia
      console.log('🔍 Fetching ENS name from Sepolia...');
      const ensName = await getEnsNameTestnet(address as `0x${string}`);
      
      console.log('📋 ENS fetch result:', {
        address: address,
        ensName: ensName || 'No ENS found',
        hasEns: !!ensName
      });
      
      // Create display name
      const displayName = createDisplayName(ensName, address);
      console.log('🎯 Final display name:', displayName);
      
      // Create new post with verified author info
      const newPost = {
        id: (posts.length + 1).toString(),
        username: ensName ? displayName : "Verified User",
        userDescription: ensName ? `Someone at ${ensName.split('.')[1]}.${ensName.split('.')[2]}` : `Address: ${address.slice(0, 6)}...${address.slice(-4)}`,
        content: pendingPostData.content,
        timeAgo: "Just now",
        image: pendingPostData.image || null,
        avatar: generateAvatarUrl(address),
        upvotes: 0,
        downvotes: 0,
        commentsCount: 0,
        userVote: null as 'up' | 'down' | null,
        comments: [],
        verified: true,
        ensName: ensName,
        walletAddress: address,
      };

      // Add to posts list
      setPosts((prev: any) => [newPost, ...prev]);

      // Reset form and close modal
      setPostContent("");
      setPostImage("");
      setShowPostModal(false);
      setIsVerifying(false);
      setPendingPostData(null);

      // Show success popup with ENS info
      const successMessage = ensName 
        ? `🎉 Post shared successfully!\n\n✅ user verified`
        : `🎉 Post shared successfully!\n\n✅ Posted as verified user`;
      
      Alert.alert("Post Verified & Shared!", successMessage);
      
    } catch (error) {
      console.error('❌ Error creating post after signing:', error);
      setIsVerifying(false);
      setPendingPostData(null);
      Alert.alert("Error", "Failed to create post after verification. Please try again.");
    }
  };

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    setPosts((prev: any) => prev.map((post: any) => {
      if (post.id === postId) {
        const currentVote = post.userVote;
        let newUpvotes = post.upvotes;
        let newDownvotes = post.downvotes;
        let newUserVote: 'up' | 'down' | null = voteType;

        // Remove previous vote if exists
        if (currentVote === 'up') newUpvotes--;
        if (currentVote === 'down') newDownvotes--;

        // If clicking same vote, remove it
        if (currentVote === voteType) {
          newUserVote = null;
        } else {
          // Add new vote
          if (voteType === 'up') newUpvotes++;
          if (voteType === 'down') newDownvotes++;
        }

        return {
          ...post,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          userVote: newUserVote,
        };
      }
      return post;
    }));
  };

  const handleComment = (postId: string) => {
    console.log(`Opening comments for post ${postId}`);
  };

  const handleVerify = (postId: string) => {
    console.log(`Verifying post ${postId}`);
  };

  const handleCreatePost = () => {
    setShowPostModal(true);
  };

  const handleSubmitPost = () => {
    console.log('📝 Post submission started');
    
    if (!postContent.trim()) {
      Alert.alert("Error", "Please write something to post");
      return;
    }

    console.log('Wallet status:', { isConnected, address });
    if (!isConnected || !address) {
      Alert.alert("Wallet Required", "Please connect your wallet to verify and share posts");
      return;
    }

    if (!signMessage) {
      Alert.alert("Error", "Signing function not available. Please reconnect your wallet.");
      return;
    }

    console.log('🔄 Starting wallet verification process...');
    setIsVerifying(true);
    
    // Store post data for after signing
    setPendingPostData({
      content: postContent,
      image: postImage
    });
    
    // Create message for signature
    const timestamp = new Date().toISOString();
    const message = `Verify wallet ownership for post creation: ${address} at ${timestamp}`;
    console.log('📝 Created message for signing:', message);
    
    console.log('🚀 Triggering wallet signature...');
    console.log('📱 MetaMask popup should appear...');
    
    // Trigger the signing - this will be handled by the useEffect
    signMessage({ message });
  };

  const handleCancelPost = () => {
    setPostContent("");
    setPostImage("");
    setShowPostModal(false);
  };

  const filteredPosts = posts.filter((post: any) => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: generateAvatarUrl("user-profile") }}
          style={styles.profileAvatar}
        />
        <Text style={styles.headerTitle}>Community</Text>
        <View style={styles.walletStatus}>
          <Text style={[styles.walletStatusText, { color: isConnected ? '#2ECC71' : '#FF6B6B' }]}>
            {isConnected ? '🟢 Connected' : '🔴 Not Connected'}
          </Text>
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, users, topics..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Posts Feed */}
      <ScrollView style={styles.postsContainer} showsVerticalScrollIndicator={false}>
        {filteredPosts.map((post: any) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image source={{ uri: post.avatar }} style={styles.userAvatar} />
              <View style={styles.userInfo}>
                <View style={styles.usernameRow}>
                  <Text style={styles.username}>{post.username}</Text>
                  <MaterialIcons name="verified" size={16} color="#1DA1F2" />
                </View>
                <Text style={styles.userDescription}>{post.userDescription}</Text>
                <Text style={styles.timeAgo}>{post.timeAgo}</Text>
              </View>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>
            
            {post.image && (
              <Image source={{ uri: post.image }} style={styles.postImage} />
            )}

            {/* Action Bar */}
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  post.userVote === 'up' && styles.activeUpvote,
                ]}
                onPress={() => handleVote(post.id, 'up')}
              >
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={post.userVote === 'up' ? '#00C851' : '#999'}
                />
                <Text
                  style={[
                    styles.actionText,
                    post.userVote === 'up' && styles.activeUpvoteText,
                  ]}
                >
                  {post.upvotes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  post.userVote === 'down' && styles.activeDownvote,
                ]}
                onPress={() => handleVote(post.id, 'down')}
              >
                <Ionicons
                  name="arrow-down"
                  size={20}
                  color={post.userVote === 'down' ? '#FF4444' : '#999'}
                />
                <Text
                  style={[
                    styles.actionText,
                    post.userVote === 'down' && styles.activeDownvoteText,
                  ]}
                >
                  {post.downvotes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleComment(post.id)}
              >
                <Feather name="message-circle" size={20} color="#999" />
                <Text style={styles.actionText}>{post.commentsCount}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleVerify(post.id)}
              >
                <MaterialIcons name="verified-user" size={20} color="#999" />
                <Text style={styles.actionText}>Verify</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Feather name="share" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreatePost}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Post Creation Modal */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelPost}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity 
              onPress={handleSubmitPost} 
              disabled={isVerifying || isSignPending}
              style={[styles.shareButtonContainer, (isVerifying || isSignPending) && styles.shareButtonDisabled]}
            >
              {isVerifying || isSignPending ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2ECC71" />
                  <Text style={styles.shareButtonLoading}>
                    {isSignPending ? "Sign Message..." : "Verifying..."}
                  </Text>
                </View>
              ) : (
                <Text style={styles.postButton}>Share</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.postComposer}>
              <Image 
                source={{ uri: generateAvatarUrl("current-user") }} 
                style={styles.composerAvatar} 
              />
              <View style={styles.composerContent}>
                <TextInput
                  style={styles.composerInput}
                  placeholder="What's happening in Web3?"
                  placeholderTextColor="#666"
                  value={postContent}
                  onChangeText={setPostContent}
                  multiline
                  textAlignVertical="top"
                />
                
                {postImage && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: postImage }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => setPostImage("")}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.composerActions}>
              <TouchableOpacity style={styles.actionIcon}>
                <Ionicons name="image-outline" size={24} color="#2ECC71" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                <Ionicons name="videocam-outline" size={24} color="#2ECC71" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                <Ionicons name="link-outline" size={24} color="#2ECC71" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                <Ionicons name="location-outline" size={24} color="#2ECC71" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1c1c',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  walletStatus: {
    marginRight: 8,
  },
  walletStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
  },
  postsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  postCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  userDescription: {
    color: '#999999',
    fontSize: 14,
    marginTop: 2,
  },
  timeAgo: {
    color: '#666666',
    fontSize: 13,
    marginTop: 4,
  },
  postContent: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  actionText: {
    color: '#999999',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  activeUpvote: {
    backgroundColor: 'rgba(0, 200, 81, 0.1)',
  },
  activeUpvoteText: {
    color: '#00C851',
  },
  activeDownvote: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  activeDownvoteText: {
    color: '#FF4444',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  shareButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  postButton: {
    color: '#2ECC71',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButtonLoading: {
    color: '#2ECC71',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  postComposer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  composerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
  },
  composerContent: {
    flex: 1,
    marginLeft: 12,
  },
  composerInput: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imagePreview: {
    marginTop: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  composerActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    justifyContent: 'flex-start',
  },
  actionIcon: {
    padding: 12,
    marginRight: 8,
  },
});


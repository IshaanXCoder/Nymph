import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    setPosts(prev => prev.map((post: any) => {
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
});


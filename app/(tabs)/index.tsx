import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// Research papers data from ethresear.ch
const researchPapers = [
  {
    id: "1",
    title: "Vanguard Prepares to Permit U.S. Clients Access to Third-Party Crypto ETFs",
    category: "News",
    timeAgo: "6 hours ago",
    posts: "11k Posts",
    authors: [
      { id: "1", color: "#FF6B6B", label: "A1" },
      { id: "2", color: "#4ECDC4", label: "B2" },
      { id: "3", color: "#45B7D1", label: "C3" },
    ],
    upvotes: 142,
    downvotes: 8,
    comments: 23,
    userVote: null as 'up' | 'down' | null,
    hasImage: true,
  },
  {
    id: "2",
    title: "Community Feedback Wanted: Privacy-Focused ZK Rollup with EVM Compatibility",
    category: "ZK Rollup",
    timeAgo: "2 days ago",
    posts: "84 Posts",
    authors: [
      { id: "4", color: "#96CEB4", label: "D4" },
      { id: "5", color: "#FFEAA7", label: "E5" },
    ],
    upvotes: 89,
    downvotes: 3,
    comments: 15,
    userVote: null as 'up' | 'down' | null,
    hasImage: false,
  },
  {
    id: "3",
    title: "Deep Funding: A Prediction Market For Open Source Dependencies",
    category: "Economics",
    timeAgo: "3 days ago",
    posts: "78 Posts",
    authors: [
      { id: "6", color: "#DDA0DD", label: "F6" },
    ],
    upvotes: 67,
    downvotes: 2,
    comments: 12,
    userVote: null as 'up' | 'down' | null,
    hasImage: false,
  },
  {
    id: "4",
    title: "Fork-Choice enforced Inclusion Lists (FOCIL): A simple committee-based inclusion list proposal",
    category: "Block proposer",
    timeAgo: "4 days ago",
    posts: "10k Posts",
    authors: [
      { id: "7", color: "#F7DC6F", label: "G7" },
      { id: "8", color: "#BB8FCE", label: "H8" },
      { id: "9", color: "#85C1E9", label: "I9" },
    ],
    upvotes: 234,
    downvotes: 12,
    comments: 45,
    userVote: null as 'up' | 'down' | null,
    hasImage: false,
  },
];

export default function Research() {
  const [searchQuery, setSearchQuery] = useState("");
  const [papers, setPapers] = useState(researchPapers);

  const handleVote = (paperId: string, voteType: 'up' | 'down') => {
    setPapers(prev => prev.map(paper => {
      if (paper.id === paperId) {
        const currentVote = paper.userVote;
        let newUpvotes = paper.upvotes;
        let newDownvotes = paper.downvotes;
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
          ...paper,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          userVote: newUserVote,
        };
      }
      return paper;
    }));
  };

  const handleComment = (paperId: string) => {
    console.log(`Opening comments for paper ${paperId}`);
  };

  const handleVerify = (paperId: string) => {
    console.log(`Verifying paper ${paperId}`);
  };

  const filteredPapers = papers.filter(paper => 
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="library" size={28} color="#2ECC71" />
        </View>
        <Text style={styles.headerTitle}>Research</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Research Papers */}
      <ScrollView style={styles.papersContainer} showsVerticalScrollIndicator={false}>
        {filteredPapers.map((paper) => (
          <View key={paper.id} style={styles.paperCard}>
            <View style={styles.paperContent}>
              <Text style={styles.paperTitle}>{paper.title}</Text>
              
              <View style={styles.paperMeta}>
                <View style={styles.authorsContainer}>
                  {paper.authors.map((author, index) => (
                    <View
                      key={author.id}
                      style={[
                        styles.authorAvatar,
                        { backgroundColor: author.color },
                        index > 0 && { marginLeft: -8 }
                      ]}
                    >
                      <Text style={styles.authorLabel}>{author.label}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.metaInfo}>
                  <Text style={styles.timeAgo}>{paper.timeAgo}</Text>
                  <View style={styles.separator} />
                  <Text style={styles.category}>{paper.category}</Text>
                  <View style={styles.separator} />
                  <Text style={styles.posts}>{paper.posts}</Text>
                </View>
              </View>
            </View>

            {paper.hasImage && (
              <View style={styles.paperImage} />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
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
    paddingVertical: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  papersContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  paperCard: {
    backgroundColor: '#000000',
    borderRadius: 0,
    paddingVertical: 20,
    marginVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#333539',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  paperContent: {
    flex: 1,
    paddingRight: 16,
  },
  paperTitle: {
    color: '#D9D9D9',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 12,
  },
  paperMeta: {
    flexDirection: 'column',
    gap: 8,
  },
  authorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  authorLabel: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeAgo: {
    color: '#70767A',
    fontSize: 13,
    fontWeight: '400',
  },
  separator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#292929',
  },
  category: {
    color: '#70767A',
    fontSize: 13,
    fontWeight: '400',
  },
  posts: {
    color: '#70767A',
    fontSize: 13,
    fontWeight: '400',
  },
  paperImage: {
    width: 78.667,
    height: 78.667,
    borderRadius: 11.333,
    backgroundColor: '#292929',
    marginLeft: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D1D5DB',
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
});
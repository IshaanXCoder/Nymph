import { SignedMessage, SignedMessageWithProof } from '../types';

/**
 * Mock API base URL - replace with your actual API endpoint
 */
const API_BASE_URL = 'https://api.nymph.example.com';

/**
 * Fetch messages from the server
 */
export async function fetchMessages(isInternal: boolean = false): Promise<SignedMessageWithProof[]> {
  try {
    // Mock implementation - replace with actual API call
    console.log(`Fetching ${isInternal ? 'internal' : 'public'} messages`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock data
    const mockMessages: SignedMessageWithProof[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        text: isInternal 
          ? "This is a sample internal message. Only members of our organization can see this."
          : "This is a sample public message. Anyone can see this message.",
        internal: isInternal,
        likes: Math.floor(Math.random() * 20),
        anonGroupId: 'example.com',
        anonGroupProvider: 'google',
        signature: 'mock_signature_1',
        ephemeralPubkey: 'mock_pubkey_1',
        ephemeralPubkeyExpiry: new Date(Date.now() + 86400000), // 24 hours from now
        proof: 'mock_proof_1',
        proofArgs: { domain: 'example.com', email: 'user@example.com' },
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        text: isInternal
          ? "Another internal message with some thoughts about the company culture."
          : "Another public message sharing some insights about remote work.",
        internal: isInternal,
        likes: Math.floor(Math.random() * 15),
        anonGroupId: 'example.com',
        anonGroupProvider: 'google',
        signature: 'mock_signature_2',
        ephemeralPubkey: 'mock_pubkey_2',
        ephemeralPubkeyExpiry: new Date(Date.now() + 86400000),
        proof: 'mock_proof_2',
        proofArgs: { domain: 'example.com', email: 'user2@example.com' },
      },
    ];

    return mockMessages;
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    throw error;
  }
}

/**
 * Create a new message
 */
export async function createMessage(message: SignedMessage): Promise<SignedMessageWithProof> {
  try {
    console.log('Creating message:', message);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return the message with additional fields
    return {
      ...message,
      proof: 'mock_proof_generated',
      proofArgs: { domain: message.anonGroupId, email: 'user@example.com' },
    };
  } catch (error) {
    console.error('Failed to create message:', error);
    throw error;
  }
}

/**
 * Create a new membership
 */
export async function createMembership(membership: {
  ephemeralPubkey: string;
  ephemeralPubkeyExpiry: Date;
  groupId: string;
  provider: string;
  proof: string;
  proofArgs: any;
}): Promise<void> {
  try {
    console.log('Creating membership:', membership);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful membership creation
    console.log('Membership created successfully');
  } catch (error) {
    console.error('Failed to create membership:', error);
    throw error;
  }
}

/**
 * Toggle like for a message
 */
export async function toggleLike(messageId: string, isLiked: boolean): Promise<void> {
  try {
    console.log(`Toggling like for message ${messageId}: ${isLiked}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock successful like toggle
    console.log('Like toggled successfully');
  } catch (error) {
    console.error('Failed to toggle like:', error);
    throw error;
  }
}

/**
 * Fetch a specific message by ID
 */
export async function fetchMessage(messageId: string): Promise<SignedMessageWithProof | null> {
  try {
    console.log('Fetching message:', messageId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock message or null if not found
    return null;
  } catch (error) {
    console.error('Failed to fetch message:', error);
    throw error;
  }
}

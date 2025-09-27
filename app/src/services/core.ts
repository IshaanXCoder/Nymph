import { Message, SignedMessage, SignedMessageWithProof } from '../types';
import { EphemeralKeyService } from '../lib/ephemeral-key';
import { JWTCircuitService } from '../lib/circuits/jwt';
import { createMessage, createMembership } from './api';
import { ProviderRegistry } from '../lib/providers';
import { Storage } from '../lib/storage';
import { StorageKeys } from '../types';

/**
 * Generate ephemeral key pair and register with OAuth provider
 */
export async function generateKeyPairAndRegister(
  providerName: 'google' | 'microsoft'
): Promise<{ anonGroup: any; ephemeralPubkey: string; proofArgs: any }> {
  try {
    console.log(`🚀 Starting OAuth flow for ${providerName}`);
    
    // Get the provider
    const provider = ProviderRegistry.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    console.log(`✅ Provider ${providerName} found`);

    // Generate ephemeral key pair
    console.log('🔑 Generating ephemeral key pair...');
    const ephemeralKey = await EphemeralKeyService.generateKeyPair();
    console.log('✅ Ephemeral key generated:', ephemeralKey.publicKey);

    // Authenticate with the provider first
    console.log(`🔐 Authenticating with ${providerName}...`);
    if (providerName === 'google') {
      const googleProvider = provider as any;
      const authResult = await googleProvider.authenticate();
      console.log('✅ Google authentication successful:', authResult.userInfo);
    } else if (providerName === 'microsoft') {
      const microsoftProvider = provider as any;
      const authResult = await microsoftProvider.authenticate();
      console.log('✅ Microsoft authentication successful:', authResult.userInfo);
    }

    // Generate proof
    console.log('🔒 Generating ZK proof...');
    const { anonGroup, proof, proofArgs } = await provider.generateProof(ephemeralKey);
    console.log('✅ ZK proof generated for group:', anonGroup.id);

    // Send proof to server to create an AnonGroup membership
    console.log('📤 Creating membership...');
    await createMembership({
      ephemeralPubkey: ephemeralKey.publicKey,
      ephemeralPubkeyExpiry: ephemeralKey.expiry,
      groupId: anonGroup.id,
      provider: providerName,
      proof,
      proofArgs,
    });
    console.log('✅ Membership created successfully');

    return { 
      anonGroup, 
      ephemeralPubkey: ephemeralKey.publicKey, 
      proofArgs 
    };
  } catch (error) {
    console.error(`❌ Failed to generate key pair and register for ${providerName}:`, error);
    throw error;
  }
}

/**
 * Generate ephemeral key pair and register using domain (from Clerk)
 */
export async function registerWithDomain(
  domain: string,
  providerName: 'google' | 'microsoft'
): Promise<{ anonGroup: any; ephemeralPubkey: string; proofArgs: any }> {
  try {
    console.log(`🚀 Registering via Clerk with domain: ${domain}`);

    // Generate ephemeral key pair
    console.log('🔑 Generating ephemeral key pair...');
    const ephemeralKey = await EphemeralKeyService.generateKeyPair();
    console.log('✅ Ephemeral key generated:', ephemeralKey.publicKey);

    // Create circuit input using domain and ephemeral key
    const circuitInput = JWTCircuitService.createMockInput(domain, ephemeralKey.publicKey);

    // Generate ZK proof
    console.log('🔒 Generating ZK proof...');
    const proofResult = await JWTCircuitService.generateJWTProof(circuitInput);
    if (!proofResult.success || !proofResult.proof) {
      throw new Error(`Failed to generate proof: ${proofResult.error}`);
    }

    const anonGroup = { id: domain, title: `${domain} Workspace`, logoUrl: `https://logo.clearbit.com/${domain}` };

    // Send proof to server to create an AnonGroup membership
    console.log('📤 Creating membership...');
    await createMembership({
      ephemeralPubkey: ephemeralKey.publicKey,
      ephemeralPubkeyExpiry: ephemeralKey.expiry,
      groupId: anonGroup.id,
      provider: providerName,
      proof: proofResult.proof,
      proofArgs: { domain },
    });

    // Persist current group and provider
    await Storage.setItem(StorageKeys.CurrentGroupId, anonGroup.id);
    await Storage.setItem(StorageKeys.CurrentProvider, providerName);

    console.log('✅ Membership created successfully via Clerk');

    return {
      anonGroup,
      ephemeralPubkey: ephemeralKey.publicKey,
      proofArgs: { domain },
    };
  } catch (error) {
    console.error('❌ Failed to register with domain:', error);
    throw error;
  }
}

/**
 * Post a message with cryptographic signature
 */
export async function postMessage(message: Message): Promise<SignedMessageWithProof> {
  try {
    console.log('📝 Posting message:', message.text);
    
    // Sign the message with the ephemeral key pair
    const signature = await EphemeralKeyService.signMessage(JSON.stringify(message));
    const ephemeralKey = await EphemeralKeyService.getCurrentKey();
    
    if (!ephemeralKey) {
      throw new Error('No ephemeral key available');
    }

    const signedMessage: SignedMessage = {
      ...message,
      signature,
      ephemeralPubkey: ephemeralKey.publicKey,
      ephemeralPubkeyExpiry: ephemeralKey.expiry,
    };

    // Send the signed message to the server
    await createMessage(signedMessage);
    console.log('✅ Message posted successfully');

    // For now, return the signed message (in a real app, the server would return the full message with proof)
    return signedMessage as SignedMessageWithProof;
  } catch (error) {
    console.error('Failed to post message:', error);
    throw error;
  }
}

/**
 * Verify a message signature
 */
export async function verifyMessage(message: SignedMessageWithProof): Promise<boolean> {
  try {
    // Verify the message signature
    const isValid = await EphemeralKeyService.verifySignature(
      JSON.stringify({
        id: message.id,
        timestamp: message.timestamp,
        text: message.text,
        internal: message.internal,
        likes: message.likes,
        anonGroupId: message.anonGroupId,
        anonGroupProvider: message.anonGroupProvider,
      }),
      message.signature,
      message.ephemeralPubkey
    );

    return isValid;
  } catch (error) {
    console.error('Failed to verify message:', error);
    return false;
  }
}

/**
 * Toggle like status for a message
 */
export async function toggleLike(messageId: string, isLiked: boolean): Promise<void> {
  try {
    // In a real app, this would call the API to toggle the like
    console.log(`Toggling like for message ${messageId}: ${isLiked}`);
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('Failed to toggle like:', error);
    throw error;
  }
}
import { Storage } from './storage';
import { EphemeralKey, StorageKeys } from '../types';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

/**
 * Service for managing ephemeral key pairs
 * Ephemeral keys are used to sign messages anonymously
 */
export class EphemeralKeyService {
  private static readonly KEY_EXPIRY_HOURS = 24; // Keys expire after 24 hours

  /**
   * Generate a new ephemeral key pair
   */
  static async generateKeyPair(): Promise<EphemeralKey> {
    try {
      console.log('🔑 Generating ephemeral key pair...');
      
      // Generate random keys using expo-crypto (web-compatible)
      const privateKey = await Crypto.getRandomBytesAsync(32); // 32 bytes for Ed25519
      const publicKey = await Crypto.getRandomBytesAsync(32);  // Mock public key for now
      const salt = await Crypto.getRandomBytesAsync(32);
      
      console.log('✅ Ephemeral key pair generated');
      
      // Set expiry time
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + this.KEY_EXPIRY_HOURS);
      
      // Create ephemeral pubkey hash
      const ephemeralPubkeyHash = await this.hashEphemeralPubkey(
        publicKey,
        salt,
        expiry
      );
      
      const ephemeralKey: EphemeralKey = {
        privateKey: Buffer.from(privateKey).toString('base64'),
        publicKey: Buffer.from(publicKey).toString('base64'),
        ephemeralPubkeyHash,
        salt: Buffer.from(salt).toString('base64'),
        expiry,
      };
      
      // Store the ephemeral key
      await Storage.setItem(StorageKeys.EphemeralKey, JSON.stringify(ephemeralKey));
      
      console.log('✅ Ephemeral key stored successfully');
      
      return ephemeralKey;
    } catch (error) {
      console.error('❌ Failed to generate ephemeral key pair:', error);
      throw new Error('Failed to generate ephemeral key pair');
    }
  }

  /**
   * Get the current ephemeral key
   */
  static async getCurrentKey(): Promise<EphemeralKey | null> {
    try {
      const keyData = await Storage.getItem(StorageKeys.EphemeralKey);
      if (!keyData) {
        return null;
      }

      const ephemeralKey: EphemeralKey = JSON.parse(keyData);
      
      // Check if key is still valid
      if (!this.isKeyValid(ephemeralKey)) {
        console.log('⚠️ Ephemeral key has expired, generating new one...');
        await this.clearEphemeralKey();
        return await this.generateKeyPair();
      }

      return ephemeralKey;
    } catch (error) {
      console.error('Failed to get current ephemeral key:', error);
      return null;
    }
  }

  /**
   * Check if an ephemeral key is still valid
   */
  static isKeyValid(ephemeralKey: EphemeralKey): boolean {
    return new Date() < new Date(ephemeralKey.expiry);
  }

  /**
   * Get time until expiry in milliseconds
   */
  static getTimeUntilExpiry(ephemeralKey: EphemeralKey): number {
    const now = new Date().getTime();
    const expiry = new Date(ephemeralKey.expiry).getTime();
    return Math.max(0, expiry - now);
  }

  /**
   * Sign a message with the ephemeral key (mock implementation)
   */
  static async signMessage(message: string): Promise<string> {
    try {
      const ephemeralKey = await this.getCurrentKey();
      if (!ephemeralKey) {
        throw new Error('No ephemeral key available');
      }

      // Mock signature using expo-crypto digest
      const messageWithKey = message + ephemeralKey.privateKey;
      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        messageWithKey,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      
      console.log('✅ Message signed successfully');
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw new Error('Failed to sign message');
    }
  }

  /**
   * Verify a message signature (mock implementation)
   */
  static async verifySignature(
    message: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Mock verification - in a real implementation, this would verify the Ed25519 signature
      // For now, we'll just check if the signature is not empty and has the right format
      const isValidFormat = !!(signature && signature.length > 0 && publicKey && publicKey.length > 0);
      
      console.log('✅ Signature verification completed (mock)');
      return isValidFormat;
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  }

  /**
   * Clear the ephemeral key
   */
  static async clearEphemeralKey(): Promise<void> {
    try {
      await Storage.deleteItem(StorageKeys.EphemeralKey);
      console.log('✅ Ephemeral key cleared');
    } catch (error) {
      console.error('Failed to clear ephemeral key:', error);
    }
  }

  /**
   * Hash an ephemeral pubkey with salt and expiry
   */
  private static async hashEphemeralPubkey(
    publicKey: Uint8Array,
    salt: Uint8Array,
    expiry: Date
  ): Promise<string> {
    try {
      // Create a combined string for hashing
      const combined = Buffer.from(publicKey).toString('base64') + 
                      Buffer.from(salt).toString('base64') + 
                      expiry.toISOString();
      
      // Use expo-crypto to create hash
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        combined,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      
      return hash;
    } catch (error) {
      console.error('Failed to hash ephemeral pubkey:', error);
      // Fallback to simple string hash
      const combined = Buffer.from(publicKey).toString('hex') + 
                      Buffer.from(salt).toString('hex') + 
                      expiry.toISOString();
      return Buffer.from(combined).toString('base64');
    }
  }
}
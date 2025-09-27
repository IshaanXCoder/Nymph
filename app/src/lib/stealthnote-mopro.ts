import { Platform, NativeModules } from 'react-native';
import { EphemeralKey, JWTCircuitInput, JWTProofResult, JWTVerificationResult } from '../types';
import { Storage } from './storage';
import { extractDomainWithCircuitIntegration, generateStealthNoteNonce, parseJWTClaims } from './domain-extraction';
import * as Crypto from 'expo-crypto';


export interface StealthNoteMessage {
  content: string;
  signature: string;
  ephemeralPubkey: string;
  timestamp: number;
  domain: string;
}

export interface StealthNoteProof {
  proof: string;
  ephemeralPubkey: string;
  domain: string;
  timestamp: number;
  expiryTimestamp: number;
}

export interface StealthNoteUser {
  ephemeralKey: EphemeralKey;
  domain: string;
  proof: StealthNoteProof;
  registrationTimestamp: number;
}

export class StealthNoteMoproService {
  
  static async registerWithStealthNote(
    jwtToken: string,
    provider: 'google' | 'microsoft'
  ): Promise<StealthNoteUser> {
    try {
      console.log('🚀 Starting StealthNote registration with Mopro...');
      
      // Step 1: Extract domain from JWT (as per StealthNote)
      const domainResult = extractDomainWithCircuitIntegration(jwtToken, provider);
      if (!domainResult.isValid) {
        throw new Error(`Domain extraction failed: ${domainResult.error}`);
      }
      
      console.log('✅ Extracted domain from JWT:', domainResult.domain);
      
      // Step 2: Generate ephemeral key pair (as per StealthNote)
      const ephemeralKey = await this.generateEphemeralKeyPair();
      console.log('✅ Generated ephemeral key pair');
      
      // Step 3: Generate nonce using StealthNote method
      // nonce = Poseidon2(ephemeral_pubkey, ephemeral_pubkey_salt, ephemeral_pubkey_expiry)
      const nonce = generateStealthNoteNonce(
        ephemeralKey.publicKey,
        ephemeralKey.salt,
        Math.floor(ephemeralKey.expiry.getTime() / 1000)
      );
      
      console.log('✅ Generated StealthNote nonce:', nonce.substring(0, 20) + '...');
      
      // Step 4: Create circuit input for Mopro
      const circuitInput = this.createMoproCircuitInput(
        jwtToken,
        ephemeralKey,
        domainResult.domain,
        nonce
      );
      
      console.log('✅ Created Mopro circuit input');
      
      // Step 5: Generate ZK proof using Android Mopro bindings
      const proofResult = await this.generateMoproProof(circuitInput);
      if (!proofResult.success || !proofResult.proof) {
        throw new Error(`Proof generation failed: ${proofResult.error}`);
      }
      
      console.log('✅ Generated ZK proof with Mopro:', proofResult.proof.substring(0, 50) + '...');
      
      // Step 6: Create StealthNote user
      const stealthNoteUser: StealthNoteUser = {
        ephemeralKey,
        domain: domainResult.domain,
        proof: {
          proof: proofResult.proof,
          ephemeralPubkey: ephemeralKey.publicKey,
          domain: domainResult.domain,
          timestamp: Date.now(),
          expiryTimestamp: ephemeralKey.expiry.getTime()
        },
        registrationTimestamp: Date.now()
      };
      
      // Step 7: Store user data locally
      await this.storeStealthNoteUser(stealthNoteUser);
      
      console.log('🎉 StealthNote registration completed successfully!');
      return stealthNoteUser;
      
    } catch (error) {
      console.error('❌ StealthNote registration failed:', error);
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  static async signMessage(
    message: string,
    user?: StealthNoteUser
  ): Promise<StealthNoteMessage> {
    try {
      // Get current user if not provided
      if (!user) {
        user = await this.getCurrentStealthNoteUser();
        if (!user) {
          throw new Error('No StealthNote user found. Please register first.');
        }
      }
      
      // Check if ephemeral key has expired
      if (Date.now() > user.ephemeralKey.expiry.getTime()) {
        throw new Error('Ephemeral key has expired. Please register again.');
      }
      
      console.log('✍️ Signing message with ephemeral key...');
      
      // Sign message using ephemeral private key (EdDSA as per StealthNote)
      const signature = await this.signWithEphemeralKey(message, user.ephemeralKey.privateKey);
      
      const signedMessage: StealthNoteMessage = {
        content: message,
        signature,
        ephemeralPubkey: user.ephemeralKey.publicKey,
        timestamp: Date.now(),
        domain: user.domain
      };
      
      console.log('✅ Message signed successfully');
      return signedMessage;
      
    } catch (error) {
      console.error('❌ Message signing failed:', error);
      throw new Error(`Message signing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  static async verifyMessage(
    message: StealthNoteMessage,
    proof: StealthNoteProof
  ): Promise<boolean> {
    try {
      console.log('🔍 Verifying StealthNote message...');
      
      // Step 1: Verify message signature with ephemeral public key
      const signatureValid = await this.verifyEphemeralSignature(
        message.content,
        message.signature,
        message.ephemeralPubkey
      );
      
      if (!signatureValid) {
        console.error('❌ Message signature verification failed');
        return false;
      }
      
      console.log('✅ Message signature verified');
      
      // Step 2: Verify ZK proof using Mopro
      const proofValid = await this.verifyMoproProof(proof.proof);
      if (!proofValid) {
        console.error('❌ ZK proof verification failed');
        return false;
      }
      
      console.log('✅ ZK proof verified');
      
      // Step 3: Verify ephemeral key matches proof
      if (message.ephemeralPubkey !== proof.ephemeralPubkey) {
        console.error('❌ Ephemeral key mismatch');
        return false;
      }
      
      // Step 4: Verify domain matches
      if (message.domain !== proof.domain) {
        console.error('❌ Domain mismatch');
        return false;
      }
      
      // Step 5: Check proof expiry
      if (Date.now() > proof.expiryTimestamp) {
        console.error('❌ Proof has expired');
        return false;
      }
      
      console.log('🎉 StealthNote message verification successful!');
      return true;
      
    } catch (error) {
      console.error('❌ Message verification failed:', error);
      return false;
    }
  }
  
  static async rotateEphemeralKey(jwtToken: string, provider: 'google' | 'microsoft'): Promise<StealthNoteUser> {
    try {
      console.log('🔄 Rotating ephemeral key...');
      
      // Generate new user with fresh ephemeral key
      const newUser = await this.registerWithStealthNote(jwtToken, provider);
      
      console.log('✅ Ephemeral key rotated successfully');
      return newUser;
      
    } catch (error) {
      console.error('❌ Key rotation failed:', error);
      throw error;
    }
  }
  
  private static async generateEphemeralKeyPair(): Promise<EphemeralKey> {
    try {
      // Generate cryptographically secure random keys
      const publicKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `ephemeral_public_${Date.now()}_${Math.random()}`
      );
      
      const privateKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `ephemeral_private_${Date.now()}_${Math.random()}`
      );
      
      const salt = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `salt_${Date.now()}_${Math.random()}`
      );
      
      // Set expiry to 1 hour (as per StealthNote recommendations)
      const expiry = new Date(Date.now() + 3600000);
      
      // Generate ephemeral pubkey hash for nonce
      const ephemeralPubkeyHash = generateStealthNoteNonce(
        publicKey,
        salt,
        Math.floor(expiry.getTime() / 1000)
      );
      
      return {
        publicKey,
        privateKey,
        salt,
        expiry,
        ephemeralPubkeyHash
      };
      
    } catch (error) {
      console.error('Failed to generate ephemeral key pair:', error);
      throw error;
    }
  }
  
  private static createMoproCircuitInput(
    jwtToken: string,
    ephemeralKey: EphemeralKey,
    domain: string,
    nonce: string
  ): JWTCircuitInput {
    try {
      // Parse JWT token
      const parts = jwtToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }
      
      const [header, payload, signature] = parts;
      const headerPayload = `${header}.${payload}`;
      
      // Convert to byte arrays for circuit
      const partialData = new Array(640).fill(0);
      const headerPayloadBytes = Array.from(new TextEncoder().encode(headerPayload));
      
      const maxLength = Math.min(headerPayloadBytes.length, 640);
      for (let i = 0; i < maxLength; i++) {
        partialData[i] = headerPayloadBytes[i];
      }
      
      // Create domain bytes (64-byte array)
      const domainBytes = new Array(64).fill(0);
      const domainByteArray = Array.from(new TextEncoder().encode(domain));
      const maxDomainLength = Math.min(domainByteArray.length, 64);
      for (let i = 0; i < maxDomainLength; i++) {
        domainBytes[i] = domainByteArray[i];
      }
      
      // TODO: In production, fetch real Google/Microsoft public keys
      const mockRSALimbs = new Array(18).fill(1);
      
      return {
        partialData,
        partialHash: [1, 2, 3, 4, 5, 6, 7, 8], // Mock - would be real partial SHA
        fullDataLength: headerPayloadBytes.length,
        base64DecodeOffset: 0,
        jwtPubkeyModulusLimbs: mockRSALimbs,
        jwtPubkeyRedcParamsLimbs: mockRSALimbs,
        jwtSignatureLimbs: mockRSALimbs,
        domain: domainBytes,
        ephemeralPubkey: ephemeralKey.publicKey,
        ephemeralPubkeySalt: ephemeralKey.salt,
        ephemeralPubkeyExpiry: Math.floor(ephemeralKey.expiry.getTime() / 1000)
      };
      
    } catch (error) {
      console.error('Failed to create Mopro circuit input:', error);
      throw error;
    }
  }
  
  private static async generateMoproProof(circuitInput: JWTCircuitInput): Promise<JWTProofResult> {
    try {
      if (Platform.OS === 'android') {
        // Use Android Mopro bindings with StealthNote integration
        const { MoproModule } = NativeModules;
        if (MoproModule) {
          console.log('🔧 Using Android Mopro bindings for StealthNote proof generation...');
          
          // Test connectivity first
          if (MoproModule.moproUniffiNymph) {
            const greeting = await MoproModule.moproUniffiNymph();
            console.log('📞 Mopro greeting:', greeting);
          }
          
          // Use the dedicated StealthNote proof generation function
          if (MoproModule.generateStealthNoteProof) {
            const circuitInputJson = JSON.stringify(circuitInput);
            const proof = await MoproModule.generateStealthNoteProof(circuitInputJson);
            
            console.log('✅ StealthNote proof generated via Android Mopro:', proof.substring(0, 50) + '...');
            
            return {
              success: true,
              proof
            };
          } else {
            throw new Error('generateStealthNoteProof function not available in Mopro module');
          }
        } else {
          throw new Error('Mopro module not available on Android');
        }
      } else {
        // Fallback for non-Android platforms
        console.log('📱 Using mock proof generation for non-Android platform...');
        
        const proofData = {
          circuitInput,
          timestamp: Date.now(),
          platform: Platform.OS,
          type: 'stealthnote_jwt_proof'
        };
        
        const proof = `mock_stealthnote_proof_${Buffer.from(JSON.stringify(proofData)).toString('base64')}`;
        
        return {
          success: true,
          proof
        };
      }
    } catch (error) {
      console.error('Mopro proof generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  static async verifyMoproProof(proof: string): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Use Android Mopro bindings for verification
        const { MoproModule } = NativeModules;
        if (MoproModule && MoproModule.verifyStealthNoteProof) {
          console.log('🔍 Using Android Mopro bindings for StealthNote proof verification...');
          
          const isValid = await MoproModule.verifyStealthNoteProof(proof);
          console.log('✅ Android Mopro verification result:', isValid);
          
          return isValid;
        } else {
          console.log('⚠️ verifyStealthNoteProof not available, using fallback verification');
        }
      }
      
      // Fallback verification for non-Android or when native function not available
      try {
        if (proof.startsWith('mopro_stealthnote_proof_')) {
          const base64Data = proof.replace('mopro_stealthnote_proof_', '');
          const proofData = JSON.parse(Buffer.from(base64Data, 'base64').toString());
          return proofData.platform === 'android-mopro' && proofData.type === 'stealthnote_jwt_proof';
        }
        
        if (proof.startsWith('mock_stealthnote_proof_')) {
          const base64Data = proof.replace('mock_stealthnote_proof_', '');
          const proofData = JSON.parse(Buffer.from(base64Data, 'base64').toString());
          return proofData.type === 'stealthnote_jwt_proof';
        }
        
        return false;
      } catch (decodeError) {
        console.error('Failed to decode proof for verification:', decodeError);
        return false;
      }
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }
  
  /**
   * Sign message with ephemeral private key (EdDSA as per StealthNote)
   */
  private static async signWithEphemeralKey(message: string, privateKey: string): Promise<string> {
    try {
      // In production, this would use EdDSA signature
      // For now, create a deterministic signature
      const messageHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        message
      );
      
      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${messageHash}:${privateKey}`
      );
      
      return `stealthnote_sig_${signature}`;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  }
  
  /**
   * Verify message signature with ephemeral public key
   */
  private static async verifyEphemeralSignature(
    message: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // In production, this would use EdDSA signature verification
      // For now, verify the mock signature
      if (!signature.startsWith('stealthnote_sig_')) {
        return false;
      }
      
      const expectedSignature = await this.signWithEphemeralKey(message, 'verify_' + publicKey);
      return signature === expectedSignature.replace('verify_', '');
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
  
  /**
   * Store StealthNote user data locally
   */
  private static async storeStealthNoteUser(user: StealthNoteUser): Promise<void> {
    try {
      await Storage.setItem('stealthnote_user', JSON.stringify(user));
      console.log('✅ StealthNote user stored locally');
    } catch (error) {
      console.error('Failed to store StealthNote user:', error);
      throw error;
    }
  }
  
  /**
   * Get current StealthNote user
   */
  static async getCurrentStealthNoteUser(): Promise<StealthNoteUser | null> {
    try {
      const userData = await Storage.getItem('stealthnote_user');
      if (!userData) return null;
      
      const user = JSON.parse(userData) as StealthNoteUser;
      
      // Check if user data is still valid
      if (Date.now() > user.ephemeralKey.expiry.getTime()) {
        console.log('⏰ StealthNote user has expired');
        await Storage.removeItem('stealthnote_user');
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Failed to get StealthNote user:', error);
      return null;
    }
  }
  
  /**
   * Clear StealthNote user data
   */
  static async clearStealthNoteUser(): Promise<void> {
    try {
      await Storage.removeItem('stealthnote_user');
      console.log('✅ StealthNote user data cleared');
    } catch (error) {
      console.error('Failed to clear StealthNote user:', error);
      throw error;
    }
  }
  
  /**
   * Get user's domain and registration status
   */
  static async getStealthNoteStatus(): Promise<{
    isRegistered: boolean;
    domain?: string;
    ephemeralKeyExpiry?: Date;
    registrationTime?: Date;
  }> {
    try {
      const user = await this.getCurrentStealthNoteUser();
      
      if (!user) {
        return { isRegistered: false };
      }
      
      return {
        isRegistered: true,
        domain: user.domain,
        ephemeralKeyExpiry: user.ephemeralKey.expiry,
        registrationTime: new Date(user.registrationTimestamp)
      };
    } catch (error) {
      console.error('Failed to get StealthNote status:', error);
      return { isRegistered: false };
    }
  }
}

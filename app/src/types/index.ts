
//  * Represents an anonymous group where members can post messages without revealing their identity
//  * Example: people in a company

export interface AnonGroup {
  /** Unique identifier for the group (e.g: company domain) */
  id: string;
  /** Display name of the group */
  title: string;
  /** URL to the group's logo image */
  logoUrl: string;
}


//  * Ephemeral key pair generated and stored in the device's secure storage
//  * This key is used to sign messages.

export interface EphemeralKey {
  privateKey: string; // Using string for React Native compatibility
  publicKey: string;
  salt: string;
  expiry: Date;
  ephemeralPubkeyHash: string;
}

export interface AnonGroupProvider {
  // Get the provider's unique identifier
  name(): string;
  getSlug(): string;
  // slug -> key which represents the type of anongroup identifier

  generateProof(ephemeralKey: EphemeralKey): Promise<{
    proof: string; // Base64 encoded proof for React Native
    anonGroup: AnonGroup;
    proofArgs: object;
  }>;

  /**
   * Verify a ZK proof of group membership
   * @param proof - The ZK proof to verify
   * @param ephemeralPubkey - Pubkey modulus of the ephemeral key that was used when generating the proof
   * @param anonGroup - AnonGroup that the proof claims membership in
   * @param proofArgs - Additional args that was returned when the proof was generated
   * @returns Promise resolving to true if the proof is valid
   */
  verifyProof(
    proof: string,
    anonGroupId: string,
    ephemeralPubkey: string,
    ephemeralPubkeyExpiry: Date,
    proofArgs: object
  ): Promise<boolean>;

  /**
   * Get the AnonGroup by its unique identifier
   * @param groupId - Unique identifier for the AnonGroup
   * @returns Promise resolving to the AnonGroup
   */
  getAnonGroup(groupId: string): AnonGroup;
}

/**
 * Represents a message posted by an AnonGroup member
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** ID of the AnonGroup the corresponding user belongs to */
  anonGroupId: string;
  /** Name of the provider that generated the proof that the user (user's ephemeral pubkey) belongs to the AnonGroup */
  anonGroupProvider: string;
  /** Content of the message */
  text: string;
  /** Unix timestamp when the message was created */
  timestamp: Date;
  /** Whether this message is only visible to other members of the same AnonGroup */
  internal: boolean;
  /** Number of likes message received */
  likes: number;
}

export interface SignedMessage extends Message {
  /** Ed25519 signature of the message - signed by the user's ephemeral private key (in hex format) */
  signature: string;
  /** Ed25519 pubkey that can verify the signature */
  ephemeralPubkey: string;
  /** Expiry of the ephemeral pubkey */
  ephemeralPubkeyExpiry: Date;
}

export interface SignedMessageWithProof extends SignedMessage {
  /** ZK proof that the sender belongs to the AnonGroup */
  proof: string;
  /** Additional args that was returned when the proof was generated */
  proofArgs: object;
}

/**
 * JWT Circuit Input interface for Mopro bindings
 */
export interface JWTCircuitInput {
  partialData: number[];
  partialHash: number[];
  fullDataLength: number;
  base64DecodeOffset: number;
  jwtPubkeyModulusLimbs: number[];
  jwtPubkeyRedcParamsLimbs: number[];
  jwtSignatureLimbs: number[];
  domain: number[];
  ephemeralPubkey: string;
  ephemeralPubkeySalt: string;
  ephemeralPubkeyExpiry: number;
}

export interface JWTProofResult {
  success: boolean;
  proof?: string;
  error?: string;
}

export interface JWTVerificationResult {
  success: boolean;
  valid?: boolean;
  error?: string;
}

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'microsoft';

export interface OAuthConfig {
  provider: OAuthProvider;
  clientId: string;
  redirectUri: string;
}

/**
 * App state interfaces
 */
export interface AppState {
  currentGroupId?: string;
  currentProvider?: OAuthProvider;
  ephemeralKey?: EphemeralKey;
  isAuthenticated: boolean;
  hasSeenWelcomeMessage: boolean;
}

export const StorageKeys = {
  EphemeralKey: "ephemeralKey",
  CurrentGroupId: "currentGroupId",
  CurrentProvider: "currentProvider",
  GoogleOAuthState: "googleOAuthState",
  GoogleOAuthNonce: "googleOAuthNonce",
  MicrosoftOAuthState: "microsoftOAuthState",
  MicrosoftOAuthNonce: "microsoftOAuthNonce",
  HasSeenWelcomeMessage: "hasSeenWelcomeMessage",
} as const;

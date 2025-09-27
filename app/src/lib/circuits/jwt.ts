import { JWTCircuitInput, JWTProofResult, JWTVerificationResult } from '../../types';
import { Platform, NativeModules } from 'react-native';

// Mock JWT bindings for development
const MockJWTBindings = {
  generateJWTProof: async (...args: any[]) => {
    console.log('Mock: Generating JWT proof with args:', args);
    return `mock_jwt_proof_${Date.now()}`;
  },
  
  verifyJWTProof: async (circuitPath: string, proof: string) => {
    console.log('Mock: Verifying JWT proof:', { circuitPath, proof });
    return proof.startsWith('mock_jwt_proof');
  },
  
  helloWorld: async () => {
    return `Hello from Mock JWT Bindings on ${Platform.OS}!`;
  }
};

// Android Native Module for JWT Circuit
const AndroidJWTBindings = {
  generateJWTProof: async (input: JWTCircuitInput) => {
    console.log('Android: Generating JWT proof with input:', input);
    
    // For now, simulate proof generation using the hello world function
    // In a real implementation, this would call the actual proof generation
    try {
      const { MoproModule } = NativeModules;
      if (MoproModule && MoproModule.moproUniffiNymph) {
        const greeting = await MoproModule.moproUniffiNymph();
        console.log('Mopro greeting:', greeting);
        
        // Generate a deterministic proof based on input
        const proofData = {
          domain: input.domain,
          ephemeralPubkey: input.ephemeralPubkey,
          timestamp: Date.now()
        };
        
        return `android_jwt_proof_${Buffer.from(JSON.stringify(proofData)).toString('base64')}`;
      }
      throw new Error('MoproModule not available');
    } catch (error) {
      console.error('Android proof generation failed:', error);
      throw error;
    }
  },
  
  verifyJWTProof: async (circuitPath: string, proof: string) => {
    console.log('Android: Verifying JWT proof:', { circuitPath, proof });
    
    // Basic verification - check if it's a valid Android proof
    try {
      if (proof.startsWith('android_jwt_proof_')) {
        const base64Data = proof.replace('android_jwt_proof_', '');
        const proofData = JSON.parse(Buffer.from(base64Data, 'base64').toString());
        
        // Basic validation
        return proofData.domain && proofData.ephemeralPubkey && proofData.timestamp;
      }
      return false;
    } catch (error) {
      console.error('Android proof verification failed:', error);
      return false;
    }
  },
  
  helloWorld: async () => {
    try {
      const { MoproModule } = NativeModules;
      if (MoproModule && MoproModule.moproUniffiNymph) {
        const greeting = await MoproModule.moproUniffiNymph();
        return `Android: ${greeting}`;
      }
      return 'Android: Mopro module not available';
    } catch (error) {
      console.error('Android hello world failed:', error);
      return `Android: Error - ${error instanceof Error ? error.message : String(error)}`;
    }
  }
};

// Import the appropriate bindings based on platform
let JWTBindings: any = MockJWTBindings;

// Load Android bindings for Android platform
if (Platform.OS === 'android') {
  try {
    JWTBindings = AndroidJWTBindings;
    console.log('✅ Loaded Android JWT bindings');
  } catch (error) {
    console.log('❌ Failed to load Android bindings, using mock:', error);
    JWTBindings = MockJWTBindings;
  }
} else if (Platform.OS === 'web') {
  // For web platform, use mock bindings
  JWTBindings = MockJWTBindings;
  console.log('✅ Using mock JWT bindings for web');
}

/**
 * JWT Circuit Service for generating and verifying ZK proofs
 * This service wraps the platform-specific Mopro bindings
 */
export class JWTCircuitService {
  /**
   * Generate a ZK proof for JWT verification and domain validation
   */
  static async generateJWTProof(input: JWTCircuitInput): Promise<JWTProofResult> {
    try {
      console.log('Generating JWT proof with input:', input);
      
      if (!JWTBindings) {
        throw new Error(`JWT bindings not available for platform: ${Platform.OS}`);
      }

      const result = await JWTBindings.generateJWTProof(
        input.partialData,
        input.partialHash,
        input.fullDataLength,
        input.base64DecodeOffset,
        input.jwtPubkeyModulusLimbs,
        input.jwtPubkeyRedcParamsLimbs,
        input.jwtSignatureLimbs,
        input.domain,
        input.ephemeralPubkey,
        input.ephemeralPubkeySalt,
        input.ephemeralPubkeyExpiry
      );

      return {
        success: true,
        proof: result
      };
    } catch (error) {
      console.error('Failed to generate JWT proof:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Verify a ZK proof for JWT verification and domain validation
   */
  static async verifyJWTProof(
    circuitPath: string,
    proof: string
  ): Promise<JWTVerificationResult> {
    try {
      console.log('Verifying JWT proof:', { circuitPath, proof });
      
      if (!JWTBindings) {
        throw new Error(`JWT bindings not available for platform: ${Platform.OS}`);
      }

      const isValid = await JWTBindings.verifyJWTProof(circuitPath, proof);

      return {
        success: true,
        valid: isValid
      };
    } catch (error) {
      console.error('Failed to verify JWT proof:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Test the JWT bindings with a hello world function
   */
  static async testBindings(): Promise<string> {
    try {
      if (!JWTBindings) {
        throw new Error(`JWT bindings not available for platform: ${Platform.OS}`);
      }

      return await JWTBindings.helloWorld();
    } catch (error) {
      console.error('Failed to test JWT bindings:', error);
      throw error;
    }
  }

  /**
   * Convert string to byte array for circuit input
   */
  static stringToByteArray(str: string): number[] {
    return Array.from(new TextEncoder().encode(str));
  }

  /**
   * Convert byte array to string from circuit output
   */
  static byteArrayToString(arr: number[]): string {
    return new TextDecoder().decode(new Uint8Array(arr));
  }

  /**
   * Create a mock JWT circuit input for testing
   */
  static createMockInput(domain: string, ephemeralPubkey: string): JWTCircuitInput {
    return {
      partialData: this.stringToByteArray('mock_jwt_partial_data'),
      partialHash: [1, 2, 3, 4, 5, 6, 7, 8],
      fullDataLength: 100,
      base64DecodeOffset: 0,
      jwtPubkeyModulusLimbs: new Array(18).fill(0),
      jwtPubkeyRedcParamsLimbs: new Array(18).fill(0),
      jwtSignatureLimbs: new Array(18).fill(0),
      domain: this.stringToByteArray(domain),
      ephemeralPubkey,
      ephemeralPubkeySalt: 'mock_salt',
      ephemeralPubkeyExpiry: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };
  }
}
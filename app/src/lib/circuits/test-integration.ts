import { JWTCircuitService } from './jwt';
import { EphemeralKey } from '../../types';

/**
 * Test script to verify JWT circuit integration
 * This can be called from the app to test the circuit functionality
 */
export class JWTCircuitTestSuite {
  
  /**
   * Test the JWT circuit service with mock data
   */
  static async testJWTCircuitService(): Promise<void> {
    console.log('🧪 Starting JWT Circuit Test Suite');
    
    try {
      // Test 1: Hello World function
      console.log('\n📋 Test 1: Testing circuit bindings...');
      const greeting = await JWTCircuitService.testBindings();
      console.log('✅ Bindings test result:', greeting);
      
      // Test 2: Mock proof generation
      console.log('\n📋 Test 2: Testing mock proof generation...');
      const mockInput = JWTCircuitService.createMockInput('example.com', 'mock_pubkey');
      console.log('✅ Mock input created:', {
        domain: mockInput.domain.length,
        ephemeralPubkey: mockInput.ephemeralPubkey,
        ephemeralPubkeyExpiry: mockInput.ephemeralPubkeyExpiry
      });
      
      const proofResult = await JWTCircuitService.generateJWTProof(mockInput);
      console.log('✅ Proof generation result:', {
        success: proofResult.success,
        proof: proofResult.proof ? proofResult.proof.substring(0, 50) + '...' : 'null',
        error: proofResult.error
      });
      
      // Test 3: Proof verification
      if (proofResult.success && proofResult.proof) {
        console.log('\n📋 Test 3: Testing proof verification...');
        const verificationResult = await JWTCircuitService.verifyJWTProof(
          'test_circuit.json',
          proofResult.proof
        );
        console.log('✅ Proof verification result:', {
          success: verificationResult.success,
          valid: verificationResult.valid,
          error: verificationResult.error
        });
      }
      
      console.log('\n🎉 JWT Circuit Test Suite completed successfully!');
      
    } catch (error) {
      console.error('❌ JWT Circuit Test Suite failed:', error);
      throw error;
    }
  }
  
  /**
   * Test with real JWT-like data structure
   */
  static async testWithRealJWTStructure(): Promise<void> {
    console.log('\n🧪 Testing with real JWT structure...');
    
    try {
      // Create a mock JWT token structure
      const mockJWTHeader = btoa(JSON.stringify({
        alg: 'RS256',
        typ: 'JWT',
        kid: 'mock-key-id'
      }));
      
      const mockJWTPayload = btoa(JSON.stringify({
        iss: 'https://accounts.google.com',
        aud: 'mock-client-id',
        sub: 'mock-user-id',
        email: 'user@example.com',
        hd: 'example.com',
        email_verified: true,
        nonce: '12345678901234567890123456789012345678901234567890123456789012345678901234567',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      
      const mockJWTSignature = 'mock-signature-data';
      const mockJWTToken = `${mockJWTHeader}.${mockJWTPayload}.${mockJWTSignature}`;
      
      console.log('📝 Mock JWT created:', {
        length: mockJWTToken.length,
        parts: mockJWTToken.split('.').length,
        header: mockJWTHeader.substring(0, 20) + '...',
        payload: mockJWTPayload.substring(0, 20) + '...'
      });
      
      // Create circuit input from JWT
      const circuitInput = this.createJWTCircuitInput(
        mockJWTToken,
        'example.com',
        {
          publicKey: 'mock_ephemeral_pubkey',
          privateKey: 'mock_ephemeral_privkey',
          salt: 'mock_salt',
          expiry: new Date(Date.now() + 3600000),
          ephemeralPubkeyHash: 'mock_hash'
        }
      );
      
      console.log('✅ Circuit input created from JWT:', {
        partialDataLength: circuitInput.partialData.length,
        domainLength: circuitInput.domain.length,
        fullDataLength: circuitInput.fullDataLength
      });
      
      // Generate proof
      const proofResult = await JWTCircuitService.generateJWTProof(circuitInput);
      console.log('✅ Proof generation with real structure:', {
        success: proofResult.success,
        proof: proofResult.proof ? proofResult.proof.substring(0, 50) + '...' : 'null'
      });
      
    } catch (error) {
      console.error('❌ Real JWT structure test failed:', error);
      throw error;
    }
  }
  
  /**
   * Create circuit input from JWT token (similar to OAuth providers)
   */
  private static createJWTCircuitInput(
    jwtToken: string,
    domain: string,
    ephemeralKey: EphemeralKey
  ): any {
    try {
      const parts = jwtToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }
      
      const [header, payload, signature] = parts;
      const headerPayload = `${header}.${payload}`;
      
      // Convert to byte arrays
      const partialData = new Array(640).fill(0);
      const headerPayloadBytes = Array.from(new TextEncoder().encode(headerPayload));
      
      // Copy data (truncate if too long)
      const maxLength = Math.min(headerPayloadBytes.length, 640);
      for (let i = 0; i < maxLength; i++) {
        partialData[i] = headerPayloadBytes[i];
      }
      
      // Domain bytes
      const domainBytes = new Array(64).fill(0);
      const domainByteArray = Array.from(new TextEncoder().encode(domain));
      const maxDomainLength = Math.min(domainByteArray.length, 64);
      for (let i = 0; i < maxDomainLength; i++) {
        domainBytes[i] = domainByteArray[i];
      }
      
      // Mock RSA parameters
      const mockRSALimbs = new Array(18).fill(1);
      
      return {
        partialData,
        partialHash: [1, 2, 3, 4, 5, 6, 7, 8],
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
      console.error('Failed to create JWT circuit input:', error);
      throw error;
    }
  }
  
  /**
   * Run all tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🚀 Running complete JWT Circuit Integration Tests');
    
    try {
      await this.testJWTCircuitService();
      await this.testWithRealJWTStructure();
      
      console.log('\n🎊 All tests completed successfully!');
    } catch (error) {
      console.error('\n💥 Test suite failed:', error);
      throw error;
    }
  }
}

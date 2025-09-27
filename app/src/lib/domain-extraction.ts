import { Platform } from 'react-native';

export interface DomainExtractionResult {
  domain: string;
  email: string;
  isValid: boolean;
  error?: string;
}

export interface JWTClaims {
  email?: string;
  email_verified?: boolean;
  hd?: string;
  tid?: string;
  upn?: string;
  [key: string]: any;
}

export function extractDomainFromJWTEmail(email: string): DomainExtractionResult {
  try {
    if (!email || typeof email !== 'string') {
      return {
        domain: '',
        email: '',
        isValid: false,
        error: 'Invalid email input'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        domain: '',
        email,
        isValid: false,
        error: 'Invalid email format'
      };
    }

    const atIndex = email.indexOf('@');
    if (atIndex === -1 || atIndex === email.length - 1) {
      return {
        domain: '',
        email,
        isValid: false,
        error: 'No domain found in email'
      };
    }

    const domain = email.substring(atIndex + 1);
    
    if (!domain || domain.length === 0) {
      return {
        domain: '',
        email,
        isValid: false,
        error: 'Empty domain'
      };
    }

    if (domain.length > 64) {
      return {
        domain: '',
        email,
        isValid: false,
        error: 'Domain too long (max 64 characters)'
      };
    }

    return {
      domain,
      email,
      isValid: true
    };
  } catch (error) {
    return {
      domain: '',
      email,
      isValid: false,
      error: `Domain extraction failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export function extractDomainFromJWTClaims(claims: JWTClaims, provider: 'google' | 'microsoft'): DomainExtractionResult {
  try {
    if (provider === 'google') {
      // Google OAuth: Use hd (hosted domain) claim if available, fallback to email
      if (claims.hd) {
        return {
          domain: claims.hd,
          email: claims.email || '',
          isValid: true
        };
      }
      
      // Fallback to email domain extraction
      if (claims.email) {
        return extractDomainFromJWTEmail(claims.email);
      }
    } else if (provider === 'microsoft') {
      // Microsoft OAuth: Use upn (user principal name) or extract from email
      if (claims.upn) {
        return extractDomainFromJWTEmail(claims.upn);
      }
      
      // Fallback to email domain extraction
      if (claims.email) {
        return extractDomainFromJWTEmail(claims.email);
      }
    }

    return {
      domain: '',
      email: claims.email || '',
      isValid: false,
      error: 'No valid domain found in JWT claims'
    };
  } catch (error) {
    return {
      domain: '',
      email: claims.email || '',
      isValid: false,
      error: `JWT claims processing failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export function parseJWTClaims(jwtToken: string): JWTClaims | null {
  try {
    const parts = jwtToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Failed to parse JWT claims:', error);
    return null;
  }
}

export function extractDomainWithCircuitIntegration(
  jwtToken: string,
  provider: 'google' | 'microsoft'
): DomainExtractionResult {
  try {
    // Parse JWT claims
    const claims = parseJWTClaims(jwtToken);
    if (!claims) {
      return {
        domain: '',
        email: '',
        isValid: false,
        error: 'Failed to parse JWT token'
      };
    }

    // Verify email_verified claim (required by circuit)
    if (claims.email_verified !== true) {
      return {
        domain: '',
        email: claims.email || '',
        isValid: false,
        error: 'Email not verified in JWT'
      };
    }

    // Extract domain using provider-specific logic
    const result = extractDomainFromJWTClaims(claims, provider);
    
    if (!result.isValid) {
      return result;
    }

    // Additional validation for circuit compatibility
    if (result.domain.length > 64) {
      return {
        ...result,
        isValid: false,
        error: 'Domain exceeds circuit maximum length (64 characters)'
      };
    }

    return result;
  } catch (error) {
    return {
      domain: '',
      email: '',
      isValid: false,
      error: `Domain extraction failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export function generateStealthNoteNonce(
  ephemeralPubkey: string,
  ephemeralPubkeySalt: string,
  ephemeralPubkeyExpiry: number
): string {
  const input = `${ephemeralPubkey}:${ephemeralPubkeySalt}:${ephemeralPubkeyExpiry}`;
  const hash = Array.from(new TextEncoder().encode(input))
    .reduce((acc, byte) => acc + byte, 0)
    .toString();
  
  return hash.padEnd(77, '0').substring(0, 77);
}

export function createStealthNoteCircuitInput(
  jwtToken: string,
  ephemeralPubkey: string,
  ephemeralPubkeySalt: string,
  ephemeralPubkeyExpiry: number,
  domain: string
): any {
  try {
    const domainResult = extractDomainWithCircuitIntegration(jwtToken, 'google');
    if (!domainResult.isValid) {
      throw new Error(`Domain extraction failed: ${domainResult.error}`);
    }

    const parts = jwtToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    const [header, payload, signature] = parts;
    const headerPayload = `${header}.${payload}`;

    const partialData = new Array(640).fill(0);
    const headerPayloadBytes = Array.from(new TextEncoder().encode(headerPayload));
    
    const maxLength = Math.min(headerPayloadBytes.length, 640);
    for (let i = 0; i < maxLength; i++) {
      partialData[i] = headerPayloadBytes[i];
    }

    const domainBytes = createCircuitDomainBytes(domainResult.domain);

    const nonce = generateStealthNoteNonce(ephemeralPubkey, ephemeralPubkeySalt, ephemeralPubkeyExpiry);

    const mockRSALimbs = new Array(18).fill(1);

    return {
      partialData,
      partialHash: [1, 2, 3, 4, 5, 6, 7, 8], // Mock hash - would be real partial SHA in production
      fullDataLength: headerPayloadBytes.length,
      base64DecodeOffset: 0,
      jwtPubkeyModulusLimbs: mockRSALimbs,
      jwtPubkeyRedcParamsLimbs: mockRSALimbs,
      jwtSignatureLimbs: mockRSALimbs,
      domain: domainBytes,
      ephemeralPubkey,
      ephemeralPubkeySalt,
      ephemeralPubkeyExpiry,
      nonce // This will be verified in the circuit
    };
  } catch (error) {
    console.error('Failed to create StealthNote circuit input:', error);
    throw new Error(`Failed to create circuit input: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function extractDomainFromEmail(email: string): string {
  console.warn('extractDomainFromEmail is deprecated. Use extractDomainWithCircuitIntegration instead.');
  const result = extractDomainFromJWTEmail(email);
  return result.isValid ? result.domain : '';
}

export function validateDomainForCircuit(domain: string): { isValid: boolean; error?: string } {
  if (!domain || typeof domain !== 'string') {
    return { isValid: false, error: 'Domain is required' };
  }

  if (domain.length === 0) {
    return { isValid: false, error: 'Domain cannot be empty' };
  }

  if (domain.length > 64) {
    return { isValid: false, error: 'Domain exceeds maximum length (64 characters)' };
  }

  // Check for valid domain characters (basic validation)
  const domainRegex = /^[a-zA-Z0-9.-]+$/;
  if (!domainRegex.test(domain)) {
    return { isValid: false, error: 'Domain contains invalid characters' };
  }

  return { isValid: true };
}

export function createCircuitDomainBytes(domain: string): number[] {
  const domainBytes = new Array(64).fill(0);
  const domainByteArray = Array.from(new TextEncoder().encode(domain));
  
  const maxLength = Math.min(domainByteArray.length, 64);
  for (let i = 0; i < maxLength; i++) {
    domainBytes[i] = domainByteArray[i];
  }
  
  return domainBytes;
}

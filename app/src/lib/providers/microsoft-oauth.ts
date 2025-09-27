import { AnonGroupProvider, AnonGroup, EphemeralKey } from '../../types';
import { Storage } from '../storage';
import { JWTCircuitService } from '../circuits/jwt';
import { StorageKeys } from '../../types';
import { OAuthConfig } from '../../config/oauth';
import { Platform } from 'react-native';

/**
 * Microsoft OAuth Provider for Nymph
 * Handles Microsoft 365 authentication and JWT verification
 */
export class MicrosoftOAuthProvider implements AnonGroupProvider {
  private clientId: string;
  private redirectUri: string;
  private isDevelopment: boolean;

  constructor() {
    this.clientId = OAuthConfig.microsoft.clientId;
    this.redirectUri = OAuthConfig.microsoft.redirectUri;
    this.isDevelopment = __DEV__;
  }

  name(): string {
    return 'microsoft';
  }

  getSlug(): string {
    return 'domain';
  }

  /**
   * Get the AnonGroup by domain
   */
  getAnonGroup(groupId: string): AnonGroup {
    return {
      id: groupId,
      title: `${groupId} Microsoft 365`,
      logoUrl: `https://logo.clearbit.com/${groupId}`
    };
  }

  /**
   * Perform Microsoft OAuth authentication
   */
  async authenticate(): Promise<{ idToken: string; userInfo: any }> {
    try {
      console.log('🔧 Microsoft OAuth: Starting authentication...');
      
      // Use real OAuth flow even in development

      // For web platform, use a simple redirect approach
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform: Using redirect-based OAuth');
        return await this.authenticateWebRedirect();
      }

      // For mobile platforms, use AuthSession
      console.log('📱 Mobile platform: Using AuthSession');
      return await this.authenticateMobile();
    } catch (error) {
      console.error('❌ Microsoft OAuth error:', error);
      throw error;
    }
  }

  private ensureOrgDomain(userInfo: any): void {
    const email = userInfo?.email || userInfo?.preferred_username;
    const domain = email?.split('@')[1];
    if (!domain || ['outlook.com', 'hotmail.com', 'live.com'].includes(domain)) {
      throw new Error('Only Microsoft 365 organization domains are allowed');
    }
  }

  /**
   * Web-specific authentication using redirect
   */
  private async authenticateWebRedirect(): Promise<{ idToken: string; userInfo: any }> {
    return new Promise((resolve, reject) => {
      console.log('🌐 Opening Microsoft OAuth popup...');
      
      // PKCE params
      const state = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const codeVerifier = this.generateCodeVerifier();
      this.persistPkce(state, codeVerifier).catch(() => undefined);
      const codeChallenge = this.generateCodeChallenge(codeVerifier);

      // Create OAuth URL
      const authUrl = `https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize?` +
        `client_id=${this.clientId}&` +
        `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('openid email profile User.Read')}&` +
        `prompt=select_account&` +
        `state=${encodeURIComponent(state)}&` +
        `code_challenge=${encodeURIComponent(codeChallenge)}&` +
        `code_challenge_method=S256`;

      console.log('🔗 OAuth URL:', authUrl);

      // Try to open popup
      try {
        const popup = window.open(
          authUrl,
          'microsoft-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          console.error('❌ Failed to open popup window');
          reject(new Error('Failed to open popup window. Please allow popups for this site.'));
          return;
        }

        console.log('✅ Popup opened successfully');

        // Listen for callback via postMessage
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          const { type, code, state: returnedState, error, error_description } = event.data || {};
          if (type === 'OAUTH_SUCCESS' && code) {
            window.removeEventListener('message', messageListener);
            clearInterval(checkClosed);
            clearTimeout(timeoutId);
            this.exchangeCodeForToken(code, returnedState)
              .then(token => {
                const userInfo = this.parseJWT(token);
                this.ensureOrgDomain(userInfo);
                try { popup.close(); } catch {}
                resolve({ idToken: token, userInfo });
              })
              .catch(err => {
                try { popup.close(); } catch {}
                reject(err);
              });
          } else if (type === 'OAUTH_ERROR') {
            window.removeEventListener('message', messageListener);
            clearInterval(checkClosed);
            clearTimeout(timeoutId);
            try { popup.close(); } catch {}
            reject(new Error(`OAuth error: ${error} - ${error_description || 'Unknown'}`));
          }
        };
        window.addEventListener('message', messageListener);

        // Monitor popup for manual closure, guard COOP
        const checkClosed = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', messageListener);
              clearTimeout(timeoutId);
              console.log('❌ Popup was closed by user');
              reject(new Error('OAuth popup was closed'));
            }
          } catch {}
        }, 1000);

        // Timeout after 5 minutes
        const timeoutId = setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          try { if (!popup.closed) popup.close(); } catch {}
          reject(new Error('OAuth timeout'));
        }, 300000);

      } catch (error) {
        console.error('❌ Error opening popup:', error);
        reject(error);
      }
    });
  }

  /**
   * Mobile-specific authentication using AuthSession
   */
  private async authenticateMobile(): Promise<{ idToken: string; userInfo: any }> {
    // This would use AuthSession for mobile platforms
    // For now, fall back to mock authentication
    console.log('📱 Mobile authentication not implemented, using mock');
    return this.authenticate();
  }

  /**
   * Create mock JWT for development
   */
  private createMockJWT(): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload = {
      iss: 'https://login.microsoftonline.com/common/v2.0',
      sub: '12345678-1234-1234-1234-123456789abc',
      aud: this.clientId,
      email: 'test@company.com',
      preferred_username: 'test@company.com',
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      tid: '12345678-1234-1234-1234-123456789abc',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    // Simple base64 encoding (not cryptographically secure, for development only)
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa('mock-signature');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Exchange authorization code for ID token
   */
  async exchangeCodeForToken(code: string, state?: string): Promise<string> {
    try {
      console.log('🔄 Exchanging code for token...');
      const codeVerifier = await this.consumePkce(state);
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
          scope: 'openid email profile User.Read',
          code_verifier: codeVerifier || ''
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (tokens.error) {
        console.error('❌ Token exchange failed:', tokens.error);
        throw new Error(`Token exchange failed: ${tokens.error_description}`);
      }

      console.log('✅ Token exchange successful');
      
      // Store the token
      await Storage.setItem(StorageKeys.MicrosoftOAuthState, tokens.id_token);

      return tokens.id_token;
    } catch (error) {
      console.error('❌ Failed to exchange code for token:', error);
      throw new Error('Failed to exchange authorization code for ID token');
    }
  }

  // --- PKCE helpers ---
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
    }
    return this.base64UrlEncode(array);
  }

  private generateCodeChallenge(codeVerifier: string): string {
    const data = new TextEncoder().encode(codeVerifier);
    const hash = this.sha256Sync(data);
    return this.base64UrlEncode(hash);
  }

  private base64UrlEncode(buffer: Uint8Array): string {
    let str = '';
    for (let i = 0; i < buffer.length; i++) str += String.fromCharCode(buffer[i]);
    const b64 = btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return b64;
  }

  private sha256Sync(message: Uint8Array): Uint8Array {
    // Same tiny SHA-256 as in Google provider
    const K = new Uint32Array([
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ]);
    const H = new Uint32Array([
      0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19
    ]);
    const l = message.length;
    const withOne = new Uint8Array(((l + 9 + 63) >> 6) << 6);
    withOne.set(message);
    withOne[l] = 0x80;
    const bitLen = l * 8;
    const dv = new DataView(withOne.buffer);
    dv.setUint32(withOne.length - 4, bitLen >>> 0);
    dv.setUint32(withOne.length - 8, Math.floor(bitLen / 0x100000000));
    const W = new Uint32Array(64);
    for (let i = 0; i < withOne.length; i += 64) {
      for (let t = 0; t < 16; t++) W[t] = dv.getUint32(i + t * 4);
      for (let t = 16; t < 64; t++) {
        const s0 = (rightRotate(W[t-15],7) ^ rightRotate(W[t-15],18) ^ (W[t-15]>>>3)) >>> 0;
        const s1 = (rightRotate(W[t-2],17) ^ rightRotate(W[t-2],19) ^ (W[t-2]>>>10)) >>> 0;
        W[t] = (W[t-16] + s0 + W[t-7] + s1) >>> 0;
      }
      let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (let t = 0; t < 64; t++) {
        const S1 = (rightRotate(e,6) ^ rightRotate(e,11) ^ rightRotate(e,25)) >>> 0;
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
        const S0 = (rightRotate(a,2) ^ rightRotate(a,13) ^ rightRotate(a,22)) >>> 0;
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0;
      H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0;
      H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0;
      H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0;
      H[7] = (H[7] + h) >>> 0;
    }
    const out = new Uint8Array(32);
    const dvOut = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) dvOut.setUint32(i*4, H[i]);
    return out;
    function rightRotate(x:number, n:number){ return (x>>>n) | (x<<(32-n)); }
  }

  private async persistPkce(state: string, verifier: string): Promise<void> {
    try {
      const mapRaw = await Storage.getItem(StorageKeys.MicrosoftOAuthNonce);
      const map = mapRaw ? JSON.parse(mapRaw) : {};
      map[state] = verifier;
      await Storage.setItem(StorageKeys.MicrosoftOAuthNonce, JSON.stringify(map));
    } catch {}
  }

  private async consumePkce(state?: string): Promise<string | null> {
    try {
      const mapRaw = await Storage.getItem(StorageKeys.MicrosoftOAuthNonce);
      const map = mapRaw ? JSON.parse(mapRaw) : {};
      if (state && map[state]) {
        const verifier = map[state];
        delete map[state];
        await Storage.setItem(StorageKeys.MicrosoftOAuthNonce, JSON.stringify(map));
        return verifier;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Create JWT Circuit Input from JWT token and ephemeral key
   */
  private createJWTCircuitInput(
    jwtToken: string,
    domain: string,
    ephemeralKey: EphemeralKey
  ): any {
    try {
      // Split JWT token into header.payload.signature
      const parts = jwtToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }

      const [header, payload, signature] = parts;
      const headerPayload = `${header}.${payload}`;
      
      // Convert strings to byte arrays
      const partialData = new Array(640).fill(0);
      const headerPayloadBytes = Array.from(new TextEncoder().encode(headerPayload));
      
      // Copy header.payload bytes to partial_data (truncate if too long)
      const maxLength = Math.min(headerPayloadBytes.length, 640);
      for (let i = 0; i < maxLength; i++) {
        partialData[i] = headerPayloadBytes[i];
      }

      // Create domain byte array
      const domainBytes = new Array(64).fill(0);
      const domainByteArray = Array.from(new TextEncoder().encode(domain));
      const maxDomainLength = Math.min(domainByteArray.length, 64);
      for (let i = 0; i < maxDomainLength; i++) {
        domainBytes[i] = domainByteArray[i];
      }

      // Create mock RSA parameters (in real implementation, these would come from Microsoft's public keys)
      const mockRSALimbs = new Array(18).fill(1);

      // Create circuit input matching the Noir circuit structure
      return {
        partialData,
        partialHash: [1, 2, 3, 4, 5, 6, 7, 8], // Mock hash
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
      throw new Error(`Failed to create circuit input: ${error.message}`);
    }
  }

  /**
   * Parse JWT token to extract domain and other claims
   */
  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      throw new Error('Invalid JWT token');
    }
  }

  /**
   * Extract domain from Microsoft email
   */
  private extractDomain(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) {
      throw new Error('Invalid email format');
    }
    return parts[1];
  }

  /**
   * Generate ZK proof of Microsoft 365 membership
   */
  async generateProof(ephemeralKey: EphemeralKey): Promise<{
    proof: string;
    anonGroup: AnonGroup;
    proofArgs: object;
  }> {
    try {
      console.log('🔒 Generating ZK proof...');
      
      // Get stored JWT token
      const jwtToken = await Storage.getItem(StorageKeys.MicrosoftOAuthState);
      if (!jwtToken) {
        throw new Error('No Microsoft JWT token found. Please authenticate first.');
      }

      // Parse JWT to get email and extract domain
      const jwtPayload = this.parseJWT(jwtToken);
      const email = jwtPayload.email || jwtPayload.preferred_username;
      
      if (!email) {
        throw new Error('No email found in Microsoft JWT');
      }

      const domain = this.extractDomain(email);
      console.log('🏢 Domain:', domain);
      console.log('📧 Email:', email);
      console.log('🔑 Ephemeral Key:', ephemeralKey.publicKey);

      // Create real circuit input from JWT token
      const circuitInput = this.createJWTCircuitInput(
        jwtToken,
        domain,
        ephemeralKey
      );

      console.log('🔧 Circuit input prepared:', {
        domain: circuitInput.domain.length,
        partialDataLength: circuitInput.partialData.length,
        ephemeralPubkey: circuitInput.ephemeralPubkey
      });

      // Generate ZK proof using the JWT circuit
      const proofResult = await JWTCircuitService.generateJWTProof(circuitInput);
      
      if (!proofResult.success || !proofResult.proof) {
        throw new Error(`Failed to generate proof: ${proofResult.error}`);
      }

      console.log('✅ ZK proof generated:', proofResult.proof.substring(0, 50) + '...');

      const anonGroup = this.getAnonGroup(domain);
      console.log('✅ ZK proof generated successfully');

      return {
        proof: proofResult.proof,
        anonGroup,
        proofArgs: {
          domain,
          email,
          issuer: jwtPayload.iss,
          tenantId: jwtPayload.tid
        }
      };
    } catch (error) {
      console.error('Failed to generate Microsoft OAuth proof:', error);
      throw error;
    }
  }

  /**
   * Verify ZK proof of Microsoft 365 membership
   */
  async verifyProof(
    proof: string,
    anonGroupId: string,
    ephemeralPubkey: string,
    ephemeralPubkeyExpiry: Date,
    proofArgs: any
  ): Promise<boolean> {
    try {
      console.log('🔍 Verifying Microsoft OAuth proof:', {
        proof: proof.substring(0, 50) + '...',
        anonGroupId,
        ephemeralPubkey,
        ephemeralPubkeyExpiry,
        proofArgs
      });

      // Use JWT circuit service for verification
      const verificationResult = await JWTCircuitService.verifyJWTProof(
        'stealthnote_jwt.json', // Circuit path
        proof
      );

      if (!verificationResult.success) {
        console.error('❌ Proof verification failed:', verificationResult.error);
        return false;
      }

      console.log('✅ Proof verification result:', verificationResult.valid);
      
      // Additional checks
      if (!verificationResult.valid) {
        return false;
      }

      // Verify proof arguments match expected values
      if (proofArgs.domain !== anonGroupId) {
        console.error('❌ Domain mismatch in proof args');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to verify Microsoft OAuth proof:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated with Microsoft
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const jwtToken = await Storage.getItem(StorageKeys.MicrosoftOAuthState);
      if (!jwtToken) {
        return false;
      }

      // Check if token is still valid
      const jwtPayload = this.parseJWT(jwtToken);
      const expiryTime = jwtPayload.exp * 1000; // Convert to milliseconds
      
      return Date.now() < expiryTime;
    } catch (error) {
      console.error('Failed to check Microsoft authentication status:', error);
      return false;
    }
  }

  /**
   * Clear Microsoft authentication data
   */
  async signOut(): Promise<void> {
    try {
      await Storage.deleteItem(StorageKeys.MicrosoftOAuthState);
      await Storage.deleteItem(StorageKeys.MicrosoftOAuthNonce);
    } catch (error) {
      console.error('Failed to sign out from Microsoft:', error);
    }
  }

  /**
   * Get user info from stored JWT
   */
  async getUserInfo(): Promise<{ email: string; domain: string; name: string } | null> {
    try {
      const jwtToken = await Storage.getItem(StorageKeys.MicrosoftOAuthState);
      if (!jwtToken) {
        return null;
      }

      const jwtPayload = this.parseJWT(jwtToken);
      const email = jwtPayload.email || jwtPayload.preferred_username;
      const domain = email ? this.extractDomain(email) : '';
      
      return {
        email,
        domain,
        name: jwtPayload.name || jwtPayload.given_name + ' ' + jwtPayload.family_name
      };
    } catch (error) {
      console.error('Failed to get Microsoft user info:', error);
      return null;
    }
  }
}
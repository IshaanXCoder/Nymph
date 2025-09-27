import { AnonGroupProvider, OAuthProvider } from '../../types';
import { GoogleOAuthProvider } from './google-oauth';
import { MicrosoftOAuthProvider } from './microsoft-oauth';
import { getAvailableProviders } from '../../config/oauth';

/**
 * Provider registry and factory
 */
export class ProviderRegistry {
  private static providers: Map<string, AnonGroupProvider> = new Map();

  /**
   * Register a provider
   */
  static registerProvider(name: string, provider: AnonGroupProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Get a provider by name
   */
  static getProvider(name: string): AnonGroupProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   */
  static getAllProviders(): AnonGroupProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check if a provider is registered
   */
  static hasProvider(name: string): boolean {
    return this.providers.has(name);
  }
}

/**
 * Initialize all OAuth providers
 */
export function initializeProviders(): void {
  // Initialize Google OAuth provider
  const googleProvider = new GoogleOAuthProvider();
  ProviderRegistry.registerProvider('google', googleProvider);

  // Initialize Microsoft OAuth provider
  const microsoftProvider = new MicrosoftOAuthProvider();
  ProviderRegistry.registerProvider('microsoft', microsoftProvider);
}

/**
 * Get provider by OAuth type
 */
export function getProviderByType(type: OAuthProvider): AnonGroupProvider | undefined {
  return ProviderRegistry.getProvider(type);
}

/**
 * Get available providers for the current configuration
 */
export function getAvailableOAuthProviders(): OAuthProvider[] {
  return getAvailableProviders() as OAuthProvider[];
}

// Export provider classes
export { GoogleOAuthProvider } from './google-oauth';
export { MicrosoftOAuthProvider } from './microsoft-oauth';
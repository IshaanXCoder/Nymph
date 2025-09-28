import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

// Create public clients for ENS resolution on different networks
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export interface WalletOwnershipProof {
  address: string;
  signature: string;
  message: string;
  timestamp: string;
}

export interface PostAuthor {
  address: string;
  ensName: string | null;
  displayName: string;
  signature: string;
  timestamp: string;
}

/**
 * Creates a message for wallet ownership verification
 */
export function createOwnershipMessage(address: string): string {
  const timestamp = new Date().toISOString();
  return `Prove ownership of wallet: ${address} at ${timestamp}`;
}

/**
 * Fetches ENS name for a given address
 * Tries both mainnet and Sepolia testnet
 */
export async function getEnsName(address: `0x${string}`, prioritizeTestnet: boolean = false): Promise<string | null> {
  console.log('🔍 Fetching ENS name for address:', address);
  console.log('🎯 Prioritize testnet:', prioritizeTestnet);
  
  const networks = prioritizeTestnet 
    ? [{ name: 'Sepolia', client: sepoliaClient }, { name: 'Mainnet', client: mainnetClient }]
    : [{ name: 'Mainnet', client: mainnetClient }, { name: 'Sepolia', client: sepoliaClient }];
  
  for (const network of networks) {
    try {
      console.log(`🌐 Trying ${network.name} ENS resolution...`);
      console.log(`🔗 Using ${network.name} client:`, {
        chain: network.client.chain.name,
        chainId: network.client.chain.id
      });
      
      const ensName = await network.client.getEnsName({ address });
      
      console.log(`📋 Raw ENS response from ${network.name}:`, ensName);
      console.log(`📋 ENS response type:`, typeof ensName);
      console.log(`📋 ENS response length:`, ensName ? ensName.length : 'null');
      
      if (ensName) {
        console.log(`✅ ENS name found on ${network.name}:`, ensName);
        console.log('🏷️ ENS domain parts:', ensName.split('.'));
        return ensName;
      } else {
        console.log(`❌ No ENS name found on ${network.name}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching ENS name from ${network.name}:`, error);
      console.error(`❌ Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack?.slice(0, 200) : 'No stack'
      });
    }
  }
  
  console.log('❌ No ENS name found on any network (mainnet, Sepolia)');
  return null;
}

/**
 * Fetches ENS name with testnet priority (convenience function)
 */
export async function getEnsNameTestnet(address: `0x${string}`): Promise<string | null> {
  return getEnsName(address, true);
}

/**
 * Test ENS resolution for a specific address on Ethereum Sepolia
 */
export async function testSepoliaEnsResolution(testAddress?: `0x${string}`): Promise<void> {
  console.log('🧪 Testing ENS resolution specifically for Ethereum Sepolia...');
  console.log('🌐 Sepolia Chain Info:', {
    name: sepolia.name,
    id: sepolia.id,
    nativeCurrency: sepolia.nativeCurrency,
    rpcUrls: sepolia.rpcUrls
  });
  
  // Test address on Sepolia with detailed logging
  const addressToTest = testAddress || '0xcDC5a5e232EEdC690128ADB5ca9c840C9F94c68A' as `0x${string}`;
  console.log('🔍 Testing address on Sepolia:', addressToTest);
  
  try {
    console.log('🌐 Sepolia client details:', {
      chain: sepoliaClient.chain.name,
      chainId: sepoliaClient.chain.id,
      transport: 'http'
    });
    
    console.log('📡 Making ENS call to Sepolia...');
    const sepoliaResult = await sepoliaClient.getEnsName({ 
      address: addressToTest,
    });
    
    console.log('📋 Raw Sepolia ENS response:', sepoliaResult);
    console.log('📋 Response type:', typeof sepoliaResult);
    console.log('📋 Response truthy:', !!sepoliaResult);
    
    if (sepoliaResult) {
      console.log('✅ ENS found on Sepolia:', sepoliaResult);
      console.log('🏷️ ENS parts:', sepoliaResult.split('.'));
    } else {
      console.log('❌ No ENS found on Sepolia');
      console.log('🤔 This could mean:');
      console.log('   - ENS is not registered on Sepolia');
      console.log('   - ENS reverse record is not set');
      console.log('   - Address format issue');
      console.log('   - Network connectivity issue');
    }
    
  } catch (error) {
    console.error('❌ Error testing Sepolia ENS:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : 'No cause'
    });
  }
  
  // Also test with a known working mainnet ENS for comparison
  console.log('🧪 Testing known working mainnet ENS for comparison...');
  try {
    const vitalikAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`;
    const vitalikEns = await mainnetClient.getEnsName({ address: vitalikAddress });
    console.log('✅ Vitalik.eth on mainnet:', vitalikEns);
  } catch (error) {
    console.error('❌ Error testing vitalik.eth:', error);
  }
}

/**
 * Quick test function for your specific address
 */
export async function testYourSepoliaEns(): Promise<void> {
  const yourAddress = '0xcDC5a5e232EEdC690128ADB5ca9c840C9F94c68A' as `0x${string}`;
  console.log('🚀 Quick test for your address on Sepolia:', yourAddress);
  
  try {
    const result = await sepoliaClient.getEnsName({ address: yourAddress });
    console.log('📋 Result:', result);
    
    if (result) {
      console.log('🎉 ENS FOUND:', result);
      const displayName = createDisplayName(result, yourAddress);
      console.log('✨ Display name:', displayName);
    } else {
      console.log('❌ No ENS found for this address on Sepolia');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Creates a display name from ENS or address
 */
export function createDisplayName(ensName: string | null, address: string): string {
  console.log('🏷️ Creating display name for:', { ensName, address });
  
  if (ensName) {
    console.log('🎯 ENS name found, processing:', ensName);
    
    // Extract domain from ENS (e.g., "bob.blocsociitr.eth" -> "blocsociitr.eth")
    const parts = ensName.split('.');
    console.log('📝 ENS parts breakdown:', parts);
    
    if (parts.length >= 2) {
      // Get the last two parts (domain.tld) - this is the main domain
      const domain = parts.slice(-2).join('.');
      console.log('✨ Generated ENS display name:', domain);
      console.log('🔍 Example: if ENS is "bob.blocsociitr.eth", showing:', domain);
      return domain;
    } else {
      // Single part ENS (unusual but possible)
      console.log('✨ Generated single-part ENS display name:', ensName);
      return ensName;
    }
  }
  
  // No ENS name - fallback to shortened address
  console.log('❌ No ENS name available, using address fallback');
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  console.log('✨ Generated address display name:', shortAddress);
  return shortAddress;
}

/**
 * Verifies wallet ownership and fetches ENS information
 */
export async function verifyWalletOwnership(
  address: string,
  signMessageAsync: (args: { message: string }) => Promise<string>
): Promise<PostAuthor> {
  console.log('🚀 Starting wallet ownership verification for:', address);
  
  if (!address) {
    console.error('❌ No wallet address provided');
    throw new Error("Wallet not connected");
  }

  // Create message for signature
  const timestamp = new Date().toISOString();
  const message = `Prove ownership of wallet: ${address} at ${timestamp}`;
  console.log('📝 Created message for signing:', message);
  
  try {
    // Get user signature
    console.log('✍️ Requesting signature from user...');
    console.log('📱 This should trigger MetaMask/wallet popup...');
    
    if (!signMessageAsync) {
      throw new Error('Sign message function is not available');
    }
    
    const signature = await signMessageAsync({ message });
    
    if (!signature) {
      throw new Error('No signature received from wallet');
    }
    
    console.log('✅ Signature received:', signature.slice(0, 20) + '...');
    console.log('📏 Signature length:', signature.length);
    
    // Fetch ENS name
    console.log('🔍 Fetching ENS name...');
    const ensName = await getEnsName(address as `0x${string}`);
    
    // Create display name
    console.log('🏷️ Creating display name...');
    const displayName = createDisplayName(ensName, address);
    
    const result = {
      address,
      ensName,
      displayName,
      signature,
      timestamp,
    };
    
    console.log('🎉 Wallet ownership verification complete:', {
      address: result.address,
      ensName: result.ensName,
      displayName: result.displayName,
      timestamp: result.timestamp,
      signatureLength: result.signature.length
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error during wallet ownership verification:', error);
    throw error;
  }
}

/**
 * Validates a signature (basic validation)
 */
export function validateSignature(proof: WalletOwnershipProof): boolean {
  // Basic validation - in production, you'd want to verify the signature cryptographically
  return !!(proof.address && proof.signature && proof.message && proof.timestamp);
}

// Blockchain configuration for ColorFlip contract and Pyth Entropy
export const config = {
  // TODO: Add your actual values here
  RPC_URL: process.env.EXPO_PUBLIC_RPC_URL || "https://your-rpc-url-here",
  PRIVATE_KEY: process.env.EXPO_PUBLIC_PRIVATE_KEY || "your-private-key-here",
  COINFLIP_ADDRESS: process.env.EXPO_PUBLIC_COINFLIP_ADDRESS || "your-colorflip-contract-address",
  ENTROPY_ADDRESS: process.env.EXPO_PUBLIC_ENTROPY_ADDRESS || "your-entropy-contract-address",
};

// Interface for ColorGenerated event
export interface ColorGeneratedEvent {
  args: {
    sequenceNumber: number;
    hexColor: string;
  };
  blockNumber: number;
  transactionHash: string;
}

// Color validation utility
export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

// Convert hex color to RGB
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

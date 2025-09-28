# Reown AppKit Setup Instructions

## ✅ Completed Setup

I've successfully integrated Reown AppKit (formerly WalletConnect) into your React Native app! Here's what has been set up:

### 1. Packages Installed
- `@reown/appkit-wagmi-react-native` - Main AppKit package
- `wagmi` - Ethereum library
- `viem` - TypeScript interface for Ethereum
- `@tanstack/react-query` - Data fetching
- Additional required packages for React Native compatibility

### 2. Configuration Files Created
- `babel.config.js` - Required for Expo SDK 53+ support
- `config/appkit.ts` - AppKit configuration with Wagmi setup

### 3. App Integration
- Updated `app/_layout.tsx` with WagmiProvider and QueryClientProvider
- Added AppKit button to your search screen
- Configured for multiple chains (Mainnet, Polygon, Arbitrum)

## 🔧 Required: Get Your Project ID

**IMPORTANT**: You need to replace `"YOUR_PROJECT_ID"` in `config/appkit.ts` with your actual Reown project ID.

### Steps to get your Project ID:
1. Go to [Reown Dashboard](https://dashboard.reown.com)
2. Create a new project
3. Copy your Project ID
4. Replace `"YOUR_PROJECT_ID"` in `config/appkit.ts` with your actual ID

## 🚀 How to Use

The AppKit button is now available on your search screen at the bottom. Users can:
- Connect their Web3 wallets (MetaMask, WalletConnect, etc.)
- Switch between different networks
- View their wallet address and balance
- Disconnect when needed

## 🎨 Customization

You can customize the AppKit button by:
- Modifying the styling in the `web3Container` style
- Using AppKit hooks for custom connection logic
- Adding custom themes and branding

## 📱 Testing

To test the integration:
1. Make sure you have your Project ID set up
2. Run your app: `npx expo start`
3. Navigate to the search tab
4. Tap the AppKit button at the bottom
5. Try connecting with a Web3 wallet

## 🔗 Useful Links

- [Reown AppKit Documentation](https://docs.reown.com/appkit)
- [Wagmi Documentation](https://wagmi.sh)
- [Reown Dashboard](https://dashboard.reown.com)

Your app now has full Web3 wallet connectivity! 🎉

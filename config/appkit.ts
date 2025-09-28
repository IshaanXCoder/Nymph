import {
    AppKit,
    createAppKit,
    defaultWagmiConfig,
} from "@reown/appkit-wagmi-react-native";
import { QueryClient } from "@tanstack/react-query";
import { arbitrum, mainnet, polygon, sepolia } from "@wagmi/core/chains";
import "@walletconnect/react-native-compat";

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId at https://dashboard.reown.com
const projectId = "238828c8e9679322dc9fdb4d10f654d7";

// 2. Create config
const metadata = {
  name: "My App",
  description: "My App with Web3 Integration",
  url: "https://myapp.com",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
  redirect: {
    native: "myapp://",
    universal: "myapp.com",
  },
};

const chains = [mainnet, polygon, arbitrum, sepolia] as const;

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
createAppKit({
  projectId,
  metadata,
  wagmiConfig,
  defaultChain: mainnet, // Optional
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
});

export { AppKit, queryClient, wagmiConfig };


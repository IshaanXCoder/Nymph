import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { AppKit, queryClient, wagmiConfig } from "../config/appkit";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Aeonik-Regular': require('../assets/fonts/Aeonik-Regular.ttf'),
    'Aeonik-Bold': require('../assets/fonts/Aeonik-Bold.ttf'),
    'SFMono-Regular': require('../assets/fonts/SFMono-Regular.otf'),
  });

  useEffect(() => {
    if (fontError) {
      console.log('Font loading error:', fontError);
    }
    if (fontsLoaded) {
      console.log('Fonts loaded successfully');
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }} 
          />
        </Stack>
        <AppKit />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

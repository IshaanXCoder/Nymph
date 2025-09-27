import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

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
  );
}

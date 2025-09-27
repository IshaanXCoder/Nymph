import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function Index() {
  const [showButton, setShowButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const textColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the animation sequence after 1.5 seconds
    const timer = setTimeout(() => {
      startTransition();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const startTransition = () => {
    // Start background and text color transition simultaneously
    Animated.parallel([
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(textColorAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Show button after background transition completes
      setShowButton(true);
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleConnectWallet = () => {
    // This is where you'll integrate your wallet adapter
    console.log("Connect wallet pressed");
    // For now, navigate to tabs (replace with actual wallet connection)
    router.push("/(tabs)");
  };

  const interpolatedBackgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#000000", "#ffffff"],
  });

  const interpolatedTextColor = textColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#000000"],
  });

  const interpolatedTaglineColor = textColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255, 255, 255, 0.8)", "rgba(0, 0, 0, 0.7)"],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: interpolatedBackgroundColor },
      ]}
    >
      <StatusBar
        barStyle={showButton ? "dark-content" : "light-content"}
        backgroundColor={showButton ? "#ffffff" : "#000000"}
      />

      {/* Enhanced Splash Screen */}
      <View style={styles.splashContainer}>
        <Animated.Text 
          style={[
            styles.appName,
            { color: interpolatedTextColor }
          ]}
        >
          NYMPH
        </Animated.Text>
        <Animated.Text 
          style={[
            styles.tagline,
            { color: interpolatedTaglineColor }
          ]}
        >
          Web3 Social & ENS Identity
        </Animated.Text>
        
        {/* Connect Wallet Button */}
        {showButton && (
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonFadeAnim,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnectWallet}
              activeOpacity={0.8}
            >
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  splashContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 16,
    textAlign: "center",
  },
  tagline: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  loginContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loginContent: {
    width: "100%",
    alignItems: "center",
  },
  loginTitle: {
    fontSize: 36,
    fontWeight: "600",
    color: "#2ECC71",
    letterSpacing: 1,
    marginBottom: 60,
  },
  walletSection: {
    alignItems: "center",
    marginBottom: 50,
  },
  walletLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  walletSubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  connectButton: {
    backgroundColor: "#2ECC71",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    width: width * 0.8,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#2ECC71",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 20,
  },
  connectButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    color: "#999999",
    fontSize: 14,
    fontWeight: "500",
  },
});
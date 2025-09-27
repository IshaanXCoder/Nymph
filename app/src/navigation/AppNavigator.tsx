import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useAppState } from '../hooks/useAppState';
import { useAuth } from '@clerk/clerk-expo';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import InternalScreen from '../screens/InternalScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MessageDetailScreen from '../screens/MessageDetailScreen';
import AuthScreen from '../screens/AuthScreen';
import LoginScreen from '../screens/LoginScreen';

// Types
export type RootStackParamList = {
  MainTabs: undefined;
  MessageDetail: { messageId: string };
  Auth: undefined;
  Login: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Internal: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Internal') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#f8f9fa',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Nymph' }}
      />
      <Tab.Screen 
        name="Internal" 
        component={InternalScreen}
        options={{ title: 'Internal' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAppState();
  const { isSignedIn } = useAuth();

  console.log('🧭 AppNavigator render:', { isAuthenticated, isSignedIn });

  return (
    <NavigationContainer>
      {(isAuthenticated || isSignedIn) ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#f8f9fa',
            },
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="MessageDetail" 
            component={MessageDetailScreen}
            options={{ title: 'Message' }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#f8f9fa',
            },
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ title: 'Sign In', headerShown: true }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

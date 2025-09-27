import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ChatIcon, SearchIcon } from "../../components/CustomTabIcon";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopColor: "#333333",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#666666",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: "Community",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <ChatIcon size={size} color={color} />
          ),
        }}
      />
        <Tabs.Screen
          name="index"
          options={{
            title: "Research",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="library-outline" size={size} color={color} />
            ),
          }}
        />
      <Tabs.Screen
        name="search"
        options={{
          title: "Private",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <SearchIcon size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "./src/hooks/useAuth";
import { CartProvider } from "./src/hooks/useCart";
import { Loading } from "./src/components";

// Import screens
import { Welcome } from "./src/screens/Welcome";
import { AdminLogin } from "./src/screens/AdminLogin";
import { CustomerLogin } from "./src/screens/CustomerLogin";
import { AdminDashboard } from "./src/screens/AdminDashboard";
import { InventoryScreen } from "./src/screens/InventoryScreen";
// Additional screens would be imported here

import {
  RootStackParamList,
  AuthStackParamList,
  AdminDrawerParamList,
} from "./src/types";

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const AdminDrawer = createDrawerNavigator<AdminDrawerParamList>();

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Welcome" component={Welcome} />
      <AuthStack.Screen name="AdminLogin" component={AdminLogin} />
      <AuthStack.Screen name="CustomerLogin" component={CustomerLogin} />
    </AuthStack.Navigator>
  );
};

// Admin Drawer Navigator
const AdminNavigator = () => {
  return (
    <AdminDrawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: "#007AFF" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "bold" },
        drawerStyle: { backgroundColor: "#F8F9FA" },
        drawerActiveTintColor: "#007AFF",
        drawerInactiveTintColor: "#666666",
      }}
    >
      <AdminDrawer.Screen
        name="Dashboard"
        component={AdminDashboard}
        options={{
          title: "Dashboard",
          drawerLabel: "Dashboard",
        }}
      />
      <AdminDrawer.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: "Inventory",
          drawerLabel: "Inventory",
        }}
      />
      {/* Additional admin screens would be added here */}
    </AdminDrawer.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { state, isAuthenticated, isAdmin, isCustomer } = useAuth();

  if (state.isLoading) {
    return <Loading text="Loading..." overlay />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated() ? (
          <RootStack.Screen name="AuthStack" component={AuthNavigator} />
        ) : isAdmin() ? (
          <RootStack.Screen name="AdminStack" component={AdminNavigator} />
        ) : isCustomer() ? (
          // Customer stack would go here
          <RootStack.Screen name="AuthStack" component={AuthNavigator} />
        ) : (
          <RootStack.Screen name="AuthStack" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// Main App Component
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

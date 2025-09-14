import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "./src/hooks/useAuth";
import { CartProvider } from "./src/hooks/useCart";
import { Loading } from "./src/components";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";

// Import screens
import { Welcome } from "./src/screens/Welcome";
import { AdminLogin } from "./src/screens/AdminLogin";
import { CustomerLogin } from "./src/screens/CustomerLogin";
import { AdminDashboard } from "./src/screens/AdminDashboard";
import { InventoryScreen } from "./src/screens/InventoryScreen";
import { TestDashboard } from "./src/screens/TestDashboard";

// Theme
import {
  RootStackParamList,
  AuthStackParamList,
  AdminDrawerParamList,
} from "./src/types";
import { ThemeColors } from "./src/theme/colors";

// Re-export ThemeColors for backward compatibility
export { ThemeColors };

// Custom theme for navigation
const CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: ThemeColors.primary,
    background: ThemeColors.background,
    card: ThemeColors.card,
    text: ThemeColors.text,
    border: ThemeColors.border,
    notification: ThemeColors.accent,
  },
  animation: {
    scale: 1,
    fade: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideFromRight: {
      from: { transform: [{ translateX: 100 }] },
      to: { transform: [{ translateX: 0 }] },
    },
  },
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const AdminTabs = createBottomTabNavigator<AdminDrawerParamList>();

// Auth Stack Navigator
const AuthNavigator = () => {
  const screenOptions = {
    headerShown: false,
    cardStyle: { backgroundColor: ThemeColors.background },
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  };

  return (
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={screenOptions}
    >
      <AuthStack.Screen
        name="Welcome"
        component={Welcome}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forFadeFromBottomAndroid,
        }}
      />
      <AuthStack.Screen
        name="AdminLogin"
        component={AdminLogin}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />
      <AuthStack.Screen
        name="CustomerLogin"
        component={CustomerLogin}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />
    </AuthStack.Navigator>
  );
};

// Stunning Admin Bottom Tab Navigator with Retail Theme
const AdminNavigator = () => {
  const screenOptions = ({
    route,
  }: {
    route: { name: keyof AdminDrawerParamList };
  }): BottomTabNavigationOptions => ({
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarIcon: ({
      focused,
      color,
      size,
    }: {
      focused: boolean;
      color: string;
      size: number;
    }) => {
      let iconName;
      let iconSet = "ionicons";
      let iconSize = size;

      switch (route.name) {
        case "Dashboard":
          iconName = focused ? "speedometer" : "speedometer-outline";
          break;
        case "Inventory":
          iconSet = "material";
          iconName = focused ? "package-variant" : "package-variant-closed";
          break;
        case "Orders":
          iconName = focused ? "cart" : "cart-outline";
          break;
        case "Settings":
          iconName = focused ? "settings" : "settings-outline";
          break;
        default:
          iconName = "home-outline";
      }

      return (
        <Animatable.View
          duration={300}
          animation={focused ? "pulse" : undefined}
          style={[styles.tabIconContainer, focused && styles.tabIconFocused]}
        >
          {iconSet === "ionicons" ? (
            <Ionicons name={iconName as any} size={iconSize} color={color} />
          ) : (
            <MaterialCommunityIcons
              name={iconName as any}
              size={iconSize}
              color={color}
            />
          )}
          {focused && <View style={styles.tabIndicator} />}
        </Animatable.View>
      );
    },
    tabBarActiveTintColor: ThemeColors.accent,
    tabBarInactiveTintColor: ThemeColors.textSecondary,
    tabBarLabelStyle: styles.tabBarLabel,
    tabBarStyle: styles.tabBar,
  });

  return (
    <AdminTabs.Navigator
      initialRouteName="Dashboard"
      screenOptions={screenOptions}
    >
      <AdminTabs.Screen
        name="Dashboard"
        component={AdminDashboard}
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
        }}
      />
      <AdminTabs.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: "Inventory",
          tabBarLabel: "Inventory",
        }}
      />
    </AdminTabs.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { state } = useAuth();
  const user = state.user;
  const loading = state.isLoading;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  }, [fadeAnim]);

  if (loading) {
    return (
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <Animatable.View
          animation="pulse"
          easing="ease-out"
          iterationCount="infinite"
          style={styles.loadingContent}
        >
          <MaterialCommunityIcons
            name="barcode-scan"
            size={60}
            color={ThemeColors.primary}
          />
          <Text style={styles.loadingText}>Inventory Pro</Text>
        </Animatable.View>
      </Animated.View>
    );
  }

  const screenOptions = {
    headerShown: false,
    cardStyle: { backgroundColor: ThemeColors.background },
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="dark" backgroundColor={ThemeColors.background} />
      <RootStack.Navigator screenOptions={screenOptions}>
        {user ? (
          <RootStack.Screen
            name="AdminStack"
            component={AdminNavigator}
            options={{
              cardStyleInterpolator:
                CardStyleInterpolators.forFadeFromBottomAndroid,
            }}
          />
        ) : (
          <RootStack.Screen
            name="AuthStack"
            component={AuthNavigator}
            options={{
              cardStyleInterpolator:
                CardStyleInterpolators.forFadeFromBottomAndroid,
            }}
          />
        )}
      </RootStack.Navigator>
    </Animated.View>
  );
};

// Main App Component
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer theme={CustomTheme}>
            <AppNavigator />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// Stunning Tab Bar Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "700",
    color: ThemeColors.primary,
    letterSpacing: 1,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    width: 40,
    borderRadius: 20,
    marginBottom: 4,
    elevation: 2,
    shadowColor: ThemeColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabIconFocused: {
    backgroundColor: ThemeColors.highlight,
    transform: [{ scale: 1.1 }],
  },
  tabIndicator: {
    position: "absolute",
    bottom: -8,
    height: 3,
    width: 20,
    backgroundColor: ThemeColors.accent,
    borderRadius: 3,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  tabBar: {
    backgroundColor: ThemeColors.card,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: ThemeColors.primary,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    height: Platform.OS === "ios" ? 90 : 70,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 25 : 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

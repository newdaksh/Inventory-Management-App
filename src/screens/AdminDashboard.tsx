import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { Item, AdminDrawerParamList } from "../types";
import { CONFIG } from "../CONFIG";
import apiService from "../services/api";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import ModernCard from "../components/ModernCard";
import AnimatedButton from "../components/AnimatedButton";
import LoadingSpinner from "../components/LoadingSpinner";
import { ThemeColors } from "../theme/colors";

type AdminDashboardNavigationProp = BottomTabNavigationProp<
  AdminDrawerParamList,
  "Dashboard"
>;

type RecentActivity = {
  id: string;
  type: "add" | "sale" | "low_stock" | "expired" | "updated";
  item: string;
  quantity: number;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description?: string;
};

interface AdminDashboardProps {
  navigation: AdminDashboardNavigationProp;
  route?: any; // Add proper type from react-navigation if needed
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  navigation,
}) => {
  const { state: authState, signOut } = useAuth();
  const user = authState.user; // Access user from authState
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    expiringSoonItems: 0,
    expiredItems: 0,
    totalValue: 0,
    categories: 0,
  });

  const recentActivity = [
    {
      id: "1",
      type: "add" as const,
      item: "iPhone 13",
      quantity: 5,
      time: "2 min ago",
      icon: "add-circle" as const,
      color: ThemeColors.primary,
      description: "Added 5 iPhone 13 to inventory",
    },
    {
      id: "2",
      type: "sale" as const,
      item: "Samsung TV",
      quantity: 2,
      time: "1 hour ago",
      icon: "cart" as const,
      color: ThemeColors.accent,
      description: "Sold 2 Samsung TV",
    },
    {
      id: "3",
      type: "low_stock" as const,
      item: "AirPods Pro",
      quantity: 3,
      time: "3 hours ago",
      icon: "warning" as const,
      color: "#E67E22",
      description: "Low stock: AirPods Pro (3 left)",
    },
  ];

  // Header animation
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: "clamp",
  });

  // Optional: opacity/scale interpolation (currently unused)

  // Fallback config values (in case CONFIG doesn't define them)
  const MOCK_MODE = (CONFIG as any).MOCK_MODE ?? false;
  const LOW_STOCK_THRESHOLD = (CONFIG as any).LOW_STOCK_THRESHOLD ?? 5;
  const CURRENCY = (CONFIG as any).CURRENCY ?? "₹";
  // const INVENTORY_PATH = (CONFIG as any).INVENTORY_PATH ?? "inventory/items";

  useEffect(() => {
    loadDashboardData();
  }, []);

  const extractUpstreamData = (proxyResp: any): any => {
    // proxyResp could be:
    // { ok, status, upstreamBody: "{}", ... }
    // or { upstreamBody: { ... } }
    // or direct data without wrapper
    if (proxyResp == null) return null;

    // If wrapper and upstreamBody is string -> try parse
    if (typeof proxyResp.upstreamBody === "string") {
      try {
        return JSON.parse(proxyResp.upstreamBody);
      } catch (e) {
        // not JSON, return as raw string
        return { raw: proxyResp.upstreamBody };
      }
    }

    // If wrapper and upstreamBody is already object
    if (proxyResp.upstreamBody && typeof proxyResp.upstreamBody === "object") {
      return proxyResp.upstreamBody;
    }

    // If proxy returned the actual data directly
    if (typeof proxyResp === "object" && !proxyResp.upstreamBody) {
      return proxyResp;
    }

    // Fallback
    return null;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      let inventoryItems: Item[] = [];

      // 1) MOCK mode support if your CONFIG or apiService supports it
      if (MOCK_MODE) {
        // prefer apiService.getMockInventoryItems if available
        if (typeof (apiService as any).getMockInventoryItems === "function") {
          inventoryItems = await (apiService as any).getMockInventoryItems();
        } else {
          // fallback empty array for mock mode
          inventoryItems = [];
        }
      } else {
        // Call the proxy URL for inventory
        try {
          // Build proxy URL (e.g. https://proxy/?path=inventory/items)
          const url = CONFIG.INVENTORY_ITEMS
            ? (CONFIG as any).buildProxyUrl(CONFIG.INVENTORY_ITEMS)
            : `${(CONFIG as any).PROXY_BASE || ""}?path=${encodeURIComponent(
                CONFIG.INVENTORY_ITEMS
              )}`;

          // Use the axios instance exported by apiService
          const resp = await apiService.axios.get(url);

          // The proxy wraps upstream response. Try to extract real data.
          const data = extractUpstreamData(resp.data);

          // Data could be { items: [...] } or directly an array
          if (Array.isArray(data)) {
            inventoryItems = data as Item[];
          } else if (data && Array.isArray((data as any).items)) {
            inventoryItems = (data as any).items as Item[];
          } else if (data && Array.isArray((data as any).inventory)) {
            inventoryItems = (data as any).inventory as Item[];
          } else {
            // If nothing matches, try to find first array in object
            if (data && typeof data === "object") {
              const foundArray = Object.keys(data)
                .map((k) => (data as any)[k])
                .find((v) => Array.isArray(v));
              if (Array.isArray(foundArray)) {
                inventoryItems = foundArray as Item[];
              }
            }
          }
        } catch (err: any) {
          console.error("[Dashboard] fetch inventory error:", err);
          throw err;
        }
      }

      setItems(inventoryItems || []);
      calculateStats(inventoryItems || []);
    } catch (error: any) {
      console.error("[Dashboard] Error loading data:", error);
      Alert.alert("Error", "Failed to load dashboard data. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const calculateStats = (inventoryItems: Item[]) => {
    const today = new Date();
    const sevenDaysFromNow = new Date(
      today.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    const totalValue = inventoryItems.reduce(
      (sum, item) => sum + (item.price ?? 0) * (item.qty ?? 0),
      0
    );

    const newStats = {
      totalItems: inventoryItems.length,
      lowStockItems: inventoryItems.filter(
        (item) => (item.qty ?? 0) <= LOW_STOCK_THRESHOLD
      ).length,
      expiringSoonItems: inventoryItems.filter((item) => {
        if (!item.expiryDate) return false;
        const expiryDate = new Date(item.expiryDate);
        return expiryDate > today && expiryDate <= sevenDaysFromNow;
      }).length,
      expiredItems: inventoryItems.filter((item) => {
        if (!item.expiryDate) return false;
        const expiryDate = new Date(item.expiryDate);
        return expiryDate < today;
      }).length,
      totalValue,
      categories: 0,
    };

    setStats(newStats);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleAddItem = useCallback(() => {
    navigation.navigate("Inventory", { screen: "AddItem" } as any);
  }, [navigation]);

  const handleViewAll = useCallback(() => {
    navigation.navigate("Inventory", { screen: "InventoryList" } as any);
  }, [navigation]);

  // const handleGenerateReport = useCallback(() => {
  //   Alert.alert('Report', 'Generating report...');
  // }, []);

  const renderHeader = () => (
    <Animated.View
      style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}
    >
      <LinearGradient
        colors={[ThemeColors.primary, ThemeColors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || "Admin"}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => (navigation as any)?.toggleDrawer?.()}
          >
            <Ionicons name="person" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={80} />
        </View>
      );
    }

    return (
      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ThemeColors.primary]}
            tintColor={ThemeColors.primary}
            progressViewOffset={Platform.OS === "ios" ? 80 : 0}
          />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <ModernCard
              title="Total Items"
              value={stats.totalItems.toString()}
              icon="📦"
              gradient={[ThemeColors.primary, ThemeColors.secondary]}
              style={styles.statCard}
            />
            <ModernCard
              title="Low Stock"
              value={stats.lowStockItems.toString()}
              icon="⚠️"
              gradient={["#F6AD55", "#ED8936"]}
              style={styles.statCard}
            />
          </View>

          <View style={styles.statsRow}>
            <ModernCard
              title="Expiring Soon"
              value={stats.expiringSoonItems.toString()}
              icon="⏰"
              gradient={["#63B3ED", "#4299E1"]}
              style={styles.statCard}
            />
            <ModernCard
              title="Expired"
              value={stats.expiredItems.toString()}
              icon="❌"
              gradient={["#FC8181", "#F56565"]}
              style={styles.statCard}
            />
          </View>

          <View style={styles.statsRow}>
            <ModernCard
              title="Total Value"
              value={`${CURRENCY}${stats.totalValue.toLocaleString()}`}
              icon="💰"
              gradient={["#68D391", "#48BB78"]}
              style={[styles.statCard, { width: "100%" }]}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <AnimatedButton
              title="Add Item"
              onPress={handleAddItem}
              type="primary"
              width="48%"
              height={56}
              style={styles.actionButton}
              icon={
                <View style={styles.actionIcon}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </View>
              }
              textStyle={styles.actionButtonText}
            />

            <AnimatedButton
              title="Scan Barcode"
              onPress={() =>
                navigation.navigate("Inventory", {
                  screen: "ScanBarcode",
                } as any)
              }
              type="outline"
              width="48%"
              height={56}
              style={styles.actionButton}
              icon={
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: ThemeColors.highlight },
                  ]}
                >
                  <Ionicons
                    name="barcode"
                    size={24}
                    color={ThemeColors.primary}
                  />
                </View>
              }
              textStyle={StyleSheet.flatten([
                styles.actionButtonText,
                { color: ThemeColors.primary },
              ])}
            />
          </View>

          <View style={[styles.actionButtons, { marginTop: 12 }]}>
            <AnimatedButton
              title="View All"
              onPress={handleViewAll}
              type="outline"
              width="48%"
              height={56}
              style={styles.actionButton}
              icon={
                <View style={styles.actionIcon}>
                  <Ionicons name="list" size={24} color={ThemeColors.primary} />
                </View>
              }
              textStyle={StyleSheet.flatten([
                styles.actionButtonText,
                { color: ThemeColors.primary },
              ])}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentActivity.length > 0 ? (
            <View style={styles.activityList}>
              {recentActivity.map((activity, index) => (
                <Animatable.View
                  key={activity.id}
                  animation="fadeInRight"
                  duration={600}
                  delay={index * 100}
                  style={styles.activityItem}
                >
                  <View
                    style={[
                      styles.activityIcon,
                      { backgroundColor: `${activity.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={activity.icon}
                      size={20}
                      color={activity.color}
                    />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityText} numberOfLines={1}>
                      {activity.description}
                    </Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
                </Animatable.View>
              ))}
            </View>
          ) : (
            <View style={styles.noActivityContainer}>
              <Ionicons name="time-outline" size={48} color="#CBD5E0" />
              <Text style={styles.noActivityText}>No recent activity</Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </Animated.ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base styles
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ThemeColors.background,
  },

  // Header styles
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Content styles
  content: {
    flex: 1,
    marginTop: Platform.OS === "ios" ? 160 : 140,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  // Stats styles
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statLabel: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: ThemeColors.text,
  },

  // Quick actions
  quickActions: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: ThemeColors.text,
  },
  seeAllText: {
    color: ThemeColors.primary,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 8,
  },

  // Recent activity
  recentActivity: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  activityList: {
    borderRadius: 12,
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
    marginRight: 8,
  },
  activityText: {
    fontSize: 14,
    fontWeight: "500",
    color: ThemeColors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
  },
  noActivityContainer: {
    paddingVertical: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginTop: 8,
  },
  noActivityText: {
    marginTop: 12,
    color: ThemeColors.textSecondary,
    fontSize: 14,
  },
  signOutText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyText: {
    color: ThemeColors.textSecondary,
    textAlign: "center",
    marginTop: 16,
  },
});

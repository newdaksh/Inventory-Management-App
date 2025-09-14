// AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { Card, Button, Loading } from "../components";
import { Item } from "../types";
import { CONFIG } from "../CONFIG";
import apiService from "../services/api";

interface AdminDashboardProps {
  navigation: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  navigation,
}) => {
  const { state: authState, signOut } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    expiringSoonItems: 0,
    expiredItems: 0,
  });

  // Fallback config values (in case CONFIG doesn't define them)
  const MOCK_MODE = (CONFIG as any).MOCK_MODE ?? false;
  const LOW_STOCK_THRESHOLD = (CONFIG as any).LOW_STOCK_THRESHOLD ?? 5;
  const CURRENCY = (CONFIG as any).CURRENCY ?? "₹";
  const INVENTORY_PATH = (CONFIG as any).INVENTORY_PATH ?? "inventory/items";

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
      Alert.alert(
        "Error",
        "Failed to load dashboard data. Please try again.",
        [{ text: "OK" }]
      );
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
    };

    setStats(newStats);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Loading text="Loading dashboard..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{authState.user?.name || "Admin"}</Text>
        </View>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          size="small"
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, styles.primaryStat]}>
          <View style={styles.statContent}>
            <Ionicons name="cube" size={32} color="#007AFF" />
            <View style={styles.statText}>
              <Text style={styles.statNumber}>{stats.totalItems}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
          </View>
        </Card>

        <Card
          style={[
            styles.statCard,
            stats.lowStockItems > 0 ? styles.warningStat : null,
          ]}
        >
          <View style={styles.statContent}>
            <Ionicons
              name="warning"
              size={32}
              color={stats.lowStockItems > 0 ? "#FF9500" : "#A0A0A0"}
            />
            <View style={styles.statText}>
              <Text
                style={[
                  styles.statNumber,
                  stats.lowStockItems > 0 && styles.warningText,
                ]}
              >
                {stats.lowStockItems}
              </Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </View>
          </View>
        </Card>

        <Card
          style={[
            styles.statCard,
            stats.expiringSoonItems > 0 ? styles.warningStat : null,
          ]}
        >
          <View style={styles.statContent}>
            <Ionicons
              name="time"
              size={32}
              color={stats.expiringSoonItems > 0 ? "#FF9500" : "#A0A0A0"}
            />
            <View style={styles.statText}>
              <Text
                style={[
                  styles.statNumber,
                  stats.expiringSoonItems > 0 && styles.warningText,
                ]}
              >
                {stats.expiringSoonItems}
              </Text>
              <Text style={styles.statLabel}>Expiring Soon</Text>
            </View>
          </View>
        </Card>

        <Card
          style={[styles.statCard, stats.expiredItems > 0 ? styles.dangerStat : null]}
        >
          <View style={styles.statContent}>
            <Ionicons
              name="alert-circle"
              size={32}
              color={stats.expiredItems > 0 ? "#DC3545" : "#A0A0A0"}
            />
            <View style={styles.statText}>
              <Text
                style={[
                  styles.statNumber,
                  stats.expiredItems > 0 && styles.dangerText,
                ]}
              >
                {stats.expiredItems}
              </Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <Button
            title="Manage Inventory"
            onPress={() => navigation.navigate("Inventory")}
            style={styles.actionButton}
          />
          <Button
            title="View Orders"
            onPress={() => navigation.navigate("Orders")}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
      </Card>

      {/* Recent Items Preview */}
      <Card style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Text style={styles.sectionTitle}>Recent Items</Text>
          <Button
            title="View All"
            onPress={() => navigation.navigate("Inventory")}
            variant="outline"
            size="small"
          />
        </View>

        {items.slice(0, 3).map((item, index) => (
          <View key={item.itemId ?? `${index}`} style={styles.previewItem}>
            <View style={styles.previewItemInfo}>
              <Text style={styles.previewItemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.previewItemDetails}>
                Stock: {item.qty ?? 0} • {CURRENCY}
                {(item.price ?? 0).toFixed(2)}
              </Text>
            </View>
            {(item.qty ?? 0) <= LOW_STOCK_THRESHOLD && (
              <Ionicons name="warning" size={16} color="#FF9500" />
            )}
          </View>
        ))}

        {items.length === 0 && (
          <Text style={styles.emptyText}>No items in inventory</Text>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: "#666666",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  statCard: {
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: 16,
  },
  primaryStat: {
    backgroundColor: "#E3F2FD",
  },
  warningStat: {
    backgroundColor: "#FFF3E0",
  },
  dangerStat: {
    backgroundColor: "#FFEBEE",
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    marginLeft: 12,
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  warningText: {
    color: "#FF9500",
  },
  dangerText: {
    color: "#DC3545",
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  previewCard: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  previewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  previewItemInfo: {
    flex: 1,
  },
  previewItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  previewItemDetails: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
});

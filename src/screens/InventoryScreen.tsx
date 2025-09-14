import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Button, Loading } from "../components";
import { Item } from "../types";
import { CONFIG } from "../CONFIG";
import apiService from "../services/api";

interface InventoryScreenProps {
  navigation: any;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  navigation,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const MOCK_MODE = (CONFIG as any).MOCK_MODE ?? false;
  const CURRENCY = (CONFIG as any).CURRENCY ?? "₹";
  const LOW_STOCK_THRESHOLD = (CONFIG as any).LOW_STOCK_THRESHOLD ?? 5;

  useEffect(() => {
    loadInventoryData();
  }, []);

  const extractUpstreamData = (proxyResp: any): any => {
    if (proxyResp == null) return null;

    if (typeof proxyResp.upstreamBody === "string") {
      try {
        return JSON.parse(proxyResp.upstreamBody);
      } catch (e) {
        return { raw: proxyResp.upstreamBody };
      }
    }

    if (proxyResp.upstreamBody && typeof proxyResp.upstreamBody === "object") {
      return proxyResp.upstreamBody;
    }

    if (typeof proxyResp === "object" && !proxyResp.upstreamBody) {
      return proxyResp;
    }

    return null;
  };

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      let inventoryItems: Item[] = [];

      if (MOCK_MODE) {
        if (typeof (apiService as any).getMockInventoryItems === "function") {
          inventoryItems = await (apiService as any).getMockInventoryItems();
        } else {
          inventoryItems = [];
        }
      } else {
        try {
          const url = CONFIG.INVENTORY_ITEMS
            ? (CONFIG as any).buildProxyUrl(CONFIG.INVENTORY_ITEMS)
            : `${(CONFIG as any).PROXY_BASE || ""}?path=${encodeURIComponent(
                CONFIG.INVENTORY_ITEMS
              )}`;

          const resp = await apiService.axios.get(url);
          const data = extractUpstreamData(resp.data);

          if (Array.isArray(data)) {
            inventoryItems = data as Item[];
          } else if (data && Array.isArray((data as any).items)) {
            inventoryItems = (data as any).items as Item[];
          } else if (data && Array.isArray((data as any).inventory)) {
            inventoryItems = (data as any).inventory as Item[];
          } else {
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
          console.error("[Inventory] fetch error:", err);
          throw err;
        }
      }

      setItems(inventoryItems || []);
    } catch (error: any) {
      console.error("[Inventory] Error loading data:", error);
      Alert.alert("Error", "Failed to load inventory data. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventoryData();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Item }) => {
    const isLowStock = (item.qty ?? 0) <= LOW_STOCK_THRESHOLD;
    const today = new Date();
    const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
    const isExpired = expiryDate && expiryDate < today;
    const isExpiringSoon =
      expiryDate &&
      expiryDate > today &&
      expiryDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.statusIcons}>
            {isLowStock && (
              <Ionicons name="warning" size={16} color="#FF9500" />
            )}
            {isExpired && (
              <Ionicons name="alert-circle" size={16} color="#DC3545" />
            )}
            {isExpiringSoon && (
              <Ionicons name="time" size={16} color="#FF9500" />
            )}
          </View>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemDetail}>Stock: {item.qty ?? 0}</Text>
          <Text style={styles.itemDetail}>
            Price: {CURRENCY}
            {(item.price ?? 0).toFixed(2)}
          </Text>
          {item.expiryDate && (
            <Text
              style={[
                styles.itemDetail,
                isExpired && styles.expiredText,
                isExpiringSoon && styles.expiringSoonText,
              ]}
            >
              Expires: {new Date(item.expiryDate).toLocaleDateString()}
            </Text>
          )}
        </View>

        {item.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading text="Loading inventory..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Info", "Add item functionality coming soon!")
          }
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          Total Items: {items.length} | Low Stock:{" "}
          {
            items.filter((item) => (item.qty ?? 0) <= LOW_STOCK_THRESHOLD)
              .length
          }
        </Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.itemId ?? Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No items in inventory</Text>
            <Text style={styles.emptySubtext}>Add items to get started</Text>
          </View>
        }
      />
    </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },
  summaryContainer: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  summaryText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
    marginRight: 8,
  },
  statusIcons: {
    flexDirection: "row",
    gap: 4,
  },
  itemDetails: {
    gap: 4,
    marginBottom: 8,
  },
  itemDetail: {
    fontSize: 14,
    color: "#666666",
  },
  expiredText: {
    color: "#DC3545",
    fontWeight: "500",
  },
  expiringSoonText: {
    color: "#FF9500",
    fontWeight: "500",
  },
  itemDescription: {
    fontSize: 12,
    color: "#999999",
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999999",
    marginTop: 4,
  },
});

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
import {
  Card,
  Button,
  Loading,
  AddItemModal,
  UpdateItemModal,
  ItemActionModal,
  ItemRow,
} from "../components";
import { Item } from "../types";
import { CONFIG } from "../CONFIG";
import inventoryService from "../services/inventoryService";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { AdminDrawerParamList } from "../types";

type InventoryScreenNavigationProp = DrawerNavigationProp<
  AdminDrawerParamList,
  "Inventory"
>;

interface InventoryScreenProps {
  navigation: InventoryScreenNavigationProp;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  navigation,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const MOCK_MODE = CONFIG.MOCK_MODE ?? false;
  const CURRENCY = CONFIG.CURRENCY ?? "$";
  const LOW_STOCK_THRESHOLD = CONFIG.LOW_STOCK_THRESHOLD ?? 5;

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      let inventoryItems: Item[] = [];

      if (MOCK_MODE) {
        // Mock data for testing
        inventoryItems = [
          {
            itemId: "1",
            name: "Sample Item 1",
            qty: 10,
            price: 29.99,
            description: "Sample description",
            expiryDate: "2024-12-31",
          },
          {
            itemId: "2",
            name: "Low Stock Item",
            qty: 2,
            price: 15.5,
            description: "Low stock warning",
          },
        ];
      } else {
        try {
          // Use the new InventoryService to get all items
          inventoryItems = await inventoryService.getAllItems();
        } catch (err: any) {
          console.error("[Inventory] API Error:", err);

          // Provide more specific error messages
          if (err.response?.status === 401) {
            throw new Error("Authentication failed. Please login again.");
          } else if (err.response?.status === 403) {
            throw new Error("Access denied. Admin privileges required.");
          } else if (err.response?.status === 404) {
            throw new Error(
              "Inventory endpoint not found. Check configuration."
            );
          } else if (err.code === "NETWORK_ERROR" || !err.response) {
            throw new Error(
              "Network error. Check your connection and server status."
            );
          } else {
            throw new Error(
              `Server error: ${err.response?.status || "Unknown"}`
            );
          }
        }
      }

      console.log("[Inventory] Loaded items:", inventoryItems.length);
      setItems(inventoryItems);
    } catch (error: any) {
      console.error("[Inventory] Error loading data:", error);
      Alert.alert(
        "Error Loading Inventory",
        error.message || "Failed to load inventory data. Please try again.",
        [
          { text: "Retry", onPress: () => loadInventoryData() },
          { text: "Cancel" },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventoryData();
    setRefreshing(false);
  };

  const addItem = async (itemData: Omit<Item, "itemId">) => {
    try {
      console.log("[InventoryScreen] Adding new item:", itemData);

      if (MOCK_MODE) {
        // Mock implementation for testing
        const newItem: Item = {
          ...itemData,
          itemId: Math.random().toString(),
        };
        setItems((prev) => [...prev, newItem]);
        return;
      }

      // Real API call
      const newItem = await inventoryService.createItem(itemData);
      console.log("[InventoryScreen] Item added successfully:", newItem);

      // Refresh the list to get updated data
      await loadInventoryData();
    } catch (error: any) {
      console.error("[InventoryScreen] Error adding item:", error);
      throw error; // Re-throw so modal can handle it
    }
  };

  const updateItem = async (itemId: string, itemData: Partial<Item>) => {
    try {
      await inventoryService.updateItem(itemId, itemData);
      Alert.alert("Success", "Item updated successfully!");
      await loadInventoryData(); // Refresh the list
    } catch (error: any) {
      console.error("[Inventory] Error updating item:", error);
      Alert.alert("Error", "Failed to update item. Please try again.");
    }
  };

  const deleteItem = async (itemId: string, itemName: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${itemName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await inventoryService.deleteItem(itemId);
              Alert.alert("Success", "Item deleted successfully!");
              await loadInventoryData(); // Refresh the list
            } catch (error: any) {
              console.error("[Inventory] Error deleting item:", error);
              Alert.alert("Error", "Failed to delete item. Please try again.");
            }
          },
        },
      ]
    );
  };

  // Handler functions for long press functionality
  const handleItemLongPress = (item: Item) => {
    setSelectedItem(item);
    setShowActionModal(true);
  };

  const handleUpdateItem = () => {
    setShowUpdateModal(true);
  };

  const handleDeleteItem = () => {
    if (selectedItem) {
      deleteItem(selectedItem.itemId, selectedItem.name);
    }
  };

  const handleCloseActionModal = () => {
    setShowActionModal(false);
    setSelectedItem(null);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedItem(null);
  };

  const renderItem = ({ item }: { item: Item }) => {
    return (
      <ItemRow
        item={item}
        onLongPress={() => handleItemLongPress(item)}
        showAdminControls={false} // We'll use long press instead
      />
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
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
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
            <Text style={styles.emptySubtext}>
              {MOCK_MODE
                ? "Enable real API in CONFIG.ts"
                : "Add items to get started"}
            </Text>
            <Button
              title="Enable Mock Mode"
              onPress={() =>
                Alert.alert(
                  "Info",
                  "Set MOCK_MODE: true in CONFIG.ts for testing"
                )
              }
              variant="outline"
              size="small"
              style={{ marginTop: 16 }}
            />
          </View>
        }
      />

      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={addItem}
      />

      <ItemActionModal
        visible={showActionModal}
        onClose={handleCloseActionModal}
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteItem}
        item={selectedItem}
      />

      <UpdateItemModal
        visible={showUpdateModal}
        onClose={handleCloseUpdateModal}
        onUpdate={updateItem}
        item={selectedItem}
      />
    </View>
  );
};

// ... rest of styles remain the same
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
  addButton: {
    padding: 4,
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

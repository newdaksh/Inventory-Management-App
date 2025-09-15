import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item } from "../types";
import { CONFIG } from "../CONFIG";

// Helper to detect mobile web
const isMobileWeb =
  Platform.OS === "web" &&
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

interface ItemActionModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  item: Item | null;
}

export const ItemActionModal: React.FC<ItemActionModalProps> = ({
  visible,
  onClose,
  onUpdate,
  onDelete,
  item,
}) => {
  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        // Improve mobile web touch handling
        {...(isMobileWeb && {
          onPressIn: () => {},
          onPressOut: () => {},
        })}
      >
        <View style={styles.modalContainer}>
          {/* Item Info Header */}
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemDetails}>
              Qty: {item.qty} • Price: {CONFIG.CURRENCY}
              {item.price?.toFixed(2) || "0.00"}
            </Text>
          </View>

          {/* Action Options */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // Close modal first, then trigger update
                onClose();
                // For mobile web, use immediate execution to avoid touch event issues
                if (isMobileWeb || Platform.OS !== "web") {
                  setTimeout(() => onUpdate(), 50);
                } else {
                  // Small delay for desktop web
                  setTimeout(() => onUpdate(), 150);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="pencil" size={24} color="#007AFF" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Update Item</Text>
                <Text style={styles.actionSubtitle}>
                  Edit name, price, quantity, etc.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // Close modal first, then trigger delete
                onClose();
                // For mobile web, use immediate execution to avoid touch event issues
                if (isMobileWeb || Platform.OS !== "web") {
                  setTimeout(() => onDelete(), 50);
                } else {
                  // Small delay for desktop web
                  setTimeout(() => onDelete(), 150);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="trash" size={24} color="#FF3B30" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, styles.deleteText]}>
                  Delete Item
                </Text>
                <Text style={styles.actionSubtitle}>
                  Remove item from inventory
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    width: "100%",
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  itemHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    alignItems: "center",
  },
  itemName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  actions: {
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
  },
  deleteText: {
    color: "#FF3B30",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginHorizontal: 20,
  },
  cancelButton: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
  },
});

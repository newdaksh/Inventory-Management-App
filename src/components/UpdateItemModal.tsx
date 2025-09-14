import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "./Input";
import { Button } from "./Button";
import { Item } from "../types";
import { CONFIG } from "../CONFIG";

interface UpdateItemModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (itemId: string, updatedData: Partial<Item>) => Promise<void>;
  item: Item | null;
}

export const UpdateItemModal: React.FC<UpdateItemModalProps> = ({
  visible,
  onClose,
  onUpdate,
  item,
}) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setPrice(item.price?.toString() || "");
      setQty(item.qty?.toString() || "");
      setDescription(item.description || "");
      setExpiryDate(item.expiryDate || "");
    } else {
      // Reset form
      setName("");
      setPrice("");
      setQty("");
      setDescription("");
      setExpiryDate("");
    }
  }, [item]);

  const handleUpdate = async () => {
    if (!item) return;

    // Validation
    if (!name.trim()) {
      Alert.alert("Error", "Item name is required");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    const parsedQty = parseInt(qty, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    // Validate expiry date format if provided
    if (expiryDate.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expiryDate)) {
        Alert.alert("Error", "Expiry date must be in YYYY-MM-DD format");
        return;
      }
    }

    try {
      setLoading(true);

      const updatedData: Partial<Item> = {
        name: name.trim(),
        price: parsedPrice,
        qty: parsedQty,
        description: description.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
      };

      await onUpdate(item.itemId, updatedData);
      onClose();
    } catch (error: any) {
      console.error("Error updating item:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update item. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Update Item</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Form Fields */}
            <View style={styles.form}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Item Name *</Text>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter item name"
                  maxLength={100}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Price ({CONFIG.CURRENCY}) *</Text>
                <Input
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Quantity *</Text>
                <Input
                  value={qty}
                  onChangeText={setQty}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Description</Text>
                <Input
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter item description (optional)"
                  multiline
                  maxLength={500}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Expiry Date</Text>
                <Input
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="YYYY-MM-DD (optional)"
                />
                <Text style={styles.hint}>
                  Format: YYYY-MM-DD (e.g., 2024-12-31)
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title={loading ? "Updating..." : "Update Item"}
              onPress={handleUpdate}
              loading={loading}
              style={styles.updateButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  updateButton: {
    flex: 1,
  },
});

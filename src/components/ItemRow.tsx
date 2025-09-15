import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item } from "../types";
import { CONFIG } from "../CONFIG";
import { Card } from "./Card";

// Helper to detect mobile web
const isMobileWeb =
  Platform.OS === "web" &&
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

interface ItemRowProps {
  item: Item;
  onPress?: () => void;
  onLongPress?: () => void;
  onAddToCart?: () => void;
  onUpdateQuantity?: (delta: number) => void;
  cartQuantity?: number;
  showCartControls?: boolean;
  showAdminControls?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  onPress,
  onLongPress,
  onAddToCart,
  onUpdateQuantity,
  cartQuantity = 0,
  showCartControls = false,
  showAdminControls = false,
  onEdit,
  onDelete,
}) => {
  const isLowStock = item.qty <= CONFIG.LOW_STOCK_THRESHOLD;
  const isExpiringSoon = checkExpiryStatus(item.expiryDate).isExpiringSoon;
  const isExpired = checkExpiryStatus(item.expiryDate).isExpired;

  return (
    <Card style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={!onPress && !onLongPress}
        delayLongPress={isMobileWeb ? 300 : 500} // Shorter delay for mobile web
      >
        <View style={styles.content}>
          {/* Item Image */}
          <View style={styles.imageContainer}>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <Ionicons name="image-outline" size={24} color="#A0A0A0" />
              </View>
            )}
          </View>

          {/* Item Details */}
          <View style={styles.details}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>

            {item.description && (
              <Text style={styles.description} numberOfLines={1}>
                {item.description}
              </Text>
            )}

            <View style={styles.priceStockRow}>
              <Text style={styles.price}>
                {CONFIG.CURRENCY}
                {item.price.toFixed(2)}
              </Text>

              <View style={styles.stockContainer}>
                <Text
                  style={[
                    styles.stock,
                    isLowStock && styles.lowStock,
                    isExpired && styles.expired,
                  ]}
                >
                  Stock: {item.qty}
                </Text>

                {isLowStock && !isExpired && (
                  <Ionicons name="warning" size={16} color="#FF9500" />
                )}

                {isExpired && (
                  <Ionicons name="alert-circle" size={16} color="#DC3545" />
                )}
              </View>
            </View>

            {/* Expiry Date */}
            {item.expiryDate && (
              <Text
                style={[
                  styles.expiry,
                  isExpiringSoon && styles.expiringSoon,
                  isExpired && styles.expired,
                ]}
              >
                Expires: {new Date(item.expiryDate).toLocaleDateString()}
              </Text>
            )}

            {/* Cart Controls */}
            {showCartControls && onUpdateQuantity && (
              <View style={styles.cartControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onUpdateQuantity(-1)}
                  disabled={cartQuantity <= 0}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={cartQuantity <= 0 ? "#A0A0A0" : "#007AFF"}
                  />
                </TouchableOpacity>

                <Text style={styles.cartQuantity}>{cartQuantity}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onUpdateQuantity(1)}
                  disabled={cartQuantity >= item.qty || isExpired}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={
                      cartQuantity >= item.qty || isExpired
                        ? "#A0A0A0"
                        : "#007AFF"
                    }
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Add to Cart Button */}
            {!showCartControls && onAddToCart && (
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  (item.qty <= 0 || isExpired) && styles.disabledButton,
                ]}
                onPress={onAddToCart}
                disabled={item.qty <= 0 || isExpired}
              >
                <Ionicons name="cart" size={16} color="#FFFFFF" />
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Admin Controls */}
          {showAdminControls && (
            <View style={styles.adminControls}>
              {onEdit && (
                <TouchableOpacity style={styles.adminButton} onPress={onEdit}>
                  <Ionicons name="pencil" size={20} color="#007AFF" />
                </TouchableOpacity>
              )}

              {onDelete && (
                <TouchableOpacity style={styles.adminButton} onPress={onDelete}>
                  <Ionicons name="trash" size={20} color="#DC3545" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );
};

// Helper function to check expiry status
const checkExpiryStatus = (expiryDate?: string) => {
  if (!expiryDate) return { isExpiringSoon: false, isExpired: false };

  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    isExpired: daysUntilExpiry < 0,
    isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 7, // Expiring within 7 days
  };
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  priceStockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stock: {
    fontSize: 14,
    color: "#666666",
    marginRight: 4,
  },
  lowStock: {
    color: "#FF9500",
    fontWeight: "600",
  },
  expired: {
    color: "#DC3545",
    fontWeight: "600",
  },
  expiry: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  expiringSoon: {
    color: "#FF9500",
    fontWeight: "600",
  },
  cartControls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cartQuantity: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: "center",
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  adminControls: {
    flexDirection: "column",
    alignItems: "center",
    marginLeft: 8,
  },
  adminButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
});

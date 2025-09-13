import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card } from "../components";

interface WelcomeProps {
  navigation: any;
}

export const Welcome: React.FC<WelcomeProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="business" size={60} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Inventory Management</Text>
        <Text style={styles.subtitle}>
          Your complete solution for inventory tracking and order management
        </Text>
      </View>

      {/* Login Options */}
      <View style={styles.content}>
        <Card style={styles.optionCard}>
          <View style={styles.option}>
            <View style={styles.optionIcon}>
              <Ionicons name="shield-checkmark" size={32} color="#007AFF" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Admin Panel</Text>
              <Text style={styles.optionDescription}>
                Manage inventory, track orders, and oversee operations
              </Text>
            </View>
          </View>
          <Button
            title="Admin Login"
            onPress={() => navigation.navigate("AdminLogin")}
            style={styles.optionButton}
          />
        </Card>

        <Card style={styles.optionCard}>
          <View style={styles.option}>
            <View style={styles.optionIcon}>
              <Ionicons name="cart" size={32} color="#28A745" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Customer Portal</Text>
              <Text style={styles.optionDescription}>
                Browse items, manage cart, and place orders
              </Text>
            </View>
          </View>
          <Button
            title="Start Shopping"
            onPress={() => navigation.navigate("CustomerLogin")}
            variant="secondary"
            style={styles.optionButton}
          />
        </Card>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Built with React Native & Expo</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#007AFF",
  },
  header: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  content: {
    flex: 0.5,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  optionCard: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 18,
  },
  optionButton: {
    marginTop: 0,
  },
  footer: {
    flex: 0.1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const TestDashboard: React.FC = () => {
  console.log("[TestDashboard] Rendering test dashboard");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Dashboard</Text>
      <Text style={styles.subtitle}>This is a simple test dashboard</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
  },
});

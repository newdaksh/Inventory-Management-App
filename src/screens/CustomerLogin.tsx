import React from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../hooks/useAuth";
import { Button, Input, Card } from "../components";
import { CustomerLoginForm } from "../types";

// Validation schema
const schema = yup.object().shape({
  name: yup
    .string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  email: yup.string().email("Please enter a valid email").optional(),
  phone: yup.string().optional(),
});

interface CustomerLoginProps {
  navigation: any;
}

export const CustomerLogin: React.FC<CustomerLoginProps> = ({ navigation }) => {
  const { signInCustomer, state } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerLoginForm>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = async (data: CustomerLoginForm) => {
    try {
      await signInCustomer(
        data.name,
        data.email || undefined,
        data.phone || undefined
      );
      // Navigation will be handled by the auth state change in App.tsx
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error.message || "Unable to sign in. Please try again.",
        [{ text: "OK" }]
      );
      reset({ name: data.name, email: data.email, phone: data.phone });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Customer Login</Text>
            <Text style={styles.subtitle}>
              Enter your details to start shopping. If you're new, we'll create
              your account automatically.
            </Text>
          </View>

          {/* Login Form */}
          <Card style={styles.formCard}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email (Optional)"
                  placeholder="Enter your email"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Phone (Optional)"
                  placeholder="Enter your phone number"
                  value={value}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              )}
            />

            <Button
              title="Start Shopping"
              onPress={handleSubmit(onSubmit)}
              loading={state.isLoading}
              style={styles.signInButton}
            />
          </Card>

          {/* Info Card */}
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>First time here?</Text>
            <Text style={styles.infoText}>
              Don't worry! Just enter your name and we'll create your account
              automatically. Email and phone are optional but help us provide
              better service.
            </Text>
          </Card>

          {/* Back Button */}
          <Button
            title="Back to Welcome"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
  },
  formCard: {
    marginBottom: 20,
  },
  signInButton: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: "#E3F2FD",
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1565C0",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1976D2",
    lineHeight: 20,
  },
  backButton: {
    marginTop: 12,
  },
});

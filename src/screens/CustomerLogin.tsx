import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../hooks/useAuth";
import { Button, Input, Card } from "../components";
import { CustomerLoginForm } from "../types";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeColors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const formSlideAnim = useRef(new Animated.Value(100)).current;
  const headerSlideAnim = useRef(new Animated.Value(-50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    // Entrance animations sequence
    Animated.sequence([
      // Initial fade in and slide animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(headerSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.1)),
        }),
      ]),
      // Form slide up animation
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();

    // Continuous pulse animation for loading states
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );

    if (state.isLoading) {
      pulseLoop.start();
    } else {
      pulseLoop.stop();
    }

    return () => pulseLoop.stop();
  }, [state.isLoading]);

  const onSubmit = async (data: CustomerLoginForm) => {
    try {
      // Add loading animation
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 200,
        useNativeDriver: true,
      }).start();

      await signInCustomer(
        data.name,
        data.email || undefined,
        data.phone || undefined
      );
      // Navigation will be handled by the auth state change in App.tsx

      // Success animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } catch (error: any) {
      // Error shake animation
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert(
        "Login Failed",
        error.message || "Unable to sign in. Please try again.",
        [{ text: "OK" }]
      );
      reset({ name: data.name, email: data.email, phone: data.phone });

      // Reset scale
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleBackPress = () => {
    // Add press animation before navigation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Animated Background Gradient */}
      <LinearGradient
        colors={["#E8F5E8", ThemeColors.background, "#F0F8F0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Background Elements */}
      <Animatable.View
        animation="pulse"
        easing="ease-out"
        iterationCount="infinite"
        duration={3500}
        style={[styles.floatingElement, styles.element1]}
      />
      <Animatable.View
        animation="pulse"
        easing="ease-out"
        iterationCount="infinite"
        duration={4500}
        style={[styles.floatingElement, styles.element2]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                transform: [{ translateY: headerSlideAnim }],
              },
            ]}
          >
            <Animatable.View
              animation="bounceIn"
              delay={300}
              duration={800}
              style={styles.iconContainer}
            >
              <Ionicons name="person-circle" size={50} color="#28A745" />
            </Animatable.View>

            <Animatable.Text
              animation="fadeInUp"
              delay={500}
              duration={800}
              style={styles.title}
            >
              Customer Login
            </Animatable.Text>

            <Animatable.Text
              animation="fadeInUp"
              delay={700}
              duration={800}
              style={styles.subtitle}
            >
              Enter your details to start shopping. If you're new, we'll create
              your account automatically.
            </Animatable.Text>
          </Animated.View>

          {/* Login Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                transform: [
                  { translateY: formSlideAnim },
                  { scale: state.isLoading ? pulseAnim : 1 },
                ],
              },
            ]}
          >
            <Animatable.View animation="slideInUp" delay={900} duration={600}>
              <Card style={styles.formCard}>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <Animatable.View
                      animation="fadeInRight"
                      delay={1100}
                      duration={500}
                    >
                      <Input
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={value}
                        onChangeText={onChange}
                        error={errors.name?.message}
                        autoCapitalize="words"
                        autoComplete="name"
                      />
                    </Animatable.View>
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <Animatable.View
                      animation="fadeInRight"
                      delay={1300}
                      duration={500}
                    >
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
                    </Animatable.View>
                  )}
                />

                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <Animatable.View
                      animation="fadeInRight"
                      delay={1500}
                      duration={500}
                    >
                      <Input
                        label="Phone (Optional)"
                        placeholder="Enter your phone number"
                        value={value}
                        onChangeText={onChange}
                        error={errors.phone?.message}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                      />
                    </Animatable.View>
                  )}
                />

                <Animatable.View
                  animation="fadeInUp"
                  delay={1700}
                  duration={500}
                >
                  <Button
                    title="Start Shopping"
                    onPress={handleSubmit(onSubmit)}
                    loading={state.isLoading}
                    style={styles.signInButton}
                  />
                </Animatable.View>
              </Card>
            </Animatable.View>
          </Animated.View>

          {/* Info Card */}
          <Animatable.View animation="fadeInUp" delay={1900} duration={600}>
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>First time here?</Text>
              <Text style={styles.infoText}>
                Don't worry! Just enter your name and we'll create your account
                automatically. Email and phone are optional but help us provide
                better service.
              </Text>
            </Card>
          </Animatable.View>

          {/* Back Button */}
          <Animatable.View animation="fadeInUp" delay={2100} duration={500}>
            <Button
              title="Back to Welcome"
              onPress={handleBackPress}
              variant="outline"
              style={styles.backButton}
            />
          </Animatable.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  floatingElement: {
    position: "absolute",
    backgroundColor: "rgba(40, 167, 69, 0.1)",
    borderRadius: 50,
  },
  element1: {
    width: 120,
    height: 120,
    top: height * 0.15,
    right: width * 0.1,
  },
  element2: {
    width: 80,
    height: 80,
    bottom: height * 0.25,
    left: width * 0.1,
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
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#28A745",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: ThemeColors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: ThemeColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  signInButton: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#28A745",
    shadowColor: "#28A745",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  infoCard: {
    backgroundColor: "#E8F5E8",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#388E3C",
    lineHeight: 20,
  },
  backButton: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#28A745",
    backgroundColor: "transparent",
  },
});

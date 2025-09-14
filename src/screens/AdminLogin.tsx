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
import { AdminLoginForm } from "../types";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeColors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Validation schema
const schema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

interface AdminLoginProps {
  navigation: any;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ navigation }) => {
  const { signInAdmin, state } = useAuth();
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
  } = useForm<AdminLoginForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
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

  const onSubmit = async (data: AdminLoginForm) => {
    try {
      // Add loading animation
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 200,
        useNativeDriver: true,
      }).start();

      await signInAdmin(data.email, data.password);
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
        error.message || "Invalid email or password. Please try again.",
        [{ text: "OK" }]
      );
      reset({ email: data.email, password: "" });

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
        colors={[ThemeColors.background, "#F0F4F8", ThemeColors.highlight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Background Elements */}
      <Animatable.View
        animation="pulse"
        easing="ease-out"
        iterationCount="infinite"
        duration={3000}
        style={[styles.floatingElement, styles.element1]}
      />
      <Animatable.View
        animation="pulse"
        easing="ease-out"
        iterationCount="infinite"
        duration={4000}
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
              <Ionicons
                name="shield-checkmark"
                size={50}
                color={ThemeColors.primary}
              />
            </Animatable.View>

            <Animatable.Text
              animation="fadeInUp"
              delay={500}
              duration={800}
              style={styles.title}
            >
              Admin Login
            </Animatable.Text>

            <Animatable.Text
              animation="fadeInUp"
              delay={700}
              duration={800}
              style={styles.subtitle}
            >
              Sign in with your admin credentials to manage inventory
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
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <Animatable.View
                      animation="fadeInRight"
                      delay={1100}
                      duration={500}
                    >
                      <Input
                        label="Email"
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
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <Animatable.View
                      animation="fadeInRight"
                      delay={1300}
                      duration={500}
                    >
                      <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={value}
                        onChangeText={onChange}
                        error={errors.password?.message}
                        secureTextEntry
                        autoComplete="password"
                      />
                    </Animatable.View>
                  )}
                />

                <Animatable.View
                  animation="fadeInUp"
                  delay={1500}
                  duration={500}
                >
                  <Button
                    title="Sign In"
                    onPress={handleSubmit(onSubmit)}
                    loading={state.isLoading}
                    style={styles.signInButton}
                  />
                </Animatable.View>
              </Card>
            </Animatable.View>
          </Animated.View>

          {/* Back Button */}
          <Animatable.View animation="fadeInUp" delay={1700} duration={500}>
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
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 50,
  },
  element1: {
    width: 120,
    height: 120,
    top: height * 0.1,
    right: width * 0.1,
  },
  element2: {
    width: 80,
    height: 80,
    bottom: height * 0.2,
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
    backgroundColor: ThemeColors.highlight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: ThemeColors.primary,
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
  },
  signInButton: {
    marginTop: 8,
    borderRadius: 12,
    shadowColor: ThemeColors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ThemeColors.primary,
    backgroundColor: "transparent",
  },
});

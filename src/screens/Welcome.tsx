import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
  SafeAreaView,
  Platform, // Added for platform detection
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card } from "../components";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeColors } from "../theme/colors";

const { width, height } = Dimensions.get("window");

interface WelcomeProps {
  navigation: any;
}

export const Welcome: React.FC<WelcomeProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current; // FIX: Start at 1 for immediate visibility

  // FIX: Detect web platform to disable native driver
  const isWeb = Platform.OS === 'web';
  const nativeDriver = !isWeb;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: nativeDriver, // FIX: Conditional
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: nativeDriver,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: nativeDriver,
          easing: Easing.out(Easing.back(1.2)),
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: nativeDriver,
        easing: Easing.out(Easing.quad),
      }),
      // FIX: Removed bounceAnim timing since initial is now 1; content fades in with header
    ]).start();

    const rotationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: nativeDriver,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: nativeDriver,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );

    const timeout = setTimeout(() => rotationLoop.start(), 1500);

    return () => {
      clearTimeout(timeout);
      rotationLoop.stop();
    };
  }, []);

  // FIX: Use a local scale for button press effect instead of shared scaleAnim
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePress = (route: string) => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: nativeDriver,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: nativeDriver,
      }),
    ]).start(() => {
      navigation.navigate(route);
    });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ThemeColors.primary}
      />

      {/* Animated Background Gradient (low z-index so content sits above it) */}
      <LinearGradient
        colors={[
          ThemeColors.primary,
          ThemeColors.accent,
          ThemeColors.secondary,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, styles.gradient]}
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
      <Animatable.View
        animation="pulse"
        easing="ease-out"
        iterationCount="infinite"
        duration={3500}
        style={[styles.floatingElement, styles.element3]}
      />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Ionicons name="business" size={60} color="#FFFFFF" />
        </Animated.View>

        <Animatable.Text
          animation="fadeInUp"
          delay={500}
          duration={1000}
          style={styles.title}
        >
          Inventory Management
        </Animatable.Text>

        <Animatable.Text
          animation="fadeInUp"
          delay={700}
          duration={1000}
          style={styles.subtitle}
        >
          Your complete solution for inventory tracking and order management
        </Animatable.Text>
      </Animated.View>

      {/* Login Options */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim, // Still fades in with header
            transform: [{ scale: bounceAnim }], // Now starts at 1
          },
        ]}
      >
        <Animatable.View
          animation="slideInLeft"
          delay={400} // FIX: Reduced delay for faster appearance
          duration={800}
          easing="ease-out"
        >
          <Card style={[styles.optionCard, styles.debugCard]}>
            <View style={styles.option}>
              <Animatable.View
                animation="bounceIn"
                delay={600} // FIX: Reduced delay
                duration={600}
                style={styles.optionIcon}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={32}
                  color={ThemeColors.primary}
                />
              </Animatable.View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Admin Panel</Text>
                <Text style={styles.optionDescription}>
                  Manage inventory, track orders, and oversee operations
                </Text>
              </View>
            </View>
            <Animatable.View animation="fadeInUp" delay={800} duration={600}> // FIX: Reduced delay
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}> // FIX: Apply local scale to button container
                <Button
                  title="Admin Login"
                  onPress={() => handlePress("AdminLogin")}
                  style={styles.optionButton}
                />
              </Animated.View>
            </Animatable.View>
          </Card>
        </Animatable.View>

        <Animatable.View
          animation="slideInRight"
          delay={500} // FIX: Reduced delay
          duration={800}
          easing="ease-out"
        >
          <Card style={[styles.optionCard, styles.debugCard]}>
            <View style={styles.option}>
              <Animatable.View
                animation="bounceIn"
                delay={700} // FIX: Reduced delay
                duration={600}
                style={styles.optionIcon}
              >
                <Ionicons name="person-circle" size={32} color="#28A745" />
              </Animatable.View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Customer Portal</Text>
                <Text style={styles.optionDescription}>
                  Sign in to browse items, manage cart, and place orders
                </Text>
              </View>
            </View>
            <Animatable.View animation="fadeInUp" delay={900} duration={600}> // FIX: Reduced delay
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}> // FIX: Apply local scale
                <Button
                  title="Customer Login"
                  onPress={() => handlePress("CustomerLogin")}
                  variant="secondary"
                  style={styles.optionButton}
                />
              </Animated.View>
            </Animatable.View>
          </Card>
        </Animatable.View>
      </Animated.View>

      {/* Footer */}
      <Animatable.View
        animation="fadeInUp"
        delay={1000} // FIX: Reduced delay slightly
        duration={800}
        style={styles.footer}
      >
        <Text style={styles.footerText}>Built with React Native & Expo</Text>
      </Animatable.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.primary,
    position: "relative", // ensure zIndex works correctly
  },
  gradient: {
    zIndex: 0, // gradient sits below content
  },
  floatingElement: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 50,
    zIndex: 1,
  },
  element1: {
    width: 100,
    height: 100,
    top: height * 0.1,
    left: width * 0.8,
  },
  element2: {
    width: 60,
    height: 60,
    top: height * 0.3,
    left: width * 0.1,
  },
  element3: {
    width: 80,
    height: 80,
    top: height * 0.7,
    right: width * 0.1,
  },
  header: {
    flex: 0.30,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    zIndex: 3,
    position: "relative",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    paddingHorizontal: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    paddingHorizontal: 15,
  },
  content: {
    flex: 0.55,
    paddingHorizontal: 20,
    paddingTop: 10,
    justifyContent: "center",
    zIndex: 4,
    position: "relative",
  },
  optionCard: {
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ scale: 1 }],
    zIndex: 5,
    position: "relative",
  },
  // debugCard helps show the card border clearly on web — remove when done
  debugCard: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: ThemeColors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 3,
  },
  optionDescription: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 16,
  },
  optionButton: {
    marginTop: 0,
    borderRadius: 12,
    shadowColor: ThemeColors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  footer: {
    flex: 0.08,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
    zIndex: 3,
    position: "relative",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

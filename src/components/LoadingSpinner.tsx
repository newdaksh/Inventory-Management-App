import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeColors } from "../theme/colors";

const { width } = Dimensions.get("window");

const LoadingSpinner = ({
  size = 60,
  color1 = ThemeColors.primary,
  color2 = ThemeColors.accent,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => spin());
    };

    spin();

    return () => {
      spinValue.stopAnimation();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinnerContainer,
          {
            width: size,
            height: size,
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <LinearGradient
          colors={[color1, color2] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Animated.View
            style={[
              styles.innerCircle,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: ThemeColors.background,
              },
            ]}
          >
            <View style={[styles.centerDot, { backgroundColor: color1 }]} />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
      <Animated.Text
        style={[
          styles.text,
          {
            opacity: pulseAnim,
            color: ThemeColors.primary,
          },
        ]}
      >
        Loading Inventory...
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ThemeColors.background,
  },
  spinnerContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
    padding: 4,
  },
  gradient: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: "90%",
    height: "90%",
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default LoadingSpinner;

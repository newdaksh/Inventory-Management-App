import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { ThemeColors } from "../theme/colors";

type ModernCardProps = {
  title: string;
  value: string | number;
  icon?: string;
  gradient?: string[];
  onPress?: () => void;
  style?: object;
  delay?: number;
};

const ModernCard: React.FC<ModernCardProps> = ({
  title,
  value,
  icon,
  gradient = [ThemeColors.primary, ThemeColors.secondary],
  onPress,
  style,
  delay = 0,
}) => {
  const scaleValue = new Animated.Value(1);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) onPress();
  };

  const animatedStyle = {
    transform: [{ scale: scaleValue }],
  };

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={delay}
      duration={600}
      style={[styles.container, style]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress ? animatePress : undefined}
        style={styles.touchable}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          <LinearGradient
            colors={gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.value}>{value}</Text>
              {icon && (
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{icon}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: "hidden",
  },
  touchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  value: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  iconContainer: {
    position: "absolute",
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  icon: {
    fontSize: 64,
    color: "#FFFFFF",
  },
});

export default ModernCard;

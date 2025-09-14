import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeColors } from "../theme/colors";

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradient?: string[];
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  type?: "primary" | "secondary" | "outline" | "text";
  width?: number | string;
  height?: number;
  fontSize?: number;
  borderRadius?: number;
  elevation?: number;
  animationScale?: number;
  animationDuration?: number;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  gradient,
  icon,
  disabled = false,
  loading = false,
  type = "primary",
  width = "100%",
  height = 50,
  fontSize = 16,
  borderRadius = 12,
  elevation = 2,
  animationScale = 0.95,
  animationDuration = 100,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const getButtonStyles = () => {
    let buttonStyles: any = [
      styles.button,
      { width, height, borderRadius, elevation },
    ];

    switch (type) {
      case "primary":
        buttonStyles.push(styles.primaryButton);
        break;
      case "secondary":
        buttonStyles.push(styles.secondaryButton);
        break;
      case "outline":
        buttonStyles.push(styles.outlineButton);
        break;
      case "text":
        buttonStyles.push(styles.textButton);
        break;
    }

    if (disabled) {
      buttonStyles.push(styles.disabledButton);
    }

    if (style) {
      buttonStyles.push(style);
    }

    return buttonStyles;
  };

  const getTextStyles = () => {
    let textStyles: any = [styles.text, { fontSize }];

    switch (type) {
      case "primary":
        textStyles.push(styles.primaryText);
        break;
      case "secondary":
        textStyles.push(styles.secondaryText);
        break;
      case "outline":
        textStyles.push(styles.outlineText);
        break;
      case "text":
        textStyles.push(styles.textOnly);
        break;
    }

    if (disabled) {
      textStyles.push(styles.disabledText);
    }

    if (textStyle) {
      textStyles.push(textStyle);
    }

    return textStyles;
  };

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: animationScale,
      useNativeDriver: true,
      speed: 20,
    }).start();

    Animated.timing(opacityValue, {
      toValue: 0.8,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.timing(opacityValue, {
      toValue: 1,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              {
                backgroundColor:
                  type === "primary" ? "#FFFFFF" : ThemeColors.primary,
                opacity: opacityValue,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              {
                backgroundColor:
                  type === "primary" ? "#FFFFFF" : ThemeColors.primary,
                opacity: opacityValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              {
                backgroundColor:
                  type === "primary" ? "#FFFFFF" : ThemeColors.primary,
                opacity: opacityValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.7],
                }),
              },
            ]}
          />
        </View>
      );
    }

    return (
      <>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Animated.Text style={getTextStyles()}>{title}</Animated.Text>
      </>
    );
  };

  const buttonGradient = gradient || [
    ThemeColors.primary,
    ThemeColors.secondary,
  ];

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleValue }], opacity: opacityValue },
        disabled && styles.disabled,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        disabled={disabled || loading}
        style={getButtonStyles()}
      >
        {type === "primary" ? (
          <LinearGradient
            colors={buttonGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { borderRadius: borderRadius - 1 }]}
          >
            {renderContent()}
          </LinearGradient>
        ) : (
          <View style={styles.contentContainer}>{renderContent()}</View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  primaryButton: {
    backgroundColor: ThemeColors.primary,
  },
  secondaryButton: {
    backgroundColor: ThemeColors.secondary,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: ThemeColors.primary,
  },
  textButton: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  disabledButton: {
    backgroundColor: "#E2E8F0",
    borderColor: "#CBD5E0",
  },
  disabled: {
    opacity: 0.6,
  },
  gradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  contentContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: "#FFFFFF",
  },
  outlineText: {
    color: ThemeColors.primary,
  },
  textOnly: {
    color: ThemeColors.primary,
  },
  disabledText: {
    color: "#A0AEC0",
  },
  iconContainer: {
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});

export default AnimatedButton;

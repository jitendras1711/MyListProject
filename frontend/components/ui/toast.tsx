import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, ViewStyle } from 'react-native';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  style?: ViewStyle;
}

export default function Toast({ message, visible, onHide, style }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onHide();
      });
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [visible, opacity, onHide]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, style, { opacity }]}> 
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'web' ? 30 : 80,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(33, 33, 33, 0.92)',
    borderRadius: 14,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 10,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});
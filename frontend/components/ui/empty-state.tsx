import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeContext } from '@/hooks/theme-context';
import { Colors } from '@/constants/theme';

interface EmptyStateProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  iconSize?: number;
}

export default function EmptyState({
  iconName,
  title,
  subtitle,
  iconSize = 64,
}: EmptyStateProps) {
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];
  const isDark = contextTheme === 'dark';
  return (
    <View style={styles.container}>
      <Ionicons name={iconName} size={iconSize} color={theme.icon} />
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#A8B0BB' : '#ADB5BD' }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

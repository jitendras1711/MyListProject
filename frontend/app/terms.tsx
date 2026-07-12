import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/hooks/theme-context';
import { Colors } from '@/constants/theme';

export default function TermsScreen() {
  const router = useRouter();
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];
  const isDark = contextTheme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Terms and Conditions</Text>
        <Text style={[styles.body, { color: isDark ? '#A8B0BB' : '#6C757D' }]}> 
          By using Atomize, you agree to use the service responsibly and not to misuse it for unlawful or harmful activity.
        </Text>
        <Text style={[styles.body, { color: isDark ? '#A8B0BB' : '#6C757D' }]}> 
          You are responsible for the content you create and share, and you must respect the rights of other users.
          Atomize provides the service as-is and may suspend access if misuse is detected.
        </Text>
        <Text style={[styles.body, { color: isDark ? '#A8B0BB' : '#6C757D' }]}> 
          Continued use of the app means you accept these terms and any updates we may publish.
        </Text>
        <Text style={[styles.contact, { color: theme.text }]}>Contact: jitendra.s1711@gmail.com</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 40, gap: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  contact: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    borderRadius: 10,
    backgroundColor: '#4361EE',
  },
  backButtonText: { color: 'white', fontWeight: '600' },
});

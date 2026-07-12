import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/hooks/theme-context';
import { Colors } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];
  const isDark = contextTheme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
        <Text style={[styles.body, { color: isDark ? '#A8B0BB' : '#6C757D' }]}> 
          Atomize collects the information needed to provide your account, task management, and sharing features.
          We use Google sign-in so you can access the app securely, and we may store your email address, name,
          and task-related content to power the experience.
        </Text>
        <Text style={[styles.body, { color: isDark ? '#A8B0BB' : '#6C757D' }]}> 
          We do not sell your personal data. We use your information to operate the service, personalize your experience,
          and allow task sharing with your approved contacts. You may request access or deletion of your account data by
          contacting us through the support contact listed below.
        </Text>
        <Text style={[styles.body, { color: isDark ? '#A8B0BB' : '#6C757D' }]}> 
          If you use this app, you agree that your data may be stored and processed in order to deliver the service.
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

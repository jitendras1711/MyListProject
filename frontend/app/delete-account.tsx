import React from 'react';
import { Head } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/hooks/theme-context';
import { Colors } from '@/constants/theme';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];
  const isDark = contextTheme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <Head>
        <title>Atomize - Delete Account</title>
      </Head>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Delete your account and data</Text>
        <Text style={[styles.body, { color: isDark ? '#A8B0BB' : '#6C757D' }]}> 
          To request deletion of your Atomize account and associated data, email us at contact@atomize.online
          with the subject “Account Deletion Request”. Please include the email address you used to sign in so
          we can verify your request.
        </Text>
        <Text style={[styles.body, { color: isDark ? '#A8B0BB' : '#6C757D' }]}> 
          Once we receive your request, we will remove your account profile, tasks, subtasks, shared-task records,
          and friend connections from active systems. This process is typically completed within 30 days.
        </Text>
        <Text style={[styles.body, { color: isDark ? '#A8B0BB' : '#6C757D' }]}> 
          We may retain limited information for a short period where required for security, fraud prevention,
          legal compliance, or backup recovery. We do not collect payment data, and any retained data is not used
          for marketing purposes.
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/login')}>
            <Text style={styles.secondaryButtonText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 40, paddingBottom: 40, gap: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#4361EE',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#E9ECEF',
  },
  backButtonText: { color: 'white', fontWeight: '600' },
  secondaryButtonText: { color: '#1A1A1B', fontWeight: '600' },
});

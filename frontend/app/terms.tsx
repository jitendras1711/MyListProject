import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/hooks/theme-context';
import { Colors } from '@/constants/theme';

const termsSections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using Atomize, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with any part of these Terms, you may not use our service.'
  },
  {
    title: '2. Description of Service',
    body: 'Atomize is a task and productivity application that allows users to create tasks, organize subtasks, share tasks with friends, and manage personal productivity lists.'
  },
  {
    title: '3. User Accounts',
    body: 'To use certain features of Atomize, you may be required to sign in using Google Authentication. You are responsible for maintaining the confidentiality of your account and for all activity that occurs under your account.'
  },
  {
    title: '4. User Content',
    body: 'You are responsible for the content you create, upload, or share through Atomize. You agree not to post content that is unlawful, harmful, abusive, obscene, or infringes on the rights of others.'
  },
  {
    title: '5. Privacy and Data Use',
    body: 'Your use of Atomize is also governed by our Privacy Policy. By using the service, you consent to the collection and use of your information as described in that policy.'
  },
  {
    title: '6. Prohibited Conduct',
    body: 'You agree not to use the service for any unlawful purpose, attempt to gain unauthorized access to other accounts or systems, interfere with the proper functioning of the service, or share inappropriate or harmful content.'
  },
  {
    title: '7. Intellectual Property',
    body: 'All content, branding, design, and software associated with Atomize remain the property of the service provider unless otherwise stated.'
  },
  {
    title: '8. Limitation of Liability',
    body: 'Atomize is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.'
  },
  {
    title: '9. Termination',
    body: 'We may suspend or terminate your access to Atomize at any time if you violate these Terms or engage in conduct that we believe is harmful to the service or other users.'
  },
  {
    title: '10. Changes to These Terms',
    body: 'We may update these Terms from time to time. Continued use of the service after changes are posted means you accept the updated Terms.'
  },
  {
    title: '11. Governing Law',
    body: 'These Terms are governed by the laws of the jurisdiction in which the service provider operates, without regard to conflict of law principles.'
  },
  {
    title: '12. Contact',
    body: 'If you have any questions about these Terms, please contact us at jitendra.s1711@gmail.com.'
  }
];

export default function TermsScreen() {
  const router = useRouter();
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];
  const isDark = contextTheme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Terms and Conditions</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>Effective Date: July 11, 2026</Text>
        {termsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <Text style={[styles.body, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>{section.body}</Text>
          </View>
        ))}
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
  subtitle: { fontSize: 14, marginBottom: 8 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
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

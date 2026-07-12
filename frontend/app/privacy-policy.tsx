import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/hooks/theme-context';
import { Colors } from '@/constants/theme';

const privacySections = [
  {
    title: '1. Introduction',
    body: 'Welcome to Atomize ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy applies to all information collected through our mobile application, web application, and related services.'
  },
  {
    title: '2. Information We Collect',
    body: 'We collect information that you provide directly to us when you use Atomize. When you sign in using Google Authentication, we collect your name, email address, and profile picture if provided. We also store user content such as tasks, subtasks, social connections, and records of shared tasks.'
  },
  {
    title: '3. How We Use Your Information',
    body: 'We use the information we collect to provide and maintain the service, facilitate task sharing between you and your confirmed friends, identify you to other users when relevant, improve and personalize your experience, and send technical notices or support messages.'
  },
  {
    title: '4. Legal Basis for Processing (GDPR)',
    body: 'If you are located in the European Economic Area (EEA), our legal basis for collecting and using your data includes performance of a contract, consent when you sign in via Google, and legitimate interests such as preventing fraud and improving service security.'
  },
  {
    title: '5. Data Sharing and Disclosure',
    body: 'We do not sell your personal data. We share information only with other users where relevant to the service, with service providers who perform services for us under strict confidentiality, and when required by law or to protect the rights and safety of our users.'
  },
  {
    title: '6. Data Retention and Deletion',
    body: 'We retain your information for as long as your account is active. You may request the deletion of your account and associated data at any time by contacting us. When you delete a task, it is removed from our active databases.'
  },
  {
    title: '7. Your Rights',
    body: 'Depending on your location, you may have the right to access your personal data, request correction of inaccurate information, request deletion of your personal data, and object to processing where applicable.'
  },
  {
    title: '8. Security',
    body: 'We implement commercially reasonable security measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.'
  },
  {
    title: '9. Children\'s Privacy',
    body: 'Atomize does not knowingly collect personal information from anyone under the age of 13. If we learn that we have collected information from a child under 13, we will delete that information as quickly as possible.'
  },
  {
    title: '10. International Data Transfers',
    body: 'Your information may be stored and processed in countries other than your own. By using Atomize, you consent to the transfer of information to countries outside your country of residence, including the United States.'
  },
  {
    title: '11. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of changes by posting the updated Privacy Policy on this page and updating the effective date.'
  },
  {
    title: '12. Contact Us',
    body: 'If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at jitendra.s1711@gmail.com.'
  }
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];
  const isDark = contextTheme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>Effective Date: May 21, 2024</Text>
        {privacySections.map((section) => (
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

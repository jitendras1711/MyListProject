import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeContext } from '@/hooks/theme-context';
import { Colors } from '@/constants/theme';

export default function CalendarNotesPrivacyPolicyScreen() {
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];
  const isDark = contextTheme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Privacy Policy for CalandarNotes</Text>
        <Text style={[styles.meta, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>Last Updated: [Date]</Text>

        <Text style={[styles.paragraph, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>
          CalandarNotes ("the App") is committed to protecting your privacy. This policy explains how we handle your data.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>1. Data Collection and Usage</Text>
        <Text style={[styles.paragraph, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>
          CalandarNotes is designed to be a private-first application.
        </Text>

        <View style={styles.listBlock}>
          <Text style={[styles.bullet, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>• No Personal Information: We do not require you to create an account, provide your name, email address, or any other personally identifiable information (PII) to use the App.</Text>
          <Text style={[styles.bullet, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>• Your Notes: All notes, events, and data you enter into the App are stored locally on your device in a private database. We do not have access to your notes.</Text>
          <Text style={[styles.bullet, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>• Backup Data: If you use the manual "Backup" feature, a JSON file is created locally on your device for the purpose of sharing. This file remains under your control at all times.</Text>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>2. Permissions</Text>
        <Text style={[styles.paragraph, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>
          The App requests the following permissions for specific functionalities:
        </Text>

        <View style={styles.listBlock}>
          <Text style={[styles.bullet, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>• Internet Access & Network State: Used solely to facilitate the "Backup and Restore" sharing feature (e.g., sending a backup via email) and the "Feedback" email feature.</Text>
          <Text style={[styles.bullet, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>• Read Phone State: A legacy permission used for internal device compatibility (no personal call logs or identifying information are accessed).</Text>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>3. Third-Party Services</Text>
        <Text style={[styles.paragraph, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>
          While we do not collect your data directly, the App interacts with the following third-party services:
        </Text>

        <View style={styles.listBlock}>
          <Text style={[styles.bullet, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>• Google Drive (Auto Backup): If you have Android's system-wide "Auto Backup" enabled, a copy of your App data (encrypted by Google) may be stored in your private Google Drive account. We do not have access to this data.</Text>
          <Text style={[styles.bullet, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>• Email Providers: When you use the "Feedback" or "Share Backup" features, you use your own chosen email client.</Text>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>4. Data Retention and Deletion</Text>
        <View style={styles.listBlock}>
          <Text style={[styles.bullet, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>• User Control: You have full control over your data. You can delete individual notes or use the "Delete All Data" feature in the Settings screen to permanently wipe all information from the App's local database.</Text>
          <Text style={[styles.bullet, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>• Uninstallation: If you uninstall the App, your local data will be removed (unless system-wide Auto Backup is enabled on your device).</Text>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>5. Security</Text>
        <Text style={[styles.paragraph, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>
          We take the security of your data seriously. By storing all notes locally on your device, we minimize the risk of data breaches associated with cloud storage. We recommend using a screen lock on your device to prevent unauthorized physical access to your notes.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>6. Changes to This Policy</Text>
        <Text style={[styles.paragraph, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date at the top of this page.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>7. Contact Us</Text>
        <Text style={[styles.paragraph, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>
          If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at: appspandora@gmail.com.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 48,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  meta: {
    fontSize: 14,
    marginBottom: 4,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
  },
  listBlock: {
    gap: 10,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 24,
  },
});

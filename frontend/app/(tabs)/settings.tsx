import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Switch, ScrollView, Linking, Alert, Platform, Image, Text, ActivityIndicator } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useThemeContext } from '@/hooks/theme-context';
import { Colors, Fonts } from '@/constants/theme';
import { getToken, removeToken } from '@/utils/storage';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Constants from 'expo-constants';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AuthSession from 'expo-auth-session';
import { apiRequest } from '@/utils/api';

interface UserInfo {
  name?: string;
  email?: string;
}

export default function SettingsScreen() {
  const { theme, setThemeMode } = useThemeContext();
  const router = useRouter();
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [isDeleting, setIsDeleting] = useState(false);

  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return {};
    }
  };

  const loadUserInfo = useCallback(async () => {
    try {
      const token = await getToken('userToken');
      if (token) {
        const decoded = decodeToken(token);
        setUserInfo({
          name: decoded.name,
          email: decoded.email,
        });
      }
    } catch {
      console.error('Failed to decode token');
    }
  }, []);

  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  const themeColors = Colors[theme];

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.navTitleContainer}>
          <Image source={require('@/assets/images/icon.png')} style={styles.navLogo} />
          <Text style={[styles.navHeader, { color: themeColors.text }]}>Settings</Text>
        </View>
      ),
      headerTitleAlign: 'left',
      headerShadowVisible: false,
      headerStyle: { backgroundColor: themeColors.background },
      headerTintColor: themeColors.text,
    });
  }, [navigation, themeColors]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            const token = await getToken('userToken');
            if (token) {
              if (Platform.OS === 'web') {
                await AuthSession.revokeAsync({ token }, { revocationEndpoint: 'https://oauth2.googleapis.com/revoke' });
              } else {
                await GoogleSignin.signOut();
              }
            }
            await removeToken('userToken');
            router.replace('/login');
          } catch {
            router.replace('/login');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your tasks. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Everything', 
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiRequest('/users/me', { method: 'DELETE' });
              await removeToken('userToken');
              router.replace('/login');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleThemeToggle = (value: boolean) => {
    setThemeMode(value ? 'dark' : 'light');
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open URL');
    });
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const isDark = theme === 'dark';
  const cardBackground = themeColors.card;
  const surfaceBorder = themeColors.border;

  return (
    <ScrollView style={{ backgroundColor: themeColors.background }}>
      <View style={styles.container}>
        {/* User Card */}
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor: surfaceBorder, borderWidth: 1 }]}> 
          <View style={styles.userCardContent}>
            <View style={styles.avatarPlaceholder}>
              <IconSymbol size={40} name="person.circle.fill" color={themeColors.tint} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: themeColors.text }]}>
                {userInfo.name || 'User'}
              </Text>
              <Text style={[styles.userEmail, { color: themeColors.text }]}>
                {userInfo.email || 'Not available'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.logoutButton, isDark ? styles.logoutDark : styles.logoutLight]}
            onPress={handleLogout}
          >
            <IconSymbol size={20} name="rectangle.portrait.and.arrow.right" color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Preferences
          </Text>

          <View style={[styles.settingRow, { backgroundColor: cardBackground, borderColor: surfaceBorder, borderWidth: 1 }]}> 
            <View style={styles.settingLabelContainer}>
              <IconSymbol size={24} name="moon.fill" color={themeColors.icon} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={handleThemeToggle}
              trackColor={{ false: '#767577', true: '#81C784' }}
              thumbColor={theme === 'dark' ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            About
          </Text>

          <View style={[styles.aboutItem, { backgroundColor: cardBackground, borderColor: surfaceBorder, borderWidth: 1 }]}> 
            <Text style={[styles.aboutLabel, { color: themeColors.text }]}>App Version</Text>
            <Text style={[styles.aboutValue, { color: themeColors.text }]}>{appVersion}</Text>
          </View>

          <TouchableOpacity
            style={[styles.linkItem, { backgroundColor: cardBackground, borderColor: surfaceBorder, borderWidth: 1 }]}
            onPress={() => openUrl('https://atomize.app/privacy')}
          >
            <Text style={[styles.linkLabel, { color: themeColors.text }]}>Privacy Policy</Text>
            <IconSymbol size={18} name="chevron.right" color={themeColors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkItem, { backgroundColor: cardBackground, borderColor: surfaceBorder, borderWidth: 1 }]}
            onPress={() => openUrl('mailto:jitendra.s1711@gmail.com')}
          >
            <Text style={[styles.linkLabel, { color: themeColors.text }]}>Support</Text>
            <IconSymbol size={18} name="chevron.right" color={themeColors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkItem, { marginTop: 20 }]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            <Text style={{ color: '#FF3B30', fontSize: 15, fontWeight: '500' }}>Delete Account</Text>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <IconSymbol size={18} name="trash.fill" color="#FF3B30" />}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeColors.text }]}>
            Made with ❤️ by Team Atomize
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  navTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  navHeader: {
    fontSize: 24,
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  cardLight: {
    backgroundColor: '#F5F5F5',
  },
  cardDark: {
    backgroundColor: '#1F242C',
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: Fonts.rounded,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutLight: {
    backgroundColor: '#FFE5E5',
  },
  logoutDark: {
    backgroundColor: '#4C1F1F',
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 8,
    fontFamily: Fonts.rounded,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  rowLight: {
    backgroundColor: '#F5F5F5',
  },
  rowDark: {
    backgroundColor: '#1F242C',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  aboutLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  aboutValue: {
    fontSize: 14,
    opacity: 0.7,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
});

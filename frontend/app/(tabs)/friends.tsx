import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { api } from '@/utils/api';
import { useNavigation } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/hooks/theme-context';

interface User {
  id: string;
  email: string;
  name?: string;
}

const formatUserDisplay = (user: User): string => {
  if (user.name && user.name.trim().length > 0) {
    return `${user.name} <${user.email}>`;
  }
  return user.email;
};

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<{ visible: boolean; friendEmail: string | null }>({ visible: false, friendEmail: null });
  const navigation = useNavigation();
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.navTitleContainer}>
          <Image source={require('@/assets/images/icon.png')} style={styles.navLogo} />
          <Text style={[styles.navHeader, { color: theme.text }]}>Atomize</Text>
        </View>
      ),
      headerTitleAlign: 'left',
      headerShadowVisible: false,
      headerStyle: { backgroundColor: theme.background },
    });
  }, [navigation, theme]);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const response = await api.get('/friends');
      setFriends(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (friendEmail: string) => {
    try {
      await api.post('/friends', { friendEmail });
      loadFriends();
      setSearchResults([]);
      setSearchQuery('');
      Alert.alert('Success', 'Friend added!');
    } catch (error) {
      console.error('Failed to add friend:', error);
      Alert.alert('Error', 'Failed to add friend');
    }
  };

  const removeFriend = async (friendEmail: string) => {
    try {
      await api.delete(`/friends/${encodeURIComponent(friendEmail)}`);
      loadFriends();
      Alert.alert('Success', 'Friend removed!');
    } catch (error) {
      console.error('Failed to remove friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
    }
  };

  const handleRemovePress = (friendEmail: string) => {
    setRemoveConfirm({ visible: true, friendEmail });
  };

  const handleConfirmRemove = async () => {
    if (removeConfirm.friendEmail) {
      await removeFriend(removeConfirm.friendEmail);
    }
    setRemoveConfirm({ visible: false, friendEmail: null });
  };

const renderSearchResult = ({ item }: { item: User }) => {
    const alreadyFriend = friends.some(friend => friend.email.toLowerCase() === item.email.toLowerCase());

    return (
      <View style={[styles.listItem, { borderBottomColor: theme.border }]}> 
        <View style={styles.listItemTextWrapper}>
          <ThemedText style={styles.listItemText}>{formatUserDisplay(item)}</ThemedText>
        </View>
        {alreadyFriend ? (
          <View style={[styles.friendLabel, { borderColor: theme.tint }]}> 
            <Text style={[styles.friendLabelText, { color: theme.tint }]}>Friend</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={() => addFriend(item.email)} style={[styles.addButton, { backgroundColor: theme.tint }]}> 
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFriend = ({ item }: { item: User }) => (
    <View style={[styles.listItem, { borderBottomColor: theme.border }]}>
      <View style={styles.listItemTextWrapper}>
        <ThemedText style={styles.listItemText}>{formatUserDisplay(item)}</ThemedText>
      </View>
      <TouchableOpacity onPress={() => handleRemovePress(item.email)} style={[styles.removeButton, { borderColor: theme.tint }]}> 
        <Text style={[styles.removeButtonText, { color: theme.tint }]}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={{ flex: 1, padding: 20, backgroundColor: theme.background }}>
      <ThemedText type="title">Find Friends</ThemedText>

      <TextInput
        placeholder="Search users by email"
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          searchUsers(text);
        }}
        placeholderTextColor={theme.tabIconDefault}
        style={[styles.searchInput, { color: theme.text, borderColor: theme.tabIconDefault, backgroundColor: theme.card }]}
      />

      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResult}
          style={{ maxHeight: 200, marginBottom: 10 }}
          scrollEnabled={true}
        />
      )}

      <ThemedText type="subtitle" style={{ marginTop: 20 }}>Your Friends</ThemedText>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        ListEmptyComponent={<ThemedText>No friends yet. Search and add some!</ThemedText>}
        scrollEnabled={true}
      />

      <ConfirmationModal
        visible={removeConfirm.visible}
        title="Remove Friend"
        message={`Are you sure you want to remove ${removeConfirm.friendEmail} from your friends list?`}
        confirmText="Remove"
        cancelText="Cancel"
        showCancel={true}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveConfirm({ visible: false, friendEmail: null })}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  navTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLogo: {
    width: 24,
    height: 24,
  },
  navHeader: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    padding: 12,
    borderBottomWidth: 1,
  },
  listItemTextWrapper: {
    flex: 1,
    marginRight: 10,
  },
  listItemText: {
    flexShrink: 1,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  removeButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  friendLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  friendLabelText: {
    fontWeight: '600',
    fontSize: 12,
  },
});
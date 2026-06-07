import { apiRequest } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AuthSession from 'expo-auth-session';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ActivityIndicator
} from 'react-native';
import { Colors } from '@/constants/theme';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import Toast from '@/components/ui/toast';
import { useThemeContext } from '@/hooks/theme-context';
import EmptyState from '@/components/ui/empty-state';
import { getToken, removeToken } from '../../utils/storage'; // Updated path

interface TodoItem {
  id: number;
  title: string;
  isCompleted: boolean;
  sharedCount?: number;
  isOwnedByCurrentUser?: boolean;
  isSharedWithMe?: boolean;
  createdByName?: string;
}

interface Friend {
  id: string;
  email: string;
  name?: string;
}

export default function HomeScreen() {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addModalTitle, setAddModalTitle] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TodoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [originalSelectedFriends, setOriginalSelectedFriends] = useState<string[]>([]);
  const [shareError, setShareError] = useState('');
  const [shareResult, setShareResult] = useState<{ title: string; message: string } | null>(null);
  const [selectedTask, setSelectedTask] = useState<TodoItem | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState<TodoItem | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sharedUsers, setSharedUsers] = useState<Friend[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];
  const isDark = contextTheme === 'dark';
  const router = useRouter();
  const navigation = useNavigation();

  const goToCompletedItems = () => {
    setMenuVisible(false);
    router.push('/completed');
  };

  const openActionMenu = (item: TodoItem) => {
    setSelectedActionItem(item);
    setActionMenuVisible(true);
  };

  const closeActionMenu = () => {
    setActionMenuVisible(false);
    setSelectedActionItem(null);
  };

  const openShareAction = (item: TodoItem) => {
    closeActionMenu();
    handleOpenShare(item);
  };

  const openEditAction = (item: TodoItem) => {
    closeActionMenu();
    handleOpenEdit(item);
  };

  const openToggleAction = async (item: TodoItem) => {
    closeActionMenu();
    await toggleItem(item);
  };

  const openDeleteAction = async (item: TodoItem) => {
    closeActionMenu();
    await deleteItem(item.id);
  };

  const fetchFriends = async () => {
    try {
      const res = await apiRequest('/friends');
      const data = await res.json();
      setFriends(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  };

  const formatFriendDisplay = (friend: Friend): string => {
    if (friend && friend.name) {
      return `${friend.name} <${friend.email || 'no-email'}>`;
    }
    return friend?.email || 'no-email';
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 20 }}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
        </TouchableOpacity>
      ),
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

  const fetchItems = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setFetchError('');
    try {
      const res = await apiRequest('/items');
      const data = await res.json();
      setItems(data.filter((item: TodoItem) => !item.isCompleted));
    } catch (err) {
      console.error(err);
      setFetchError('Unable to load tasks. Check your internet connection or try again later.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchChildItems = async (parentId: number) => {
    const res = await apiRequest(`/items?parentId=${parentId}`);
    return await res.json();
  };

  const getImmediateChildCounts = async (parentId: number) => {
    const children = await fetchChildItems(parentId);
    const completed = children.filter((child: TodoItem) => child.isCompleted).length;
    return {
      completed,
      incomplete: children.length - completed,
    };
  };

  const hasIncompleteDescendants = async (parentId: number) => {
    const queue = [parentId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (currentId === undefined) break;

      const children = await fetchChildItems(currentId);
      for (const child of children) {
        if (!child.isCompleted) {
          return true;
        }
        queue.push(child.id);
      }
    }

    return false;
  };

  const performToggle = async (id: number) => {
    try {
      const res = await apiRequest(`/items/${id}/toggle`, { method: 'PUT' });
      const toggledItem = await res.json();

      if (toggledItem.isCompleted) {
        setItems(prevItems => prevItems.filter(item => item.id !== toggledItem.id));
      } else {
        setItems(prevItems => prevItems.map(item => 
          item.id === toggledItem.id ? toggledItem : item
        ));
      }
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  const requestConfirmation = async (title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmation({
        title,
        message,
        onConfirm: () => {
          resolve(true);
          setConfirmation(null);
        },
        onCancel: () => {
          resolve(false);
          setConfirmation(null);
        },
      });
    });
  };

  const toggleItem = async (item: TodoItem) => {
    if (!item.isCompleted) {
      const hasIncomplete = await hasIncompleteDescendants(item.id);
      if (hasIncomplete) {
        const confirmed = await requestConfirmation(
          'Incomplete subtasks',
          'This task has incomplete subtasks below. Do you still want to mark it complete?'
        );
        if (!confirmed) return;
      }
    }
    await performToggle(item.id);
  };

  const addItem = async () => {
    if (!addModalTitle.trim()) return;
    
    setAddLoading(true);
    try {
      const res = await apiRequest('/items', {
        method: 'POST',
        body: JSON.stringify({ title: addModalTitle, isCompleted: false, parentId: null }),
      });
      const newItem = await res.json();
      
      // Set ownership properties for newly added items
      newItem.isOwnedByCurrentUser = true;
      newItem.isSharedWithMe = false;
      newItem.sharedCount = 0;
      
      setItems(prevItems => [newItem, ...prevItems]);
      setAddModalVisible(false);
      setAddModalTitle('');
      setToastMessage('Task added successfully');
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      setAddLoading(false);
    }
  };

  const handleOpenEdit = (item: TodoItem) => {
    setEditingTask(item);
    setEditTitle(item.title);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editTitle.trim()) return;

    setEditLoading(true);
    try {
      const res = await apiRequest(`/items/${editingTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle }),
      });
      const updatedItem = await res.json();
      
      // Preserve ownership properties from the original item
      updatedItem.isOwnedByCurrentUser = editingTask.isOwnedByCurrentUser;
      updatedItem.isSharedWithMe = editingTask.isSharedWithMe;
      updatedItem.sharedCount = editingTask.sharedCount;
      updatedItem.createdByName = editingTask.createdByName;
      
      setItems(prevItems => prevItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));
      setEditModalVisible(false);
      setEditingTask(null);
      setEditTitle('');
      setToastMessage('Task updated successfully');
    } catch (err) {
      console.error('Edit failed:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const performDelete = async (id: number) => {
    try {
      await apiRequest(`/items/${id}`, { method: 'DELETE' });
      setItems(prevItems => prevItems.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const deleteItem = async (id: number) => {
    const { completed, incomplete } = await getImmediateChildCounts(id);
    const message = completed || incomplete
      ? `This task has ${completed} completed and ${incomplete} incomplete immediate subtasks. Deleting it will also remove those subtasks.`
      : 'Are you sure you want to delete this task?';

    const confirmed = await requestConfirmation('Delete task', message);
    if (!confirmed) return;
    await performDelete(id);
  };

  const handleOpenShare = async (item: TodoItem) => {
    setSelectedTask(item);
    setSelectedFriends([]);
    setOriginalSelectedFriends([]);
    setShareError('');
    setSharedUsers([]);

    try {
      // Fetch users who already have access to this task
      const res = await apiRequest(`/items/${item.id}/shared-users`);
      const sharedUsersList = await res.json();
      setSharedUsers(sharedUsersList);
      
      // Pre-select friends who already have access
      const preSelectedEmails = sharedUsersList
        .map((user: Friend) => user.email)
        .filter((email: string) => 
          friends.some(friend => friend.email.toLowerCase() === email.toLowerCase())
        );
      
      setSelectedFriends(preSelectedEmails);
      setOriginalSelectedFriends(preSelectedEmails);
    } catch (err) {
      console.error('Failed to fetch shared users:', err);
      // Continue anyway - user can still share
    }

    setShareVisible(true);
  };

  const handleShare = async () => {
    if (!selectedTask) return;
    if (selectedFriends.length === 0) {
      setShareError('Select at least one friend to share with.');
      return;
    }

    setShareLoading(true);
    try {
      await apiRequest(`/items/${selectedTask.id}/share`, {
        method: 'POST',
        body: JSON.stringify({ emails: selectedFriends }),
      });

      setShareVisible(false);
      setSelectedFriends([]);
      setOriginalSelectedFriends([]);
      setShareError('');
      setSelectedTask(null);
      setSharedUsers([]);
      setShareResult({
        title: 'Task shared',
        message: `"${selectedTask.title}" was shared successfully.`,
      });
      fetchItems(false);
    } catch (err) {
      console.error('Sharing failed:', err);
      setShareError('Unable to share task. Please check the email and try again.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setMenuVisible(false);
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
  };

  useEffect(() => {
    fetchItems();
    fetchFriends();
  }, []);

  useEffect(() => {
    if (shareVisible) {
      fetchFriends();
    }
  }, [shareVisible]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={[styles.innerContainer, { backgroundColor: theme.background }]}> 
        {/* <View style={styles.headerContainer}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.header}>Atomize</Text>
        </View> */}

        {loading ? (
          <EmptyState
            iconName="hourglass-outline"
            title="Loading your tasks"
            subtitle="Please wait while your tasks are loaded."
          />
        ) : fetchError ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.card }]}> 
            <Text style={[styles.errorTitle, { color: theme.text }]}>Unable to load tasks</Text>
            <Text style={[styles.errorMessage, { color: theme.icon }]}>{fetchError}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.tint }]} onPress={() => fetchItems()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: theme.card }]}> 
                <TouchableOpacity
                  onPress={() => router.push({ pathname: "/task/[id]", params: { id: item.id, parentTitle: item.title } })}
                  style={styles.cardMain}
                >
                  <View style={styles.titleArea}>
                    <Text style={[styles.itemText, { color: theme.text }, item.isCompleted && styles.completed]}>
                      {item.title}
                    </Text>
                    {item.createdByName ? (
                      <Text style={[styles.createdByText, { color: theme.icon }]}>{item.isOwnedByCurrentUser ? 'you' : item.createdByName}</Text>
                    ) : null}
                    {item.sharedCount && item.sharedCount > 0 ? (
                      <View style={[styles.shareInfoContainer, {
                        backgroundColor: item.isSharedWithMe ? '#F5F3FF' : theme.background,
                        borderColor: item.isSharedWithMe ? '#8B5CF6' : theme.tint,
                      }]}> 
                        <Ionicons name="people-outline" size={14} color={item.isSharedWithMe ? '#8B5CF6' : theme.tint} />
                        <Ionicons
                          name={item.isSharedWithMe ? 'arrow-down-outline' : 'arrow-up-outline'}
                          size={14}
                          color={item.isSharedWithMe ? '#8B5CF6' : theme.tint}
                        />
                        <Text style={[styles.shareCountText, { color: item.isSharedWithMe ? '#8B5CF6' : theme.tint }]}>{item.sharedCount}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>

                <View style={styles.actionArea}>
                  {item.isOwnedByCurrentUser && (
                    <Pressable
                      onPress={() => openActionMenu(item)}
                      style={styles.iconBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityLabel="Open task menu"
                    >
                      <Ionicons name="ellipsis-vertical" size={22} color={theme.icon} />
                    </Pressable>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <EmptyState
                iconName="list-outline"
                title="No tasks yet"
                subtitle="Add your first task below"
              />
            }
          />
        )}
      </View>

      {/* Bottom Add Button */}
<TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.tint }]}
        onPress={() => {
          setAddModalTitle('');
          setAddModalVisible(true);
        }}
        accessibilityLabel="Add new task"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <Modal transparent visible={menuVisible} animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.dropdown, { backgroundColor: theme.card }]}> 
            <TouchableOpacity style={styles.menuItem} onPress={goToCompletedItems}>
              <Ionicons name="checkmark-done-outline" size={20} color={theme.tint} />
              <Text style={[styles.menuText, { color: theme.text }]}>Completed Items</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FF4D4D" />
              <Text style={[styles.logoutText, { color: '#FF4D4D' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={actionMenuVisible} animationType="fade">
        <Pressable style={styles.overlay} onPress={closeActionMenu}>
          <Pressable style={[styles.actionMenuContainer, { backgroundColor: theme.card }]} onPress={() => {}}>
            <Text style={[styles.actionMenuTitle, { color: theme.text }]}>Task actions</Text>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => selectedActionItem && openShareAction(selectedActionItem)}
            >
              <Ionicons name="share-outline" size={20} color={theme.icon} />
              <View style={styles.actionMenuTextGroup}>
                <Text style={[styles.actionMenuLabel, { color: theme.text }]}>Share task</Text>
                <Text style={[styles.actionMenuDescription, { color: theme.icon }]}>Share with friends</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => selectedActionItem && openEditAction(selectedActionItem)}
            >
              <Ionicons name="pencil-outline" size={20} color={theme.icon} />
              <View style={styles.actionMenuTextGroup}>
                <Text style={[styles.actionMenuLabel, { color: theme.text }]}>Edit task</Text>
                <Text style={[styles.actionMenuDescription, { color: theme.icon }]}>Rename this task</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => selectedActionItem && openToggleAction(selectedActionItem)}
            >
              <Ionicons name="checkbox-outline" size={20} color={theme.icon} />
              <View style={styles.actionMenuTextGroup}>
                <Text style={[styles.actionMenuLabel, { color: theme.text }]}>Toggle complete</Text>
                <Text style={[styles.actionMenuDescription, { color: theme.icon }]}>Mark complete or incomplete</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => selectedActionItem && openDeleteAction(selectedActionItem)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF4D4D" />
              <View style={styles.actionMenuTextGroup}>
                <Text style={[styles.actionMenuLabel, { color: theme.text }]}>Delete task</Text>
                <Text style={[styles.actionMenuDescription, { color: theme.icon }]}>Remove this task</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={shareVisible} animationType="fade">
        <Pressable style={styles.overlay} onPress={() => {
          setShareVisible(false);
          setSelectedFriends([]);
          setOriginalSelectedFriends([]);
          setShareError('');
          setSharedUsers([]);
        }}>
          <Pressable style={[styles.shareModalContainer, { backgroundColor: theme.card }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Share task</Text>
            {selectedTask?.isOwnedByCurrentUser ? (
              <>
                <Text style={[styles.modalSubtitle, { color: theme.text }]}>Share &quot;{selectedTask?.title}&quot; with your friends.</Text>
                <Text style={[styles.shareNote, { color: theme.text }]}>Select friends to share with:</Text>
                {friends.length > 0 ? (
                  <View style={styles.shareFriendList}>
                    {friends.map((friend) => {
                      const isSelected = selectedFriends.includes(friend.email);
                      return (
                        <TouchableOpacity
                          key={friend.id}
                          style={[
                            styles.friendBadge,
                            {
                              borderColor: theme.tint,
                              backgroundColor: isSelected ? theme.tint : 'transparent',
                            },
                          ]}
                          onPress={() => {
                            setSelectedFriends(prev =>
                              isSelected
                                ? prev.filter(email => email !== friend.email)
                                : [...prev, friend.email]
                            );
                            setShareError('');
                          }}
                        >
                          <Text style={[
                            styles.friendBadgeText,
                            { color: isSelected ? '#FFF' : theme.text }
                          ]}>
                            {formatFriendDisplay(friend)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={[styles.shareNote, { color: theme.text }]}>Add friends first from the Friends tab.</Text>
                )}
                {selectedFriends.length > 0 && (
                  <Text style={[styles.shareNote, { color: theme.text }]}>
                    Selected: {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''}
                  </Text>
                )}
                {shareError ? <Text style={styles.shareError}>{shareError}</Text> : null}
              </>
            ) : (
              <>
                <Text style={[styles.modalSubtitle, { color: theme.text }]}>This task is shared with:</Text>
                {sharedUsers.length > 0 ? (
                  <View style={styles.shareFriendList}>
                    {sharedUsers.map((user) => (
                      <View
                        key={user.id}
                        style={[
                          styles.friendBadge,
                          {
                            borderColor: theme.tint,
                            backgroundColor: 'transparent',
                            opacity: 0.7,
                          },
                        ]}
                      >
                        <Text style={[
                          styles.friendBadgeText,
                          { color: theme.text }
                        ]}>
                          {formatFriendDisplay(user)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.shareNote, { color: theme.text }]}>Not shared with anyone.</Text>
                )}
              </>
            )}
            <View style={styles.shareActionRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.border }]}
                onPress={() => {
                  setShareVisible(false);
                  setSelectedFriends([]);
                  setOriginalSelectedFriends([]);
                  setShareError('');
                  setSharedUsers([]);
                }}
                disabled={shareLoading}
              >
                <Text style={{ color: theme.text, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
              {selectedTask?.isOwnedByCurrentUser && (
                <TouchableOpacity 
                  style={[
                    styles.modalButton,
                    { backgroundColor: '#4361EE' },
                    (JSON.stringify(selectedFriends) === JSON.stringify(originalSelectedFriends) || shareLoading) && styles.disabledButton
                  ]} 
                  onPress={handleShare}
                  disabled={JSON.stringify(selectedFriends) === JSON.stringify(originalSelectedFriends) || shareLoading}
                >
                  {shareLoading && <ActivityIndicator size="small" color="white" style={styles.buttonLoader} />}
                  <Text style={{ color: 'white', fontWeight: '600' }}>Share</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmationModal
        visible={!!shareResult}
        title={shareResult?.title ?? ''}
        message={shareResult?.message ?? ''}
        confirmText="OK"
        showCancel={false}
        onConfirm={() => setShareResult(null)}
        onCancel={() => setShareResult(null)}
      />

      <ConfirmationModal
        visible={!!confirmation}
        title={confirmation?.title ?? ''}
        message={confirmation?.message ?? ''}
        onConfirm={confirmation?.onConfirm ?? (() => {})}
        onCancel={confirmation?.onCancel ?? (() => {})}
      />

      {/* Add Task Modal */}
      <Modal transparent visible={addModalVisible} animationType="fade">
        <Pressable style={styles.overlay} onPress={() => {
          setAddModalVisible(false);
          setAddModalTitle('');
        }}>
          <Pressable style={[styles.modalContainer, { backgroundColor: theme.card }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Task</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Enter task title..."
              placeholderTextColor={isDark ? '#9DA5B2' : '#999'}
              value={addModalTitle}
              onChangeText={setAddModalTitle}
              autoFocus
              maxLength={150}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.border }]} 
                onPress={() => {
                  setAddModalVisible(false);
                  setAddModalTitle('');
                }}
                disabled={addLoading}
              >
                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#4361EE' }, addLoading && styles.disabledButton]}
                disabled={!addModalTitle.trim() || addLoading}
                onPress={addItem}
              >
                {addLoading && <ActivityIndicator size="small" color="white" style={styles.buttonLoader} />}
                <Text style={{ color: 'white', fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Task Modal */}
      <Modal transparent visible={editModalVisible} animationType="fade">
        <Pressable style={styles.overlay} onPress={() => {
          setEditModalVisible(false);
          setEditingTask(null);
          setEditTitle('');
        }}>
          <Pressable style={[styles.modalContainer, { backgroundColor: theme.card }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Task</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Enter task title..."
              placeholderTextColor={isDark ? '#9DA5B2' : '#999'}
              value={editTitle}
              onChangeText={setEditTitle}
              autoFocus
              maxLength={150}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.border }]} 
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingTask(null);
                  setEditTitle('');
                }}
                disabled={editLoading}
              >
                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#4361EE' }, (editLoading || editTitle === editingTask?.title || !editTitle.trim()) && styles.disabledButton]}
                disabled={!editTitle.trim() || editTitle === editingTask?.title || editLoading}
                onPress={handleSaveEdit}
              >
                {editLoading && <ActivityIndicator size="small" color="white" style={styles.buttonLoader} />}
                <Text style={{ color: 'white', fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Toast
        message={toastMessage}
        visible={!!toastMessage}
        onHide={() => setToastMessage('')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  innerContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 40 : 20, // More padding on web for readability
  },
  navTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  navHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1B',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingTop: 20,
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  header: { fontSize: 32, fontWeight: '800', color: '#1A1A1B', letterSpacing: -1 },
  listContainer: {
    paddingBottom: 120, // Space for bottom input
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6C757D',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ADB5BD',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
    paddingBottom: Platform.OS === 'ios' ? 90 : 16, // Account for tab bar
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 22,
    right: Platform.OS === 'web' ? 40 : 22,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: '#4361EE',
  },
  inputContainer: { flexDirection: 'row', gap: 12 },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 18,
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  button: {
    backgroundColor: '#4361EE',
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    minHeight: 72, // Fixed minimum height
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  itemText: { fontSize: 17, color: '#1A1A1B', fontWeight: '500' },
  shareInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  shareCountText: { fontSize: 12, fontWeight: '700' },
  createdByText: { fontSize: 12, marginTop: 4 },
  completed: { textDecorationLine: 'line-through', color: '#ADB5BD' },
  actionArea: { 
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row', 
    gap: 8,
    alignItems: 'center',
  },
  iconBtn: { padding: 8 },
  actionMenuContainer: {
    width: '85%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    elevation: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
  },
  actionMenuTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  actionMenuTextGroup: {
    flex: 1,
  },
  actionMenuLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionMenuDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  footerText: { textAlign: 'center', color: '#ADB5BD', fontSize: 13, marginVertical: 20, fontStyle: 'italic' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.05)' },
  dropdown: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  menuText: { fontSize: 16, fontWeight: '600' },
  logoutText: { color: '#FF4D4D', fontWeight: '700' },
  shareModalContainer: {
    width: '85%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  cancelActionBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  confirmShareBtn: { backgroundColor: '#4361EE', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  disabledButton: { backgroundColor: '#CCCCCC', opacity: 0.6 },
  disabledButtonText: { opacity: 0.6 },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  modalInput: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
  },
  buttonLoader: {
    position: 'absolute',
    left: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, marginBottom: 18, lineHeight: 20 },
  shareInput: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 12,
  },
  shareNote: {
    fontSize: 13,
    marginBottom: 10,
  },
  shareFriendList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  friendBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  friendBadgeText: {
    fontSize: 13,
  },
  shareError: {
    color: '#FF4D4D',
    marginBottom: 12,
    fontSize: 13,
  },
  shareActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  shareCancelText: { fontSize: 16, fontWeight: '600' },
  shareButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  errorContainer: {
    padding: 24,
    borderRadius: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    alignItems: 'center',
  },
  errorTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  errorMessage: { fontSize: 15, lineHeight: 22, marginBottom: 18, textAlign: 'center' },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  retryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
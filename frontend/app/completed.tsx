import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { useThemeContext } from '@/hooks/theme-context';
import EmptyState from '@/components/ui/empty-state';
import { apiRequest } from '@/utils/api';

interface TodoItem {
  id: number;
  title: string;
  isCompleted: boolean;
  createdByName?: string;
}

export default function CompletedItemsScreen() {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);
  const router = useRouter();
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];
  const isDark = contextTheme === 'dark';

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await apiRequest('/items');
      const data = await res.json();
      setItems(data.filter((item: TodoItem) => item.isCompleted));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleItem = async (item: TodoItem) => {
    try {
      await apiRequest(`/items/${item.id}/toggle`, { method: 'PUT' });
      await fetchItems();
      router.replace('/');
    } catch (err) {
      console.error('Error toggling item:', err);
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

  const deleteItem = async (id: number) => {
    const { completed, incomplete } = await getImmediateChildCounts(id);
    const message = completed || incomplete
      ? `This task has ${completed} completed and ${incomplete} incomplete immediate subtasks. Deleting it will also remove those subtasks.`
      : 'Are you sure you want to delete this task?';

    const confirmed = await requestConfirmation('Delete task', message);
    if (!confirmed) return;

    try {
      await apiRequest(`/items/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <Stack.Screen
        options={{
          title: 'Completed Items',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.background },
          headerTitleStyle: { fontWeight: '700', color: theme.text },
          headerBackTitle: 'Back',
        }}
      />

      <View style={styles.innerContainer}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.card }]}> 
              <Pressable
                onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id, parentTitle: item.title } })}
                style={styles.cardMain}
              >
                <Ionicons
                  name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={item.isCompleted ? '#2EC4B6' : isDark ? '#E9ECEF' : '#6C757D'}
                />
                <Text style={[styles.itemText, { color: theme.text }, item.isCompleted && styles.completed]}>
                  {item.title}
                </Text>
              </Pressable>

              <View style={styles.actionArea}>
                <Pressable
                  onPress={() => toggleItem(item)}
                  style={styles.iconBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Mark incomplete"
                >
                  <Ionicons name="refresh-outline" size={20} color="#4361EE" />
                </Pressable>
                <Pressable
                  onPress={() => deleteItem(item.id)}
                  style={styles.iconBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Delete completed task"
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4D4D" />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              iconName="checkmark-done-circle-outline"
              title="No completed items yet"
              subtitle="Completed tasks will appear here"
            />
          }
        />
      </View>
      <ConfirmationModal
        visible={!!confirmation}
        title={confirmation?.title ?? ''}
        message={confirmation?.message ?? ''}
        onConfirm={confirmation?.onConfirm ?? (() => {})}
        onCancel={confirmation?.onCancel ?? (() => {})}
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
    paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
  },
  listContainer: {
    paddingBottom: 120,
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
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemText: { fontSize: 17, color: '#1A1A1B', fontWeight: '500' },
  completed: { textDecorationLine: 'line-through', color: '#ADB5BD' },
  actionArea: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8 },
});

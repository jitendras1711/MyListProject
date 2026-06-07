import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import EmptyState from '@/components/ui/empty-state';
import Toast from '@/components/ui/toast';
import { apiRequest } from '../../utils/api';
import { useThemeContext } from '@/hooks/theme-context';
import { Colors } from '@/constants/theme';

interface TodoItem {
    id: number;
    title: string;
    isCompleted: boolean;
    parentId?: number;
    createdByName?: string;
    isOwnedByCurrentUser?: boolean;
}

export default function SubTaskScreen() {
    const { id, parentTitle, grandparentTitle } = useLocalSearchParams();
    const taskId = Number(id);
    const router = useRouter();
    const { theme: contextTheme } = useThemeContext();
    const theme = Colors[contextTheme];
    const isDark = contextTheme === 'dark';

    const [items, setItems] = useState<TodoItem[]>([]);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [addModalTitle, setAddModalTitle] = useState('');
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<TodoItem | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [actionMenuVisible, setActionMenuVisible] = useState(false);
    const [selectedActionItem, setSelectedActionItem] = useState<TodoItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [addLoading, setAddLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [confirmation, setConfirmation] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        onCancel: () => void;
    } | null>(null);

    const backLabel = grandparentTitle ? `Back to ${grandparentTitle}` : 'Back to Home';

    const fetchSubTasks = useCallback(async () => {
        if (!taskId) return;

        setLoading(true);
        try {
            const res = await apiRequest(`/items?parentId=${taskId}`);
            const data = await res.json();
            setItems(data);
        } catch (err) {
            console.error('Error fetching subtasks:', err);
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchSubTasks();
    }, [fetchSubTasks]);

    const openActionMenu = (item: TodoItem) => {
        setSelectedActionItem(item);
        setActionMenuVisible(true);
    };

    const closeActionMenu = () => {
        setActionMenuVisible(false);
        setSelectedActionItem(null);
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

    const addSubTask = async () => {
        if (!addModalTitle.trim() || !taskId) return;

        setAddLoading(true);
        try {
            const res = await apiRequest('/items', {
                method: 'POST',
                body: JSON.stringify({
                    title: addModalTitle,
                    isCompleted: false,
                    parentId: taskId,
                }),
            });
            const newItem = await res.json();
            
            // Set ownership properties for newly added subtasks
            newItem.isOwnedByCurrentUser = true;
            
            setItems(prevItems => [newItem, ...prevItems]);
            setAddModalVisible(false);
            setAddModalTitle('');
            setToastMessage('Subtask added successfully');
        } catch (error) {
            console.error('Error adding subtask:', error);
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
            updatedItem.createdByName = editingTask.createdByName;
            
            setItems(prevItems => prevItems.map(item => 
                item.id === updatedItem.id ? updatedItem : item
            ));
            setEditModalVisible(false);
            setEditingTask(null);
            setEditTitle('');
            setToastMessage('Subtask updated successfully');
        } catch (err) {
            console.error('Edit failed:', err);
        } finally {
            setEditLoading(false);
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

    const performToggle = async (itemId: number) => {
        try {
            const res = await apiRequest(`/items/${itemId}/toggle`, { method: 'PUT' });
            const toggledItem = await res.json();
            setItems(prevItems => prevItems.map(item => 
                item.id === toggledItem.id ? toggledItem : item
            ));
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


    const deleteItem = async (itemId: number) => {
        const { completed, incomplete } = await getImmediateChildCounts(itemId);
        const message = completed || incomplete
            ? `This subtask has ${completed} completed and ${incomplete} incomplete immediate subtasks. Deleting it will also remove those subtasks.`
            : 'Are you sure you want to delete this subtask?';

        const confirmed = await requestConfirmation('Delete subtask', message);
        if (!confirmed) return;

        try {
            await apiRequest(`/items/${itemId}`, { method: 'DELETE' });
            setItems(prevItems => prevItems.filter(item => item.id !== itemId));
        } catch (err) {
            console.error('Error deleting item:', err);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}> 
            <Stack.Screen options={{
                title: parentTitle ? (parentTitle as string) : "Subtasks",
                headerShadowVisible: false,
                headerStyle: { backgroundColor: theme.background },
                headerTitleStyle: { fontWeight: '700', color: theme.text },
                headerBackTitle: 'Back'
            }} />

            <View style={styles.innerContainer}>
                <TouchableOpacity
                    style={styles.contextContainer}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    
                </TouchableOpacity>

                {/* Minimalist Input Card */}
                {loading ? (
                    <EmptyState
                        iconName="hourglass-outline"
                        title="Loading your subtasks"
                        subtitle="Please wait while your subtasks are loaded."
                    />
                ) : (
                    <FlatList
                        data={items}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        renderItem={({ item }) => (
                            <View style={[styles.card, { backgroundColor: theme.card }]}> 
                                <TouchableOpacity
                                    onPress={() => router.push({
                                        pathname: "/task/[id]",
                                        params: {
                                            id: item.id,
                                            parentTitle: item.title,
                                            grandparentTitle: parentTitle
                                        }
                                    })}
                                    style={styles.cardMain}
                                >
                                    <Text style={[styles.itemText, { color: theme.text }, item.isCompleted && styles.completed]}>
                                        {item.title}
                                    </Text>
                                    <Text style={[styles.createdByText, { color: theme.text }]}>
                                        {item.createdByName ? `by ${item.createdByName}` : ''}
                                    </Text>
                                </TouchableOpacity>

                                <View style={styles.actionArea}>
                                    {item.isOwnedByCurrentUser && (
                                        <Pressable
                                            onPress={() => openActionMenu(item)}
                                            style={styles.iconBtn}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            accessibilityLabel="Open subtask menu"
                                        >
                                            <Ionicons name="ellipsis-vertical" size={22} color="#4361EE" />
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <EmptyState
                                iconName="list-outline"
                                title="No subtasks yet"
                                subtitle="Add your first subtask below"
                            />
                        }
                    />
                )}
            </View>

<TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.tint }]}
                onPress={() => {
                    setAddModalTitle('');
                    setAddModalVisible(true);
                }}
                accessibilityLabel="Add new subtask"
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>

            <ConfirmationModal
                visible={!!confirmation}
                title={confirmation?.title ?? ''}
                message={confirmation?.message ?? ''}
                onConfirm={confirmation?.onConfirm ?? (() => {})}
                onCancel={confirmation?.onCancel ?? (() => {})}
            />

            <Modal transparent visible={addModalVisible} animationType="fade">
                <Pressable style={styles.overlay} onPress={() => {
                    setAddModalVisible(false);
                    setAddModalTitle('');
                }}>
                    <Pressable style={[styles.modalContainer, { backgroundColor: theme.card }]} onPress={() => {}}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Subtask</Text>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                            placeholder="Enter subtask title..."
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
                                onPress={addSubTask}
                            >
                                {addLoading && <ActivityIndicator size="small" color="white" style={styles.buttonLoader} />}
                                <Text style={{ color: 'white', fontWeight: '600' }}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal transparent visible={actionMenuVisible} animationType="fade">
                <Pressable style={styles.overlay} onPress={closeActionMenu}>
                    <Pressable style={[styles.actionMenuContainer, { backgroundColor: theme.card }]} onPress={() => {}}>
                        <Text style={[styles.actionMenuTitle, { color: theme.text }]}>Subtask actions</Text>
                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={() => selectedActionItem && openEditAction(selectedActionItem)}
                        >
                            <Ionicons name="pencil-outline" size={20} color={theme.icon} />
                            <View style={styles.actionMenuTextGroup}>
                                <Text style={[styles.actionMenuLabel, { color: theme.text }]}>Edit subtask</Text>
                                <Text style={[styles.actionMenuDescription, { color: theme.icon }]}>Rename this subtask</Text>
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
                                <Text style={[styles.actionMenuLabel, { color: theme.text }]}>Delete subtask</Text>
                                <Text style={[styles.actionMenuDescription, { color: theme.icon }]}>Remove this subtask</Text>
                            </View>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal transparent visible={editModalVisible} animationType="fade">
                <Pressable style={styles.overlay} onPress={() => {
                    setEditModalVisible(false);
                    setEditingTask(null);
                    setEditTitle('');
                }}>
                    <Pressable style={[styles.modalContainer, { backgroundColor: theme.card }]} onPress={() => {}}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Subtask</Text>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                            placeholder="Enter subtask title..."
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
        paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
    },
    listContainer: {
        paddingBottom: 140,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    breadcrumbContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 10,
    },
    breadcrumbText: {
        fontSize: 13,
        color: '#6C757D',
        fontWeight: '500',
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        gap: 12,
    },
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
    cardMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    itemText: { fontSize: 16, color: '#1A1A1B', fontWeight: '500' },
    createdByText: { fontSize: 12, color: '#6C757D', fontWeight: '400', marginTop: 2 },
    completed: { textDecorationLine: 'line-through', color: '#ADB5BD' },
    actionArea: { 
        position: 'absolute',
        right: 16,
        top: 16,
        flexDirection: 'row', 
        gap: 4,
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
    contextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 10,
        alignSelf: 'flex-start', // Ensures only the text is clickable, not the whole row width
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#F8F9FA',
        paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
        paddingBottom: Platform.OS === 'ios' ? 90 : 16,
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
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
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 10,
    },
    disabledButton: {
        backgroundColor: '#CCCCCC',
        opacity: 0.6,
    },
});

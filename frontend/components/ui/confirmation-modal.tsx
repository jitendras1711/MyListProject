import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/hooks/theme-context';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  showCancel = true,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.icon }]}>{message}</Text>
          <View style={styles.buttonRow}>
            {showCancel ? (
              <Pressable style={[styles.button, styles.cancelButton, { backgroundColor: contextTheme === 'dark' ? theme.card : '#F1F3F5' }]} onPress={onCancel}>
                <Text style={[styles.buttonText, styles.cancelText, { color: theme.text }]}>{cancelText}</Text>
              </Pressable>
            ) : null}
            <Pressable style={[styles.button, styles.confirmButton, !showCancel ? styles.singleButton : null]} onPress={onConfirm}>
              <Text style={[styles.buttonText, styles.confirmText]}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1B',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#495057',
    marginBottom: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minWidth: 96,
    alignItems: 'center',
  },
  singleButton: {
    minWidth: 160,
  },
  cancelButton: {
    backgroundColor: '#F1F3F5',
  },
  confirmButton: {
    backgroundColor: '#4361EE',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cancelText: {
    color: '#495057',
  },
  confirmText: {
    color: '#FFFFFF',
  },
});

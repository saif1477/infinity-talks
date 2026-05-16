import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

interface Session {
  id: string;
  created_at: string;
  preview: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  pastSessions: Session[];
  activeSessionId: string;
  pinnedSessions: string[];
  onStartNewChat: () => void;
  onLoadSession: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  pastSessions,
  activeSessionId,
  pinnedSessions,
  onStartNewChat,
  onLoadSession,
  onTogglePin,
  onDeleteSession,
}) => {
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <View style={styles.sidebar}>
      <Pressable style={styles.newChatBtn} onPress={onStartNewChat}>
        <Ionicons name="add" size={20} color={Colors.textPrimary} />
        <Text style={styles.newChatText}>New Chat</Text>
      </Pressable>
      
      <Text style={styles.historyTitle}>History</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {pastSessions.map(sess => {
          const isPinned = pinnedSessions.includes(sess.id);
          const isHovered = hoveredSessionId === sess.id;
          
          return (
            <View 
              key={sess.id}
              // @ts-ignore
              onMouseEnter={() => setHoveredSessionId(sess.id)}
              onMouseLeave={() => setHoveredSessionId(null)}
              style={{ zIndex: activeMenuId === sess.id ? 1000 : 1 }}
            >
              <Pressable 
                style={[styles.historyItem, activeSessionId === sess.id && styles.historyItemActive]}
                onPress={() => onLoadSession(sess.id)}
              >
                <View style={styles.historyItemMain}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.historyItemHeader}>
                      {isPinned && <Ionicons name="pin" size={12} color={Colors.accentPurple} style={{ marginRight: 4 }} />}
                      <Text style={styles.historyItemDate}>{sess.created_at}</Text>
                    </View>
                    <Text style={styles.historyItemPreview} numberOfLines={1}>{sess.preview}</Text>
                  </View>
                  
                  {(isHovered || activeMenuId === sess.id) && (
                    <Pressable 
                      onPress={() => setActiveMenuId(activeMenuId === sess.id ? null : sess.id)}
                      style={styles.kebabBtn}
                    >
                      <Ionicons name="ellipsis-vertical" size={16} color={Colors.textSecondary} />
                    </Pressable>
                  )}
                </View>
              </Pressable>

              {activeMenuId === sess.id && (
                <View style={styles.menuOverlay}>
                  <Pressable style={styles.menuItem} onPress={() => { onTogglePin(sess.id); setActiveMenuId(null); }}>
                    <Ionicons name={isPinned ? "pin-outline" : "pin"} size={16} color={Colors.textPrimary} />
                    <Text style={styles.menuItemText}>{isPinned ? 'Unpin' : 'Pin'}</Text>
                  </Pressable>
                  <Pressable style={styles.menuItem} onPress={() => { onDeleteSession(sess.id); setActiveMenuId(null); }}>
                    <Ionicons name="trash-outline" size={16} color={Colors.accentRed} />
                    <Text style={[styles.menuItemText, { color: Colors.accentRed }]}>Delete</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.divider,
    padding: Spacing.md,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  newChatText: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  historyTitle: {
    ...Typography.label,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  historyItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  historyItemActive: {
    backgroundColor: Colors.backgroundSecondary,
  },
  historyItemMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  historyItemPreview: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  kebabBtn: {
    padding: 4,
    marginLeft: 4,
  },
  menuOverlay: {
    position: 'absolute',
    right: 8,
    top: 40,
    backgroundColor: '#1E1E1E',
    borderRadius: BorderRadius.md,
    padding: 4,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    minWidth: 120,
    ...Shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  menuItemText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
});

export default ChatSidebar;

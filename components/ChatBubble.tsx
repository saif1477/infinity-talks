import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Message, Expert } from '../data/experts';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  message: Message;
  expert: Expert;
  index: number;
  onEdit?: (message: Message) => void;
  userAvatar?: string | null;
}

export default function ChatBubble({ message, expert, index, onEdit, userAvatar }: Props) {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<any>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 350, delay: index * 100, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 350, delay: index * 100, useNativeDriver: true,
      }),
    ]).start();
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  const handleHoverIn = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(true);
  };

  const handleHoverOut = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 200); // 200ms grace period
  };

  if (isUser) {
    return (
      <Pressable 
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        style={styles.userRowContainer}
      >
        <Animated.View style={[
          styles.userRow,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
        ]}>
          <View style={styles.userBubbleContainer}>
            {isHovered && onEdit && (
              <Pressable 
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit(message);
                }}
                hitSlop={10}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={14} color={Colors.textTertiary} />
              </Pressable>
            )}
            <View style={styles.userBubbleWrap}>
              <LinearGradient
                colors={[Colors.bubbleUser, Colors.bubbleUserEnd]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.userBubble}
              >
                <Text style={styles.userText}>{message.content}</Text>
              </LinearGradient>
              <Text style={[styles.timestamp, styles.timestampRight]}>{message.timestamp}</Text>
            </View>
            <View style={styles.userAvatarWrap}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.userAvatar} />
              ) : (
                <View style={styles.userAvatarPlaceholder}>
                  <Ionicons name="person" size={14} color="#FFF" />
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[
      styles.expertRow,
      { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
    ]}>
      <View style={styles.expertAvatarWrap}>
        <Image source={expert.avatar} style={styles.expertAvatar} resizeMode="cover" />
      </View>
      <View style={styles.expertBubbleWrap}>
        <View style={[styles.expertBubble, { borderColor: expert.color + '20' }]}>
          <Text style={styles.expertText}>{message.content}</Text>
        </View>
        <Text style={styles.timestamp}>{message.timestamp}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  userRowContainer: {
    width: '100%',
  },
  userRow: { alignItems: 'flex-end', marginBottom: Spacing.md, paddingLeft: 12 },
  userBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userBubbleWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginLeft: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  userAvatar: {
    width: '100%',
    height: '100%',
  },
  userAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    marginRight: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: '#2A2A2A', // Solid background
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    zIndex: 50,
  },
  userBubble: {
    borderRadius: BorderRadius.lg, borderBottomRightRadius: 4,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    maxWidth: '100%',
  },
  userText: { ...Typography.body, color: '#FFFFFF' },
  expertRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    marginBottom: Spacing.md, paddingRight: 48,
  },
  expertAvatarWrap: {
    width: 32, height: 32, borderRadius: 16, overflow: 'hidden',
    marginRight: Spacing.sm, backgroundColor: Colors.surface,
  },
  expertAvatar: { width: '100%', height: '100%' },
  expertBubbleWrap: { flex: 1 },
  expertBubble: {
    backgroundColor: Colors.bubbleExpert,
    borderRadius: BorderRadius.lg, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.bubbleExpertBorder,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  expertText: { ...Typography.body, color: Colors.textPrimary },
  timestamp: {
    ...Typography.caption, color: Colors.textTertiary,
    marginTop: 4, marginLeft: 4,
  },
  timestampRight: { marginRight: 4, textAlign: 'right' },
});

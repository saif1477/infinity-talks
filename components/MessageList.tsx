import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import ChatBubble from './ChatBubble';
import { ChatMessage } from '../hooks/useChatSession';
import { Expert } from '../data/experts';
import { Spacing } from '../constants/theme';

interface MessageListProps {
  messages: ChatMessage[];
  expert: Expert;
  userAvatar: string | null;
}

const MessageList: React.FC<MessageListProps> = ({ messages, expert, userAvatar }) => {
  const flashListRef = useRef<FlashList<ChatMessage>>(null);

  useEffect(() => {
    if (messages.length > 0) {
      flashListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const bubbleMsg = {
      id: item.id,
      role: item.role as 'user' | 'expert',
      content: item.content,
      timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    return (
      <ChatBubble 
        message={bubbleMsg} 
        expert={expert} 
        index={index} 
        userAvatar={userAvatar}
      />
    );
  };

  const displayMessages = messages.filter(m => m.role !== 'system');

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={displayMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        estimatedItemSize={100}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
});

export default MessageList;

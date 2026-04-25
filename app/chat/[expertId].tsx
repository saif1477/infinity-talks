import React, { useRef, useEffect, useState } from 'react';
import {
  View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getExpertById } from '../../data/experts';
import ExpertHeader from '../../components/ExpertHeader';
import ChatBubble from '../../components/ChatBubble';
import ChatInput from '../../components/ChatInput';
import { Colors, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { modelManager } from '../../services/ModelManager';

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'expert';
  content: string;
  created_at: string;
  expert_id: string;
  user_id?: string;
  session_id?: string;
}

// Helper to generate a simple UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function ChatScreen() {
  const { expertId } = useLocalSearchParams<{ expertId: string }>();
  const expert = getExpertById(expertId ?? '');
  const flatListRef = useRef<FlatList>(null);
  
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create a new session ID when the chat screen mounts
  const sessionId = useRef(generateUUID()).current;

  useEffect(() => {
    if (!session) {
      router.replace('/auth');
      return;
    }

    const initChat = async () => {
      // First, fetch messages for this specific session
      // (Since it's a new UUID every time you open the screen, this will be empty, 
      // giving us a "Fresh Start" each time. If you wanted to load past chats, 
      // you would pass an existing sessionId instead of generating a new one).
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('expert_id', expertId)
        .eq('user_id', session.user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setMessages(data as ChatMessage[]);
      } else {
        // New session: Inject the System Prompt
        // Set timestamp to 1ms before current time so it's always index 0
        const systemDate = new Date();
        systemDate.setMilliseconds(systemDate.getMilliseconds() - 1);
        
        const systemMsg: Partial<ChatMessage> = {
          content: expert?.systemPrompt || '',
          role: 'system',
          expert_id: expert?.id || '',
          user_id: session.user.id,
          session_id: sessionId,
          created_at: systemDate.toISOString(),
        };

        // We don't add the system message to local state so the UI doesn't flicker it
        await supabase.from('messages').insert([systemMsg]);
        
        // Add the intro message to the UI locally (we'll save it to DB when they reply, or right now)
        const introMsg = {
          id: Math.random().toString(),
          content: expert?.introMessage || '',
          role: 'expert',
          expert_id: expert?.id || '',
          user_id: session.user.id,
          session_id: sessionId,
          created_at: new Date().toISOString(),
        };
        setMessages([introMsg as ChatMessage]);
        await supabase.from('messages').insert([{
           content: introMsg.content, role: introMsg.role, expert_id: introMsg.expert_id, user_id: introMsg.user_id, session_id: introMsg.session_id, created_at: introMsg.created_at
        }]);
      }
      setLoading(false);
    };

    initChat();
  }, [expertId, session]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  if (!expert) {
    return <View style={styles.screen} />;
  }

  const handleSend = async (text: string, imageUri?: string) => {
    if (!session) return;

    // Check if model is loaded
    if (!modelManager.isReady()) {
      const lastErr = modelManager.getLastError();
      if (lastErr) {
        alert(`Model Error: ${lastErr}\n\nPlease try selecting a model from the ∞ menu.`);
      } else {
        alert("No AI model loaded yet.\n\nTap the ∞ (infinity) symbol below to select and load a model first.");
      }
      return;
    }

    // 1. Create a local temporary message object
    const displayContent = imageUri ? `[Image Attached]\n${text}` : text;
    
    const userMessage: ChatMessage = {
      id: Math.random().toString(), // temp ID
      content: displayContent,
      role: 'user',
      expert_id: expert.id,
      created_at: new Date().toISOString(),
      user_id: session.user.id,
      session_id: sessionId,
    };

    // 2. Push to UI immediately (Optimistic)
    setMessages(prev => [...prev, userMessage]);

    // 3. Save User Message to Supabase
    await supabase.from('messages').insert([
      { 
        content: userMessage.content,
        role: userMessage.role,
        expert_id: userMessage.expert_id,
        user_id: userMessage.user_id,
        session_id: userMessage.session_id,
      }
    ]);

    // Add a temporary "Thinking" message to UI
    const thinkingId = Math.random().toString();
    setMessages(prev => [...prev, {
      id: thinkingId,
      content: "Thinking...",
      role: 'expert',
      expert_id: expert.id,
      created_at: new Date().toISOString(),
      user_id: session.user.id,
      session_id: sessionId,
    } as ChatMessage]);

    try {
      // 4. Prepare Context for WebLLM
      // ALWAYS inject the system prompt as the very first message
      const llmMessages: any[] = [
        { role: 'system', content: expert.systemPrompt }
      ];

      // Then add all previous conversation messages (excluding system & thinking)
      messages
        .filter(m => m.role !== 'system' && m.content !== 'Thinking...')
        .forEach(m => {
          llmMessages.push({
            role: m.role === 'expert' ? 'assistant' : 'user',
            content: m.content
          });
        });

      // Append the current user message
      // Note: The current WebLLM model (gemma-2-2b) is text-only.
      // For images, we describe the context in text so the expert can still respond in character.
      if (imageUri) {
        const imagePrompt = text 
          ? `[The user has shared an image with you and asks: "${text}"]\nPlease respond to their question about the image in character, using your expertise and personal experience.`
          : `[The user has shared an image with you for analysis.]\nPlease respond in character, commenting on what they might be showing you based on your area of expertise.`;
        llmMessages.push({ role: 'user', content: imagePrompt });
      } else {
        llmMessages.push({ role: 'user', content: text });
      }

      // 5. Run local inference!
      const responseText = await modelManager.generateResponse(llmMessages);

      // 6. Replace Thinking message with real response
      const expertResponse: ChatMessage = {
        id: Math.random().toString(),
        content: responseText,
        role: 'expert',
        expert_id: expert.id,
        created_at: new Date().toISOString(),
        user_id: session.user.id,
        session_id: sessionId,
      };

      setMessages(prev => prev.map(m => m.id === thinkingId ? expertResponse : m));
      
      // Save to Supabase
      await supabase.from('messages').insert([{
        content: expertResponse.content,
        role: expertResponse.role,
        expert_id: expertResponse.expert_id,
        user_id: expertResponse.user_id,
        session_id: expertResponse.session_id,
      }]);

    } catch (e) {
      console.error(e);
      // Remove thinking message on error
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      alert("Inference failed. The model might still be loading or there was a WebGPU error.");
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    // Convert to the format expected by ChatBubble
    const bubbleMsg = {
      id: item.id,
      role: item.role as 'user' | 'expert',
      content: item.content,
      timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    return <ChatBubble message={bubbleMsg} expert={expert} index={index} />;
  };

  // UI Filtering: Hide system messages from the chat bubbles
  const displayMessages = messages.filter(m => m.role !== 'system');

  return (
    <View style={styles.screen}>
      <ExpertHeader expert={expert} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.accentPurple} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />
        )}
        <ChatInput 
          accentColor={expert.color} 
          gradient={expert.gradient} 
          onSend={handleSend}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  messageList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  }
});

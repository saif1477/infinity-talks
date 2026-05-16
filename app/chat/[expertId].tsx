import React, { useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getExpertById } from '../../data/experts';
import ExpertHeader from '../../components/ExpertHeader';
import ChatInput from '../../components/ChatInput';
import { Colors } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { modelManager } from '../../services/ModelManager';
import { useChatSession, ChatMessage } from '../../hooks/useChatSession';
import { useLLMInference } from '../../hooks/useLLMInference';
import MessageList from '../../components/MessageList';
import ChatSidebar from '../../components/ChatSidebar';
import * as Crypto from 'expo-crypto';

export default function ChatScreen() {
  const { expertId } = useLocalSearchParams<{ expertId: string }>();
  const { session } = useAuth();
  const expert = getExpertById(expertId ?? '');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const {
    messages,
    loading,
    activeSessionId,
    pastSessions,
    pinnedSessions,
    startNewChat,
    loadSession,
    togglePinSession,
    deleteSession,
    addMessage,
    updateMessage,
  } = useChatSession(expertId ?? '', session?.user?.id);

  const { isThinking, generateResponse } = useLLMInference(expertId ?? '');

  useEffect(() => {
    if (session?.user?.user_metadata?.avatar_url) {
      setUserAvatar(session.user.user_metadata.avatar_url);
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      router.replace('/auth');
    }
  }, [session]);

  if (!expert) return <View style={styles.screen} />;

  const handleSend = async (text: string, imageUri?: string) => {
    if (!session) return;

    if (!modelManager.isReady()) {
      const lastErr = modelManager.getLastError();
      alert(lastErr ? `Model Error: ${lastErr}` : "No AI model loaded yet.");
      return;
    }

    const displayContent = imageUri ? `[Image Attached]\n${text}` : text;
    
    const userMessage: ChatMessage = {
      id: Crypto.randomUUID(),
      content: displayContent,
      role: 'user',
      expert_id: expert.id,
      created_at: new Date().toISOString(),
      user_id: session.user.id,
      session_id: activeSessionId,
    };

    addMessage(userMessage);

    const { data: insertedData, error: insertError } = await supabase.from('messages').insert([{ 
      content: userMessage.content,
      role: userMessage.role,
      expert_id: userMessage.expert_id,
      user_id: userMessage.user_id,
      session_id: userMessage.session_id,
    }]).select();

    if (!insertError && insertedData && insertedData[0]) {
      updateMessage(userMessage.id, insertedData[0]);
    }

    const thinkingId = Crypto.randomUUID();
    addMessage({
      id: thinkingId,
      content: "Thinking...",
      role: 'expert',
      expert_id: expert.id,
      created_at: new Date().toISOString(),
      user_id: session.user.id,
      session_id: activeSessionId,
    } as ChatMessage);

    try {
      const responseText = await generateResponse(messages, text, expert.systemPrompt, imageUri);

      const expertResponse: ChatMessage = {
        id: Crypto.randomUUID(),
        content: responseText,
        role: 'expert',
        expert_id: expert.id,
        created_at: new Date().toISOString(),
        user_id: session.user.id,
        session_id: activeSessionId,
      };

      updateMessage(thinkingId, expertResponse);
      
      await supabase.from('messages').insert([{
        content: expertResponse.content,
        role: expertResponse.role,
        expert_id: expertResponse.expert_id,
        user_id: expertResponse.user_id,
        session_id: expertResponse.session_id,
      }]);

    } catch (e) {
      console.error(e);
      updateMessage(thinkingId, {
        ...messages[messages.length - 1],
        id: thinkingId,
        content: "I'm sorry, I encountered an error during inference.",
        role: 'expert',
        created_at: new Date().toISOString(),
      } as ChatMessage);
    }
  };

  return (
    <View style={styles.screen}>
      <ExpertHeader expert={expert} onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <View style={styles.mainLayout}>
        <ChatSidebar 
          isOpen={isSidebarOpen}
          pastSessions={pastSessions}
          activeSessionId={activeSessionId}
          pinnedSessions={pinnedSessions}
          onStartNewChat={() => { startNewChat(); setIsSidebarOpen(false); }}
          onLoadSession={(id) => { loadSession(id); setIsSidebarOpen(false); }}
          onTogglePin={togglePinSession}
          onDeleteSession={deleteSession}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <MessageList 
            messages={messages} 
            expert={expert} 
            userAvatar={userAvatar} 
          />
          
          <ChatInput 
            accentColor={expert.color} 
            gradient={expert.gradient} 
            onSend={handleSend}
            disabled={isThinking}
          />
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  mainLayout: { flex: 1, flexDirection: 'row' },
  flex: { flex: 1 },
});

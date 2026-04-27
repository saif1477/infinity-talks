import React, { useRef, useEffect, useState } from 'react';
import {
  View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable, Text, ScrollView
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getExpertById } from '../../data/experts';
import ExpertHeader from '../../components/ExpertHeader';
import ChatBubble from '../../components/ChatBubble';
import ChatInput from '../../components/ChatInput';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { modelManager } from '../../services/ModelManager';
import { Ionicons } from '@expo/vector-icons';

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'expert';
  content: string;
  created_at: string;
  expert_id: string;
  user_id?: string;
  session_id?: string;
}

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
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pastSessions, setPastSessions] = useState<{ id: string, created_at: string, preview: string }[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>(generateUUID());
  const [pinnedSessions, setPinnedSessions] = useState<string[]>([]);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  useEffect(() => {
    // Load pinned sessions from localStorage
    const saved = localStorage.getItem('infinity_talks_pinned_sessions');
    if (saved) setPinnedSessions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('infinity_talks_pinned_sessions', JSON.stringify(pinnedSessions));
  }, [pinnedSessions]);

  useEffect(() => {
    if (!session) {
      router.replace('/auth');
      return;
    }

    const loadHistory = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('session_id, created_at, content')
        .eq('expert_id', expertId)
        .eq('user_id', session.user.id)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const sessionsMap = new Map();
        data.forEach(msg => {
          if (!sessionsMap.has(msg.session_id)) {
            sessionsMap.set(msg.session_id, {
              id: msg.session_id,
              created_at: new Date(msg.created_at).toLocaleDateString(),
              preview: msg.content.substring(0, 30) + '...'
            });
          }
        });
        
        const sortedSessions = Array.from(sessionsMap.values()).sort((a: any, b: any) => {
          const aPinned = pinnedSessions.includes(a.id);
          const bPinned = pinnedSessions.includes(b.id);
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;
          return 0;
        });
        
        setPastSessions(sortedSessions);
      }
    };

    const initChat = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('expert_id', expertId)
        .eq('user_id', session.user.id)
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setMessages(data as ChatMessage[]);
      } else {
        const systemDate = new Date();
        systemDate.setMilliseconds(systemDate.getMilliseconds() - 1);
        
        const systemMsg: Partial<ChatMessage> = {
          content: expert?.systemPrompt || '',
          role: 'system',
          expert_id: expert?.id || '',
          user_id: session.user.id,
          session_id: activeSessionId,
          created_at: systemDate.toISOString(),
        };

        await supabase.from('messages').insert([systemMsg]);
        
        const introMsg = {
          id: Math.random().toString(),
          content: expert?.introMessage || '',
          role: 'expert',
          expert_id: expert?.id || '',
          user_id: session.user.id,
          session_id: activeSessionId,
          created_at: new Date().toISOString(),
        };
        setMessages([introMsg as ChatMessage]);
        await supabase.from('messages').insert([{
           content: introMsg.content, role: introMsg.role, expert_id: introMsg.expert_id, user_id: introMsg.user_id, session_id: introMsg.session_id, created_at: introMsg.created_at
        }]);
      }
      setLoading(false);
    };

    loadHistory();
    initChat();
  }, [expertId, session, activeSessionId]);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const startNewChat = () => {
    setActiveSessionId(generateUUID());
    setIsSidebarOpen(false);
  };

  const loadSession = (sid: string) => {
    setActiveSessionId(sid);
    setIsSidebarOpen(false);
  };

  const togglePinSession = (sid: string) => {
    setPinnedSessions(prev => 
      prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]
    );
  };

  const deleteSession = async (sid: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('session_id', sid);
    
    if (!error) {
      setPastSessions(prev => prev.filter(s => s.id !== sid));
      if (activeSessionId === sid) {
        startNewChat();
      }
    }
  };

  const handleUpdateMessage = async (newText: string) => {
    if (!editingMessage || !session) return;

    const { error } = await supabase
      .from('messages')
      .update({ content: newText })
      .eq('id', editingMessage.id);

    if (!error) {
      setMessages(prev => prev.map(m => 
        m.id === editingMessage.id ? { ...m, content: newText } : m
      ));
    } else {
      alert("Failed to update message.");
    }
    setEditingMessage(null);
  };

  if (!expert) {
    return <View style={styles.screen} />;
  }

  const handleSend = async (text: string, imageUri?: string) => {
    if (!session) return;

    if (!modelManager.isReady()) {
      const lastErr = modelManager.getLastError();
      if (lastErr) {
        alert(`Model Error: ${lastErr}\n\nPlease try selecting a model from the ∞ menu.`);
      } else {
        alert("No AI model loaded yet.\n\nTap the ∞ (infinity) symbol below to select and load a model first.");
      }
      return;
    }

    const displayContent = imageUri ? `[Image Attached]\n${text}` : text;
    
    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      content: displayContent,
      role: 'user',
      expert_id: expert.id,
      created_at: new Date().toISOString(),
      user_id: session.user.id,
      session_id: activeSessionId,
    };

    setMessages(prev => [...prev, userMessage]);

    const { data: insertedData, error: insertError } = await supabase.from('messages').insert([{ 
      content: userMessage.content,
      role: userMessage.role,
      expert_id: userMessage.expert_id,
      user_id: userMessage.user_id,
      session_id: userMessage.session_id,
    }]).select();

    if (!insertError && insertedData && insertedData[0]) {
      setMessages(prev => prev.map(m => m.id === userMessage.id ? insertedData[0] : m));
    }

    const thinkingId = Math.random().toString();
    setMessages(prev => [...prev, {
      id: thinkingId,
      content: "Thinking...",
      role: 'expert',
      expert_id: expert.id,
      created_at: new Date().toISOString(),
      user_id: session.user.id,
      session_id: activeSessionId,
    } as ChatMessage]);

    try {
      const llmMessages: any[] = [];
      messages
        .filter(m => m.role !== 'system' && m.content !== 'Thinking...')
        .forEach(m => {
          llmMessages.push({
            role: m.role === 'expert' ? 'assistant' : 'user',
            content: m.content
          });
        });

      const directive = `[SYSTEM DIRECTIVE: You must strictly follow your persona rules in your response:\n${expert.systemPrompt}\n]`;
      
      if (imageUri) {
        const imagePrompt = text 
          ? `[The user has shared an image with you and asks: "${text}"]`
          : `[The user has shared an image with you for analysis.]`;
        llmMessages.push({ role: 'user', content: `${directive}\n\n${imagePrompt}` });
      } else {
        llmMessages.push({ role: 'user', content: `${directive}\n\nUser: ${text}` });
      }

      const responseText = await modelManager.generateResponse(llmMessages);

      const expertResponse: ChatMessage = {
        id: Math.random().toString(),
        content: responseText,
        role: 'expert',
        expert_id: expert.id,
        created_at: new Date().toISOString(),
        user_id: session.user.id,
        session_id: activeSessionId,
      };

      setMessages(prev => prev.map(m => m.id === thinkingId ? expertResponse : m));
      
      await supabase.from('messages').insert([{
        content: expertResponse.content,
        role: expertResponse.role,
        expert_id: expertResponse.expert_id,
        user_id: expertResponse.user_id,
        session_id: expertResponse.session_id,
      }]);

    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      alert("Inference failed. The model might still be loading or there was a WebGPU error.");
    }
  };

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
        onEdit={() => setEditingMessage(item)} 
      />
    );
  };

  const displayMessages = messages.filter(m => m.role !== 'system');

  return (
    <View style={styles.screen}>
      <ExpertHeader expert={expert} onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <View style={styles.mainLayout}>
        {isSidebarOpen && (
          <View style={styles.sidebar}>
            <Pressable style={styles.newChatBtn} onPress={startNewChat}>
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
                    onMouseLeave={() => {
                      setHoveredSessionId(null);
                    }}
                  >
                    <Pressable 
                      style={[styles.historyItem, activeSessionId === sess.id && styles.historyItemActive]}
                      onPress={() => loadSession(sess.id)}
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
                        <Pressable style={styles.menuItem} onPress={() => { togglePinSession(sess.id); setActiveMenuId(null); }}>
                          <Ionicons name={isPinned ? "pin-outline" : "pin"} size={16} color={Colors.textPrimary} />
                          <Text style={styles.menuItemText}>{isPinned ? 'Unpin' : 'Pin'}</Text>
                        </Pressable>
                        <Pressable style={styles.menuItem} onPress={() => { deleteSession(sess.id); setActiveMenuId(null); }}>
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
        )}

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
            editingMessage={editingMessage}
            onSaveEdit={handleUpdateMessage}
            onCancelEdit={() => setEditingMessage(null)}
          />
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  mainLayout: { flex: 1, flexDirection: 'row' },
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
    backgroundColor: '#1E1E1E', // Solid dark color
    borderRadius: BorderRadius.md,
    padding: 4,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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

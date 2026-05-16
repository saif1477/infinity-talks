import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getExpertById } from '../data/experts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'expert';
  content: string;
  created_at: string;
  expert_id: string;
  user_id?: string;
  session_id?: string;
}

export function useChatSession(expertId: string, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string>(Crypto.randomUUID());
  const [pastSessions, setPastSessions] = useState<{ id: string, created_at: string, preview: string }[]>([]);
  const [pinnedSessions, setPinnedSessions] = useState<string[]>([]);

  const expert = getExpertById(expertId);

  // Load pinned sessions
  useEffect(() => {
    const loadPinned = async () => {
      try {
        const saved = await AsyncStorage.getItem('infinity_talks_pinned_sessions');
        if (saved) setPinnedSessions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load pinned sessions', e);
      }
    };
    loadPinned();
  }, []);

  // Save pinned sessions
  useEffect(() => {
    const savePinned = async () => {
      try {
        await AsyncStorage.setItem('infinity_talks_pinned_sessions', JSON.stringify(pinnedSessions));
      } catch (e) {
        console.error('Failed to save pinned sessions', e);
      }
    };
    savePinned();
  }, [pinnedSessions]);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('session_id, created_at, content')
      .eq('expert_id', expertId)
      .eq('user_id', userId)
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
  }, [expertId, userId, pinnedSessions]);

  const initChat = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('expert_id', expertId)
      .eq('user_id', userId)
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
        user_id: userId,
        session_id: activeSessionId,
        created_at: systemDate.toISOString(),
      };

      await supabase.from('messages').insert([systemMsg]);
      
      const introMsg = {
        id: Crypto.randomUUID(),
        content: expert?.introMessage || '',
        role: 'expert',
        expert_id: expert?.id || '',
        user_id: userId,
        session_id: activeSessionId,
        created_at: new Date().toISOString(),
      };
      setMessages([introMsg as ChatMessage]);
      await supabase.from('messages').insert([{
         content: introMsg.content, role: introMsg.role, expert_id: introMsg.expert_id, user_id: introMsg.user_id, session_id: introMsg.session_id, created_at: introMsg.created_at
      }]);
    }
    setLoading(false);
  }, [expertId, userId, activeSessionId, expert]);

  useEffect(() => {
    loadHistory();
    initChat();
  }, [loadHistory, initChat]);

  const startNewChat = () => {
    setActiveSessionId(Crypto.randomUUID());
  };

  const loadSession = (sid: string) => {
    setActiveSessionId(sid);
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

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const updateMessage = (id: string, updated: ChatMessage) => {
    setMessages(prev => prev.map(m => m.id === id ? updated : m));
  };

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return {
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
    removeMessage
  };
}

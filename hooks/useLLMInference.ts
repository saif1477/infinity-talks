import { useState } from 'react';
import { modelManager } from '../services/ModelManager';
import { ChatMessage } from './useChatSession';
import * as Crypto from 'expo-crypto';

export function useLLMInference(expertId: string) {
  const [isThinking, setIsThinking] = useState(false);

  const generateResponse = async (
    messages: ChatMessage[],
    userText: string,
    expertSystemPrompt: string,
    imageUri?: string
  ): Promise<string> => {
    setIsThinking(true);
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

      const directive = `[SYSTEM DIRECTIVE: You must strictly follow your persona rules in your response:\n${expertSystemPrompt}\n]`;
      
      if (imageUri) {
        const imagePrompt = userText 
          ? `[The user has shared an image with you and asks: "${userText}"]`
          : `[The user has shared an image with you for analysis.]`;
        llmMessages.push({ role: 'user', content: `${directive}\n\n${imagePrompt}` });
      } else {
        llmMessages.push({ role: 'user', content: `${directive}\n\nUser: ${userText}` });
      }

      const responseText = await modelManager.generateResponse(llmMessages, expertId);
      return responseText;
    } finally {
      setIsThinking(false);
    }
  };

  return {
    isThinking,
    generateResponse
  };
}

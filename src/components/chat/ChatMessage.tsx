import React from 'react';
import { User, Bot, Loader2, Sparkles } from 'lucide-react';
import { Message } from '../../types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 text-gray-700 text-sm px-4 py-3 rounded-xl flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isUser 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
              : 'bg-gradient-to-br from-gray-600 to-gray-700'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
        
        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
            : 'bg-white border border-gray-200 text-gray-900'
        }`}>
          <div className="text-sm leading-relaxed">
            {message.content}
            {isStreaming && !isUser && (
              <Loader2 className="inline w-4 h-4 ml-2 animate-spin opacity-70" />
            )}
          </div>
          {message.leads && message.leads.length > 0 && (
            <div className={`mt-2 text-xs flex items-center ${
              isUser ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <Sparkles className="w-3 h-3 mr-1" />
              Found {message.leads.length} {message.leads.length === 1 ? 'lead' : 'leads'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
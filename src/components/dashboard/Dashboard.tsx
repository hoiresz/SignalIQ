import React, { useState, useEffect } from 'react';
import { Brain, LogOut, MessageCircle, Database, Plus, Clock, ChevronRight, Settings, Users, Zap, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage } from '../chat/ChatMessage';
import { ChatInput } from '../chat/ChatInput';
import { LeadsTable } from '../leads/LeadsTable';
import { SignalsPage } from '../signals/SignalsPage';
import { SettingsPage } from '../settings/SettingsPage';
import { Message, Lead, Conversation, User } from '../../types';
import { generateMockResponse } from '../../utils/mockAI';
import { exportLeadsToCSV } from '../../utils/csvExport';
import { supabase } from '../../lib/supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface ConversationSummary {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  lead_count: number;
}

type ActiveTab = 'leads' | 'settings' | 'campaigns';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversation, setConversation] = useState<Conversation>({
    id: '',
    messages: [],
    leads: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('leads');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversationSidebarCollapsed, setConversationSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (user) {
      initializeConversation();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          messages(count),
          leads(count)
        `)
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationSummaries: ConversationSummary[] = data.map(conv => ({
        ...conv,
        message_count: conv.messages?.[0]?.count || 0,
        lead_count: conv.leads?.[0]?.count || 0,
      }));

      setConversations(conversationSummaries);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const initializeConversation = async () => {
    try {
      // Load all conversations for the sidebar
      await loadConversations();
      
      // Try to get the most recent conversation
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      let conversationId: string;

      if (conversations && conversations.length > 0) {
        conversationId = conversations[0].id;
      } else {
        // Create a new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_id: user!.id,
            title: 'New Search Session',
          })
          .select()
          .single();

        if (createError) throw createError;
        conversationId = newConversation.id;

        // Add welcome message
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            type: 'system',
            content: 'Welcome to SignalIQ! Ask me to find companies or people based on your criteria.',
          });
      }

      // Load messages and leads
      await loadConversationData(conversationId);
      setActiveConversationId(conversationId);
    } catch (error) {
      console.error('Error initializing conversation:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadConversationData = async (conversationId: string) => {
    try {
      // Load messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Load leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (leadsError) throw leadsError;

      // Convert to our types
      const convertedMessages: Message[] = messages.map(msg => ({
        id: msg.id,
        type: msg.type as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));

      const convertedLeads: Lead[] = leads.map(lead => ({
        id: lead.id,
        type: lead.type as 'company' | 'person',
        name: lead.name,
        data: lead.data,
        createdAt: new Date(lead.created_at),
      }));

      setConversation({
        id: conversationId,
        messages: convertedMessages,
        leads: convertedLeads,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error loading conversation data:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!conversation.id) return;

    try {
      // Add user message to database
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          type: 'user',
          content
        })
        .select()
        .single();

      if (userError) throw userError;

      // Add to local state
      const newUserMessage: Message = {
        id: userMessage.id,
        type: 'user',
        content,
        timestamp: new Date(userMessage.created_at),
      };

      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, newUserMessage],
        updatedAt: new Date(),
      }));

      setIsLoading(true);

      // Create placeholder assistant message
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          type: 'assistant',
          content: ''
        })
        .select()
        .single();

      if (assistantError) throw assistantError;

      setStreamingMessageId(assistantMessage.id);

      const newAssistantMessage: Message = {
        id: assistantMessage.id,
        type: 'assistant',
        content: '',
        timestamp: new Date(assistantMessage.created_at),
      };

      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, newAssistantMessage],
      }));

      // Generate response using backend if available, otherwise use mock
      let aiResponse;
      if (BACKEND_URL && false) { // Temporarily disable backend to use mock data
        try {
          const response = await fetch(`${BACKEND_URL}/api/generate-leads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: content,
              conversation_id: conversation.id,
              user_id: user!.id
            })
          });

          if (!response.ok) {
            throw new Error('Failed to generate leads');
          }

          aiResponse = await response.json();
        } catch (error) {
          console.error('Backend error, falling back to mock:', error);
          const mockResponse = await generateMockResponse(content);
          aiResponse = { message: mockResponse.content, leads: mockResponse.leads };
        }
      } else {
        const mockResponse = await generateMockResponse(content);
        aiResponse = { message: mockResponse.content, leads: mockResponse.leads };
      }

      // Update assistant message
      await supabase
        .from('messages')
        .update({ content: aiResponse.message })
        .eq('id', assistantMessage.id);

      // Store leads in database if they exist
      if (aiResponse.leads && aiResponse.leads.length > 0) {
        // Store mock leads in database
        const leadsToInsert = aiResponse.leads.map((lead: Lead) => ({
          conversation_id: conversation.id,
          type: lead.type,
          name: lead.name,
          data: lead.data
        }));

        await supabase
          .from('leads')
          .insert(leadsToInsert);

        // Update local state with new leads
        setConversation(prev => ({
          ...prev,
          leads: [...prev.leads, ...aiResponse.leads],
        }));
      }

      // Update local message
      setConversation(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: aiResponse.message }
            : msg
        ),
        updatedAt: new Date(),
      }));

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

      // Reload conversations list to update lead counts
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  const loadConversationLeads = async (conversationId: string) => {
    if (!BACKEND_URL) {
      console.warn('Backend URL not configured');
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/conversations/${conversationId}/leads`, {
        headers: {
          'X-User-ID': user!.id
        }
      });

      if (response.ok) {
        const data = await response.json();
        const convertedLeads: Lead[] = data.leads.map((lead: any) => ({
          id: lead.id,
          type: lead.type as 'company' | 'person',
          name: lead.name,
          data: lead.data,
          createdAt: new Date(lead.createdAt),
        }));

        setConversation(prev => ({
          ...prev,
          leads: convertedLeads,
        }));
      }
    } catch (error) {
      console.error('Error loading conversation leads:', error);
    }
  };
  
  const handleExportCSV = () => {
    exportLeadsToCSV(conversation.leads);
  };

  const handleNewConversation = async () => {
    if (!user) return;

    try {
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: 'New Search Session',
        })
        .select()
        .single();

      if (error) throw error;

      const { data: welcomeMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: newConversation.id,
          type: 'system',
          content: 'Welcome to SignalIQ! Ask me to find companies or people based on your criteria.',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      setConversation({
        id: newConversation.id,
        messages: [{
          id: welcomeMessage.id,
          type: 'system',
          content: welcomeMessage.content,
          timestamp: new Date(welcomeMessage.created_at),
        }],
        leads: [],
        createdAt: new Date(newConversation.created_at),
        updatedAt: new Date(newConversation.updated_at),
      });

      setActiveConversationId(newConversation.id);
      
      // Reload conversations list and leads
      await loadConversations();
      if (BACKEND_URL) {
        await loadConversationLeads(newConversation.id);
      }
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-300">Loading SignalIQ...</p>
        </div>
      </div>
    );
  }

  const handleConversationSelect = async (conversationId: string) => {
    if (conversationId === activeConversationId) return;
    
    try {
      setActiveConversationId(conversationId);
      await loadConversationData(conversationId);
      if (BACKEND_URL) {
        await loadConversationLeads(conversationId);
      }
    } catch (error) {
      console.error('Error switching conversation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const navItems = [
    { id: 'leads' as ActiveTab, label: 'Leads', icon: Database, description: 'Manage your leads' },
    { id: 'signals' as ActiveTab, label: 'Signals', icon: Zap, description: 'Lead signal management' },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings, description: 'Account & ICP settings' },
    { id: 'campaigns' as ActiveTab, label: 'Campaigns', icon: Target, description: 'Coming soon...', disabled: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Main Navigation Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col transition-all duration-300 relative`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-white">SignalIQ</h1>
                  <p className="text-xs text-slate-400">Lead Generation</p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={logout}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-8 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors border border-slate-600"
          >
            <ChevronRight className={`w-3 h-3 text-slate-300 transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
          
          {!sidebarCollapsed && (
            <div className="mt-4 bg-slate-700/30 rounded-lg p-3">
              <p className="text-sm text-white font-medium">
                Welcome back, {user?.firstName}!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ready to find your next leads?
              </p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.disabled && setActiveTab(item.id)}
                disabled={item.disabled}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white shadow-lg'
                    : item.disabled
                    ? 'text-slate-500 cursor-not-allowed'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                }`}
              >
                <item.icon className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                {!sidebarCollapsed && (
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex">
        {activeTab === 'leads' && (
          <>
            {/* Conversations Sidebar */}
            <div className={`${conversationSidebarCollapsed ? 'w-16' : 'w-80'} bg-slate-800/30 backdrop-blur-xl border-r border-slate-700/50 flex flex-col transition-all duration-300 relative`}>
              {/* Conversations Header */}
              <div className="p-6 border-b border-slate-700/50">
                <div className={`flex items-center ${conversationSidebarCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
                  {!conversationSidebarCollapsed && (
                    <h3 className="text-lg font-semibold text-white">Conversations</h3>
                  )}
                  {!conversationSidebarCollapsed && (
                    <button
                      onClick={handleNewConversation}
                      className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                      title="New conversation"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                  {conversationSidebarCollapsed && (
                    <button
                      onClick={handleNewConversation}
                      className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                      title="New conversation"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Collapse Toggle */}
                <button
                  onClick={() => setConversationSidebarCollapsed(!conversationSidebarCollapsed)}
                  className="absolute -right-3 top-8 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors border border-slate-600"
                >
                  <ChevronRight className={`w-3 h-3 text-slate-300 transition-transform duration-300 ${conversationSidebarCollapsed ? '' : 'rotate-180'}`} />
                </button>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleConversationSelect(conv.id)}
                      className={`w-full text-left ${conversationSidebarCollapsed ? 'p-2' : 'p-3'} rounded-xl border transition-all duration-200 ${
                        activeConversationId === conv.id
                          ? 'bg-blue-500/20 border-blue-500/30 text-white shadow-lg'
                          : 'bg-slate-700/20 border-slate-600/30 text-slate-300 hover:bg-slate-700/30 hover:text-white'
                      }`}
                    >
                      {conversationSidebarCollapsed ? (
                        <div className="flex flex-col items-center">
                          <MessageCircle className={`w-5 h-5 mb-1 ${
                            activeConversationId === conv.id ? 'text-blue-400' : 'text-slate-400'
                          }`} />
                          <div className="text-xs text-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              activeConversationId === conv.id ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'
                            }`}>
                              {conv.lead_count}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <MessageCircle className={`w-4 h-4 mr-2 flex-shrink-0 ${
                                activeConversationId === conv.id ? 'text-blue-400' : 'text-slate-400'
                              }`} />
                              <h4 className="text-sm font-medium truncate">
                                {conv.title || 'New Search Session'}
                              </h4>
                            </div>
                            
                            <div className="mt-2 flex items-center space-x-4 text-xs text-slate-400">
                              <span className="flex items-center">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                {conv.message_count}
                              </span>
                              <span className="flex items-center">
                                <Database className="w-3 h-3 mr-1" />
                                {conv.lead_count}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end ml-2">
                            <span className="text-xs text-slate-400">
                              {formatDate(conv.updated_at)}
                            </span>
                            {activeConversationId === conv.id && (
                              <ChevronRight className="w-3 h-3 text-blue-400 mt-1" />
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Sidebar */}
            <div className={`${conversationSidebarCollapsed ? 'w-96' : 'w-96'} bg-slate-800/20 backdrop-blur-xl border-r border-slate-700/50 flex flex-col`}>
              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {conversation.messages.map((message) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message} 
                      isStreaming={streamingMessageId === message.id}
                    />
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-700/50">
                <ChatInput 
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  placeholder="Find companies in fintech with Series A funding..."
                />
              </div>
            </div>

            {/* Main Content - Leads Table */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="flex-1 overflow-hidden">
                <LeadsTable 
                  leads={conversation.leads}
                  onExportCSV={handleExportCSV}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 bg-white">
            <SettingsPage />
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="flex-1 bg-white">
            <SignalsPage />
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="flex-1 bg-white flex items-center justify-center">
            <div className="text-center">
              <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Campaigns</h2>
              <p className="text-slate-600">Coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
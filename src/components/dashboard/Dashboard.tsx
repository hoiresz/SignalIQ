import React, { useState, useEffect } from 'react';
import { Brain, LogOut, MessageCircle, Database, Plus, Clock, ChevronRight, Settings, Users, Zap, Target, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage } from '../chat/ChatMessage';
import { ChatInput } from '../chat/ChatInput';
import { LeadsTable } from '../leads/LeadsTable';
import { SignalsPage } from '../signals/SignalsPage';
import { SettingsPage } from '../settings/SettingsPage';
import { NewLeadTablePanel } from './NewLeadTablePanel';
import { Message, Lead, Conversation, User } from '../../types';
import { generateMockResponse } from '../../utils/mockAI';
import { exportLeadsToCSV } from '../../utils/csvExport';
import { apiClient } from '../../lib/api';

interface ConversationSummary {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  lead_count: number;
}

interface LeadTableSummary {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  lead_count?: number;
}

type ActiveTab = 'leads' | 'settings' | 'campaigns';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [leadTables, setLeadTables] = useState<LeadTableSummary[]>([]);
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
  const [activeLeadTableId, setActiveLeadTableId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('leads');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewTablePanel, setShowNewTablePanel] = useState(false);

  // Get display name based on table type
  const getDisplayName = (type: 'companies' | 'people' | 'custom', isPlural: boolean = true) => {
    switch (type) {
      case 'companies':
        return isPlural ? 'companies' : 'company';
      case 'people':
        return isPlural ? 'people' : 'person';
      case 'custom':
        return isPlural ? 'results' : 'result';
      default:
        return isPlural ? 'results' : 'result';
    }
  };

  // Get current table type
  const getCurrentTableType = (): 'companies' | 'people' | 'custom' => {
    const currentTable = leadTables.find(table => table.id === activeLeadTableId);
    return (currentTable?.table_type as 'companies' | 'people' | 'custom') || 'companies';
  };

  useEffect(() => {
    if (user) {
      initializeLeadTables();
    }
  }, [user]);

  const loadLeadTables = async () => {
    try {
      const tables = await apiClient.getLeadTables();
      setLeadTables(tables);
    } catch (error) {
      console.error('Error loading lead tables:', error);
    }
  };

  const initializeLeadTables = async () => {
    try {
      // Load all lead tables for the sidebar
      await loadLeadTables();
      
      // Try to get the most recent lead table
      const tables = await apiClient.getLeadTables();
      
      let tableId: string;
      
      if (tables && tables.length > 0) {
        tableId = tables[0].id;
      } else {
        // Create a new lead table
        const newTable = await apiClient.createLeadTable(
          'My Leads',
          'Default lead table for generated leads'
        );
        tableId = newTable.id;
      }

      // Load table data
      await loadLeadTableData(tableId);
      setActiveLeadTableId(tableId);
    } catch (error) {
      console.error('Error initializing lead tables:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadLeadTableData = async (tableId: string) => {
    try {
      // Load table leads
      const tableData = await apiClient.getTableLeads(tableId);
      
      const convertedLeads: Lead[] = tableData.leads.map((lead: any) => ({
        id: lead.id,
        type: lead.type as 'company' | 'person',
        name: lead.name,
        data: lead.data,
        createdAt: new Date(lead.createdAt),
      }));

      setConversation({
        id: tableId,
        messages: [],
        leads: convertedLeads,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error loading lead table data:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeLeadTableId) return;

    try {
      setIsLoading(true);

      // Use mock AI response for now
      const aiResponse = await generateMockResponse(content);
      
      // TODO: Store leads in the selected table
      // This will be implemented when we switch to backend
      
      // Reload table data to show new leads
      await loadLeadTableData(activeLeadTableId);
      await loadLeadTables();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  const loadTableLeads = async (tableId: string) => {
    try {
      const data = await apiClient.getTableLeads(tableId);
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
    } catch (error) {
      console.error('Error loading table leads:', error);
    }
  };
  
  const handleExportCSV = () => {
    exportLeadsToCSV(conversation.leads);
  };

  const handleNewLeadTable = async () => {
    if (!user) return;

    setShowNewTablePanel(true);
  };

  const handleCreateTable = async (searchQuery: string, tableType: 'companies' | 'people' | 'custom', customType: string, enrichments: string[]) => {
    try {
      // Generate table name based on search query and type
      const tableName = generateTableName(searchQuery, tableType, customType);
      
      const newTable = await apiClient.createLeadTableWithEnrichments(
        tableName, 
        searchQuery, 
        tableType, 
        enrichments
      );

      setConversation({
        id: newTable.id,
        messages: [],
        leads: [],
        createdAt: new Date(newTable.created_at),
        updatedAt: new Date(newTable.updated_at),
      });

      setActiveLeadTableId(newTable.id);
      
      // Reload tables list
      await loadLeadTables();
      setShowNewTablePanel(false);
    } catch (error) {
      console.error('Error creating new lead table:', error);
    }
  };

  const generateTableName = (searchQuery: string, tableType: 'companies' | 'people' | 'custom', customType: string): string => {
    const typeLabel = tableType === 'custom' ? customType : tableType;
    const queryWords = searchQuery.split(' ').slice(0, 3).join(' ');
    return `${queryWords} - ${typeLabel}`.substring(0, 50);
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

  const handleLeadTableSelect = async (tableId: string) => {
    if (tableId === activeLeadTableId) return;
    
    try {
      setActiveLeadTableId(tableId);
      await loadLeadTableData(tableId);
    } catch (error) {
      console.error('Error switching lead table:', error);
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
    { id: 'leads' as ActiveTab, label: 'Datasets', icon: Database, description: 'Manage your data' },
    { id: 'signals' as ActiveTab, label: 'Signals', icon: Zap, description: 'Signal management' },
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
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Top Navigation Bar for Data Tables */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900">Data Tables</h2>
                  <div className="flex items-center space-x-3">
                    <select
                      value={activeLeadTableId}
                      onChange={(e) => handleLeadTableSelect(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium min-w-[250px]"
                    >
                      {leadTables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.name} - {table.table_type || 'companies'} ({conversation.leads.length} {getDisplayName(table.table_type || 'companies', conversation.leads.length !== 1)})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleNewLeadTable}
                      className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Table
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {conversation.leads.length} {getDisplayName(getCurrentTableType(), conversation.leads.length !== 1)}
                  </span>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <LeadsTable 
                leads={conversation.leads}
                onExportCSV={handleExportCSV}
                tableType={getCurrentTableType()}
              />
            </div>
          </div>
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

      <NewLeadTablePanel
        isOpen={showNewTablePanel}
        onClose={() => setShowNewTablePanel(false)}
        onCreate={handleCreateTable}
      />
    </div>
  );
};
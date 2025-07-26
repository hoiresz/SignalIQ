import React, { useState, useEffect } from 'react';
import { Brain, LogOut, MessageCircle, Database, Plus, Clock, ChevronRight, Settings, Users, Zap, Target, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage } from '../chat/ChatMessage';
import { ChatInput } from '../chat/ChatInput';
import { LeadsTable } from '../leads/LeadsTable';
import { SignalsPage } from '../signals/SignalsPage';
import { SettingsPage } from '../settings/SettingsPage';
import { NewLeadTableModal } from './NewLeadTableModal';
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
  const [showNewTableModal, setShowNewTableModal] = useState(false);

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

    setShowNewTableModal(true);
  };

  const handleCreateTable = async (name: string, description: string, tableType: 'companies' | 'people' | 'custom', enrichments: string[]) => {
    try {
      const newTable = await apiClient.createLeadTableWithEnrichments(name, description, tableType, enrichments);

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
      setShowNewTableModal(false);
    } catch (error) {
      console.error('Error creating new lead table:', error);
    }
  };

  const NewTableModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, description: string, tableType: 'companies' | 'people' | 'custom') => void;
  }> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tableType, setTableType] = useState<'companies' | 'people' | 'custom'>('companies');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
        onCreate(name.trim(), description.trim(), tableType);
        setName('');
        setDescription('');
        setTableType('companies');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Create New Lead Table</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., SaaS Companies, Tech Executives"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this lead table..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Type
              </label>
              <select
                value={tableType}
                onChange={(e) => setTableType(e.target.value as 'companies' | 'people' | 'custom')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="companies">Companies</option>
                <option value="people">People</option>
                <option value="custom">Custom</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {tableType === 'companies' && 'Default columns: Name, Website, Description, Industry, Location'}
                {tableType === 'people' && 'Default columns: Name, Job Title, Company, LinkedIn, Email'}
                {tableType === 'custom' && 'Default columns: Name, Description, URL'}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Table
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Top Navigation Bar for Lead Tables */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900">Lead Tables</h2>
                  <div className="flex items-center space-x-3">
                    <select
                      value={activeLeadTableId}
                      onChange={(e) => handleLeadTableSelect(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium min-w-[250px]"
                    >
                      {leadTables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.name} - {table.table_type || 'companies'} ({conversation.leads.length} leads)
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
                    {conversation.leads.length} leads
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

      <NewTableModal
        isOpen={showNewTableModal}
        onClose={() => setShowNewTableModal(false)}
        onCreate={handleCreateTable}
      />
    </div>
  );
};
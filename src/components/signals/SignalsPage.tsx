import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Edit3, Loader2, Save, X, Sparkles, Target, Building2, Users, DollarSign, MapPin, User, Globe, Lightbulb, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LeadSignal, IdealCustomerProfile } from '../../types';

const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000',
  '1001-5000', '5001-10000', '10001+'
];

const FUNDING_STAGES = [
  'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C',
  'Series D+', 'IPO/Public', 'Bootstrapped'
];

const INFORMATION_PLATFORMS = [
  'LinkedIn', 'Twitter/X', 'Reddit', 'Company Websites', 'Job Boards',
  'News Articles', 'Press Releases', 'Crunchbase', 'AngelList', 'GitHub',
  'Product Hunt', 'Industry Forums', 'Podcasts', 'Webinars', 'Conference Speakers'
];

export const SignalsPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [signals, setSignals] = useState<LeadSignal[]>([]);
  const [icpProfiles, setIcpProfiles] = useState<IdealCustomerProfile[]>([]);
  const [editingSignal, setEditingSignal] = useState<LeadSignal | null>(null);
  const [showNewSignalForm, setShowNewSignalForm] = useState(false);
  const [selectedIcpId, setSelectedIcpId] = useState<string>('');
  const [generatedCriteria, setGeneratedCriteria] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load ICP profiles
      const { data: icpData } = await supabase
        .from('ideal_customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Load signals
      const { data: signalsData } = await supabase
        .from('lead_signals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setIcpProfiles(icpData || []);
      setSignals(signalsData || []);
      
      if (icpData && icpData.length > 0 && !selectedIcpId) {
        setSelectedIcpId(icpData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAISignals = async () => {
    if (!selectedIcpId) return;

    // Generate mock criteria
    const mockCriteria = [
      "posted on LinkedIn about SEO",
      "has job positions open on their website", 
      "company is located in the US",
      "mentioned AI or automation in recent posts",
      "has raised funding in the last 12 months",
      "hiring for engineering roles",
      "attended recent industry conferences",
      "published content about digital transformation"
    ];
    
    setGeneratedCriteria(mockCriteria);
    setShowGeneratePanel(true);
  };

  const handleSaveSignal = async (signal: Partial<LeadSignal>) => {
    if (!user || !selectedIcpId) return;

    setIsSaving(true);
    try {
      if (signal.id) {
        // Update existing
        await supabase
          .from('lead_signals')
          .update({
            name: signal.name,
            description: signal.description,
            criteria: signal.criteria,
            is_active: signal.is_active
          })
          .eq('id', signal.id);
      } else {
        // Create new
        await supabase
          .from('lead_signals')
          .insert({
            user_id: user.id,
            icp_id: selectedIcpId,
            name: signal.name,
            description: signal.description || '',
            signal_type: 'custom',
            criteria: signal.criteria || {},
            is_active: signal.is_active ?? true
          });
      }

      await loadData();
      setEditingSignal(null);
      setShowNewSignalForm(false);
    } catch (error) {
      console.error('Error saving signal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    if (!confirm('Are you sure you want to delete this signal?')) return;

    try {
      await supabase
        .from('lead_signals')
        .delete()
        .eq('id', signalId);

      await loadData();
    } catch (error) {
      console.error('Error deleting signal:', error);
    }
  };

  const toggleSignalActive = async (signalId: string, isActive: boolean) => {
    try {
      await supabase
        .from('lead_signals')
        .update({ is_active: isActive })
        .eq('id', signalId);

      await loadData();
    } catch (error) {
      console.error('Error updating signal:', error);
    }
  };

  const SignalForm: React.FC<{
    signal: Partial<LeadSignal>;
    onSave: (signal: Partial<LeadSignal>) => void;
    onCancel: () => void;
  }> = ({ signal, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<LeadSignal>>({
      ...signal,
      criteria: signal.criteria || {}
    });

    const updateCriteria = (key: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          [key]: value
        }
      }));
    };

    const toggleArrayValue = (key: string, value: string) => {
      const current = formData.criteria?.[key] || [];
      const updated = current.includes(value)
        ? current.filter((item: string) => item !== value)
        : [...current, value];
      updateCriteria(key, updated);
    };

    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 space-y-6 border border-slate-200 shadow-md">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {signal.id ? 'Edit Signal' : 'Create New Signal'}
          </h3>
          <p className="text-slate-600 text-sm">Define the criteria for identifying potential leads</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Signal Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Companies hiring marketing specialists"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this signal identifies and why it's valuable..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none bg-white shadow-sm text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Target People Criteria
              </label>
              <textarea
                value={formData.criteria?.target_people_criteria || ''}
                onChange={(e) => updateCriteria('target_people_criteria', e.target.value)}
                placeholder="e.g., CEOs, CTOs, VP of Engineering, Marketing Directors, Decision makers in technology adoption..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none bg-white shadow-sm text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Signal Description *
              </label>
              <textarea
                value={formData.criteria?.signal_description || ''}
                onChange={(e) => updateCriteria('signal_description', e.target.value)}
                placeholder="e.g., Companies posting job openings for marketing roles on LinkedIn, mentions of pain points on social media, recent funding announcements..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none bg-white shadow-sm text-sm"
              />
            </div>
          </div>

          {/* Criteria Filters */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                Company Sizes
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-white">
                {COMPANY_SIZES.map((size) => (
                  <label key={size} className="flex items-center hover:bg-slate-50 p-1 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.criteria?.company_sizes?.includes(size) || false}
                      onChange={() => toggleArrayValue('company_sizes', size)}
                      className="mr-2 rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-emerald-600" />
                Funding Stages
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-white">
                {FUNDING_STAGES.map((stage) => (
                  <label key={stage} className="flex items-center hover:bg-slate-50 p-1 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.criteria?.funding_stages?.includes(stage) || false}
                      onChange={() => toggleArrayValue('funding_stages', stage)}
                      className="mr-2 rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-medium text-slate-700">{stage}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                <Globe className="w-4 h-4 mr-2 text-purple-600" />
                Information Platforms
              </label>
              <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-white">
                {INFORMATION_PLATFORMS.map((platform) => (
                  <label key={platform} className="flex items-center hover:bg-slate-50 p-1 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.criteria?.information_platforms?.includes(platform) || false}
                      onChange={() => toggleArrayValue('information_platforms', platform)}
                      className="mr-2 rounded text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-xs font-medium text-slate-700">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={isSaving || !formData.name?.trim() || !formData.criteria?.signal_description?.trim()}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Signal'}
          </button>
        </div>
      </div>
    );
  };

  const filteredSignals = selectedIcpId 
    ? signals.filter(signal => signal.icp_id === selectedIcpId)
    : signals;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Signals</h1>
            <p className="text-slate-600 mt-2">Generate and manage signals to identify potential prospects automatically</p>
          </div>
        </div>
      </div>

      {/* ICP Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Target className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold text-slate-900">Select ICP Profile</h2>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedIcpId}
              onChange={(e) => setSelectedIcpId(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm font-medium"
            >
              <option value="">Select an ICP profile...</option>
              {icpProfiles.map((icp) => (
                <option key={icp.id} value={icp.id}>
                  {icp.name}
                </option>
              ))}
            </select>
            <button
              onClick={generateAISignals}
              disabled={!selectedIcpId}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              <Lightbulb className="w-5 h-5 mr-2" />
              Generate Signals
            </button>
          </div>
        </div>

        {selectedIcpId && (
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200">
            {(() => {
              const selectedIcp = icpProfiles.find(icp => icp.id === selectedIcpId);
              return selectedIcp ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex items-start">
                    <Building2 className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-700 block mb-2">Solution & Products:</span>
                      <span className="text-slate-600 leading-relaxed text-sm">{selectedIcp.solution_products}</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-6 h-6 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-700 block mb-2">Target Region:</span>
                      <div className="flex flex-wrap gap-2 max-w-md">
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Signals Management */}
      {selectedIcpId && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Search className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Active Signals</h2>
                <p className="text-slate-600 mt-2">
                  {filteredSignals.length} signal{filteredSignals.length !== 1 ? 's' : ''} configured
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNewSignalForm(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Custom Signal
            </button>
          </div>

          <div className="space-y-6">
            {/* New Signal Form */}
            {showNewSignalForm && (
              <SignalForm
                signal={{}}
                onSave={handleSaveSignal}
                onCancel={() => setShowNewSignalForm(false)}
              />
            )}

            {/* Existing Signals */}
            {filteredSignals.map((signal) => (
              <div key={signal.id}>
                {editingSignal?.id === signal.id ? (
                  <SignalForm
                    signal={editingSignal}
                    onSave={handleSaveSignal}
                    onCancel={() => setEditingSignal(null)}
                  />
                ) : (
                  <div className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 mr-3">{signal.name}</h3>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              signal.signal_type === 'ai_generated'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {signal.signal_type === 'ai_generated' ? (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  AI Generated
                                </>
                          selectedIcp.target_region.slice(0, 3).map((country) => (
                                <>
                                  <User className="w-3 h-3 mr-1" />
                                  Custom
                                </>
                              )}
                            </span>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={signal.is_active}
                                onChange={(e) => toggleSignalActive(signal.id, e.target.checked)}
                                className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-medium text-slate-600">Active</span>
                            </label>
                          </div>
                        </div>
                        {signal.description && (
                          <p className="text-slate-600 mb-4 leading-relaxed">{signal.description}</p>
                        )}
                        {Array.isArray(selectedIcp.target_region) && selectedIcp.target_region.length > 3 && (
                          <span className="text-slate-500 text-sm">
                            ... +{selectedIcp.target_region.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <button
                          onClick={() => setEditingSignal(signal)}
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                          title="Edit signal"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSignal(signal.id)}
                          className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                          title="Delete signal"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Signal Description */}
                    {signal.criteria?.signal_description && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                        <div className="flex items-center mb-1">
                          <Zap className="w-5 h-5 text-orange-600 mr-2" />
                          <span className="font-semibold text-slate-700">Signal Details</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{signal.criteria.signal_description}</p>
                      </div>
                    )}

                    {/* Criteria Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {signal.criteria?.company_sizes && signal.criteria.company_sizes.length > 0 && (
                        <div>
                          <div className="flex items-center mb-2">
                            <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="font-semibold text-slate-700">Company Sizes</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {signal.criteria.company_sizes.map((size) => (
                              <span key={size} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {signal.criteria?.funding_stages && signal.criteria.funding_stages.length > 0 && (
                        <div>
                          <div className="flex items-center mb-2">
                            <DollarSign className="w-5 h-5 text-emerald-600 mr-2" />
                            <span className="font-semibold text-slate-700">Funding Stages</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {signal.criteria.funding_stages.map((stage) => (
                              <span key={stage} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md text-sm font-medium">
                                {stage}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {signal.criteria?.information_platforms && signal.criteria.information_platforms.length > 0 && (
                        <div>
                          <div className="flex items-center mb-2">
                            <Globe className="w-5 h-5 text-purple-600 mr-2" />
                            <span className="font-semibold text-slate-700">Platforms</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {signal.criteria.information_platforms.map((platform) => (
                              <span key={platform} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-md text-sm font-medium">
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {signal.criteria?.target_people_criteria && (
                        <div>
                          <div className="flex items-center mb-2">
                            <Users className="w-5 h-5 text-orange-600 mr-2" />
                            <span className="font-semibold text-slate-700">Target People</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed bg-orange-50 p-3 rounded-md">
                            {signal.criteria.target_people_criteria}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredSignals.length === 0 && !showNewSignalForm && (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No signals yet</h3>
                <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
                  Start by generating AI-powered signals or create custom signals to identify high-intent leads automatically
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedIcpId && icpProfiles.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No ICP Profiles</h2>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
            Create an ICP profile first to start generating powerful lead signals
          </p>
          <button
            onClick={() => window.location.href = '#settings'}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Go to Settings
          </button>
        </div>
      )}

      {/* Generate Signals Side Panel */}
      {showGeneratePanel && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="flex-1 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setShowGeneratePanel(false)}
          />
          
          <div className="w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button
                onClick={() => setShowGeneratePanel(false)}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate AI Signals</h2>
                <p className="text-gray-600">AI will generate relevant signals based on your ICP profile</p>
              </div>

              {/* Generated Criteria */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Generated Criteria</h3>
                <div className="space-y-2">
                  {generatedCriteria.map((criteria, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-gray-700">{criteria}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowGeneratePanel(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle signal generation
                    setShowGeneratePanel(false);
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200"
                >
                  Generate Signals
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
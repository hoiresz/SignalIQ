import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Edit3, Loader2, Save, X, Sparkles, Target, Building2, Users, DollarSign, MapPin, User, Globe, Lightbulb, Search, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LeadSignal, IdealCustomerProfile } from '../../types';

const MOCK_GENERATED_CRITERIA = [
  "posted on LinkedIn about SEO",
  "has job positions open on their website", 
  "company is located in the US",
  "mentioned AI or automation in recent posts",
  "has raised funding in the last 12 months",
  "hiring for engineering roles",
  "attended recent industry conferences",
  "published content about digital transformation"
];

export const SignalsPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [signals, setSignals] = useState<LeadSignal[]>([]);
  const [icpProfiles, setIcpProfiles] = useState<IdealCustomerProfile[]>([]);
  const [editingSignal, setEditingSignal] = useState<LeadSignal | null>(null);
  const [showNewSignalForm, setShowNewSignalForm] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [selectedIcpId, setSelectedIcpId] = useState<string>('');
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [customCriteria, setCustomCriteria] = useState<string[]>([]);
  const [newCriteriaInput, setNewCriteriaInput] = useState('');

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

  const handleGenerateSignals = () => {
    if (!selectedIcpId) return;
    setSelectedCriteria([]);
    setCustomCriteria([]);
    setNewCriteriaInput('');
    setShowGeneratePanel(true);
  };

  const toggleCriteriaSelection = (criteria: string) => {
    setSelectedCriteria(prev => 
      prev.includes(criteria)
        ? prev.filter(c => c !== criteria)
        : [...prev, criteria]
    );
  };

  const addCustomCriteria = () => {
    if (newCriteriaInput.trim() && !customCriteria.includes(newCriteriaInput.trim())) {
      setCustomCriteria(prev => [...prev, newCriteriaInput.trim()]);
      setNewCriteriaInput('');
    }
  };

  const removeCustomCriteria = (criteria: string) => {
    setCustomCriteria(prev => prev.filter(c => c !== criteria));
  };

  const handleCreateSignal = async () => {
    if (!selectedIcpId || (selectedCriteria.length === 0 && customCriteria.length === 0)) return;

    setIsSaving(true);
    try {
      const allCriteria = [...selectedCriteria, ...customCriteria];
      const signalName = `Signal - ${allCriteria.slice(0, 2).join(', ')}${allCriteria.length > 2 ? '...' : ''}`;

      await supabase
        .from('lead_signals')
        .insert({
          user_id: user.id,
          icp_id: selectedIcpId,
          name: signalName,
          description: `Auto-generated signal with ${allCriteria.length} criteria`,
          signal_type: 'ai_generated',
          status: 'deployed',
          criteria: {
            signal_criteria: allCriteria
          },
          is_active: true
        });

      await loadData();
      setShowGeneratePanel(false);
      setSelectedCriteria([]);
      setCustomCriteria([]);
    } catch (error) {
      console.error('Error creating signal:', error);
    } finally {
      setIsSaving(false);
    }
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
            status: signal.status || 'deployed'
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
            status: 'deployed',
            criteria: signal.criteria || {}
          });
      }

      await loadData();
      setEditingSignal(null);
      setShowNewSignalForm(false);
      setShowEditPanel(false);
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

  const cancelSignal = async (signalId: string) => {
    if (!confirm('Are you sure you want to cancel this signal?')) return;

    try {
      await supabase
        .from('lead_signals')
        .update({ status: 'completed' })
        .eq('id', signalId);

      await loadData();
    } catch (error) {
      console.error('Error cancelling signal:', error);
    }
  };

  const handleEditSignal = (signal: LeadSignal) => {
    setEditingSignal(signal);
    // Populate the criteria from the signal
    if (signal.criteria?.signal_criteria) {
      const allCriteria = signal.criteria.signal_criteria;
      const generatedCriteria = MOCK_GENERATED_CRITERIA.filter(c => allCriteria.includes(c));
      const customCriteria = allCriteria.filter(c => !MOCK_GENERATED_CRITERIA.includes(c));
      
      setSelectedCriteria(generatedCriteria);
      setCustomCriteria(customCriteria);
    }
    setShowEditPanel(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 text-green-800';
      case 'searching':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const SignalForm: React.FC<{
    signal: Partial<LeadSignal>;
    onSave: (signal: Partial<LeadSignal>) => void;
    onCancel: () => void;
    isEdit?: boolean;
  }> = ({ signal, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<LeadSignal>>({
      ...signal,
      criteria: signal.criteria || {},
      status: signal.status || 'deployed'
    });

    const handleSave = () => {
      const allCriteria = [...selectedCriteria, ...customCriteria];
      const updatedSignal = {
        ...formData,
        criteria: {
          signal_criteria: allCriteria
        }
      };
      onSave(updatedSignal);
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Signal Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signal Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Companies hiring marketing specialists"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this signal identifies and why it's valuable..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            />
          </div>
        </div>

        {/* Generated Criteria */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Generated Criteria</h3>
          <div className="space-y-2">
            {MOCK_GENERATED_CRITERIA.map((criteria, index) => (
              <div 
                key={index} 
                onClick={() => toggleCriteriaSelection(criteria)}
                className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedCriteria.includes(criteria)
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm">{criteria}</p>
                  {selectedCriteria.includes(criteria) && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Criteria */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Criteria</h3>
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="text"
              value={newCriteriaInput}
              onChange={(e) => setNewCriteriaInput(e.target.value)}
              placeholder="Add custom criteria..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCriteria())}
            />
            <button
              type="button"
              onClick={addCustomCriteria}
              disabled={!newCriteriaInput.trim()}
              className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {customCriteria.length > 0 && (
            <div className="space-y-2">
              {customCriteria.map((criteria, index) => (
                <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-green-800">{criteria}</p>
                    <button
                      type="button"
                      onClick={() => removeCustomCriteria(criteria)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Summary */}
        {(selectedCriteria.length > 0 || customCriteria.length > 0) && (
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">
              Selected Criteria ({selectedCriteria.length + customCriteria.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {[...selectedCriteria, ...customCriteria].map((criteria, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                >
                  {criteria}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !formData.name?.trim() || (selectedCriteria.length === 0 && customCriteria.length === 0)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              signal.id ? 'Update Signal' : 'Create Signal'
            )}
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
              onClick={handleGenerateSignals}
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
                        {Array.isArray(selectedIcp.target_region) ? (
                          <>
                            {selectedIcp.target_region.slice(0, 3).map((country) => (
                              <span
                                key={country}
                                className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md text-sm font-medium"
                              >
                                {country}
                              </span>
                            ))}
                            {selectedIcp.target_region.length > 3 && (
                              <span className="text-slate-500 text-sm">
                                ... +{selectedIcp.target_region.length - 3} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-600">{selectedIcp.target_region}</span>
                        )}
                      </div>
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
                <div className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 mr-3">{signal.name}</h3>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(signal.status || 'deployed')}`}>
                            {signal.status === 'searching' && (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            )}
                            {signal.status === 'deployed' && 'Deployed'}
                            {signal.status === 'searching' && 'Searching'}
                            {signal.status === 'completed' && 'Completed'}
                          </span>
                          {signal.status === 'searching' && (
                            <button
                              onClick={() => cancelSignal(signal.id)}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      {signal.description && (
                        <p className="text-slate-600 mb-4 leading-relaxed">{signal.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={() => handleEditSignal(signal)}
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

                  {/* Signal Criteria */}
                  {signal.criteria?.signal_criteria && Array.isArray(signal.criteria.signal_criteria) && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                      <div className="flex items-center mb-3">
                        <Zap className="w-5 h-5 text-orange-600 mr-2" />
                        <span className="font-semibold text-slate-700">Signal Criteria</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {signal.criteria.signal_criteria.map((criteria, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium"
                          >
                            {criteria}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredSignals.length === 0 && !showNewSignalForm && (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No signals yet</h3>
                <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
                  Start by generating AI-powered signals or create custom signals to identify high-intent prospects automatically
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
            Create an ICP profile first to start generating powerful signals
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
                  {MOCK_GENERATED_CRITERIA.map((criteria, index) => (
                    <div 
                      key={index} 
                      onClick={() => toggleCriteriaSelection(criteria)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedCriteria.includes(criteria)
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{criteria}</p>
                        {selectedCriteria.includes(criteria) && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Criteria */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Criteria</h3>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={newCriteriaInput}
                    onChange={(e) => setNewCriteriaInput(e.target.value)}
                    placeholder="Add custom criteria..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCriteria())}
                  />
                  <button
                    onClick={addCustomCriteria}
                    disabled={!newCriteriaInput.trim()}
                    className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {customCriteria.length > 0 && (
                  <div className="space-y-2">
                    {customCriteria.map((criteria, index) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-green-800">{criteria}</p>
                          <button
                            onClick={() => removeCustomCriteria(criteria)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Summary */}
              {(selectedCriteria.length > 0 || customCriteria.length > 0) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Selected Criteria ({selectedCriteria.length + customCriteria.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[...selectedCriteria, ...customCriteria].map((criteria, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                      >
                        {criteria}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
                  onClick={handleCreateSignal}
                  disabled={isSaving || (selectedCriteria.length === 0 && customCriteria.length === 0)}
                  className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all duration-200"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? 'Creating...' : 'Create Signal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Signal Side Panel */}
      {showEditPanel && editingSignal && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="flex-1 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => {
              setShowEditPanel(false);
              setEditingSignal(null);
              setSelectedCriteria([]);
              setCustomCriteria([]);
            }}
          />
          
          <div className="w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button
                onClick={() => {
                  setShowEditPanel(false);
                  setEditingSignal(null);
                  setSelectedCriteria([]);
                  setCustomCriteria([]);
                }}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <SignalForm
                signal={editingSignal}
                onSave={handleSaveSignal}
                onCancel={() => {
                  setShowEditPanel(false);
                  setEditingSignal(null);
                  setSelectedCriteria([]);
                  setCustomCriteria([]);
                }}
                isEdit={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
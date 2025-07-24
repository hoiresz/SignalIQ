import React, { useState, useEffect } from 'react';
import { X, Globe, Target, Building2, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, IdealCustomerProfile } from '../../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000',
  '1001-5000', '5001-10000', '10001+'
];

const FUNDING_STAGES = [
  'Any', 'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C',
  'Series D', 'Series E', 'Series F', 'Series G', 'Series H', 'IPO/Public'
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Netherlands',
  'Sweden', 'Denmark', 'Norway', 'Finland', 'Switzerland', 'Austria',
  'Australia', 'New Zealand', 'Singapore', 'Hong Kong', 'Japan', 'South Korea',
  'India', 'Israel', 'UAE', 'Brazil', 'Mexico', 'Argentina', 'Chile',
  'South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Other'
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [icp, setIcp] = useState<IdealCustomerProfile | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadUserData();
    }
  }, [isOpen, user]);

  const loadUserData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Load ICP
      const { data: icpData } = await supabase
        .from('ideal_customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);
      setIcp(icpData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile || !icp) return;

    setIsSaving(true);
    try {
      // Update user profile
      await supabase
        .from('user_profiles')
        .update({
          company_website: profile.company_website
        })
        .eq('user_id', user.id);

      // Update ICP
      await supabase
        .from('ideal_customer_profiles')
        .update({
          company_sizes: icp.company_sizes,
          funding_stages: icp.funding_stages,
          locations: icp.locations,
          titles: icp.titles
        })
        .eq('user_id', user.id);

      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompanySizeToggle = (size: string) => {
    if (!icp) return;
    setIcp(prev => prev ? {
      ...prev,
      company_sizes: prev.company_sizes.includes(size)
        ? prev.company_sizes.filter(s => s !== size)
        : [...prev.company_sizes, size]
    } : prev);
  };

  const handleFundingStageToggle = (stage: string) => {
    if (!icp) return;
    setIcp(prev => prev ? {
      ...prev,
      funding_stages: prev.funding_stages.includes(stage)
        ? prev.funding_stages.filter(s => s !== stage)
        : [...prev.funding_stages, stage]
    } : prev);
  };

  const handleLocationToggle = (location: string) => {
    if (!icp) return;
    setIcp(prev => prev ? {
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    } : prev);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Company Information */}
              <div>
                <div className="flex items-center mb-4">
                  <Globe className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-slate-900">Company Information</h3>
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-2">
                    Company Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={profile?.company_website || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, company_website: e.target.value } : prev)}
                    placeholder="https://yourcompany.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Ideal Customer Profile */}
              <div>
                <div className="flex items-center mb-6">
                  <Target className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-slate-900">Ideal Customer Profile</h3>
                </div>

                {/* Company Sizes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Target Company Sizes
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {COMPANY_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleCompanySizeToggle(size)}
                        className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                          icp?.company_sizes.includes(size)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Funding Stages */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Target Funding Stages
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FUNDING_STAGES.map((stage) => (
                      <button
                        key={stage}
                        onClick={() => handleFundingStageToggle(stage)}
                        className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                          icp?.funding_stages.includes(stage)
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Locations */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Target Locations
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-4">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country}
                        onClick={() => handleLocationToggle(country)}
                        className={`px-3 py-2 rounded-md border transition-all duration-200 text-sm ${
                          icp?.locations.includes(country)
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Titles */}
                <div>
                  <label htmlFor="titles" className="block text-sm font-medium text-slate-700 mb-2">
                    Target Job Titles
                  </label>
                  <textarea
                    id="titles"
                    value={icp?.titles || ''}
                    onChange={(e) => setIcp(prev => prev ? { ...prev, titles: e.target.value } : prev)}
                    placeholder="e.g., CEO, CTO, VP of Engineering, Head of Sales..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
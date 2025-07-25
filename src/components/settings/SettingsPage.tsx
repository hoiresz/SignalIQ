import React, { useState, useEffect } from 'react';
import { Globe, Target, Building2, Save, Loader2, Plus, Trash2, Edit3, User, Mail, Pencil, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, IdealCustomerProfile } from '../../types';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [icpProfiles, setIcpProfiles] = useState<IdealCustomerProfile[]>([]);
  const [editingIcp, setEditingIcp] = useState<IdealCustomerProfile | null>(null);
  const [showNewIcpForm, setShowNewIcpForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Load all ICP profiles
      const { data: icpData } = await supabase
        .from('ideal_customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      setProfile(profileData);
      setIcpProfiles(icpData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          company_website: profile.company_website,
          onboarding_completed: profile.onboarding_completed
        }, {
          onConflict: 'user_id'
        });
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIcp = async (icp: Partial<IdealCustomerProfile>) => {
    if (!user) return;

    setIsSaving(true);
    try {
      if (icp.id) {
        // Update existing
        await supabase
          .from('ideal_customer_profiles')
          .update({
            name: icp.name,
            solution_products: icp.solution_products || '',
            target_region: icp.target_region || '',
          target_customers: icp.target_customers || '',
          })
          .eq('id', icp.id);
      } else {
        // Create new
        await supabase
          .from('ideal_customer_profiles')
          .insert({
            user_id: user.id,
            name: icp.name,
            solution_products: icp.solution_products || '',
            target_region: icp.target_region || '',
            target_customers: icp.target_customers || '',
          });
      }

      await loadUserData();
      setEditingIcp(null);
      setShowNewIcpForm(false);
    } catch (error) {
      console.error('Error saving ICP:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIcp = async (icpId: string) => {
    if (!confirm('Are you sure you want to delete this ICP profile?')) return;

    try {
      await supabase
        .from('ideal_customer_profiles')
        .delete()
        .eq('id', icpId);

      await loadUserData();
    } catch (error) {
      console.error('Error deleting ICP:', error);
    }
  };

  const CompanyWebsiteSection: React.FC<{
    profile: UserProfile | null;
    onProfileUpdate: (profile: UserProfile | null) => void;
    onSave: () => Promise<void>;
  }> = ({ profile, onProfileUpdate, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempWebsite, setTempWebsite] = useState('');
    const [isSavingWebsite, setIsSavingWebsite] = useState(false);

    const handleEditClick = () => {
      setTempWebsite(profile?.company_website || '');
      setIsEditing(true);
    };

    const handleSaveWebsite = async () => {
      setIsSavingWebsite(true);
      try {
        onProfileUpdate(profile ? { ...profile, company_website: tempWebsite } : profile);
        await onSave();
        setIsEditing(false);
      } catch (error) {
        console.error('Error saving website:', error);
      } finally {
        setIsSavingWebsite(false);
      }
    };

    const handleCancel = () => {
      setTempWebsite('');
      setIsEditing(false);
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Company Website
          </label>
          {!isEditing ? (
            <div className="flex items-center justify-between p-4 border border-slate-300 rounded-lg bg-slate-50">
              <div className="flex-1">
                {profile?.company_website ? (
                  <a
                    href={profile.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {profile.company_website}
                  </a>
                ) : (
                  <span className="text-slate-500 italic">No website added</span>
                )}
              </div>
              <button
                onClick={handleEditClick}
                className="flex items-center px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-all duration-200"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="url"
                value={tempWebsite}
                onChange={(e) => setTempWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                autoFocus
              />
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveWebsite}
                  disabled={isSavingWebsite}
                  className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-all duration-200"
                >
                  {isSavingWebsite ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {isSavingWebsite ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const IcpForm: React.FC<{
    icp: Partial<IdealCustomerProfile>;
    onSave: (icp: Partial<IdealCustomerProfile>) => void;
    onCancel: () => void;
  }> = ({ icp, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<IdealCustomerProfile>>(icp);

    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 space-y-6 border border-slate-200 shadow-sm">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Profile Name
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Enterprise SaaS, Early Stage Startups"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
               Solution & Products *
              </label>
              <textarea
               value={formData.solution_products || ''}
               onChange={(e) => setFormData(prev => ({ ...prev, solution_products: e.target.value }))}
                placeholder="What products or services are you selling?"
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
               Target Region *
              </label>
              <textarea
               value={formData.target_region || ''}
               onChange={(e) => setFormData(prev => ({ ...prev, target_region: e.target.value }))}
                placeholder="Which regions or locations are you targeting?"
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Target Customers
          </label>
          <textarea
            value={formData.target_customers || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, target_customers: e.target.value }))}
            placeholder="Describe your ideal customers - company size, industry, roles, etc..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
          />
        </div>


        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={isSaving || !formData.name?.trim()}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    );
  };

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
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account and ideal customer profiles</p>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center mb-6">
          <User className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-slate-900">Account Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Company Information
            </label>
            <input
              type="text"
              value={user?.firstName || ''}
              disabled
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={user?.lastName || ''}
              disabled
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center mb-6">
          <Globe className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-slate-900">Company Information</h2>
        </div>

        <CompanyWebsiteSection profile={profile} onProfileUpdate={setProfile} onSave={handleSaveProfile} />
      </div>

      {/* Ideal Customer Profiles */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Target className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold text-slate-900">Ideal Customer Profiles</h2>
          </div>
          <button
            onClick={() => setShowNewIcpForm(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Profile
          </button>
        </div>

        <div className="space-y-6">
          {/* New ICP Form */}
          {showNewIcpForm && (
            <IcpForm
              icp={{}}
              onSave={handleSaveIcp}
              onCancel={() => setShowNewIcpForm(false)}
            />
          )}

          {/* Existing ICP Profiles */}
          {icpProfiles.map((icp) => (
            <div key={icp.id}>
              {editingIcp?.id === icp.id ? (
                <IcpForm
                  icp={editingIcp}
                  onSave={handleSaveIcp}
                  onCancel={() => setEditingIcp(null)}
                />
              ) : (
                <div className="border border-slate-200 rounded-2xl p-6 bg-white hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900">{icp.name}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingIcp(icp)}
                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteIcp(icp.id)}
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {icp.solution_products && (
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Solution & Products</h4>
                        <p className="text-slate-600 leading-relaxed">{icp.solution_products}</p>
                      </div>
                    )}

                    {icp.target_region && (
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Target Region</h4>
                        <p className="text-slate-600 leading-relaxed">{icp.target_region}</p>
                      </div>
                    )}

                    {icp.target_customers && (
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Target Customers</h4>
                        <p className="text-slate-600 leading-relaxed">{icp.target_customers}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {icpProfiles.length === 0 && !showNewIcpForm && (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No ICP profiles yet</h3>
              <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">Create your first ideal customer profile to get started</p>
              <button
                onClick={() => setShowNewIcpForm(true)}
                className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mx-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
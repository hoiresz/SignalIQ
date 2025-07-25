import React, { useState } from 'react';
import { Pencil, X, Check, Loader2 } from 'lucide-react';
import { UserProfile } from '../../types';

interface CompanyWebsiteSectionProps {
  profile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile | null) => void;
  onSave: () => Promise<void>;
}

export const CompanyWebsiteSection: React.FC<CompanyWebsiteSectionProps> = ({ 
  profile, 
  onProfileUpdate, 
  onSave 
}) => {
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
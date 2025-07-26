import React, { useState } from 'react';
import { ArrowLeft, Building2, User, Settings, Plus, Trash2, X } from 'lucide-react';

interface NewLeadTablePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (searchQuery: string, tableType: 'companies' | 'people' | 'custom', customType: string, enrichments: string[]) => void;
}

// Available enrichments for each type
const AVAILABLE_ENRICHMENTS = {
  companies: [
    'Industry', 'Location', 'Employee Count', 'Founded Date', 'Funding Stage',
    'Last Funding Date', 'Amount Raised', 'Valuation', 'Revenue', 'Technologies',
    'Social Media', 'Contact Email', 'Phone Number', 'Headquarters'
  ],
  people: [
    'LinkedIn Profile', 'Email', 'Phone', 'Location', 'Experience Years',
    'Previous Companies', 'Education', 'Skills', 'Social Media', 'Bio',
    'Seniority Level', 'Department', 'Start Date', 'Salary Range'
  ],
  custom: [
    'Category', 'Tags', 'Priority', 'Status', 'Date Added', 'Source',
    'Notes', 'Contact Info', 'Location', 'Rating', 'Price', 'Features'
  ]
};

export const NewLeadTablePanel: React.FC<NewLeadTablePanelProps> = ({ 
  isOpen, 
  onClose, 
  onCreate 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tableType, setTableType] = useState<'companies' | 'people' | 'custom'>('companies');
  const [customType, setCustomType] = useState('');
  const [selectedEnrichments, setSelectedEnrichments] = useState<string[]>([]);
  const [customEnrichment, setCustomEnrichment] = useState('');

  const handleSubmit = () => {
    if (searchQuery.trim()) {
      onCreate(searchQuery.trim(), tableType, customType, selectedEnrichments);
      // Reset form
      setSearchQuery('');
      setTableType('companies');
      setCustomType('');
      setSelectedEnrichments([]);
      setCustomEnrichment('');
    }
  };

  const toggleEnrichment = (enrichment: string) => {
    setSelectedEnrichments(prev => 
      prev.includes(enrichment)
        ? prev.filter(e => e !== enrichment)
        : [...prev, enrichment]
    );
  };

  const addCustomEnrichment = () => {
    if (customEnrichment.trim() && !selectedEnrichments.includes(customEnrichment.trim())) {
      setSelectedEnrichments(prev => [...prev, customEnrichment.trim()]);
      setCustomEnrichment('');
    }
  };

  const removeEnrichment = (enrichment: string) => {
    setSelectedEnrichments(prev => prev.filter(e => e !== enrichment));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Find your perfect dataset</h2>
          </div>

          {/* Table Type Selection */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTableType('people')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                  tableType === 'people'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">People</span>
              </button>

              <button
                onClick={() => setTableType('companies')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                  tableType === 'companies'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Companies</span>
              </button>

              {tableType === 'custom' ? (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Custom type..."
                  className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-900 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setTableType('custom')}
                  className="p-3 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-all duration-200 text-center"
                >
                  <Settings className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Custom</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Query */}
          <div>
            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Agentic AI startups for home services..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            />
          </div>

          {/* Enrichments Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Enrichments</h3>

            {/* Selected Enrichments */}
            {selectedEnrichments.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex flex-wrap gap-2">
                  {selectedEnrichments.map((enrichment) => (
                    <span
                      key={enrichment}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {enrichment}
                      <button
                        onClick={() => removeEnrichment(enrichment)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Available Enrichments */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {AVAILABLE_ENRICHMENTS[tableType].map((enrichment) => (
                <button
                  key={enrichment}
                  onClick={() => toggleEnrichment(enrichment)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 text-left ${
                    selectedEnrichments.includes(enrichment)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {enrichment}
                </button>
              ))}
            </div>

            {/* Add Custom Enrichment */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customEnrichment}
                onChange={(e) => setCustomEnrichment(e.target.value)}
                placeholder="+ Custom"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEnrichment())}
              />
              <button
                onClick={addCustomEnrichment}
                disabled={!customEnrichment.trim()}
                className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!searchQuery.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
            >
              Start Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
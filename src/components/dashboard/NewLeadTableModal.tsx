import React, { useState } from 'react';
import { X, Building2, User, Settings, Plus, Trash2 } from 'lucide-react';

interface NewLeadTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, tableType: 'companies' | 'people' | 'custom', enrichments: string[]) => void;
}

// Base columns for each table type
const BASE_COLUMNS = {
  companies: ['Company Name', 'Website', 'Description'],
  people: ['Name', 'Job Title', 'Company'],
  custom: ['Name', 'Description', 'URL']
};

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

export const NewLeadTableModal: React.FC<NewLeadTableModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreate 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tableType, setTableType] = useState<'companies' | 'people' | 'custom'>('companies');
  const [selectedEnrichments, setSelectedEnrichments] = useState<string[]>([]);
  const [customEnrichment, setCustomEnrichment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim(), tableType, selectedEnrichments);
      // Reset form
      setName('');
      setDescription('');
      setTableType('companies');
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

  const handleTypeChange = (newType: 'companies' | 'people' | 'custom') => {
    setTableType(newType);
    setSelectedEnrichments([]); // Clear enrichments when changing type
  };

  const tableTypeOptions = [
    {
      id: 'companies' as const,
      label: 'Companies',
      icon: Building2,
      description: 'Track companies and organizations',
      baseColumns: BASE_COLUMNS.companies
    },
    {
      id: 'people' as const,
      label: 'People',
      icon: User,
      description: 'Track individuals and contacts',
      baseColumns: BASE_COLUMNS.people
    },
    {
      id: 'custom' as const,
      label: 'Custom',
      icon: Settings,
      description: 'Custom data structure',
      baseColumns: BASE_COLUMNS.custom
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Create New Lead Table</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Table Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., SaaS Companies, Tech Executives"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this table..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Table Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Table Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tableTypeOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleTypeChange(option.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      tableType === option.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <option.icon className={`w-5 h-5 mr-2 ${
                        tableType === option.id ? 'text-blue-600' : 'text-slate-500'
                      }`} />
                      <span className="font-semibold">{option.label}</span>
                    </div>
                    <p className="text-sm opacity-80 mb-2">{option.description}</p>
                    <div className="text-xs">
                      <span className="font-medium">Base columns:</span>
                      <div className="mt-1">
                        {option.baseColumns.map((col, idx) => (
                          <span key={col} className="inline-block">
                            {col}{idx < option.baseColumns.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Enrichments Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Enrichments
                </label>
                <span className="text-xs text-slate-500">
                  {selectedEnrichments.length} selected
                </span>
              </div>

              {/* Selected Enrichments */}
              {selectedEnrichments.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Selected Enrichments:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEnrichments.map((enrichment) => (
                      <span
                        key={enrichment}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                      >
                        {enrichment}
                        <button
                          type="button"
                          onClick={() => removeEnrichment(enrichment)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Enrichments */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                {AVAILABLE_ENRICHMENTS[tableType].map((enrichment) => (
                  <button
                    key={enrichment}
                    type="button"
                    onClick={() => toggleEnrichment(enrichment)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      selectedEnrichments.includes(enrichment)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {enrichment}
                  </button>
                ))}
              </div>

              {/* Custom Enrichment Input */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={customEnrichment}
                  onChange={(e) => setCustomEnrichment(e.target.value)}
                  placeholder="Add custom enrichment..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEnrichment())}
                />
                <button
                  type="button"
                  onClick={addCustomEnrichment}
                  disabled={!customEnrichment.trim()}
                  className="flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Table Preview:</h4>
              <div className="text-sm text-slate-600">
                <div className="mb-1">
                  <span className="font-medium">Columns:</span> {BASE_COLUMNS[tableType].length + selectedEnrichments.length} total
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  {[...BASE_COLUMNS[tableType], ...selectedEnrichments].map((col, idx) => (
                    <span key={col} className={`px-2 py-1 rounded ${
                      BASE_COLUMNS[tableType].includes(col) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
          >
            Create Table
          </button>
        </div>
      </div>
    </div>
  );
};
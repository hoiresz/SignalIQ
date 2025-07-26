import React, { useState } from 'react';
import { Download, Filter, Search, Building2, User, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Lead } from '../../types';

interface LeadsTableProps {
  leads: Lead[];
  onExportCSV: () => void;
  tableType?: 'companies' | 'people' | 'custom';
}

export const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onExportCSV, tableType = 'companies' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'company' | 'person'>('all');
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  // Get all unique columns from leads
  const getAllColumns = () => {
    const columns = new Set<string>();
    columns.add('name');
    columns.add('type');
    
    leads.forEach(lead => {
      Object.keys(lead.data).forEach(key => columns.add(key));
    });
    
    return Array.from(columns);
  };

  const columns = getAllColumns();

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.values(lead.data).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesType = filterType === 'all' || lead.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let aValue = sortColumn === 'name' ? a.name : 
                 sortColumn === 'type' ? a.type : 
                 a.data[sortColumn] || '';
    let bValue = sortColumn === 'name' ? b.name : 
                 sortColumn === 'type' ? b.type : 
                 b.data[sortColumn] || '';

    aValue = String(aValue).toLowerCase();
    bValue = String(bValue).toLowerCase();

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const formatColumnName = (column: string) => {
    return column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Controls Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
              {filteredLeads.length} of {leads.length} {getDisplayName(tableType, leads.length !== 1)}
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="company">{getDisplayName('companies', true)}</option>
                <option value="person">{getDisplayName('people', true)}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <button
            onClick={onExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${getDisplayName(tableType, true)}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Excel-style Table Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          {leads.length === 0 ? (
            // Empty state - return null to let Dashboard handle it
            null
          ) : (
            // Table with data
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  {columns.map((column, index) => (
                    <th
                      key={column}
                      className={`
                        px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider 
                        cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-200
                        ${index === 0 ? 'border-l border-gray-200' : ''}
                        min-w-[120px] max-w-[200px]
                      `}
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {column === 'type' && <Building2 className="w-3 h-3 mr-2 text-gray-500" />}
                          {column === 'name' && <User className="w-3 h-3 mr-2 text-gray-500" />}
                          <span className="truncate">{formatColumnName(column)}</span>
                        </div>
                        {sortColumn === column && (
                          <div className="ml-2">
                            {sortDirection === 'asc' ? (
                              <ChevronUp className="w-3 h-3 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-gray-600" />
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead, rowIndex) => (
                  <tr 
                    key={lead.id} 
                    className={`
                      hover:bg-blue-50 transition-colors border-b border-gray-200
                      ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    `}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={column}
                        className={`
                          px-4 py-3 text-sm border-r border-gray-200 align-top
                          ${colIndex === 0 ? 'border-l border-gray-200' : ''}
                          min-w-[120px] max-w-[200px]
                        `}
                      >
                        {column === 'name' ? (
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 ${
                              lead.type === 'company' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                              {lead.type === 'company' ? (
                                <Building2 className={`w-4 h-4 ${lead.type === 'company' ? 'text-blue-600' : 'text-purple-600'}`} />
                              ) : (
                                <User className={`w-4 h-4 ${lead.type === 'company' ? 'text-blue-600' : 'text-purple-600'}`} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">{lead.name}</div>
                              {lead.data.website && (
                                <a
                                  href={lead.data.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-xs flex items-center mt-1 transition-colors truncate"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{lead.data.website.replace(/^https?:\/\//, '')}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        ) : column === 'type' ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            lead.type === 'company' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {lead.type === 'company' ? (
                              <>
                                <Building2 className="w-3 h-3 mr-1" />
                                Company
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 mr-1" />
                                Person
                              </>
                            )}
                          </span>
                        ) : (
                          <div className={`${lead.data[column] ? 'text-gray-900' : 'text-gray-400'} ${
                            !lead.data[column] ? 'italic' : ''
                          }`}>
                            <span className="block truncate" title={formatCellValue(lead.data[column])}>
                              {formatCellValue(lead.data[column]) || '—'}
                            </span>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
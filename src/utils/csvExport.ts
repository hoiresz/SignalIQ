import { Lead } from '../types';

export const exportLeadsToCSV = (leads: Lead[]) => {
  if (leads.length === 0) {
    alert('No leads to export');
    return;
  }

  // Get all unique columns
  const columns = new Set<string>();
  columns.add('name');
  columns.add('type');
  
  leads.forEach(lead => {
    Object.keys(lead.data).forEach(key => columns.add(key));
  });

  const columnArray = Array.from(columns);

  // Create CSV content
  const headers = columnArray.map(col => 
    col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  );
  
  const csvContent = [
    headers.join(','),
    ...leads.map(lead => 
      columnArray.map(column => {
        let value = '';
        
        if (column === 'name') {
          value = lead.name;
        } else if (column === 'type') {
          value = lead.type;
        } else {
          value = lead.data[column] || '';
        }

        // Handle arrays
        if (Array.isArray(value)) {
          value = value.join('; ');
        }

        // Escape commas and quotes
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }

        return value;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `signaliq-data-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
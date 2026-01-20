import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';

const Table = ({ 
  columns, 
  data, 
  loading = false, 
  sortable = true, 
  onSort, 
  onRowClick,
  className = '' 
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const handleSort = (column) => {
    if (!sortable || !column.sortable) return;

    const newDirection = 
      sortConfig.key === column.key && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc';

    setSortConfig({ key: column.key, direction: newDirection });
    
    if (onSort) {
      onSort(column.key, newDirection);
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const renderCell = (column, row, index) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row, index);
    }

    if (column.format) {
      switch (column.format) {
        case 'date':
          return new Date(value).toLocaleDateString();
        case 'datetime':
          return new Date(value).toLocaleString();
        case 'currency':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value);
        default:
          return value;
      }
    }

    return value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 select-none">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${sortable && column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                `}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.title}</span>
                  {sortable && column.sortable && (
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`w-3 h-3 -mb-1 ${
                          sortConfig.key === column.key && sortConfig.direction === 'asc'
                            ? 'text-primary-600'
                            : 'text-gray-400'
                        }`}
                      />
                      <ChevronDown 
                        className={`w-3 h-3 ${
                          sortConfig.key === column.key && sortConfig.direction === 'desc'
                            ? 'text-primary-600'
                            : 'text-gray-400'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((row, index) => (
            <motion.tr
              key={row.id || index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={`
                ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              `}
              onMouseDown={(e) => {
                if (onRowClick) e.preventDefault();
              }}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {renderCell(column, row, index)}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
      
      {data.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
};

export default Table;

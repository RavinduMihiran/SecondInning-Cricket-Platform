import React, { useState } from 'react';
import { FaMapMarkerAlt, FaFilter, FaTimes } from 'react-icons/fa';
import { sriLankaDistricts } from '../utils/districtUtils';

/**
 * A component for filtering content by Sri Lanka districts
 * 
 * @param {Object} props
 * @param {string} props.selectedDistrict - Currently selected district
 * @param {Function} props.onDistrictChange - Function called when district selection changes
 * @param {string} props.label - Label for the filter
 * @param {boolean} props.showLabel - Whether to show the label
 * @param {boolean} props.compact - Whether to use compact mode
 */
const DistrictFilter = ({
  selectedDistrict = '',
  onDistrictChange,
  label = 'Filter by District',
  showLabel = true,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDistrictClick = (district) => {
    onDistrictChange(district);
    setIsOpen(false);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onDistrictChange('');
  };

  return (
    <div className="district-filter relative">
      {showLabel && !compact && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div 
        className={`flex items-center ${compact ? 'btn btn-sm' : 'border rounded-md p-2'} ${selectedDistrict ? 'bg-blue-50 border-blue-300' : 'bg-white'} cursor-pointer`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaMapMarkerAlt className={`${selectedDistrict ? 'text-blue-500' : 'text-gray-400'} mr-2`} />
        
        {selectedDistrict ? (
          <div className="flex items-center justify-between flex-1">
            <span className="text-sm font-medium">{selectedDistrict}</span>
            <button 
              className="ml-2 text-gray-400 hover:text-gray-600" 
              onClick={clearSelection}
              aria-label="Clear selection"
            >
              <FaTimes size={12} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-1">
            <span className="text-sm text-gray-500">{compact ? 'District' : 'All Districts'}</span>
            <FaFilter className="text-gray-400 ml-2" size={12} />
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-200">
          {/* "All Districts" option */}
          <div
            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${!selectedDistrict ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
            onClick={() => handleDistrictClick('')}
          >
            All Districts
          </div>
          
          {/* District options grouped by province */}
          <div className="border-t border-gray-200 pt-1 mt-1">
            <div className="px-3 py-1 text-xs font-semibold text-gray-500">Northern Province</div>
            {['Jaffna', 'Kilinochchi', 'Mullaitivu', 'Mannar', 'Vavuniya'].map(district => (
              <div
                key={district}
                className={`cursor-pointer select-none relative py-2 pl-8 pr-4 hover:bg-gray-100 ${selectedDistrict === district ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                onClick={() => handleDistrictClick(district)}
              >
                {district}
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-1 mt-1">
            <div className="px-3 py-1 text-xs font-semibold text-gray-500">Eastern Province</div>
            {['Trincomalee', 'Batticaloa', 'Ampara'].map(district => (
              <div
                key={district}
                className={`cursor-pointer select-none relative py-2 pl-8 pr-4 hover:bg-gray-100 ${selectedDistrict === district ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                onClick={() => handleDistrictClick(district)}
              >
                {district}
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-1 mt-1">
            <div className="px-3 py-1 text-xs font-semibold text-gray-500">Other Provinces</div>
            {sriLankaDistricts
              .filter(d => !['Jaffna', 'Kilinochchi', 'Mullaitivu', 'Mannar', 'Vavuniya', 'Trincomalee', 'Batticaloa', 'Ampara'].includes(d))
              .map(district => (
                <div
                  key={district}
                  className={`cursor-pointer select-none relative py-2 pl-8 pr-4 hover:bg-gray-100 ${selectedDistrict === district ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                  onClick={() => handleDistrictClick(district)}
                >
                  {district}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictFilter; 
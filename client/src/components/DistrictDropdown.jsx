import React from 'react';
import { sriLankaDistricts } from '../utils/districtUtils';
import { FaMapMarkerAlt } from 'react-icons/fa';

/**
 * A reusable dropdown component for selecting districts in Sri Lanka
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - The currently selected district value
 * @param {function} props.onChange - Function to call when selection changes
 * @param {string} props.name - Name attribute for the select element
 * @param {string} props.id - ID attribute for the select element
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.placeholder - Placeholder text for empty option
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.disabled - Whether the field is disabled
 * @param {Object} props.labelProps - Props for the label element
 * @param {string} props.labelText - Text for the label
 */
const DistrictDropdown = ({
  value = '',
  onChange,
  name = 'district',
  id = 'district',
  className = '',
  placeholder = 'Select District',
  required = false,
  disabled = false,
  labelProps = {},
  labelText = 'District'
}) => {
  return (
    <div className="district-dropdown-container">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaMapMarkerAlt className="text-gray-400" />
        </div>
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={`input w-full pl-10 appearance-none ${className}`}
          required={required}
          disabled={disabled}
          style={{ 
            backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
            backgroundPosition: "right 0.5rem center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "1.5em 1.5em",
            paddingRight: "2.5rem"
          }}
        >
          <option value="">{placeholder}</option>
          {sriLankaDistricts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>
      
      <style jsx>{`
        .district-dropdown-container select {
          scrollbar-width: thin;
          scrollbar-color: #4f46e5 #f3f4f6;
        }
        
        .district-dropdown-container select:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 1px #4f46e5;
        }
        
        /* For Webkit browsers like Chrome/Safari */
        .district-dropdown-container select::-webkit-scrollbar {
          width: 8px;
        }
        
        .district-dropdown-container select::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        
        .district-dropdown-container select::-webkit-scrollbar-thumb {
          background-color: #4f46e5;
          border-radius: 4px;
          border: 2px solid #f3f4f6;
        }
      `}</style>
    </div>
  );
};

export default DistrictDropdown; 
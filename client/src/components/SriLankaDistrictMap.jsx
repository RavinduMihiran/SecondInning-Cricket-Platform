import React from 'react';
import { sriLankaDistricts } from '../utils/districtUtils';

/**
 * A simple visual representation of Sri Lanka with districts
 * The selected district is highlighted
 * 
 * @param {Object} props
 * @param {string} props.selectedDistrict - The currently selected district
 */
const SriLankaDistrictMap = ({ selectedDistrict }) => {
  // Group districts by region for visualization
  const northernDistricts = ['Jaffna', 'Kilinochchi', 'Mullaitivu', 'Mannar', 'Vavuniya'];
  const easternDistricts = ['Trincomalee', 'Batticaloa', 'Ampara'];
  const centralDistricts = ['Kandy', 'Matale', 'Nuwara Eliya'];
  const northCentralDistricts = ['Anuradhapura', 'Polonnaruwa'];
  const northWesternDistricts = ['Kurunegala', 'Puttalam'];
  const southernDistricts = ['Galle', 'Matara', 'Hambantota'];
  const westernDistricts = ['Colombo', 'Gampaha', 'Kalutara'];
  const sabaragamuwaDistricts = ['Kegalle', 'Ratnapura'];
  const uvaDistricts = ['Badulla', 'Monaragala'];

  // Helper function to check if a district is selected
  const isSelected = (district) => district === selectedDistrict;

  // Helper function to get district style
  const getDistrictStyle = (district) => {
    return {
      padding: '8px',
      margin: '2px',
      borderRadius: '4px',
      fontSize: '12px',
      textAlign: 'center',
      backgroundColor: isSelected(district) ? '#4f46e5' : '#e5e7eb',
      color: isSelected(district) ? 'white' : '#374151',
      fontWeight: isSelected(district) ? 'bold' : 'normal',
      cursor: 'default',
      transition: 'all 0.2s ease',
    };
  };

  // Helper function to render a district group
  const renderDistrictGroup = (title, districts, color) => {
    return (
      <div className="mb-3">
        <div className="text-xs font-medium mb-1" style={{ color }}>
          {title}
        </div>
        <div className="flex flex-wrap">
          {districts.map(district => (
            <div key={district} style={getDistrictStyle(district)}>
              {district}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="sri-lanka-map border rounded-lg p-4 bg-gray-50">
      <div className="text-sm font-medium text-gray-700 mb-3 text-center">
        Sri Lanka Districts Map
      </div>
      
      <div className="districts-container">
        {renderDistrictGroup('Northern Province', northernDistricts, '#2563eb')}
        {renderDistrictGroup('Eastern Province', easternDistricts, '#9333ea')}
        {renderDistrictGroup('Central Province', centralDistricts, '#16a34a')}
        {renderDistrictGroup('North Central Province', northCentralDistricts, '#ca8a04')}
        {renderDistrictGroup('North Western Province', northWesternDistricts, '#c2410c')}
        {renderDistrictGroup('Southern Province', southernDistricts, '#0891b2')}
        {renderDistrictGroup('Western Province', westernDistricts, '#be123c')}
        {renderDistrictGroup('Sabaragamuwa Province', sabaragamuwaDistricts, '#4d7c0f')}
        {renderDistrictGroup('Uva Province', uvaDistricts, '#7c2d12')}
      </div>
      
      {!selectedDistrict && (
        <div className="text-center text-gray-500 text-xs mt-3">
          Select a district to see it highlighted on the map
        </div>
      )}
      
      {selectedDistrict && (
        <div className="text-center mt-3">
          <div className="text-xs font-medium text-gray-700">Selected District:</div>
          <div className="text-sm font-bold text-indigo-600">{selectedDistrict}</div>
        </div>
      )}
    </div>
  );
};

export default SriLankaDistrictMap; 
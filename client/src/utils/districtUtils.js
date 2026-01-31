/**
 * List of all 24 districts in Sri Lanka
 */
export const sriLankaDistricts = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee'
];

/**
 * Get district options for dropdown menus
 * @param {boolean} includeEmpty - Whether to include an empty option at the beginning
 * @param {string} emptyLabel - Label for the empty option
 * @returns {Array} - Array of district options
 */
export const getDistrictOptions = (includeEmpty = true, emptyLabel = 'Select District') => {
  const options = sriLankaDistricts.map(district => ({
    value: district,
    label: district
  }));
  
  if (includeEmpty) {
    return [{ value: '', label: emptyLabel }, ...options];
  }
  
  return options;
};

export default {
  sriLankaDistricts,
  getDistrictOptions
}; 
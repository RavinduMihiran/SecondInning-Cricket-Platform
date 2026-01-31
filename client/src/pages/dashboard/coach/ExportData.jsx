import { useState } from 'react';
import { FaDownload, FaSpinner, FaFileExport, FaTable, FaChartBar } from 'react-icons/fa';
import axios from 'axios';

const ExportData = () => {
  const [loading, setLoading] = useState({
    watchlist: false
  });

  // Handle export watchlist
  const handleExportWatchlist = async () => {
    try {
      setLoading(prev => ({ ...prev, watchlist: true }));
      
      const response = await axios.get('/api/coaches/export/watchlist');
      
      // Create a downloadable file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `watchlist_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error exporting watchlist:', err);
      alert('Failed to export watchlist. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, watchlist: false }));
    }
  };

  // Function to convert JSON to CSV
  const convertToCSV = (data) => {
    if (!data || !data.length) return '';
    
    // Get headers
    const headers = Object.keys(data[0]);
    
    // Create CSV rows
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Handle strings with commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  // Handle export watchlist as CSV
  const handleExportWatchlistCSV = async () => {
    try {
      setLoading(prev => ({ ...prev, watchlist: true }));
      
      const response = await axios.get('/api/coaches/export/watchlist');
      
      // Convert to CSV
      const csv = convertToCSV(response.data);
      
      // Create a downloadable file
      const dataBlob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `watchlist_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error exporting watchlist as CSV:', err);
      alert('Failed to export watchlist as CSV. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, watchlist: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Export Data</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Watchlist Export */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <FaTable className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Watchlist Data</h2>
              <p className="text-sm text-gray-500">Export your player watchlist</p>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            Export all players in your watchlist with their stats and your notes. 
            Choose from JSON or CSV format.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={handleExportWatchlist}
              disabled={loading.watchlist}
              className="btn btn-primary flex items-center"
            >
              {loading.watchlist ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaDownload className="mr-2" />
              )}
              Export as JSON
            </button>
            
            <button
              onClick={handleExportWatchlistCSV}
              disabled={loading.watchlist}
              className="btn btn-outline flex items-center"
            >
              {loading.watchlist ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaFileExport className="mr-2" />
              )}
              Export as CSV
            </button>
          </div>
        </div>
        
        {/* Player Ratings Export */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <FaChartBar className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Player Ratings</h2>
              <p className="text-sm text-gray-500">Export your player ratings</p>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            Export all your player ratings including overall, batting, bowling, fielding, 
            and fitness scores along with tags and notes.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={() => alert('This feature is coming soon!')}
              className="btn btn-primary flex items-center"
            >
              <FaDownload className="mr-2" />
              Export as JSON
            </button>
            
            <button
              onClick={() => alert('This feature is coming soon!')}
              className="btn btn-outline flex items-center"
            >
              <FaFileExport className="mr-2" />
              Export as CSV
            </button>
          </div>
        </div>
      </div>

      {/* Additional Export Options */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">More Export Options</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 cursor-pointer">
            <h3 className="font-medium mb-2">Player Comparison</h3>
            <p className="text-sm text-gray-500 mb-2">
              Export side-by-side player comparison data
            </p>
            <button 
              onClick={() => alert('This feature is coming soon!')}
              className="text-primary text-sm hover:underline flex items-center"
            >
              <FaDownload className="mr-1" size={12} />
              Coming Soon
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 cursor-pointer">
            <h3 className="font-medium mb-2">Performance Reports</h3>
            <p className="text-sm text-gray-500 mb-2">
              Export detailed player performance reports
            </p>
            <button 
              onClick={() => alert('This feature is coming soon!')}
              className="text-primary text-sm hover:underline flex items-center"
            >
              <FaDownload className="mr-1" size={12} />
              Coming Soon
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 cursor-pointer">
            <h3 className="font-medium mb-2">Talent Scouting Report</h3>
            <p className="text-sm text-gray-500 mb-2">
              Generate comprehensive scouting reports
            </p>
            <button 
              onClick={() => alert('This feature is coming soon!')}
              className="text-primary text-sm hover:underline flex items-center"
            >
              <FaDownload className="mr-1" size={12} />
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportData; 
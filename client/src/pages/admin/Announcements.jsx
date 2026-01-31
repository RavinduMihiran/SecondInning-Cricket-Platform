import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCalendar, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    isActive: true,
    startDate: '',
    endDate: '',
    location: '',
    image: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/api/admin/announcements');
      
      setAnnouncements(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Failed to load announcements');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const openCreateModal = () => {
    setCurrentAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      type: 'general',
      isActive: true,
      startDate: '',
      endDate: '',
      location: '',
      image: ''
    });
    setShowModal(true);
  };

  const openEditModal = (announcement) => {
    setCurrentAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      isActive: announcement.isActive,
      startDate: announcement.startDate ? new Date(announcement.startDate).toISOString().split('T')[0] : '',
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().split('T')[0] : '',
      location: announcement.location || '',
      image: announcement.image || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentAnnouncement) {
        // Update existing announcement
        await api.put(
          `/api/admin/announcements/${currentAnnouncement._id}`,
          formData
        );
        
        // Update the announcement in the state
        setAnnouncements(announcements.map(item => 
          item._id === currentAnnouncement._id ? { ...item, ...formData } : item
        ));
        
        toast.success('Announcement updated successfully');
      } else {
        // Create new announcement
        const response = await api.post(
          '/api/admin/announcements',
          formData
        );
        
        // Add the new announcement to the state
        setAnnouncements([response.data, ...announcements]);
        
        toast.success('Announcement created successfully');
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }
    
    try {
      await api.delete(`/api/admin/announcements/${id}`);
      
      // Remove the announcement from the state
      setAnnouncements(announcements.filter(item => item._id !== id));
      
      toast.success('Announcement deleted successfully');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      case 'update':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          <FiPlus className="mr-2" />
          New Announcement
        </button>
      </div>
      
      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No announcements found. Create your first announcement!</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div 
              key={announcement._id} 
              className={`bg-gray-800 rounded-lg overflow-hidden border ${
                announcement.isActive ? 'border-gray-700' : 'border-red-800 opacity-75'
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(announcement.type)}`}>
                      {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                    </span>
                    
                    <h2 className="text-xl font-bold text-white mt-2">{announcement.title}</h2>
                    
                    <div className="mt-2 text-gray-300 whitespace-pre-wrap">
                      {announcement.content.length > 150 
                        ? `${announcement.content.substring(0, 150)}...` 
                        : announcement.content}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-400">
                      {announcement.startDate && (
                        <div className="flex items-center">
                          <FiCalendar className="mr-1" />
                          <span>
                            {new Date(announcement.startDate).toLocaleDateString()}
                            {announcement.endDate && ` - ${new Date(announcement.endDate).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                      
                      {announcement.location && (
                        <div className="flex items-center">
                          <FiMapPin className="mr-1" />
                          <span>{announcement.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(announcement)}
                      className="p-2 text-blue-500 hover:text-blue-600"
                      title="Edit Announcement"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement._id)}
                      className="p-2 text-red-500 hover:text-red-600"
                      title="Delete Announcement"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  Created: {new Date(announcement.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="max-w-3xl w-full p-4" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {currentAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <FiX size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 md:col-span-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter announcement title"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Content
                      </label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows="5"
                        className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter announcement content"
                        required
                      ></textarea>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="general">General</option>
                      <option value="trial">Trial</option>
                      <option value="event">Event</option>
                      <option value="update">Update</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Status
                    </label>
                    <div className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
                      />
                      <label htmlFor="isActive" className="ml-2 text-gray-300">
                        Active
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter location (optional)"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter image URL (optional)"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    {currentAnnouncement ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements; 
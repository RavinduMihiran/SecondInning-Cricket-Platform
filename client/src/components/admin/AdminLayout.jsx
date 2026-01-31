import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { FiUsers, FiHome, FiImage, FiMessageSquare, FiBarChart2, FiLogOut, FiMenu, FiX, FiServer, FiSettings, FiShield, FiActivity } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for admin token on component mount
  useEffect(() => {
    checkAdminAuth();
  }, [navigate]);
  
  const checkAdminAuth = () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      toast.error('Please login to access the admin panel');
      navigate('/admin/login');
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };
  
  const navItems = [
    { path: '/admin/dashboard', icon: <FiHome size={20} />, label: 'Dashboard' },
    { path: '/admin/users', icon: <FiUsers size={20} />, label: 'User Management' },
    { path: '/admin/media', icon: <FiImage size={20} />, label: 'Media Moderation' },
    { path: '/admin/announcements', icon: <FiMessageSquare size={20} />, label: 'Announcements' },
    { path: '/admin/activity', icon: <FiActivity size={20} />, label: 'Activity Logs' },
    { path: '/admin/system', icon: <FiServer size={20} />, label: 'System Management' },
    { path: '/admin/analytics', icon: <FiBarChart2 size={20} />, label: 'Analytics' },
    { path: '/admin/settings', icon: <FiSettings size={20} />, label: 'Settings' },
    { path: '/admin/security', icon: <FiShield size={20} />, label: 'Security' },
  ];
  
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 focus:outline-none"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
      
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:static lg:translate-x-0 z-40 h-full w-64 bg-gray-800 transition-transform duration-300 ease-in-out overflow-y-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-blue-500">Admin Panel</h1>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-md ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          
          {/* Logout button */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-md text-gray-300 hover:bg-gray-700"
            >
              <FiLogOut size={20} className="mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-gray-800 shadow-md">
          <div className="px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cricket Admin Dashboard</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Admin</span>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="font-medium">A</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 
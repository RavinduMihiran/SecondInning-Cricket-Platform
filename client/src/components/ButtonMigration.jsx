import { useState } from 'react';
import Button from './Button';
import IconButton from './IconButton';
import TabButton from './TabButton';
import { FaCode, FaPlus, FaSearch, FaEdit, FaSave, FaTrash, FaSyncAlt } from 'react-icons/fa';

/**
 * Component that demonstrates button migration patterns
 * This is a reference component to help developers migrate from old button styles to new components
 */
const ButtonMigration = () => {
  const [activeTab, setActiveTab] = useState('standard');
  
  return (
    <div className="p-8 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Button Migration Guide</h2>
      
      <div className="border-b mb-6">
        <div className="flex">
          <TabButton 
            isActive={activeTab === 'standard'}
            onClick={() => setActiveTab('standard')}
          >
            Standard Buttons
          </TabButton>
          <TabButton 
            isActive={activeTab === 'icon'}
            onClick={() => setActiveTab('icon')}
          >
            Icon Buttons
          </TabButton>
          <TabButton 
            isActive={activeTab === 'tabs'}
            onClick={() => setActiveTab('tabs')}
          >
            Tab Buttons
          </TabButton>
        </div>
      </div>
      
      {activeTab === 'standard' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Primary Buttons</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">Old Style</h4>
                <div className="mb-2">
                  <button className="btn btn-primary">Primary Button</button>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<button className="btn btn-primary">Primary Button</button>'}
                </pre>
              </div>
              
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">New Style</h4>
                <div className="mb-2">
                  <Button variant="primary">Primary Button</Button>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<Button variant="primary">Primary Button</Button>'}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Button with Icon</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">Old Style</h4>
                <div className="mb-2">
                  <button className="btn btn-primary flex items-center">
                    <FaPlus className="mr-2" /> Add New
                  </button>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<button className="btn btn-primary flex items-center">\n  <FaPlus className="mr-2" /> Add New\n</button>'}
                </pre>
              </div>
              
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">New Style</h4>
                <div className="mb-2">
                  <Button variant="primary" leftIcon={<FaPlus />}>Add New</Button>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<Button variant="primary" leftIcon={<FaPlus />}>Add New</Button>'}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Link Button</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">Old Style</h4>
                <div className="mb-2">
                  <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>'}
                </pre>
              </div>
              
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">New Style</h4>
                <div className="mb-2">
                  <Button variant="primary" to="/dashboard">Go to Dashboard</Button>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<Button variant="primary" to="/dashboard">Go to Dashboard</Button>'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'icon' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Icon Only Button</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">Old Style</h4>
                <div className="mb-2">
                  <button className="p-2 rounded-full hover:bg-gray-100" title="Edit">
                    <FaEdit className="text-gray-600" />
                  </button>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<button className="p-2 rounded-full hover:bg-gray-100" title="Edit">\n  <FaEdit className="text-gray-600" />\n</button>'}
                </pre>
              </div>
              
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">New Style</h4>
                <div className="mb-2">
                  <IconButton icon={<FaEdit />} variant="ghost" ariaLabel="Edit" />
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<IconButton icon={<FaEdit />} variant="ghost" ariaLabel="Edit" />'}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Action Icons</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">Old Style</h4>
                <div className="mb-2 flex space-x-2">
                  <button className="p-2 rounded-full hover:bg-gray-100" title="Edit">
                    <FaEdit className="text-blue-500" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100" title="Delete">
                    <FaTrash className="text-red-500" />
                  </button>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<div className="flex space-x-2">\n  <button className="p-2 rounded-full hover:bg-gray-100" title="Edit">\n    <FaEdit className="text-blue-500" />\n  </button>\n  <button className="p-2 rounded-full hover:bg-gray-100" title="Delete">\n    <FaTrash className="text-red-500" />\n  </button>\n</div>'}
                </pre>
              </div>
              
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">New Style</h4>
                <div className="mb-2 flex space-x-2">
                  <IconButton icon={<FaEdit className="text-blue-500" />} variant="ghost" ariaLabel="Edit" />
                  <IconButton icon={<FaTrash className="text-red-500" />} variant="ghost" ariaLabel="Delete" />
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<div className="flex space-x-2">\n  <IconButton icon={<FaEdit className="text-blue-500" />} variant="ghost" ariaLabel="Edit" />\n  <IconButton icon={<FaTrash className="text-red-500" />} variant="ghost" ariaLabel="Delete" />\n</div>'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'tabs' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tab Navigation</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">Old Style</h4>
                <div className="mb-2 border-b">
                  <button className="py-2 px-4 font-medium border-b-2 border-primary text-primary">
                    Active Tab
                  </button>
                  <button className="py-2 px-4 font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                    Inactive Tab
                  </button>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<div className="border-b">\n  <button className="py-2 px-4 font-medium border-b-2 border-primary text-primary">\n    Active Tab\n  </button>\n  <button className="py-2 px-4 font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">\n    Inactive Tab\n  </button>\n</div>'}
                </pre>
              </div>
              
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">New Style</h4>
                <div className="mb-2 border-b">
                  <TabButton isActive={true} onClick={() => {}}>Active Tab</TabButton>
                  <TabButton isActive={false} onClick={() => {}}>Inactive Tab</TabButton>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<div className="border-b">\n  <TabButton isActive={true} onClick={() => {}}>\n    Active Tab\n  </TabButton>\n  <TabButton isActive={false} onClick={() => {}}>\n    Inactive Tab\n  </TabButton>\n</div>'}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tab with Icons</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">Old Style</h4>
                <div className="mb-2 border-b">
                  <button className="py-2 px-4 font-medium border-b-2 border-primary text-primary">
                    <FaCode className="inline mr-2" /> Code
                  </button>
                  <button className="py-2 px-4 font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                    <FaSearch className="inline mr-2" /> Search
                  </button>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<div className="border-b">\n  <button className="py-2 px-4 font-medium border-b-2 border-primary text-primary">\n    <FaCode className="inline mr-2" /> Code\n  </button>\n  <button className="py-2 px-4 font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">\n    <FaSearch className="inline mr-2" /> Search\n  </button>\n</div>'}
                </pre>
              </div>
              
              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2 text-gray-500">New Style</h4>
                <div className="mb-2 border-b">
                  <TabButton isActive={true} onClick={() => {}} icon={<FaCode />}>Code</TabButton>
                  <TabButton isActive={false} onClick={() => {}} icon={<FaSearch />}>Search</TabButton>
                </div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {'<div className="border-b">\n  <TabButton isActive={true} onClick={() => {}} icon={<FaCode />}>\n    Code\n  </TabButton>\n  <TabButton isActive={false} onClick={() => {}} icon={<FaSearch />}>\n    Search\n  </TabButton>\n</div>'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ButtonMigration; 
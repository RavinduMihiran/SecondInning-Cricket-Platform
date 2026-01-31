import { FaPlus, FaSearch, FaDownload, FaArrowRight, FaEdit, FaTrash } from 'react-icons/fa';
import Button from './Button';
import TabButton from './TabButton';
import IconButton from './IconButton';

/**
 * Example component showcasing all button variants and styles
 * This is for documentation purposes - not intended to be included in the actual app
 */
const ButtonExample = () => {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Standard Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="outline-secondary">Outline Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="info">Info</Button>
          <Button variant="error">Error</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Button Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary" size="xs">Extra Small</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button variant="primary" size="xl">Extra Large</Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Buttons with Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" leftIcon={<FaPlus />}>Create New</Button>
          <Button variant="outline" leftIcon={<FaSearch />}>Search</Button>
          <Button variant="success" rightIcon={<FaDownload />}>Download</Button>
          <Button variant="secondary" rightIcon={<FaArrowRight />}>Next Step</Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Loading Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" isLoading>Loading</Button>
          <Button variant="outline" isLoading>Loading</Button>
          <Button variant="secondary" isLoading>Saving</Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Disabled Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="outline" disabled>Disabled</Button>
          <Button variant="secondary" disabled leftIcon={<FaPlus />}>Disabled</Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Full Width Button</h2>
        <Button variant="primary" fullWidth>Full Width Button</Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Pill Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" pill>Pill Button</Button>
          <Button variant="outline" pill leftIcon={<FaPlus />}>Create New</Button>
          <Button variant="success" pill size="sm">Small Pill</Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Link Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" to="/dashboard">Dashboard Link</Button>
          <Button variant="outline" href="https://example.com" target="_blank">External Link</Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Icon Buttons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <IconButton icon={<FaEdit />} variant="ghost" ariaLabel="Edit" />
          <IconButton icon={<FaTrash />} variant="outline" ariaLabel="Delete" />
          <IconButton icon={<FaPlus />} variant="primary" ariaLabel="Add" />
          <IconButton icon={<FaSearch />} variant="secondary" size="lg" ariaLabel="Search" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Tab Buttons</h2>
        <div className="border-b flex">
          <TabButton isActive={true} onClick={() => {}}>All Files</TabButton>
          <TabButton isActive={false} onClick={() => {}} icon={<FaSearch />}>Images</TabButton>
          <TabButton isActive={false} onClick={() => {}}>Videos</TabButton>
          <TabButton isActive={false} onClick={() => {}}>Documents</TabButton>
        </div>
      </div>
    </div>
  );
};

export default ButtonExample; 
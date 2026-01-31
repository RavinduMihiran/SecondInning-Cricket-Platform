import { forwardRef } from 'react';

/**
 * TabButton component for consistent tab button styling across the application
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - Whether the tab is currently active
 * @param {function} props.onClick - Click handler function
 * @param {React.ReactNode} [props.icon] - Optional icon to display
 * @param {string} [props.className] - Additional classes to apply
 */
const TabButton = forwardRef(({
  children,
  isActive,
  onClick,
  icon,
  className = '',
  ...rest
}, ref) => {
  // Combine classes
  const tabClasses = [
    'btn-tab',
    isActive ? 'btn-tab-active' : 'btn-tab-inactive',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={tabClasses}
      onClick={onClick}
      ref={ref}
      {...rest}
    >
      {icon && <span className={`inline-block ${children ? 'mr-2' : ''}`}>{icon}</span>}
      {children}
    </button>
  );
});

TabButton.displayName = 'TabButton';

export default TabButton; 
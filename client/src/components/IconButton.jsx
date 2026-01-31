import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * IconButton component for consistent icon button styling across the application
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - The icon to display
 * @param {string} [props.variant='ghost'] - Button style variant
 * @param {string} [props.size='md'] - Button size
 * @param {string} [props.to] - If provided, button renders as a Link
 * @param {string} [props.href] - If provided, button renders as an anchor tag
 * @param {string} [props.className] - Additional classes to apply
 * @param {string} [props.ariaLabel] - Accessible label for the button
 */
const IconButton = forwardRef(({
  icon,
  variant = 'ghost',
  size = 'md',
  to,
  href,
  className = '',
  ariaLabel,
  ...rest
}, ref) => {
  // Map size to pixel values
  const sizeClasses = {
    xs: 'p-1 text-xs',
    sm: 'p-1.5 text-sm',
    md: 'p-2 text-base',
    lg: 'p-2.5 text-lg',
    xl: 'p-3 text-xl'
  };

  // Base classes
  const baseClasses = [
    'btn-icon',
    `btn-${variant}`,
    sizeClasses[size] || sizeClasses.md,
    className
  ].filter(Boolean).join(' ');

  // If to is provided, render as Link
  if (to) {
    return (
      <Link 
        to={to} 
        className={baseClasses} 
        ref={ref} 
        aria-label={ariaLabel}
        {...rest}
      >
        {icon}
      </Link>
    );
  }

  // If href is provided, render as anchor
  if (href) {
    return (
      <a 
        href={href} 
        className={baseClasses} 
        ref={ref} 
        aria-label={ariaLabel}
        {...rest}
      >
        {icon}
      </a>
    );
  }

  // Otherwise render as button
  return (
    <button 
      type="button" 
      className={baseClasses} 
      ref={ref} 
      aria-label={ariaLabel}
      {...rest}
    >
      {icon}
    </button>
  );
});

IconButton.displayName = 'IconButton';

export default IconButton; 
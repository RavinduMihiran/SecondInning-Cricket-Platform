import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Button component for consistent button styling across the application
 * 
 * @param {Object} props - Component props
 * @param {string} [props.variant='primary'] - Button style variant
 * @param {string} [props.size='md'] - Button size
 * @param {boolean} [props.isLoading] - Whether button is in loading state
 * @param {React.ReactNode} [props.leftIcon] - Icon to display on the left
 * @param {React.ReactNode} [props.rightIcon] - Icon to display on the right
 * @param {string} [props.to] - If provided, button renders as a Link
 * @param {string} [props.href] - If provided, button renders as an anchor tag
 * @param {string} [props.className] - Additional classes to apply
 * @param {boolean} [props.fullWidth] - Whether button should take full width
 * @param {boolean} [props.pill] - Whether button should have pill shape
 * @param {boolean} [props.isIcon] - Whether button is an icon button
 */
const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  to,
  href,
  className = '',
  fullWidth = false,
  pill = false,
  isIcon = false,
  type = 'button',
  ...rest
}, ref) => {
  // Base classes for all button types
  const baseClasses = [
    'btn',
    `btn-${variant}`,
    isIcon ? 'btn-icon' : `btn-${size}`,
    fullWidth ? 'w-full' : '',
    pill ? 'btn-pill' : '',
    className
  ].filter(Boolean).join(' ');

  // Content to render inside the button
  const content = (
    <>
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </>
  );

  // If to is provided, render as Link
  if (to) {
    return (
      <Link to={to} className={baseClasses} ref={ref} {...rest}>
        {content}
      </Link>
    );
  }

  // If href is provided, render as anchor
  if (href) {
    return (
      <a href={href} className={baseClasses} ref={ref} {...rest}>
        {content}
      </a>
    );
  }

  // Otherwise render as button
  return (
    <button type={type} className={baseClasses} ref={ref} disabled={isLoading || rest.disabled} {...rest}>
      {content}
    </button>
  );
});

Button.displayName = 'Button';

export default Button; 
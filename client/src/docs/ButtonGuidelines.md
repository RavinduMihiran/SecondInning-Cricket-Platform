# Button Styling Guidelines for SecondInning Cricket Platform

This document provides guidelines for using buttons consistently across the SecondInning cricket platform.

## Component Overview

We have three main button components:

1. **Button** - Standard button for most actions
2. **IconButton** - For icon-only buttons
3. **TabButton** - For tab-style navigation

## When to Use Each Button Type

### Standard Button (`Button` component)

Use the standard Button component for:
- Primary actions (submit, save, create)
- Secondary actions (cancel, back)
- Navigation that requires emphasis

```jsx
import Button from '../components/Button';

// Primary action
<Button variant="primary">Save Changes</Button>

// With icon
<Button variant="primary" leftIcon={<FaPlus />}>Create New</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// As a link
<Button variant="primary" to="/dashboard">Go to Dashboard</Button>
```

### Icon Button (`IconButton` component)

Use the IconButton component for:
- UI actions where space is limited
- Actions where the icon clearly communicates the purpose
- Toolbar actions
- Small actions next to content

```jsx
import IconButton from '../components/IconButton';

// Basic icon button
<IconButton 
  icon={<FaEdit />} 
  variant="ghost" 
  ariaLabel="Edit item" 
  onClick={handleEdit} 
/>

// Icon button with different style
<IconButton 
  icon={<FaTrash />} 
  variant="outline" 
  ariaLabel="Delete item" 
  onClick={handleDelete}
/>
```

### Tab Button (`TabButton` component)

Use the TabButton component for:
- Tab navigation
- Filter selection
- Content category selection

```jsx
import TabButton from '../components/TabButton';

// Basic tab button
<TabButton 
  isActive={activeTab === 'profile'} 
  onClick={() => setActiveTab('profile')}
>
  Profile
</TabButton>

// Tab with icon
<TabButton 
  isActive={activeTab === 'settings'} 
  onClick={() => setActiveTab('settings')}
  icon={<FaCog />}
>
  Settings
</TabButton>
```

## Button Variants

Choose the appropriate button variant based on the action's importance:

1. **Primary (`variant="primary"`)** - Main action on a page or form
2. **Secondary (`variant="secondary"`)** - Alternative main action
3. **Outline (`variant="outline"`)** - Secondary actions or less emphasis
4. **Ghost (`variant="ghost"`)** - Subtle actions integrated with content
5. **Link (`variant="link"`)** - Navigation that looks like a text link

## Button Sizes

Choose the appropriate size based on context:

- **xs** - Very compact UI areas
- **sm** - Tables, cards, compact layouts
- **md** (default) - Most forms and content areas
- **lg** - Featured actions, CTAs
- **xl** - Hero sections, major page actions

## General Guidelines

1. **Action Hierarchy**: Use button styling to create a visual hierarchy:
   - Primary actions use `variant="primary"`
   - Secondary actions use `variant="outline"` or `variant="secondary"`
   - Tertiary actions use `variant="ghost"` or `variant="link"`

2. **Color Usage**:
   - Use blue (primary) for most actions
   - Use green (success) for positive completion actions
   - Use red (error) for destructive actions
   - Use yellow (warning) for cautionary actions

3. **Icons**:
   - Add icons to buttons when they help clarify the action
   - Keep icon usage consistent across similar actions
   - Use `leftIcon` for most action buttons
   - Use `rightIcon` for navigation or "next" actions

4. **Loading States**:
   - Always use the `isLoading` prop when an action is processing
   - Disable buttons while loading to prevent double submission

5. **Disabled States**:
   - Use the `disabled` prop for unavailable actions
   - Always provide a tooltip or context about why the action is disabled

## Special Considerations

### Mobile Usage
- Use appropriate sizing for touch targets (minimum 44x44px)
- For very small screens, consider full-width buttons `fullWidth={true}`

### Accessibility
- Always include `ariaLabel` for IconButtons
- Ensure sufficient color contrast
- Keep text labels clear and descriptive

## Example Usage

### Form Actions

```jsx
<div className="flex justify-end gap-4 mt-6">
  <Button 
    variant="outline" 
    onClick={handleCancel}
  >
    Cancel
  </Button>
  <Button 
    variant="primary" 
    type="submit" 
    isLoading={isSubmitting}
  >
    Save Changes
  </Button>
</div>
```

### Card Actions

```jsx
<div className="flex items-center justify-between">
  <h3 className="font-medium">{item.title}</h3>
  <div className="flex gap-2">
    <IconButton 
      icon={<FaEye />} 
      variant="ghost" 
      ariaLabel="View details"
      onClick={() => handleView(item.id)} 
    />
    <IconButton 
      icon={<FaEdit />} 
      variant="ghost" 
      ariaLabel="Edit item"
      onClick={() => handleEdit(item.id)} 
    />
  </div>
</div>
```

### Tab Navigation

```jsx
<div className="border-b flex">
  <TabButton 
    isActive={activeView === 'all'} 
    onClick={() => setActiveView('all')}
  >
    All Items
  </TabButton>
  <TabButton 
    isActive={activeView === 'favorites'} 
    onClick={() => setActiveView('favorites')}
    icon={<FaStar />}
  >
    Favorites
  </TabButton>
  <TabButton 
    isActive={activeView === 'archived'} 
    onClick={() => setActiveView('archived')}
  >
    Archived
  </TabButton>
</div>
``` 
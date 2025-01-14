import { Theme } from '@douyinfe/semi-ui';

export const lightTheme = {
  colors: {
    primary: '#2563EB', // Modern blue
    secondary: '#6B7280', // Cool gray
    tertiary: '#E5E7EB', // Light gray
    success: '#059669', // Green
    warning: '#D97706', // Amber
    danger: '#DC2626', // Red
    info: '#3B82F6', // Blue
  },
  shadows: {
    elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  }
};

export const darkTheme = {
  colors: {
    primary: '#3B82F6', // Brighter blue for dark mode
    secondary: '#9CA3AF', // Lighter gray
    tertiary: '#374151', // Dark gray
    success: '#10B981', // Brighter green
    warning: '#F59E0B', // Brighter amber
    danger: '#EF4444', // Brighter red
    info: '#60A5FA', // Lighter blue
  },
  shadows: {
    elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.18)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
  }
};

// Apply theme to Semi UI
export const applyTheme = (isDark) => {
  const theme = isDark ? darkTheme : lightTheme;
  
  Theme.setTheme({
    variables: {
      'color-primary': theme.colors.primary,
      'color-secondary': theme.colors.secondary,
      'color-tertiary': theme.colors.tertiary,
      'color-success': theme.colors.success,
      'color-warning': theme.colors.warning,
      'color-danger': theme.colors.danger,
      'color-info': theme.colors.info,
      
      // Shadows
      'shadow-elevated': theme.shadows.elevated,
      'shadow-dropdown': theme.shadows.dropdown,

      // Border radius
      'border-radius': '8px',
      'border-radius-small': '6px',
      'border-radius-medium': '8px',
      'border-radius-large': '12px',

      // Spacing
      'spacing-tight': '4px',
      'spacing-base': '8px',
      'spacing-loose': '16px',
      'spacing-extra-loose': '24px',

      // Animation
      'motion-duration': '0.3s',
      'motion-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  });
};
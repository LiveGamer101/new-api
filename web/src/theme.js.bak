import { Button } from '@douyinfe/semi-ui';

// Modern color palette
const colors = {
  light: {
    primary: 'rgb(37, 99, 235)',
    secondary: 'rgb(107, 114, 128)',
    tertiary: 'rgb(229, 231, 235)',
    success: 'rgb(5, 150, 105)',
    warning: 'rgb(217, 119, 6)',
    danger: 'rgb(220, 38, 38)',
    info: 'rgb(59, 130, 246)',
  },
  dark: {
    primary: 'rgb(59, 130, 246)',
    secondary: 'rgb(156, 163, 175)',
    tertiary: 'rgb(55, 65, 81)',
    success: 'rgb(16, 185, 129)',
    warning: 'rgb(245, 158, 11)',
    danger: 'rgb(239, 68, 68)',
    info: 'rgb(96, 165, 250)',
  }
};

// Modern shadows
const shadows = {
  light: {
    elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  dark: {
    elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.18)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)'
  }
};

// Border radius configuration
const borderRadius = {
  base: '8px',
  small: '6px',
  medium: '8px',
  large: '12px'
};

// Apply theme
export const applyTheme = (isDark) => {
  const mode = isDark ? 'dark' : 'light';
  const root = document.documentElement;
  
  // Apply colors
  Object.entries(colors[mode]).forEach(([key, value]) => {
    root.style.setProperty(`--semi-color-${key}`, value);
  });

  // Apply shadows
  Object.entries(shadows[mode]).forEach(([key, value]) => {
    root.style.setProperty(`--semi-shadow-${key}`, value);
  });

  // Apply border radius
  Object.entries(borderRadius).forEach(([key, value]) => {
    root.style.setProperty(
      `--semi-border-radius${key === 'base' ? '' : '-' + key}`,
      value
    );
  });

  // Apply motion
  root.style.setProperty('--semi-motion-duration', '0.3s');
  root.style.setProperty('--semi-motion-ease', 'cubic-bezier(0.4, 0, 0.2, 1)');

  // Update body theme mode
  document.body.setAttribute('theme-mode', mode);
};
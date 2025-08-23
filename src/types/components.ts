// Component System Type Definitions

import type { ReactNode } from 'react';

// Core component definition interface
export interface ComponentDefinition {
  // Identity
  id: string;
  name: string;
  description: string;
  
  // Visual Identity (Component's Responsibility)
  icon: ReactNode | string;
  primaryColor: string;
  secondaryColor?: string;
  iconStyle?: 'solid' | 'outline';
  
  // Organization
  category?: string;
  priority?: number;
  enabled?: boolean;
  
  // Modal Integration (Component Controls Everything)
  onLaunch: (onClose?: () => void) => ModalConfig;
  
  // Access Control
  requiredPermissions?: string[];
  betaComponent?: boolean;
}

// Modal configuration provided by components
export interface ModalConfig {
  id: string;
  title: string;
  content: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initialState?: 'modal' | 'sidebar' | 'icon';
  theme?: ComponentTheme;
  closeable?: boolean;
  sidebarWidth?: number;
  componentId?: string; // Reference to the component that created this modal
}

// Component theme configuration
export interface ComponentTheme {
  primaryColor?: string;
  accentColor?: string;
  headerStyle?: 'default' | 'branded';
  contentPadding?: 'sm' | 'md' | 'lg';
  borderRadius?: 'sm' | 'md' | 'lg';
}

// Modal content props interface
export interface ModalContentProps {
  modalState?: 'modal' | 'sidebar' | 'icon';
  onAction?: (action: string, data?: any) => void;
  onClose?: () => void;
  isCompact?: boolean;
  theme?: ComponentTheme;
}

// Modal theme context
export interface ModalThemeContext {
  primaryColor: string;
  accentColor: string;
  size: string;
  isCompact: boolean;
}

// Home button state
export interface HomeButtonState {
  isExpanded: boolean;
  hoveredComponent: string | null;
}

// Modal display states
export type ModalDisplayState = 'modal' | 'sidebar' | 'icon' | 'closed';

// Component categories
export const ComponentCategories = {
  DATA: 'data',
  ANALYSIS: 'analysis', 
  VISUALIZATION: 'visualization',
  SETTINGS: 'settings',
  TOOLS: 'tools'
} as const;

export type ComponentCategory = typeof ComponentCategories[keyof typeof ComponentCategories];

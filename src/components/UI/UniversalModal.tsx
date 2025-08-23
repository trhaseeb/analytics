// Universal Modal System - Unified display framework

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ModalConfig, ModalDisplayState } from '../../types/components';
import { componentRegistry } from '../../systems/ComponentRegistry';

interface UniversalModalProps {
  config: ModalConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onStateChange?: (state: ModalDisplayState) => void;
}

export default function UniversalModal({ 
  config, 
  isOpen, 
  onClose, 
  onStateChange 
}: UniversalModalProps) {
  const [displayState, setDisplayState] = useState<ModalDisplayState>('modal');
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize display state from config
  useEffect(() => {
    if (config?.initialState && isOpen) {
      setDisplayState(config.initialState);
    }
  }, [config?.initialState, isOpen]);

  // Handle state transitions
  const handleStateChange = useCallback((newState: ModalDisplayState) => {
    if (newState === displayState) return;
    
    setIsAnimating(true);
    setDisplayState(newState);
    onStateChange?.(newState);
    
    // Animation complete
    setTimeout(() => setIsAnimating(false), 300);
  }, [displayState, onStateChange]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && config?.closeable !== false) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, config?.closeable]);

  if (!isOpen || !config) return null;

  // Theme styles
  const theme = config.theme || {};
  const primaryColor = theme.primaryColor || '#3B82F6';

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const size = config.size || 'md';
  const sidebarWidth = config.sidebarWidth || 400;

  // Render modal state
  const renderModal = () => (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        ${isAnimating ? 'transition-all duration-300 ease-in-out' : ''}
      `}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div 
        className={`
          relative bg-white rounded-lg shadow-2xl w-full ${sizeClasses[size]}
          max-h-[90vh] overflow-hidden flex flex-col
          ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          transition-all duration-300 ease-in-out
        `}
        style={{ 
          borderTop: `4px solid ${primaryColor}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
          style={{ backgroundColor: theme.headerStyle === 'branded' ? `${primaryColor}10` : undefined }}
        >
          <h2 
            className="text-xl font-semibold"
            style={{ color: theme.headerStyle === 'branded' ? primaryColor : undefined }}
          >
            {config.title}
          </h2>
          <div className="flex items-center gap-2">
            {/* State controls */}
            <button
              onClick={() => handleStateChange('sidebar')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Convert to sidebar"
            >
              <SidebarIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => handleStateChange('icon')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Minimize to icon"
            >
              <MinimizeIcon className="w-4 h-4 text-gray-600" />
            </button>
            {config.closeable !== false && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <CloseIcon className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div 
          className={`
            flex-1 overflow-auto
            ${theme.contentPadding === 'sm' ? 'p-4' : ''}
            ${theme.contentPadding === 'md' ? 'p-6' : ''}
            ${theme.contentPadding === 'lg' ? 'p-8' : ''}
            ${!theme.contentPadding ? 'p-6' : ''}
          `}
        >
          {config.content}
        </div>
      </div>
    </div>
  );

  // Render sidebar state
  const renderSidebar = () => (
    <div className="fixed left-4 top-4 h-[calc(100vh-2rem)] z-50">
      {/* Sidebar Content */}
      <div 
        className={`
          bg-white/95 backdrop-blur-md shadow-2xl h-full overflow-hidden flex flex-col
          rounded-2xl border border-white/20
          ${isAnimating ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
          transition-all duration-300 ease-in-out
        `}
        style={{ 
          width: sidebarWidth,
          borderLeft: `4px solid ${primaryColor}`,
        }}
      >
        {/* Header */}
        <div 
          className="px-4 py-3 border-b border-gray-200 flex items-center justify-between"
          style={{ backgroundColor: theme.headerStyle === 'branded' ? `${primaryColor}10` : undefined }}
        >
          <h3 
            className="font-semibold"
            style={{ color: theme.headerStyle === 'branded' ? primaryColor : undefined }}
          >
            {config.title}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleStateChange('modal')}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Convert to modal"
            >
              <ExpandIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => handleStateChange('icon')}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Minimize to icon"
            >
              <MinimizeIcon className="w-4 h-4 text-gray-600" />
            </button>
            {config.closeable !== false && (
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <CloseIcon className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {config.content}
        </div>
      </div>
    </div>
  );

  // Render icon state (collapsed to bottom)
  const renderIcon = () => {
    // Get the component definition for icon
    const component = config?.componentId ? componentRegistry.getComponent(config.componentId) : null;
    
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => handleStateChange('sidebar')}
          className={`
            w-12 h-12 rounded-full shadow-lg flex items-center justify-center
            transition-all duration-200 hover:scale-110 active:scale-95
            ${isAnimating ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
          `}
          style={{ 
            backgroundColor: component?.primaryColor || config?.theme?.primaryColor || '#3B82F6',
            color: 'white'
          }}
          title={`Open ${config?.title}`}
        >
          {/* Use component icon with proper sizing */}
          <div className="w-6 h-6 flex items-center justify-center text-white">
            {component?.icon || (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            )}
          </div>
        </button>
      </div>
    );
  };

  // Render based on display state
  const content = displayState === 'modal' 
    ? renderModal() 
    : displayState === 'sidebar' 
    ? renderSidebar()
    : displayState === 'icon'
    ? renderIcon()
    : null;

  return createPortal(content, document.body);
}

// Simple icon components (can be replaced with icon library)
const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SidebarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h16" />
  </svg>
);

const ExpandIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

const MinimizeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13H5v-2h14v2z" />
  </svg>
);

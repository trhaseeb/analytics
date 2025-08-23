// Home Button & Component Launcher System
// Enhanced with drag-and-drop, improved UI, and better positioning

import { useState, useEffect, useRef } from 'react';
import type { ComponentDefinition } from '../../types/components';
import { componentRegistry } from '../../systems/ComponentRegistry';

interface HomeButtonProps {
  onComponentLaunch: (componentId: string) => void;
  className?: string;
}

interface DragState {
  isDragging: boolean;
  draggedComponent: string | null;
  draggedIndex: number | null;
  dropTargetIndex: number | null;
}

export default function HomeButton({ onComponentLaunch, className = '' }: HomeButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [components, setComponents] = useState<ComponentDefinition[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedComponent: null,
    draggedIndex: null,
    dropTargetIndex: null
  });

  const dragRef = useRef<HTMLDivElement>(null);

  // Subscribe to component registry changes
  useEffect(() => {
    const updateComponents = () => {
      setComponents(componentRegistry.getEnabledComponents());
    };

    updateComponents();
    const unsubscribe = componentRegistry.subscribe(updateComponents);
    return unsubscribe;
  }, []);

  // Handle component launch
  const handleComponentClick = (component: ComponentDefinition) => {
    if (dragState.isDragging) return; // Prevent click during drag
    
    onComponentLaunch(component.id);
    setIsExpanded(false);
    setHoveredComponent(null);
  };

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-home-button]')) {
        setIsExpanded(false);
        setHoveredComponent(null);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', component.id);
    
    setDragState({
      isDragging: true,
      draggedComponent: component.id,
      draggedIndex: index,
      dropTargetIndex: null
    });
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    setDragState(prev => ({
      ...prev,
      dropTargetIndex: targetIndex
    }));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drop target if leaving the container entirely
    if (!dragRef.current?.contains(e.relatedTarget as Node)) {
      setDragState(prev => ({
        ...prev,
        dropTargetIndex: null
      }));
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    const { draggedIndex } = dragState;
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDragState({
        isDragging: false,
        draggedComponent: null,
        draggedIndex: null,
        dropTargetIndex: null
      });
      return;
    }

    // Reorder components
    const newComponents = [...components];
    const draggedComponent = newComponents[draggedIndex];
    newComponents.splice(draggedIndex, 1);
    newComponents.splice(targetIndex, 0, draggedComponent);
    
    setComponents(newComponents);
    
    // Update priorities in registry based on new order
    newComponents.forEach((comp, index) => {
      componentRegistry.updateComponent(comp.id, { priority: index * 10 });
    });

    setDragState({
      isDragging: false,
      draggedComponent: null,
      draggedIndex: null,
      dropTargetIndex: null
    });
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedComponent: null,
      draggedIndex: null,
      dropTargetIndex: null
    });
  };

  return (
    <div
      data-home-button
      className={`fixed top-12 right-6 z-40 ${className}`}
    >
      {/* Component Icons Row (when expanded) */}
      {isExpanded && (
        <div 
          ref={dragRef}
          className="flex items-center gap-3 mb-4 p-2 bg-black/20 backdrop-blur-md rounded-xl border border-white/10"
        >
          {components.map((component, index) => {
            const isDragged = dragState.draggedComponent === component.id;
            const isDropTarget = dragState.dropTargetIndex === index && !isDragged;
            
            return (
              <div key={component.id} className="relative">
                {/* Tooltip */}
                {hoveredComponent === component.id && !dragState.isDragging && (
                  <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50">
                    <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg border border-gray-700">
                      <div className="font-medium">{component.name}</div>
                      <div className="text-xs text-gray-300 mt-1">{component.description}</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                    </div>
                  </div>
                )}
                
                {/* Drop indicator */}
                {isDropTarget && (
                  <div className="absolute -left-1 top-0 w-1 h-full bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-pulse" />
                )}
                
                {/* Component Icon Button */}
                <button
                  draggable
                  onDragStart={(e) => handleDragStart(e, component, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleComponentClick(component)}
                  onMouseEnter={() => !dragState.isDragging && setHoveredComponent(component.id)}
                  onMouseLeave={() => setHoveredComponent(null)}
                  style={{ 
                    backgroundColor: component.primaryColor,
                    animationDelay: `${index * 50}ms`,
                    transform: isDragged ? 'rotate(5deg) scale(1.1)' : undefined,
                    opacity: isDragged ? 0.7 : 1
                  }}
                  className={`
                    w-14 h-14 rounded-full shadow-lg transition-all duration-200 ease-in-out
                    hover:scale-110 hover:shadow-xl active:scale-95
                    flex items-center justify-center text-white font-medium
                    animate-slide-in-right cursor-grab active:cursor-grabbing
                    border-2 border-white/20 backdrop-blur-sm
                    ${hoveredComponent === component.id && !dragState.isDragging ? 'scale-110 shadow-xl ring-2 ring-white/30' : ''}
                    ${isDragged ? 'z-50' : ''}
                    ${dragState.isDragging && !isDragged ? 'cursor-pointer' : ''}
                  `}
                  title={`${component.description} (Drag to reorder)`}
                >
                  <div className="w-7 h-7 flex items-center justify-center text-white">
                    {component.icon}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Home/Close Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-14 h-14 bg-black/30 hover:bg-black/40 rounded-full shadow-xl border border-white/20
          flex items-center justify-center transition-all duration-300 ease-in-out
          hover:scale-105 hover:shadow-2xl active:scale-95 backdrop-blur-md
          ${isExpanded ? 'bg-black/40 hover:bg-black/50 ring-2 ring-white/20' : ''}
        `}
        title={isExpanded ? 'Close component menu' : 'Open component menu'}
      >
        {isExpanded ? (
          <CloseIcon className="w-7 h-7 text-white transition-transform duration-300 hover:rotate-90" />
        ) : (
          <img
            src="/home-logo.svg"
            alt="Home"
            className="w-10 h-10 transition-transform duration-300 hover:scale-110 filter drop-shadow-sm"
          />
        )}
      </button>

      {/* Drag instructions (when dragging) */}
      {dragState.isDragging && (
        <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-blue-900/90 text-blue-100 text-sm px-3 py-2 rounded-lg shadow-lg border border-blue-400/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <DragIcon className="w-4 h-4" />
              Drag to reorder components
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Close icon component (X)
const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Drag icon component
const DragIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

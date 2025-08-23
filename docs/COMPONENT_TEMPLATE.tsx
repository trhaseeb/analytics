// COMPONENT TEMPLATE - STRICTLY FOLLOW THIS PATTERN
// Component: [COMPONENT_NAME]
// Purpose: [BRIEF_DESCRIPTION]
// Category: [data|analysis|visualization|settings|tools]
// Standards Compliance: MANDATORY - See docs/COMPONENT_STANDARDS.md

// NOTE: When using this template, place it in src/components/domain/
// and adjust import paths accordingly:

import { useState, useEffect } from 'react';
import { storageManager } from '../../systems/StorageManager';
import type { ComponentDefinition } from '../../types/components';

// ==========================================
// 1. DATA TYPES & INTERFACES
// ==========================================

// Define your data structure that will be stored
interface ComponentData {
  id: string;
  name: string;
  // Add your specific data fields here
  // Example: setting: boolean;
  // Example: value: number;
  lastModified: string;
}

// Optional: Define any additional interfaces
interface ComponentState {
  // Example: activeTab: 'view' | 'edit';
  // Example: isLoading: boolean;
}

// ==========================================
// 2. CONTENT COMPONENT (MAIN UI)
// ==========================================

const ComponentContent = () => {
  // State management
  const [data, setData] = useState<ComponentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Optional: Additional UI state
  // const [uiState, setUiState] = useState<ComponentState>({
  //   activeTab: 'view',
  //   isLoading: false
  // });

  // ==========================================
  // 3. DATA LOADING (REQUIRED)
  // ==========================================
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load data from StorageManager
        const savedData = storageManager.loadComponentData(); // Replace with actual method
        setData(savedData);
        console.log('Loaded component data:', savedData);
      } catch (err) {
        setError('Failed to load data');
        console.error('Component data loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Listen for external updates
    const handleExternalUpdate = () => {
      loadData();
    };

    window.addEventListener('dataUpdated', handleExternalUpdate);
    
    return () => {
      window.removeEventListener('dataUpdated', handleExternalUpdate);
    };
  }, []);

  // ==========================================
  // 4. DATA OPERATIONS (REQUIRED PATTERN)
  // ==========================================

  // ✅ REQUIRED: Auto-save pattern
  const updateData = (id: string, updates: Partial<ComponentData>) => {
    setData(prev => {
      const updated = prev.map(item => 
        item.id === id 
          ? { ...item, ...updates, lastModified: new Date().toISOString() }
          : item
      );
      
      // REQUIRED: Save immediately
      try {
        storageManager.saveComponentData(updated); // Replace with actual method
        
        // REQUIRED: Dispatch update event
        window.dispatchEvent(new CustomEvent('componentUpdated', {
          detail: { component: 'COMPONENT_NAME', data: updated }
        }));
        
        console.log('Data updated:', { id, updates });
      } catch (err) {
        console.error('Failed to save data:', err);
        setError('Failed to save changes');
      }
      
      return updated;
    });
  };

  // ✅ REQUIRED: Add new item pattern
  const addNewItem = (newItem: Omit<ComponentData, 'id' | 'lastModified'>) => {
    const item: ComponentData = {
      ...newItem,
      id: `item-${Date.now()}`,
      lastModified: new Date().toISOString()
    };

    setData(prev => {
      const updated = [...prev, item];
      
      // REQUIRED: Save immediately
      try {
        storageManager.saveComponentData(updated); // Replace with actual method
        
        // REQUIRED: Dispatch update event
        window.dispatchEvent(new CustomEvent('componentUpdated', {
          detail: { component: 'COMPONENT_NAME', data: updated }
        }));
        
        console.log('Item added:', item);
      } catch (err) {
        console.error('Failed to save new item:', err);
        setError('Failed to add item');
      }
      
      return updated;
    });
  };

  // ✅ REQUIRED: Remove item pattern
  const removeItem = (id: string) => {
    // Use native browser confirmation if needed
    if (!confirm('Are you sure you want to remove this item?')) {
      return;
    }

    setData(prev => {
      const updated = prev.filter(item => item.id !== id);
      
      // REQUIRED: Save immediately
      try {
        storageManager.saveComponentData(updated); // Replace with actual method
        
        // REQUIRED: Dispatch update event
        window.dispatchEvent(new CustomEvent('componentUpdated', {
          detail: { component: 'COMPONENT_NAME', data: updated }
        }));
        
        console.log('Item removed:', id);
      } catch (err) {
        console.error('Failed to remove item:', err);
        setError('Failed to remove item');
      }
      
      return updated;
    });
  };

  // ==========================================
  // 5. LOADING & ERROR STATES (REQUIRED)
  // ==========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={() => setError(null)}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // ==========================================
  // 6. MAIN UI RENDER (CUSTOMIZE THIS SECTION)
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Component Title
        </h2>
        <p className="text-sm text-gray-600">
          Component description and current status: {data.length} items
        </p>
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <ComponentIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p>No items found</p>
          <p className="text-sm">Add your first item to get started</p>
        </div>
      )}

      {/* Data list */}
      {data.length > 0 && (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  {/* Add more item details here */}
                </div>
                
                {/* ✅ ALLOWED: Functional action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateData(item.id, { /* update object */ })}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit item"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove item"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new item form */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Add New Item</h4>
        
        {/* ✅ REQUIRED: Form with immediate validation */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Item name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => {
              // ✅ REQUIRED: Real-time validation
              const isValid = e.target.value.trim().length > 0;
              e.target.className = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isValid ? 'border-gray-300' : 'border-red-300'
              }`;
            }}
            onBlur={(e) => {
              if (e.target.value.trim()) {
                // ✅ REQUIRED: Auto-add on blur with valid data
                addNewItem({ name: e.target.value.trim() });
                e.target.value = '';
              }
            }}
          />
          <p className="text-xs text-gray-500">
            Press Tab or click elsewhere to add the item
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. ICONS (REQUIRED FOR EACH COMPONENT)
// ==========================================

const ComponentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {/* Replace with appropriate icon */}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// ==========================================
// 8. COMPONENT DEFINITION (REQUIRED)
// ==========================================

export const ComponentNameComponent: ComponentDefinition = {
  // Required fields
  id: 'component-name',
  name: 'Component Name',
  description: 'Brief description of what this component does',
  
  // Visual identity
  icon: <ComponentIcon />,
  primaryColor: '#2563EB',      // Blue-600
  secondaryColor: '#3B82F6',    // Blue-500
  
  // Organization
  category: 'data',             // data|analysis|visualization|settings|tools
  priority: 10,                 // Lower numbers = higher priority
  enabled: true,
  
  // Modal configuration
  onLaunch: () => ({
    id: 'component-name-modal',
    title: 'Component Name',
    content: <ComponentContent />,
    size: 'lg',                 // sm|md|lg|xl
    initialState: 'modal',      // modal|sidebar|icon
    theme: {
      primaryColor: '#2563EB',
      accentColor: '#3B82F6',
      headerStyle: 'branded',   // default|branded
      contentPadding: 'md'      // sm|md|lg
    },
    closeable: true,
    sidebarWidth: 400
  } as const)
};

// ==========================================
// 9. CHECKLIST VERIFICATION
// ==========================================

/*
BEFORE SUBMITTING THIS COMPONENT, VERIFY:

UI Standards:
□ No save/submit/apply buttons
□ No custom close buttons
□ No custom modals within modals
□ Real-time feedback on all interactions
□ Auto-save on data changes

Technical Standards:
□ Uses StorageManager for persistence
□ Dispatches 'componentUpdated' events
□ Handles loading and error states
□ TypeScript types defined
□ Performance optimized

Integration Standards:
□ Follows ComponentDefinition interface
□ Works in both modal and sidebar modes
□ No external dependencies beyond allowed list
□ Proper event cleanup in useEffect

Testing Standards:
□ Component loads without errors
□ Data persists across modal open/close
□ Real-time updates work correctly
□ No console errors
□ Responsive design implemented

Code Quality:
□ ESLint passes without warnings
□ TypeScript compiles without errors
□ Bundle size impact acceptable
□ Documentation updated
*/

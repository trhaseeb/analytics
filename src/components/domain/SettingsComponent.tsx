// Settings Component - Application preferences

import { useState, useEffect } from 'react';
import { storageManager, type SettingsData } from '../../systems/StorageManager';
import type { ComponentDefinition, ModalContentProps } from '../../types/components';

// Component content
const SettingsContent = ({ modalState }: ModalContentProps) => {
  const [settings, setSettings] = useState<SettingsData>({
    units: 'metric',
    coordinateFormat: 'decimal',
    showGrid: false,
    showScaleBar: true,
    showAttribution: true,
    lastModified: new Date().toISOString()
  });
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = storageManager.loadSettingsData();
    setSettings(savedSettings);
    setLastSaved(savedSettings.lastModified);
  }, []);

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    if (key === 'lastModified') return; // Don't allow manual modification of timestamp
    
    setSettings(prev => ({ 
      ...prev, 
      [key]: value,
      lastModified: new Date().toISOString()
    }));
  };

  const isCompact = modalState === 'sidebar';

  return (
    <div className="space-y-6">
      {isCompact && (
        <div className="text-xs text-gray-500 mb-4">Settings - Compact View</div>
      )}

      {/* Display Settings */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Display Options</h3>
        
        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Show grid overlay</span>
          <input
            type="checkbox"
            checked={settings.showGrid}
            onChange={(e) => handleSettingChange('showGrid', e.target.checked)}
            className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Show scale bar</span>
          <input
            type="checkbox"
            checked={settings.showScaleBar}
            onChange={(e) => handleSettingChange('showScaleBar', e.target.checked)}
            className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Show attribution</span>
          <input
            type="checkbox"
            checked={settings.showAttribution}
            onChange={(e) => handleSettingChange('showAttribution', e.target.checked)}
            className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
        </label>
      </div>

      {/* Coordinate Format */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Coordinate Format</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="decimal"
              checked={settings.coordinateFormat === 'decimal'}
              onChange={(e) => handleSettingChange('coordinateFormat', e.target.value)}
              className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Decimal degrees (40.7128, -74.0060)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="dms"
              checked={settings.coordinateFormat === 'dms'}
              onChange={(e) => handleSettingChange('coordinateFormat', e.target.value)}
              className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Degrees, minutes, seconds (40°42'46"N, 74°00'22"W)</span>
          </label>
        </div>
      </div>

      {/* Units */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Units</h3>
        <div className="grid grid-cols-2 gap-2">
          {['metric', 'imperial'].map(unit => (
            <button
              key={unit}
              onClick={() => handleSettingChange('units', unit)}
              className={`
                p-2 rounded-lg border text-sm font-medium transition-colors capitalize
                ${settings.units === unit 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-200">
        {/* Save Status */}
        <div className="text-sm text-gray-500">
          {lastSaved ? (
            <span>Last saved: {new Date(lastSaved).toLocaleString()}</span>
          ) : (
            <span>Settings not saved yet</span>
          )}
        </div>

      </div>
    </div>
  );
};

// Flat minimal settings icon
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

// Component definition
export const SettingsComponent: ComponentDefinition = {
  id: 'settings',
  name: 'Settings',
  description: 'Configure application preferences and map settings',
  icon: <SettingsIcon />,
  primaryColor: '#059669',
  secondaryColor: '#34D399',
  category: 'settings',
  priority: 90,
  enabled: true,
  onLaunch: (onClose?: () => void) => ({
    id: 'settings-modal',
    title: 'Application Settings',
    content: <SettingsContent onClose={onClose} />,
    size: 'md',
    initialState: 'modal',
    theme: {
      primaryColor: '#059669',
      accentColor: '#34D399',
      headerStyle: 'branded',
      contentPadding: 'md'
    },
    closeable: true,
    sidebarWidth: 350
  } as const)
};

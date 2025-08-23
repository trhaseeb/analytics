// Basemaps Component - Background map management

import { useState, useEffect } from 'react';
import { storageManager } from '../../systems/StorageManager';
import type { ComponentDefinition } from '../../types/components';

interface Basemap {
  id: string;
  name: string;
  type: 'satellite' | 'street' | 'terrain' | 'dark' | 'light' | 'custom';
  url?: string;
  tiles?: string; // Local tiles folder path
  attribution?: string;
  isActive: boolean;
}

// Component content
const BasemapsContent = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [basemaps, setBasemaps] = useState<Basemap[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // New basemap form state
  const [newBasemap, setNewBasemap] = useState({
    name: '',
    type: 'custom' as Basemap['type'],
    url: '',
    attribution: '',
    tiles: null as File | null
  });

  // Load saved basemaps on component mount
  useEffect(() => {
    const savedBasemaps = storageManager.loadBasemapsData();
    setBasemaps(savedBasemaps);
    if (savedBasemaps.length > 0) {
      setLastSaved(new Date().toISOString());
    }
  }, []);

  // Save basemaps
  const saveBasemaps = () => {
    try {
      storageManager.saveBasemapsData(basemaps);
      setLastSaved(new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Failed to save basemaps:', error);
      return false;
    }
  };

  const setActiveBasemap = (basemapId: string) => {
    setBasemaps(prev => {
      const updated = prev.map(basemap => ({
        ...basemap,
        isActive: basemap.id === basemapId
      }));
      
      // Auto-save when basemap selection changes
      setTimeout(() => {
        storageManager.saveBasemapsData(updated);
        setLastSaved(new Date().toISOString());
      }, 100);
      
      return updated;
    });
  };

  const removeBasemap = (basemapId: string) => {
    // Prevent removing the last basemap
    if (basemaps.length <= 1) return;
    
    const isActiveBasemap = basemaps.find(b => b.id === basemapId)?.isActive;
    setBasemaps(prev => {
      const filtered = prev.filter(basemap => basemap.id !== basemapId);
      
      // If we removed the active basemap, activate the first one
      if (isActiveBasemap && filtered.length > 0) {
        filtered[0].isActive = true;
      }
      
      return filtered;
    });
  };

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          return null;
        }
        return prev + 10;
      });
    }, 200);

    // Store reference to uploaded folder (in real implementation, process tiles)
    setNewBasemap(prev => ({ ...prev, tiles: files[0] }));
  };

  const addBasemap = () => {
    if (!newBasemap.name) return;
    if (!newBasemap.url && !newBasemap.tiles) return;

    const basemap: Basemap = {
      id: Date.now().toString(),
      name: newBasemap.name,
      type: newBasemap.type,
      url: newBasemap.url || undefined,
      tiles: newBasemap.tiles ? `/tiles/${newBasemap.tiles.name}` : undefined,
      attribution: newBasemap.attribution || 'Custom Basemap',
      isActive: false
    };

    setBasemaps(prev => [...prev, basemap]);
    setNewBasemap({
      name: '',
      type: 'custom',
      url: '',
      attribution: '',
      tiles: null
    });
  };

  const isCompact = false; // For now, always show full view

  return (
    <div className="space-y-6">
      {isCompact && (
        <div className="text-xs text-gray-500 mb-4">Basemap Manager - Compact View</div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'current', name: 'Current Basemaps' },
            { id: 'add', name: 'Add Basemap' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Current Basemaps Tab */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Active Basemaps</h3>
            <span className="text-sm text-gray-500">{basemaps.length} basemap{basemaps.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-3">
            {basemaps.map((basemap) => (
              <div
                key={basemap.id}
                className={`p-4 border rounded-lg transition-all ${
                  basemap.isActive 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setActiveBasemap(basemap.id)}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          basemap.isActive 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {basemap.isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                      </button>
                      <h4 className="font-medium text-gray-900">{basemap.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        basemap.type === 'satellite' ? 'bg-blue-100 text-blue-800' :
                        basemap.type === 'street' ? 'bg-gray-100 text-gray-800' :
                        basemap.type === 'terrain' ? 'bg-green-100 text-green-800' :
                        basemap.type === 'dark' ? 'bg-gray-800 text-white' :
                        basemap.type === 'light' ? 'bg-gray-50 text-gray-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {basemap.type}
                      </span>
                    </div>

                    {/* Basemap Details */}
                    <div className="mt-2 ml-7 space-y-1 text-sm text-gray-600">
                      {basemap.url && (
                        <div>URL: {basemap.url.length > 50 ? basemap.url.substring(0, 50) + '...' : basemap.url}</div>
                      )}
                      {basemap.tiles && (
                        <div>Local Tiles: {basemap.tiles}</div>
                      )}
                      {basemap.attribution && (
                        <div>Attribution: {basemap.attribution}</div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {!basemap.isActive && (
                      <button
                        onClick={() => setActiveBasemap(basemap.id)}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Activate
                      </button>
                    )}
                    
                    {basemaps.length > 1 && (
                      <button
                        onClick={() => removeBasemap(basemap.id)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Basemap Tab */}
      {activeTab === 'add' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Add New Basemap</h3>

          <div className="space-y-4">
            {/* Basemap Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Basemap Name *
              </label>
              <input
                type="text"
                value={newBasemap.name}
                onChange={(e) => setNewBasemap(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter basemap name"
              />
            </div>

            {/* Basemap Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Basemap Type
              </label>
              <select
                value={newBasemap.type}
                onChange={(e) => setNewBasemap(prev => ({ ...prev, type: e.target.value as Basemap['type'] }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="satellite">Satellite</option>
                <option value="street">Street</option>
                <option value="terrain">Terrain</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Source Options */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700">Basemap Source</div>
              
              {/* URL Option */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  External URL (e.g., tile server)
                </label>
                <input
                  type="url"
                  value={newBasemap.url}
                  onChange={(e) => setNewBasemap(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://example.com/tiles/{z}/{x}/{y}.png"
                />
              </div>

              <div className="text-center text-gray-500 text-sm">OR</div>

              {/* Local Tiles Upload */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Upload Local Tiles Folder
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFolderUpload}
                    className="hidden"
                    id="tiles-upload"
                    {...({ webkitdirectory: "", directory: "" } as any)}
                  />
                  <label htmlFor="tiles-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 text-gray-400">
                        📁
                      </div>
                      <div className="text-sm text-gray-600">
                        {newBasemap.tiles ? newBasemap.tiles.name : 'Click to select tiles folder'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Select a folder containing map tiles (e.g., z/x/y.png structure)
                      </div>
                    </div>
                  </label>
                </div>

                {uploadProgress !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Uploading tiles...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attribution
              </label>
              <input
                type="text"
                value={newBasemap.attribution}
                onChange={(e) => setNewBasemap(prev => ({ ...prev, attribution: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="© Your Organization"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={addBasemap}
              disabled={!newBasemap.name || (!newBasemap.url && !newBasemap.tiles)}
              className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Basemap
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-200">
        {/* Save Status */}
        <div className="text-sm text-gray-500">
          {lastSaved ? (
            <span>Last saved: {new Date(lastSaved).toLocaleString()}</span>
          ) : (
            <span>Using default basemaps</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              const success = saveBasemaps();
              if (success) {
                console.log('Basemaps saved successfully');
              } else {
                console.error('Failed to save basemaps');
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Basemaps
          </button>
        </div>
      </div>
    </div>
  );
};

// Component definition
export const BasemapsComponent: ComponentDefinition = {
  id: 'basemaps',
  name: 'Basemaps',
  description: 'Manage background maps and tile sources',
  icon: '🗺️',
  primaryColor: '#10B981',
  secondaryColor: '#34D399',
  category: 'Map',
  priority: 3,
  enabled: true,
  onLaunch: () => ({
    id: 'basemaps-modal',
    title: 'Basemap Manager',
    content: <BasemapsContent />,
    size: 'lg',
    initialState: 'modal',
    theme: {
      primaryColor: '#10B981',
      accentColor: '#34D399',
      headerStyle: 'branded',
      contentPadding: 'md'
    },
    closeable: true,
    sidebarWidth: 400
  })
};

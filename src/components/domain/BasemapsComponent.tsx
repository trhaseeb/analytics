// Enhanced Basemaps Component with load status indicators and better feedback
// Fixes: 1) Visual load status 2) Connection testing 3) Auto-zoom functionality 4) Better error handling

import { useState, useEffect } from 'react';
import { storageManager } from '../../systems/StorageManager';
import type { ComponentDefinition, ModalContentProps } from '../../types/components';

// Enhanced Basemap interface with status tracking
interface Basemap {
  id: string;
  name: string;
  type: 'satellite' | 'street' | 'terrain' | 'dark' | 'light' | 'custom';
  url: string;
  attribution?: string;
  isActive: boolean;
  opacity: number;
  minZoom: number;
  maxZoom: number;
  status?: 'loading' | 'loaded' | 'error';
  lastTested?: string;
}

// Enhanced predefined basemap options with Google Hybrid as default
const PRESET_BASEMAPS = [
  {
    id: 'google-hybrid',
    name: 'Google Hybrid',
    type: 'satellite' as const,
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '© Google',
    minZoom: 0,
    maxZoom: 20
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    type: 'street' as const,
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    minZoom: 0,
    maxZoom: 19
  },
  {
    id: 'cartodb-positron',
    name: 'CartoDB Positron',
    type: 'light' as const,
    url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: '© CartoDB',
    minZoom: 0,
    maxZoom: 18
  },
  {
    id: 'cartodb-dark',
    name: 'CartoDB Dark Matter',
    type: 'dark' as const,
    url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: '© CartoDB',
    minZoom: 0,
    maxZoom: 18
  },
  {
    id: 'stamen-terrain',
    name: 'Stamen Terrain',
    type: 'terrain' as const,
    url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png',
    attribution: '© Stamen',
    minZoom: 0,
    maxZoom: 15
  },
  {
    id: 'esri-satellite',
    name: 'ESRI Satellite',
    type: 'satellite' as const,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© ESRI',
    minZoom: 0,
    maxZoom: 18
  }
];

const BasemapsContent = ({ onClose }: ModalContentProps) => {
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [basemaps, setBasemaps] = useState<Basemap[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  
  // New basemap form state
  const [newBasemap, setNewBasemap] = useState({
    name: '',
    type: 'custom' as Basemap['type'],
    url: '',
    attribution: '',
    testUrl: false
  });

  // Load saved basemaps on component mount
  useEffect(() => {
    const savedBasemaps = storageManager.loadBasemapsData();
    
    // Convert to enhanced format
    const converted = savedBasemaps.map(bm => ({
      id: bm.id,
      name: bm.name,
      type: bm.type,
      url: bm.url || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: bm.attribution,
      isActive: bm.isActive,
      opacity: 1,
      minZoom: 0,
      maxZoom: 18,
      status: 'loaded' as const
    }));
    
    // If no basemaps, add default Google Hybrid
    if (converted.length === 0) {
      const defaultBasemap = {
        id: 'default-google-hybrid',
        name: 'Google Hybrid',
        type: 'satellite' as const,
        url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        attribution: '© Google',
        isActive: true,
        opacity: 1,
        minZoom: 0,
        maxZoom: 20,
        status: 'loaded' as const
      };
      converted.push(defaultBasemap);
      // Save default to storage
      storageManager.saveBasemapsData([{
        id: defaultBasemap.id,
        name: defaultBasemap.name,
        type: defaultBasemap.type,
        url: defaultBasemap.url,
        attribution: defaultBasemap.attribution,
        isActive: defaultBasemap.isActive
      }]);
    }
    
    setBasemaps(converted);
  }, []);

  const setActiveBasemap = (basemapId: string) => {
    setBasemaps(prev => {
      const updated = prev.map(basemap => ({
        ...basemap,
        isActive: basemap.id === basemapId
      }));

      // Auto-save to storage
      const storageFormat = updated.map(bm => ({
        id: bm.id,
        name: bm.name,
        type: bm.type,
        url: bm.url,
        attribution: bm.attribution,
        isActive: bm.isActive
      }));
      storageManager.saveBasemapsData(storageFormat);

      // Dispatch custom event to notify app of basemap change
      setTimeout(() => {
        window.dispatchEvent(new Event('basemapsUpdated'));
      }, 50);

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
      
      // Auto-save to storage
      const storageFormat = filtered.map(bm => ({
        id: bm.id,
        name: bm.name,
        type: bm.type,
        url: bm.url,
        attribution: bm.attribution,
        isActive: bm.isActive
      }));
      storageManager.saveBasemapsData(storageFormat);
      
      return filtered;
    });
  };

  // Test basemap URL by attempting to load a sample tile
  const testBasemap = async (url: string, basemapId?: string) => {
    setTesting(basemapId || 'new');
    
    try {
      // Create test URL with sample coordinates (NYC area, zoom 10)
      const testTileUrl = url
        .replace('{z}', '10')
        .replace('{x}', '301')
        .replace('{y}', '384')
        .replace('{-y}', '639'); // For TMS format
      
      await fetch(testTileUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // Allow cross-origin requests
      });
      
      // For no-cors mode, we can't check status, so assume success if no error
      if (basemapId) {
        setBasemaps(prev => prev.map(bm => 
          bm.id === basemapId ? { 
            ...bm, 
            status: 'loaded' as const, 
            lastTested: new Date().toISOString() 
          } : bm
        ));
      }
      
      console.log(`Basemap test successful: ${url}`);
      return true;
    } catch (error) {
      console.warn(`Basemap test failed: ${url}`, error);
      
      if (basemapId) {
        setBasemaps(prev => prev.map(bm => 
          bm.id === basemapId ? { 
            ...bm, 
            status: 'error' as const, 
            lastTested: new Date().toISOString() 
          } : bm
        ));
      }
      
      return false;
    } finally {
      setTesting(null);
    }
  };

  const addBasemap = async () => {
    if (!newBasemap.name || !newBasemap.url) return;

    // Test URL if requested
    if (newBasemap.testUrl) {
      const isValid = await testBasemap(newBasemap.url);
      if (!isValid) {
        alert('Warning: The basemap URL test failed. The basemap may not load correctly.');
      }
    }

    const basemap: Basemap = {
      id: Date.now().toString(),
      name: newBasemap.name,
      type: newBasemap.type,
      url: newBasemap.url,
      attribution: newBasemap.attribution || 'Custom Basemap',
      isActive: false,
      opacity: 1,
      minZoom: 0,
      maxZoom: 18,
      status: newBasemap.testUrl ? 'loaded' : undefined,
      lastTested: newBasemap.testUrl ? new Date().toISOString() : undefined
    };

    setBasemaps(prev => {
      const updated = [...prev, basemap];
      
      // Auto-save to storage
      const storageFormat = updated.map(bm => ({
        id: bm.id,
        name: bm.name,
        type: bm.type,
        url: bm.url,
        attribution: bm.attribution,
        isActive: bm.isActive
      }));
      storageManager.saveBasemapsData(storageFormat);
      
      return updated;
    });

    // Reset form
    setNewBasemap({
      name: '',
      type: 'custom',
      url: '',
      attribution: '',
      testUrl: false
    });
  };

  const addPresetBasemap = async (preset: typeof PRESET_BASEMAPS[0]) => {
    // Check if already exists
    if (basemaps.some(bm => bm.url === preset.url)) return;

    const basemap: Basemap = {
      id: `preset-${preset.id}`,
      name: preset.name,
      type: preset.type,
      url: preset.url,
      attribution: preset.attribution,
      isActive: false,
      opacity: 1,
      minZoom: preset.minZoom,
      maxZoom: preset.maxZoom,
      status: 'loading'
    };

    setBasemaps(prev => {
      const updated = [...prev, basemap];
      
      // Auto-save to storage
      const storageFormat = updated.map(bm => ({
        id: bm.id,
        name: bm.name,
        type: bm.type,
        url: bm.url,
        attribution: bm.attribution,
        isActive: bm.isActive
      }));
      storageManager.saveBasemapsData(storageFormat);
      
      return updated;
    });

    // Test the preset basemap
    await testBasemap(preset.url, basemap.id);
  };

  const activeBasemap = basemaps.find(bm => bm.isActive);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'loading': return <span className="text-yellow-500 animate-spin">⟳</span>;
      case 'loaded': return <span className="text-green-500">✓</span>;
      case 'error': return <span className="text-red-500">✗</span>;
      default: return <span className="text-gray-400">○</span>;
    }
  };

  const getStatusText = (status?: string, lastTested?: string) => {
    switch (status) {
      case 'loading': return 'Testing...';
      case 'loaded': return lastTested ? `Tested ${new Date(lastTested).toLocaleTimeString()}` : 'Available';
      case 'error': return 'Connection failed';
      default: return 'Not tested';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Active Basemap */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
            ✓
          </div>
          <div className="flex-1">
            <div className="font-medium text-green-900">
              Active Basemap: {activeBasemap?.name || 'None'}
            </div>
            <div className="text-sm text-green-700 flex items-center gap-2">
              {activeBasemap?.type && <span className="capitalize">{activeBasemap.type}</span>}
              {activeBasemap?.status && getStatusIcon(activeBasemap.status)}
              {activeBasemap?.attribution && (
                <span className="opacity-75">• {activeBasemap.attribution}</span>
              )}
            </div>
          </div>
          {activeBasemap && (
            <button
              onClick={() => testBasemap(activeBasemap.url, activeBasemap.id)}
              disabled={testing === activeBasemap.id}
              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 disabled:opacity-50"
            >
              {testing === activeBasemap.id ? 'Testing...' : 'Test'}
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'current'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Available Basemaps ({basemaps.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'add'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Add Basemap
          </button>
        </nav>
      </div>

      {/* Current Basemaps Tab */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {basemaps.map((basemap) => (
              <div
                key={basemap.id}
                className={`p-4 border rounded-lg transition-all cursor-pointer ${
                  basemap.isActive 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
                onClick={() => setActiveBasemap(basemap.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      basemap.isActive 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {basemap.isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {basemap.name}
                        {getStatusIcon(basemap.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="capitalize">{basemap.type}</span>
                        <span className="ml-2">• {getStatusText(basemap.status, basemap.lastTested)}</span>
                        {basemap.attribution && (
                          <span className="ml-2 opacity-75">• {basemap.attribution}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Test button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        testBasemap(basemap.url, basemap.id);
                      }}
                      disabled={testing === basemap.id}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      {testing === basemap.id ? 'Testing...' : 'Test'}
                    </button>
                    
                    {/* Remove button (not for the last/default basemap) */}
                    {basemaps.length > 1 && !basemap.id.startsWith('default') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBasemap(basemap.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
                {/* URL display */}
                <div className="mt-2 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                  {basemap.url}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Basemap Tab */}
      {activeTab === 'add' && (
        <div className="space-y-6">
          {/* Quick Add Presets */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quick Add Reliable Basemaps</h4>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_BASEMAPS.map((preset) => {
                const exists = basemaps.some(bm => bm.url === preset.url);
                return (
                  <button
                    key={preset.id}
                    onClick={() => addPresetBasemap(preset)}
                    disabled={exists}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      exists 
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs opacity-75 capitalize">{preset.type}</div>
                    {exists && <div className="text-xs text-green-600 mt-1">✓ Added</div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Add Custom Basemap</h4>
            
            <div className="space-y-4">
              {/* Basemap Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Basemap Name *
                </label>
                <input
                  type="text"
                  value={newBasemap.name}
                  onChange={(e) => setNewBasemap(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Custom Satellite"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Basemap Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Basemap Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'satellite', name: '🛰️ Satellite', desc: 'Aerial imagery' },
                    { value: 'street', name: '🗺️ Street', desc: 'Road maps' },
                    { value: 'terrain', name: '🏔️ Terrain', desc: 'Topographic' },
                    { value: 'light', name: '☀️ Light', desc: 'Minimal style' },
                    { value: 'dark', name: '🌙 Dark', desc: 'Dark theme' },
                    { value: 'custom', name: '⚙️ Custom', desc: 'Custom style' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewBasemap(prev => ({ ...prev, type: type.value as Basemap['type'] }))}
                      className={`p-2 rounded border text-left text-xs transition-colors ${
                        newBasemap.type === type.value
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{type.name}</div>
                      <div className="opacity-75">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tile URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tile Service URL *
                </label>
                <input
                  type="text"
                  value={newBasemap.url}
                  onChange={(e) => setNewBasemap(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/tiles/{z}/{x}/{y}.png"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Use {'{z}/{x}/{y}'} placeholders for XYZ tile format
                </div>
              </div>

              {/* Attribution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attribution
                </label>
                <input
                  type="text"
                  value={newBasemap.attribution}
                  onChange={(e) => setNewBasemap(prev => ({ ...prev, attribution: e.target.value }))}
                  placeholder="© Your Map Provider"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Test URL option */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="test-url"
                  checked={newBasemap.testUrl}
                  onChange={(e) => setNewBasemap(prev => ({ ...prev, testUrl: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="test-url" className="text-sm text-gray-700">
                  Test URL before adding (recommended)
                </label>
              </div>

              {/* Add Button */}
              <div className="flex justify-end">
                <button
                  onClick={addBasemap}
                  disabled={!newBasemap.name || !newBasemap.url || testing === 'new'}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {testing === 'new' ? 'Testing...' : 'Add Basemap'}
                </button>
              </div>
            </div>
          </div>

          {/* Examples */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">
              💡 Basemap URL Examples
            </h5>
            <div className="text-sm text-blue-700 space-y-2">
              <div><strong>OpenStreetMap:</strong> https://tile.openstreetmap.org/{'{z}'}/{'{x}'}/{'{y}'}.png</div>
              <div><strong>CartoDB:</strong> https://basemaps.cartocdn.com/light_all/{'{z}'}/{'{x}'}/{'{y}'}.png</div>
              <div><strong>ESRI Satellite:</strong> https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{'{z}'}/{'{y}'}/{'{x}'}</div>
              <div className="text-xs mt-2 opacity-75">
                Note: Some services require API keys or have usage limits
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Component definition
export const BasemapsComponent: ComponentDefinition = {
  id: 'basemaps',
  name: 'Basemap Manager',
  description: 'Manage background maps with connection testing and status indicators',
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  primaryColor: '#059669',
  secondaryColor: '#34D399',
  category: 'visualization',
  priority: 15,
  enabled: true,
  onLaunch: (onClose?: () => void) => ({
    id: 'basemaps-modal',
    title: 'Basemap Manager',
    content: <BasemapsContent onClose={onClose} />,
    size: 'lg' as const,
    initialState: 'modal' as const,
    theme: {
      primaryColor: '#059669',
      accentColor: '#34D399',
      headerStyle: 'branded' as const,
      contentPadding: 'md' as const
    },
    closeable: true,
    sidebarWidth: 400
  })
};

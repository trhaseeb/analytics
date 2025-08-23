// Enhanced Layers Component - Research-Based Implementation
// Features: Smart type detection, duplicate prevention, better layout, working map integration

import { useState, useEffect } from 'react';
import { storageManager, type LayerData } from '../../systems/StorageManager';
import type { ComponentDefinition } from '../../types/components';

const LayersContent = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [layers, setLayers] = useState<LayerData[]>([]);
  
  const [newLayer, setNewLayer] = useState({
    name: '',
    type: '2d-orthophoto' as LayerData['type'],
    url: '',
    resolution: '',
    captureDate: '',
    provider: ''
  });

  // Load saved layers
  useEffect(() => {
    const savedLayers = storageManager.loadLayersData();
    setLayers(savedLayers);
    console.log('Loaded layers:', savedLayers);
  }, []);

  // Add new layer - URL based with validation
  const addLayer = () => {
    const { name, type, url, resolution, captureDate, provider } = newLayer;
    
    if (!name.trim()) {
      alert('Please enter a layer name');
      return;
    }
    
    if (!url.trim()) {
      alert('Please enter a valid URL');
      return;
    }
    
    // Validate URL format
    if (!isValidUrl(url)) {
      alert('Please enter a valid URL format. For 2D tiles use {x}/{y}/{z} pattern, for 3D use tileset.json URL');
      return;
    }
    
    // Check for duplicates
    if (layers.some(layer => 
      layer.name.toLowerCase() === name.toLowerCase() || layer.url === url
    )) {
      alert('A layer with this name or URL already exists');
      return;
    }
    
    const layer: LayerData = {
      id: `layer-${Date.now()}`,
      name: name.trim(),
      type,
      url,
      visible: true,
      opacity: 1,
      metadata: {
        resolution,
        captureDate,
        provider
      }
    };
    
    const updatedLayers = [...layers, layer];
    setLayers(updatedLayers);
    storageManager.saveLayersData(updatedLayers);
    
    console.log('Added layer:', layer);
    console.log('Total layers:', updatedLayers.length);
    
    // Reset form
    setNewLayer({
      name: '',
      type: '2d-orthophoto',
      url: '',
      resolution: '',
      captureDate: '',
      provider: ''
    });
    
    setActiveTab('current');
    
    // Force app refresh by dispatching a custom event
    window.dispatchEvent(new CustomEvent('layersUpdated', { detail: { layers: updatedLayers } }));
  };

  // URL validation function
  const isValidUrl = (url: string): boolean => {
    try {
      // Check if it's a valid URL
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return false;
      }
      
      // For 3D tiles, should end with tileset.json
      if (newLayer.type === '3d-orthophoto') {
        return url.endsWith('tileset.json');
      }
      
      // For 2D tiles, should have {x}, {y}, {z} placeholders or be a valid tile server
      return url.includes('{x}') && url.includes('{y}') && url.includes('{z}');
    } catch {
      return false;
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => {
      const updated = prev.map(layer => 
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      );
      storageManager.saveLayersData(updated);
      window.dispatchEvent(new CustomEvent('layersUpdated', { detail: { layers: updated } }));
      console.log('Toggled layer visibility:', layerId, 'New layers:', updated);
      return updated;
    });
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev => {
      const updated = prev.map(layer => 
        layer.id === layerId ? { ...layer, opacity } : layer
      );
      storageManager.saveLayersData(updated);
      window.dispatchEvent(new CustomEvent('layersUpdated', { detail: { layers: updated } }));
      console.log('Updated layer opacity:', layerId, opacity);
      return updated;
    });
  };

  const removeLayer = (layerId: string) => {
    if (confirm('Are you sure you want to remove this layer?')) {
      setLayers(prev => {
        const updated = prev.filter(layer => layer.id !== layerId);
        storageManager.saveLayersData(updated);
        window.dispatchEvent(new CustomEvent('layersUpdated', { detail: { layers: updated } }));
        console.log('Removed layer:', layerId, 'Remaining layers:', updated);
        return updated;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'current'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('current')}
          >
            Current Layers ({layers.length})
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'add'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('add')}
          >
            Add Layer
          </button>
        </nav>
      </div>

      {/* Current Layers Tab */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          {layers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <LayersIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p>No layers added yet</p>
              <button
                onClick={() => setActiveTab('add')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Add your first layer
              </button>
            </div>
          ) : (
            layers.map((layer) => (
              <div key={layer.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          layer.visible
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {layer.visible && <CheckIcon className="w-4 h-4" />}
                      </button>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">{layer.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            layer.type === '3d-orthophoto' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {layer.type === '3d-orthophoto' ? '3D' : '2D'}
                          </span>
                          <span>Orthophoto</span>
                        </div>
                        {layer.url && (
                          <div className="text-xs text-gray-400 mt-1 break-all">
                            {layer.url}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Opacity slider */}
                    <div className="mt-3">
                      <label className="text-sm text-gray-600 mb-1 block">
                        Opacity: {Math.round(layer.opacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={layer.opacity}
                        onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Metadata */}
                    {layer.metadata && (
                      <div className="mt-3 text-sm text-gray-600">
                        {layer.metadata.resolution && (
                          <div>Resolution: {layer.metadata.resolution}</div>
                        )}
                        {layer.metadata.captureDate && (
                          <div>Captured: {layer.metadata.captureDate}</div>
                        )}
                        {layer.metadata.provider && (
                          <div>Provider: {layer.metadata.provider}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeLayer(layer.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove layer"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Layer Tab */}
      {activeTab === 'add' && (
        <div className="space-y-6">
          {/* Layer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layer Name *
            </label>
            <input
              type="text"
              value={newLayer.name}
              onChange={(e) => setNewLayer(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter layer name"
            />
          </div>

          {/* Layer Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layer Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setNewLayer(prev => ({ ...prev, type: '2d-orthophoto' }))}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  newLayer.type === '2d-orthophoto'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">2D Orthophoto</div>
                <div className="text-sm text-gray-600">Standard aerial imagery tiles</div>
              </button>
              <button
                onClick={() => setNewLayer(prev => ({ ...prev, type: '3d-orthophoto' }))}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  newLayer.type === '3d-orthophoto'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">3D Orthophoto</div>
                <div className="text-sm text-gray-600">3D tiles with depth</div>
              </button>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {newLayer.type === '3d-orthophoto' ? 'Tileset.json URL' : 'Tile URL Template'} *
            </label>
            <input
              type="url"
              value={newLayer.url}
              onChange={(e) => setNewLayer(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={
                newLayer.type === '3d-orthophoto' 
                  ? 'https://example.com/tileset.json'
                  : 'https://example.com/{z}/{x}/{y}.png'
              }
            />
            <div className="mt-1 text-sm text-gray-500">
              {newLayer.type === '3d-orthophoto' 
                ? 'URL to a 3D Tiles tileset.json file'
                : 'Use {x}, {y}, {z} for tile coordinates'
              }
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution
              </label>
              <input
                type="text"
                value={newLayer.resolution}
                onChange={(e) => setNewLayer(prev => ({ ...prev, resolution: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 10cm/px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capture Date
              </label>
              <input
                type="date"
                value={newLayer.captureDate}
                onChange={(e) => setNewLayer(prev => ({ ...prev, captureDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider
              </label>
              <input
                type="text"
                value={newLayer.provider}
                onChange={(e) => setNewLayer(prev => ({ ...prev, provider: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Data provider"
              />
            </div>
          </div>

          {/* Add Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={addLayer}
              disabled={!newLayer.name.trim() || !newLayer.url.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Add Layer
            </button>
          </div>

          {/* Quick Test Examples */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">
              🧪 Quick Test URLs
            </h5>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• <strong>OpenStreetMap:</strong> https://tile.openstreetmap.org/{'{z}'}/{'{x}'}/{'{y}'}.png</div>
              <div>• <strong>CartoDB:</strong> https://basemaps.cartocdn.com/light_all/{'{z}'}/{'{x}'}/{'{y}'}.png</div>
              <div>• <strong>Stamen Terrain:</strong> https://stamen-tiles.a.ssl.fastly.net/terrain/{'{z}'}/{'{x}'}/{'{y}'}.png</div>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">
              💡 URL Format Guide
            </h5>
            <div className="text-sm text-gray-700 space-y-1">
              <div>• <strong>2D Tiles:</strong> Must include {'{z}'}, {'{x}'}, and {'{y}'} placeholders</div>
              <div>• <strong>3D Tiles:</strong> Must be a direct URL to tileset.json file</div>
              <div>• <strong>HTTPS Required:</strong> Most modern tile servers require secure connections</div>
              <div>• <strong>CORS:</strong> Ensure tile server allows cross-origin requests</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Icons
const LayersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Component definition
export const LayersComponent: ComponentDefinition = {
  id: 'layers',
  name: 'Layers',
  description: 'Manage 2D and 3D map layers with URL support',
  icon: <LayersIcon />,
  primaryColor: '#2563EB',
  secondaryColor: '#3B82F6',
  category: 'data',
  priority: 20,
  enabled: true,
  onLaunch: () => ({
    id: 'layers-modal',
    title: 'Layer Manager',
    content: <LayersContent />,
    size: 'lg',
    initialState: 'modal',
    theme: {
      primaryColor: '#2563EB',
      accentColor: '#3B82F6',
      headerStyle: 'branded',
      contentPadding: 'md'
    },
    closeable: true,
    sidebarWidth: 400
  } as const)
};

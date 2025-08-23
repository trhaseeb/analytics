// Layers Component - Layer management for 2D and 3D orthophotos

import { useState, useEffect } from 'react';
import { storageManager } from '../../systems/StorageManager';
import type { ComponentDefinition, ModalContentProps } from '../../types/components';

interface Layer {
  id: string;
  name: string;
  type: '2d-orthophoto' | '3d-orthophoto';
  tiles?: string; // Local tiles folder path or processed tile info JSON
  url?: string; // External URL (optional)
  visible: boolean;
  opacity: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  metadata?: {
    resolution: string;
    captureDate: string;
    provider: string;
    zoomLevels?: number[]; // Available zoom levels for tiled maps
    tileCount?: number; // Total number of tiles
    structure?: 'tiled' | 'single'; // Type of tile structure
  };
}

// Component content
const LayersContent = ({ modalState, onClose }: ModalContentProps) => {
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // New layer form state
  const [newLayer, setNewLayer] = useState({
    name: '',
    type: '2d-orthophoto' as '2d-orthophoto' | '3d-orthophoto',
    url: '',
    tiles: null as File | string | null, // Updated to support both File and processed tile info
    resolution: '',
    captureDate: '',
    provider: '',
    bounds: undefined as Layer['bounds'] | undefined
  });

  // Load saved layers on component mount
  useEffect(() => {
    const savedLayers = storageManager.loadLayersData();
    setLayers(savedLayers);
    if (savedLayers.length > 0) {
      setLastSaved(new Date().toISOString());
    }
  }, []);

  // Save layers
  const saveLayers = () => {
    try {
      storageManager.saveLayersData(layers);
      setLastSaved(new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Failed to save layers:', error);
      return false;
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity }
        : layer
    ));
  };

  const removeLayer = (layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
  };

  const handleTileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadProgress(0);
    
    try {
      // Handle multiple files for tiled map structure
      const fileList = Array.from(files);
      
      // Validate tile structure
      const tilePattern = /(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)$/i;
      const xmlPattern = /\.(xml|tilesxml)$/i;
      
      let tileFiles = [];
      let metadataFiles = [];
      let bounds = null;
      let zoomLevels = new Set<number>();
      
      // Process files and extract structure info
      for (const file of fileList) {
        const relativePath = file.webkitRelativePath || file.name;
        
        if (xmlPattern.test(relativePath)) {
          metadataFiles.push(file);
        } else if (tilePattern.test(relativePath)) {
          const match = relativePath.match(tilePattern);
          if (match) {
            const [, z, x, y] = match;
            zoomLevels.add(parseInt(z));
            tileFiles.push({
              file,
              z: parseInt(z),
              x: parseInt(x),
              y: parseInt(y),
              path: relativePath
            });
          }
        }
      }
      
      // Calculate bounds from tile coordinates if available
      if (tileFiles.length > 0) {
        const minZ = Math.min(...Array.from(zoomLevels));
        
        // Get tiles from the lowest zoom level to calculate overall bounds
        const lowZoomTiles = tileFiles.filter(t => t.z === minZ);
        if (lowZoomTiles.length > 0) {
          const xCoords = lowZoomTiles.map(t => t.x);
          const yCoords = lowZoomTiles.map(t => t.y);
          
          // Convert tile coordinates to lat/lng bounds
          // Using standard Web Mercator projection formulas
          const minX = Math.min(...xCoords);
          const maxX = Math.max(...xCoords);
          const minY = Math.min(...yCoords);
          const maxY = Math.max(...yCoords);
          
          // Convert to lat/lng using tile2deg formula
          const n = Math.pow(2, minZ);
          bounds = {
            west: (minX / n * 360.0) - 180.0,
            east: ((maxX + 1) / n * 360.0) - 180.0,
            north: Math.atan(Math.sinh(Math.PI * (1 - 2 * minY / n))) * 180.0 / Math.PI,
            south: Math.atan(Math.sinh(Math.PI * (1 - 2 * (maxY + 1) / n))) * 180.0 / Math.PI
          };
        }
      }
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 5) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Update new layer with processed tile information
      setNewLayer(prev => ({ 
        ...prev, 
        tiles: JSON.stringify({
          fileCount: tileFiles.length,
          zoomLevels: Array.from(zoomLevels).sort((a, b) => a - b),
          bounds: bounds,
          structure: 'tiled', // Mark as tiled structure
          metadataFiles: metadataFiles.length
        }),
        bounds: bounds || undefined
      }));
      
      setUploadProgress(null);
      console.log(`Processed ${tileFiles.length} tiles across ${zoomLevels.size} zoom levels`, {
        bounds,
        zoomRange: `${Math.min(...Array.from(zoomLevels))}-${Math.max(...Array.from(zoomLevels))}`
      });
    } catch (error) {
      console.error('Error processing tiles:', error);
      setUploadProgress(null);
    }
  };  const addLayer = () => {
    if (!newLayer.name) return;
    if (!newLayer.url && !newLayer.tiles) return;

    const layer: Layer = {
      id: Date.now().toString(),
      name: newLayer.name,
      type: newLayer.type,
      url: newLayer.url || undefined,
      tiles: typeof newLayer.tiles === 'string' ? newLayer.tiles : 
             newLayer.tiles ? `/layers/${newLayer.tiles.name}` : undefined,
      visible: true,
      opacity: 1.0,
      metadata: {
        resolution: newLayer.resolution || 'Unknown',
        captureDate: newLayer.captureDate || 'Unknown',
        provider: newLayer.provider || 'Custom'
      }
    };

    setLayers(prev => {
      const newLayers = [...prev, layer];
      // Auto-save after adding layer
      setTimeout(() => {
        storageManager.saveLayersData(newLayers);
        setLastSaved(new Date().toISOString());
      }, 100);
      return newLayers;
    });
    
    setNewLayer({
      name: '',
      type: '2d-orthophoto',
      url: '',
      tiles: null,
      resolution: '',
      captureDate: '',
      provider: '',
      bounds: undefined
    });
  };

  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const index = prev.findIndex(layer => layer.id === layerId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newLayers = [...prev];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      return newLayers;
    });
  };

  const isCompact = modalState === 'sidebar';

  return (
    <div className="space-y-6">
      {isCompact && (
        <div className="text-xs text-gray-500 mb-4">Layer Manager - Compact View</div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'current', name: 'Current Layers' },
            { id: 'add', name: 'Add Layer' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Current Layers Tab */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Loaded Layers ({layers.length})</h4>
            <div className="text-sm text-gray-500">
              {layers.filter(l => l.visible).length} visible
            </div>
          </div>

          <div className="space-y-3">
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                className={`p-4 rounded-lg border transition-all ${
                  layer.visible 
                    ? 'bg-white border-blue-200 shadow-sm' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* Layer Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        layer.visible
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {layer.visible && <CheckIcon className="w-3 h-3" />}
                    </button>
                    <div>
                      <h5 className="font-medium text-gray-900">{layer.name}</h5>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded ${
                          layer.type === '2d-orthophoto' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {layer.type === '2d-orthophoto' ? '2D Orthophoto' : '3D Orthophoto'}
                        </span>
                        {layer.metadata && (
                          <span>{layer.metadata.resolution} • {layer.metadata.provider}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Layer Ordering */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveLayer(layer.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUpIcon className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveLayer(layer.id, 'down')}
                        disabled={index === layers.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDownIcon className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Remove Layer */}
                    <button
                      onClick={() => removeLayer(layer.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <RemoveIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Opacity Control */}
                {layer.visible && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Opacity</span>
                      <span className="text-gray-900 font-medium">{Math.round(layer.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={layer.opacity}
                      onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}

                {/* Layer Details */}
                {layer.metadata && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Resolution: {layer.metadata.resolution}</div>
                      <div>Capture: {layer.metadata.captureDate}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {layers.length === 0 && (
            <div className="text-center py-8">
              <LayersIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-500 mb-2">No layers loaded</p>
              <button
                onClick={() => setActiveTab('add')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first layer →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Layer Tab */}
      {activeTab === 'add' && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Add New Orthophoto Layer</h4>
            
            <div className="space-y-4">
              {/* Layer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Layer Name *
                </label>
                <input
                  type="text"
                  value={newLayer.name}
                  onChange={(e) => setNewLayer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Aerial Survey 2023"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Layer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Layer Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewLayer(prev => ({ ...prev, type: '2d-orthophoto' }))}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      newLayer.type === '2d-orthophoto'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">2D Orthophoto</div>
                    <div className="text-xs opacity-75">Flat aerial imagery</div>
                  </button>
                  <button
                    onClick={() => setNewLayer(prev => ({ ...prev, type: '3d-orthophoto' }))}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      newLayer.type === '3d-orthophoto'
                        ? 'bg-purple-50 border-purple-200 text-purple-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">3D Orthophoto</div>
                    <div className="text-xs opacity-75">3D tiled imagery</div>
                  </button>
                </div>
              </div>

              {/* Layer Source */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700">Layer Source</div>
                
                {/* Local Tiles Upload */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Upload Local Tiles Folder *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      onChange={handleTileUpload}
                      className="hidden"
                      id="tiles-upload"
                      accept=".png,.jpg,.jpeg,.xml"
                      {...({ webkitdirectory: "", directory: "", multiple: true } as any)}
                    />
                    <label htmlFor="tiles-upload" className="cursor-pointer">
                      <div className="space-y-2">
                        <div className="mx-auto w-12 h-12 text-gray-400">
                          📁
                        </div>
                        <div className="text-sm text-gray-600">
                          {newLayer.tiles ? 
                            (typeof newLayer.tiles === 'string' ? 'Processed tile structure' : newLayer.tiles.name) : 
                            'Click to select tiles folder'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Select a folder containing {newLayer.type === '2d-orthophoto' ? 'z/x/y.png' : '3D tiles'} structure
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
                          className="bg-blue-500 h-2 rounded-full transition-all" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center text-gray-500 text-sm">OR</div>

                {/* External URL Option */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    External Tile Service URL
                  </label>
                  <input
                    type="text"
                    value={newLayer.url}
                    onChange={(e) => setNewLayer(prev => ({ ...prev, url: e.target.value }))}
                    placeholder={newLayer.type === '2d-orthophoto' 
                      ? "https://example.com/tiles/{z}/{x}/{y}.png"
                      : "https://example.com/3dtiles/tileset.json"
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resolution
                  </label>
                  <input
                    type="text"
                    value={newLayer.resolution}
                    onChange={(e) => setNewLayer(prev => ({ ...prev, resolution: e.target.value }))}
                    placeholder="e.g., 10cm"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capture Date
                  </label>
                  <input
                    type="text"
                    value={newLayer.captureDate}
                    onChange={(e) => setNewLayer(prev => ({ ...prev, captureDate: e.target.value }))}
                    placeholder="e.g., 2023-08"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <input
                    type="text"
                    value={newLayer.provider}
                    onChange={(e) => setNewLayer(prev => ({ ...prev, provider: e.target.value }))}
                    placeholder="e.g., Survey Co."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Add Button */}
              <div className="flex justify-end">
                <button
                  onClick={addLayer}
                  disabled={!newLayer.name || (!newLayer.url && !newLayer.tiles)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Layer
                </button>
              </div>
            </div>
          </div>

          {/* Layer Examples */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">
              <InfoIcon className="w-4 h-4 inline mr-2" />
              Supported Formats
            </h5>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Local Tiles:</strong> Upload folder with z/x/y structure (PNG, JPEG, WebP)</p>
              <p><strong>2D External:</strong> XYZ tiles, WMS, WMTS, TMS services</p>
              <p><strong>3D External:</strong> 3D Tiles, Cesium 3D Tiles (tileset.json)</p>
              <p><strong>Note:</strong> Local tiles are processed and stored in your project</p>
            </div>
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
            <span>No layers saved yet</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              const success = saveLayers();
              if (success) {
                console.log('Layers saved successfully');
                onClose?.(); // Close modal after successful save
              } else {
                console.error('Failed to save layers');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Layers
          </button>
        </div>
      </div>
    </div>
  );
};

// Flat minimal layers icon
const LayersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

// Component definition
export const LayersComponent: ComponentDefinition = {
  id: 'layers',
  name: 'Layer Manager',
  description: 'Manage 2D and 3D orthophoto layers for your map',
  icon: <LayersIcon />,
  primaryColor: '#2563EB',
  secondaryColor: '#60A5FA',
  category: 'visualization',
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
      accentColor: '#60A5FA',
      headerStyle: 'branded',
      contentPadding: 'md'
    },
    closeable: true,
    sidebarWidth: 400
  })
};

// Simple icon components
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ChevronUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const RemoveIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Unified Tile Manager - Handles all tiles (background + orthophoto) in one interface
// Replaces separate BasemapsComponent and LayersComponent

import { useState, useEffect } from 'react';
import { storageManager } from '../../systems/StorageManager';
import type { ComponentDefinition } from '../../types/components';

interface TileSource {
  id: string;
  name: string;
  type: 'background' | 'orthophoto' | 'elevation';
  source: 'url' | 'local';
  data: string; // URL template or local path
  visible: boolean;
  opacity: number;
  minZoom: number;
  maxZoom: number;
  bounds?: [number, number, number, number];
  attribution?: string;
  metadata?: {
    resolution?: string;
    captureDate?: string;
    provider?: string;
    tileCount?: number;
    structure?: 'tiled' | 'single';
  };
}

// Component content
const UnifiedTileManagerContent = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [tileSources, setTileSources] = useState<TileSource[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // New tile source form state
  const [newTileSource, setNewTileSource] = useState({
    name: '',
    type: 'orthophoto' as TileSource['type'],
    source: 'url' as TileSource['source'],
    data: '',
    opacity: 1,
    minZoom: 0,
    maxZoom: 22,
    attribution: '',
    tiles: null as File | string | null,
    resolution: '',
    captureDate: '',
    provider: ''
  });

  // Load saved tile sources on component mount
  useEffect(() => {
    const loadedSources = loadAllTileSources();
    setTileSources(loadedSources);
    if (loadedSources.length > 0) {
      setLastSaved(new Date().toISOString());
    }
  }, []);

  // Auto-save when tile sources change
  useEffect(() => {
    if (tileSources.length > 0) {
      saveAllTileSources(tileSources);
      setLastSaved(new Date().toISOString());
    }
  }, [tileSources]);

  const loadAllTileSources = (): TileSource[] => {
    const sources: TileSource[] = [];
    
    // Load basemaps as background tiles
    const basemaps = storageManager.loadBasemapsData();
    basemaps.forEach(basemap => {
      sources.push({
        id: basemap.id,
        name: basemap.name,
        type: 'background',
        source: basemap.url ? 'url' : 'local',
        data: basemap.url || basemap.tiles || '',
        visible: basemap.isActive,
        opacity: 1,
        minZoom: 0,
        maxZoom: 19,
        attribution: basemap.attribution
      });
    });
    
    // Load layers as orthophoto tiles
    const layers = storageManager.loadLayersData();
    layers.forEach(layer => {
      let bounds: [number, number, number, number] | undefined;
      if (layer.bounds) {
        bounds = [layer.bounds.west, layer.bounds.south, layer.bounds.east, layer.bounds.north];
      }
      
      sources.push({
        id: layer.id,
        name: layer.name,
        type: layer.type === '3d-orthophoto' ? 'elevation' : 'orthophoto',
        source: layer.url ? 'url' : 'local',
        data: layer.url || layer.tiles || '',
        visible: layer.visible,
        opacity: layer.opacity,
        minZoom: 0,
        maxZoom: 22,
        bounds,
        metadata: layer.metadata ? {
          resolution: layer.metadata.resolution,
          captureDate: layer.metadata.captureDate,
          provider: layer.metadata.provider
        } : undefined
      });
    });
    
    return sources;
  };

  const saveAllTileSources = (sources: TileSource[]) => {
    // Separate and save background vs orthophoto tiles
    const backgroundSources = sources.filter(s => s.type === 'background');
    const dataSources = sources.filter(s => s.type !== 'background');
    
    // Convert back to basemap format
    const basemaps = backgroundSources.map(source => ({
      id: source.id,
      name: source.name,
      type: 'custom' as const,
      url: source.source === 'url' ? source.data : undefined,
      tiles: source.source === 'local' ? source.data : undefined,
      attribution: source.attribution,
      isActive: source.visible
    }));
    
    // Convert back to layer format
    const layers = dataSources.map(source => ({
      id: source.id,
      name: source.name,
      type: source.type === 'elevation' ? '3d-orthophoto' as const : '2d-orthophoto' as const,
      url: source.source === 'url' ? source.data : undefined,
      tiles: source.source === 'local' ? source.data : undefined,
      visible: source.visible,
      opacity: source.opacity,
      bounds: source.bounds ? {
        west: source.bounds[0],
        south: source.bounds[1],
        east: source.bounds[2],
        north: source.bounds[3]
      } : undefined,
      metadata: source.metadata && source.metadata.resolution && source.metadata.captureDate && source.metadata.provider ? {
        resolution: source.metadata.resolution,
        captureDate: source.metadata.captureDate,
        provider: source.metadata.provider
      } : undefined
    }));
    
    storageManager.saveBasemapsData(basemaps);
    storageManager.saveLayersData(layers);
    
    // Dispatch update events for other components
    window.dispatchEvent(new CustomEvent('componentUpdated', {
      detail: { component: 'tiles', data: { basemaps, layers } }
    }));
  };

  const handleTileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadProgress(0);
    
    try {
      // Handle multiple files for tiled structure
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
        const lowZoomTiles = tileFiles.filter(t => t.z === minZ);
        
        if (lowZoomTiles.length > 0) {
          const xCoords = lowZoomTiles.map(t => t.x);
          const yCoords = lowZoomTiles.map(t => t.y);
          
          const minX = Math.min(...xCoords);
          const maxX = Math.max(...xCoords);
          const minY = Math.min(...yCoords);
          const maxY = Math.max(...yCoords);
          
          // Convert to lat/lng using tile2deg formula
          const n = Math.pow(2, minZ);
          bounds = [
            (minX / n * 360.0) - 180.0, // west
            Math.atan(Math.sinh(Math.PI * (1 - 2 * (maxY + 1) / n))) * 180.0 / Math.PI, // south
            ((maxX + 1) / n * 360.0) - 180.0, // east
            Math.atan(Math.sinh(Math.PI * (1 - 2 * minY / n))) * 180.0 / Math.PI // north
          ] as [number, number, number, number];
        }
      }
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 5) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Update new tile source with processed tile information
      setNewTileSource(prev => ({ 
        ...prev, 
        data: JSON.stringify({
          fileCount: tileFiles.length,
          zoomLevels: Array.from(zoomLevels).sort((a, b) => a - b),
          bounds: bounds,
          structure: 'tiled',
          metadataFiles: metadataFiles.length
        }),
        source: 'local',
        minZoom: Math.min(...Array.from(zoomLevels)),
        maxZoom: Math.max(...Array.from(zoomLevels))
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
  };

  const addTileSource = () => {
    if (!newTileSource.name) return;
    if (!newTileSource.data && newTileSource.source === 'url') return;
    if (!newTileSource.tiles && newTileSource.source === 'local') return;

    const tileSource: TileSource = {
      id: Date.now().toString(),
      name: newTileSource.name,
      type: newTileSource.type,
      source: newTileSource.source,
      data: newTileSource.source === 'url' ? newTileSource.data : 
            (typeof newTileSource.tiles === 'string' ? newTileSource.tiles : 
             newTileSource.tiles ? `/tiles/${newTileSource.tiles.name}` : ''),
      visible: true,
      opacity: newTileSource.opacity,
      minZoom: newTileSource.minZoom,
      maxZoom: newTileSource.maxZoom,
      attribution: newTileSource.attribution || undefined,
      metadata: {
        resolution: newTileSource.resolution || undefined,
        captureDate: newTileSource.captureDate || undefined,
        provider: newTileSource.provider || undefined
      }
    };

    setTileSources(prev => [...prev, tileSource]);
    
    // Reset form
    setNewTileSource({
      name: '',
      type: 'orthophoto',
      source: 'url',
      data: '',
      opacity: 1,
      minZoom: 0,
      maxZoom: 22,
      attribution: '',
      tiles: null,
      resolution: '',
      captureDate: '',
      provider: ''
    });
  };

  const toggleTileVisibility = (id: string) => {
    setTileSources(prev => prev.map(source => 
      source.id === id ? { ...source, visible: !source.visible } : source
    ));
  };

  const updateTileOpacity = (id: string, opacity: number) => {
    setTileSources(prev => prev.map(source => 
      source.id === id ? { ...source, opacity } : source
    ));
  };

  const removeTileSource = (id: string) => {
    setTileSources(prev => prev.filter(source => source.id !== id));
  };

  // Convert to TileLayerConfig for the map (could be used by parent component)
  // const getTileLayerConfigs = (): TileLayerConfig[] => {
  //   return tileSources.map(source => ({
  //     id: source.id,
  //     name: source.name,
  //     type: source.type,
  //     data: source.data,
  //     visible: source.visible,
  //     opacity: source.opacity,
  //     minZoom: source.minZoom,
  //     maxZoom: source.maxZoom,
  //     bounds: source.bounds,
  //     tileSize: 256
  //   }));
  // };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'current', name: 'Tile Sources', count: tileSources.length },
            { id: 'add', name: 'Add Source' }
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
              {'count' in tab && <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">{tab.count}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Current Tile Sources Tab */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Tile Sources</h3>
            <div className="text-sm text-gray-500">
              {tileSources.filter(s => s.visible).length} of {tileSources.length} visible
            </div>
          </div>

          {tileSources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🗺️</div>
              <p>No tile sources added yet</p>
              <p className="text-sm">Click "Add Source" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tileSources.map(source => (
                <div key={source.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleTileVisibility(source.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            source.visible 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {source.visible && <div className="w-2 h-2 bg-white rounded-sm" />}
                        </button>
                        <h4 className="font-medium text-gray-900">{source.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          source.type === 'background' ? 'bg-gray-100 text-gray-800' :
                          source.type === 'orthophoto' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {source.type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          source.source === 'url' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {source.source}
                        </span>
                      </div>

                      <div className="mt-2 ml-7 space-y-1 text-sm text-gray-600">
                        <div>Data: {source.data.length > 60 ? source.data.substring(0, 60) + '...' : source.data}</div>
                        <div>Zoom: {source.minZoom}-{source.maxZoom}</div>
                        {source.bounds && (
                          <div>Bounds: [{source.bounds.map(b => b.toFixed(4)).join(', ')}]</div>
                        )}
                        {source.attribution && (
                          <div>Attribution: {source.attribution}</div>
                        )}
                      </div>

                      {/* Opacity Control */}
                      <div className="mt-3 ml-7">
                        <label className="block text-xs text-gray-500 mb-1">
                          Opacity: {Math.round(source.opacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={source.opacity}
                          onChange={(e) => updateTileOpacity(source.id, parseFloat(e.target.value))}
                          className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => removeTileSource(source.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add New Tile Source Tab */}
      {activeTab === 'add' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Add New Tile Source</h3>

          <div className="space-y-4">
            {/* Source Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Name *
              </label>
              <input
                type="text"
                value={newTileSource.name}
                onChange={(e) => setNewTileSource(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tile source name"
              />
            </div>

            {/* Source Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Type
              </label>
              <select
                value={newTileSource.type}
                onChange={(e) => setNewTileSource(prev => ({ ...prev, type: e.target.value as TileSource['type'] }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="background">Background Map</option>
                <option value="orthophoto">2D Orthophoto</option>
                <option value="elevation">3D Elevation</option>
              </select>
            </div>

            {/* Data Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Source
              </label>
              <div className="space-y-3">
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="url"
                      checked={newTileSource.source === 'url'}
                      onChange={(e) => setNewTileSource(prev => ({ ...prev, source: e.target.value as 'url' | 'local' }))}
                      className="mr-2"
                    />
                    URL Template
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="local"
                      checked={newTileSource.source === 'local'}
                      onChange={(e) => setNewTileSource(prev => ({ ...prev, source: e.target.value as 'url' | 'local' }))}
                      className="mr-2"
                    />
                    Local Tiles
                  </label>
                </div>

                {newTileSource.source === 'url' ? (
                  <input
                    type="url"
                    value={newTileSource.data}
                    onChange={(e) => setNewTileSource(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/tiles/{z}/{x}/{y}.png"
                  />
                ) : (
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
                          {newTileSource.tiles ? 
                            (typeof newTileSource.tiles === 'string' ? 'Processed tile structure' : newTileSource.tiles.name) : 
                            'Click to select tiles folder'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Select a folder containing z/x/y tile structure
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {uploadProgress !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Processing tiles...</span>
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
            </div>

            {/* Zoom Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Zoom
                </label>
                <input
                  type="number"
                  min="0"
                  max="22"
                  value={newTileSource.minZoom}
                  onChange={(e) => setNewTileSource(prev => ({ ...prev, minZoom: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Zoom
                </label>
                <input
                  type="number"
                  min="0"
                  max="22"
                  value={newTileSource.maxZoom}
                  onChange={(e) => setNewTileSource(prev => ({ ...prev, maxZoom: parseInt(e.target.value) || 22 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opacity: {Math.round(newTileSource.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={newTileSource.opacity}
                onChange={(e) => setNewTileSource(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Attribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attribution
              </label>
              <input
                type="text"
                value={newTileSource.attribution}
                onChange={(e) => setNewTileSource(prev => ({ ...prev, attribution: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="© Your Organization"
              />
            </div>

            {/* Metadata (for orthophoto/elevation sources) */}
            {newTileSource.type !== 'background' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Metadata</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Resolution</label>
                    <input
                      type="text"
                      value={newTileSource.resolution}
                      onChange={(e) => setNewTileSource(prev => ({ ...prev, resolution: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 10cm/pixel"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Capture Date</label>
                    <input
                      type="date"
                      value={newTileSource.captureDate}
                      onChange={(e) => setNewTileSource(prev => ({ ...prev, captureDate: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Provider</label>
                  <input
                    type="text"
                    value={newTileSource.provider}
                    onChange={(e) => setNewTileSource(prev => ({ ...prev, provider: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Drone Survey Co."
                  />
                </div>
              </div>
            )}

            {/* Add Button */}
            <button
              onClick={addTileSource}
              disabled={!newTileSource.name || (newTileSource.source === 'url' && !newTileSource.data) || (newTileSource.source === 'local' && !newTileSource.tiles)}
              className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Tile Source
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {lastSaved ? (
            <span>Last saved: {new Date(lastSaved).toLocaleString()}</span>
          ) : (
            <span>Auto-saving changes</span>
          )}
        </div>

        <div className="flex items-center px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Changes saved automatically
        </div>
      </div>
    </div>
  );
};

// Component definition for registration
export const UnifiedTileManagerComponent: ComponentDefinition = {
  id: 'unified-tile-manager',
  name: 'Tile Manager',
  description: 'Unified tile source management',
  icon: '🗺️',
  primaryColor: '#3B82F6',
  category: 'data',
  onLaunch: () => ({
    id: 'unified-tile-manager-modal',
    title: 'Tile Manager',
    content: <UnifiedTileManagerContent />,
    size: 'lg'
  } as const)
};

export default UnifiedTileManagerComponent;

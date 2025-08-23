// Enhanced Layers Component - Research-Based Implementation
// Features: Smart type detection, duplicate prevention, better layout, fixed map integration

import { useState, useEffect } from 'react';
import { storageManager, type LayerData } from '../../systems/StorageManager';
import type { ComponentDefinition } from '../../types/components';

// Enhanced Layer interface that extends existing LayerData
interface EnhancedLayer extends LayerData {
  dimension?: '2d' | '3d';
  dataType?: 'orthophoto' | 'dsm' | 'dem' | 'pointcloud' | 'mesh';
  source?: 'url' | 'tiles';
  createdAt?: string;
}

// Smart type detection for tiles
const detectLayerType = (files: FileList): {
  dimension: '2d' | '3d';
  dataType: 'orthophoto' | 'dsm' | 'dem' | 'pointcloud' | 'mesh';
  format: 'xyz' | '3dtiles';
  tileInfo?: any;
} => {
  const fileArray = Array.from(files);
  const fileNames = fileArray.map(f => f.name.toLowerCase());
  
  // Check for 3D Tiles
  if (fileNames.some(name => name.includes('tileset.json'))) {
    const dataType = fileNames.some(name => name.includes('.pnts')) ? 'pointcloud' :
                    fileNames.some(name => name.includes('.b3dm')) ? 'mesh' : 'orthophoto';
    return { dimension: '3d', dataType, format: '3dtiles' };
  }
  
  // Check for tile structure
  const tilePattern = /(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg|tif|tiff)$/i;
  const hasTileStructure = fileArray.some(file => 
    file.webkitRelativePath && tilePattern.test(file.webkitRelativePath)
  );
  
  if (hasTileStructure) {
    const nameLower = fileNames.join(' ');
    const isDSM = nameLower.includes('dsm') || nameLower.includes('surface');
    const isDEM = nameLower.includes('dem') || nameLower.includes('elevation');
    
    let dataType: 'orthophoto' | 'dsm' | 'dem' = 'orthophoto';
    if (isDSM) dataType = 'dsm';
    else if (isDEM) dataType = 'dem';
    
    return {
      dimension: '2d',
      dataType,
      format: 'xyz',
      tileInfo: analyzeTileStructure(fileArray)
    };
  }
  
  return { dimension: '2d', dataType: 'orthophoto', format: 'xyz' };
};

const analyzeTileStructure = (files: File[]) => {
  const tilePattern = /(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg|tif|tiff)$/i;
  let minZ = Infinity, maxZ = -Infinity;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let tileCount = 0;
  
  files.forEach(file => {
    const match = file.webkitRelativePath?.match(tilePattern);
    if (match) {
      const [, z, x, y] = match.map(Number);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      tileCount++;
    }
  });
  
  if (tileCount === 0) return null;
  
  // Calculate bounds
  const n = Math.pow(2, minZ);
  const bounds = {
    west: (minX / n * 360.0) - 180.0,
    east: ((maxX + 1) / n * 360.0) - 180.0,
    north: Math.atan(Math.sinh(Math.PI * (1 - 2 * minY / n))) * 180.0 / Math.PI,
    south: Math.atan(Math.sinh(Math.PI * (1 - 2 * (maxY + 1) / n))) * 180.0 / Math.PI
  };
  
  return {
    fileCount: tileCount,
    zoomLevels: Array.from({length: maxZ - minZ + 1}, (_, i) => minZ + i),
    bounds
  };
};

const LayersContent = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [layers, setLayers] = useState<EnhancedLayer[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  
  const [newLayer, setNewLayer] = useState({
    name: '',
    dimension: '2d' as '2d' | '3d',
    source: 'url' as 'url' | 'tiles',
    url: '',
    files: null as FileList | null,
    resolution: '',
    captureDate: '',
    provider: '',
    detectedInfo: null as ReturnType<typeof detectLayerType> | null
  });

  // Load saved layers
  useEffect(() => {
    const savedLayers = storageManager.loadLayersData();
    // Convert to enhanced format with backward compatibility
    const enhanced = savedLayers.map(layer => ({
      ...layer,
      dimension: layer.type === '3d-orthophoto' ? '3d' as const : '2d' as const,
      dataType: 'orthophoto' as const,
      source: layer.url ? 'url' as const : 'tiles' as const,
      createdAt: new Date().toISOString()
    }));
    setLayers(enhanced);
  }, []);

  // Check for duplicates
  const checkForDuplicate = (name: string, url?: string): boolean => {
    return layers.some(layer => 
      layer.name.toLowerCase() === name.toLowerCase() ||
      (url && layer.url === url)
    );
  };

  // Handle file selection
  const handleFileSelection = (files: FileList) => {
    setProcessing(true);
    const detection = detectLayerType(files);
    
    setNewLayer(prev => ({
      ...prev,
      files,
      dimension: detection.dimension,
      detectedInfo: detection,
      name: prev.name || `${detection.dataType}_layer_${Date.now()}`
    }));
    
    setProcessing(false);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files);
    }
  };

  // Add new layer
  const addLayer = () => {
    const { name, dimension, source, url, files, detectedInfo, resolution, captureDate, provider } = newLayer;
    
    if (!name.trim()) {
      alert('Please enter a layer name');
      return;
    }
    
    if (checkForDuplicate(name, url)) {
      alert('A layer with this name or URL already exists');
      return;
    }
    
    if (source === 'url' && !url.trim()) {
      alert('Please enter a valid URL');
      return;
    }
    
    if (source === 'tiles' && !files) {
      alert('Please select tiles');
      return;
    }
    
    // Map to compatible LayerData format
    const layerType = dimension === '3d' ? '3d-orthophoto' : '2d-orthophoto';
    
    const layer: EnhancedLayer = {
      id: `layer-${Date.now()}`,
      name: name.trim(),
      type: layerType,
      dimension,
      dataType: detectedInfo?.dataType || 'orthophoto',
      source,
      url: source === 'url' ? url : undefined,
      tiles: source === 'tiles' ? JSON.stringify(detectedInfo?.tileInfo || {}) : undefined,
      visible: true,
      opacity: 1,
      bounds: detectedInfo?.tileInfo?.bounds,
      metadata: {
        resolution,
        captureDate,
        provider
      },
      createdAt: new Date().toISOString()
    };
    
    const updatedLayers = [...layers, layer];
    setLayers(updatedLayers);
    
    // Convert back to LayerData format for storage
    const storageFormat = updatedLayers.map(l => ({
      id: l.id,
      name: l.name,
      type: l.type,
      url: l.url,
      tiles: l.tiles,
      visible: l.visible,
      opacity: l.opacity,
      bounds: l.bounds,
      metadata: l.metadata
    }));
    
    storageManager.saveLayersData(storageFormat);
    
    // Reset form
    setNewLayer({
      name: '',
      dimension: '2d',
      source: 'url',
      url: '',
      files: null,
      resolution: '',
      captureDate: '',
      provider: '',
      detectedInfo: null
    });
    
    setActiveTab('current');
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => {
      const updated = prev.map(layer => 
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      );
      
      const storageFormat = updated.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type,
        url: l.url,
        tiles: l.tiles,
        visible: l.visible,
        opacity: l.opacity,
        bounds: l.bounds,
        metadata: l.metadata
      }));
      
      storageManager.saveLayersData(storageFormat);
      return updated;
    });
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev => {
      const updated = prev.map(layer => 
        layer.id === layerId ? { ...layer, opacity } : layer
      );
      
      const storageFormat = updated.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type,
        url: l.url,
        tiles: l.tiles,
        visible: l.visible,
        opacity: l.opacity,
        bounds: l.bounds,
        metadata: l.metadata
      }));
      
      storageManager.saveLayersData(storageFormat);
      return updated;
    });
  };

  const removeLayer = (layerId: string) => {
    if (confirm('Are you sure you want to remove this layer?')) {
      setLayers(prev => {
        const updated = prev.filter(layer => layer.id !== layerId);
        
        const storageFormat = updated.map(l => ({
          id: l.id,
          name: l.name,
          type: l.type,
          url: l.url,
          tiles: l.tiles,
          visible: l.visible,
          opacity: l.opacity,
          bounds: l.bounds,
          metadata: l.metadata
        }));
        
        storageManager.saveLayersData(storageFormat);
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
                            layer.dimension === '3d' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {(layer.dimension || '2d').toUpperCase()}
                          </span>
                          <span className="capitalize">{layer.dataType || 'orthophoto'}</span>
                          <span>• {layer.source || 'url'}</span>
                        </div>
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

          {/* Dimension Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layer Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setNewLayer(prev => ({ ...prev, dimension: '2d' }))}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  newLayer.dimension === '2d'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">2D Layers</div>
                <div className="text-sm text-gray-600">Orthophotos, DSM, DEM tiles</div>
              </button>
              <button
                onClick={() => setNewLayer(prev => ({ ...prev, dimension: '3d' }))}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  newLayer.dimension === '3d'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">3D Layers</div>
                <div className="text-sm text-gray-600">3D Tiles, Point clouds</div>
              </button>
            </div>
          </div>

          {/* Source Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Source
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setNewLayer(prev => ({ ...prev, source: 'url' }))}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  newLayer.source === 'url'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">External URL</div>
                <div className="text-sm text-gray-600">Tile servers, APIs</div>
              </button>
              <button
                onClick={() => setNewLayer(prev => ({ ...prev, source: 'tiles' }))}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  newLayer.source === 'tiles'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">Upload Tiles</div>
                <div className="text-sm text-gray-600">Local tile folders</div>
              </button>
            </div>
          </div>

          {/* URL Input */}
          {newLayer.source === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {newLayer.dimension === '3d' ? 'Tileset.json URL' : 'Tile URL Template'}
              </label>
              <input
                type="url"
                value={newLayer.url}
                onChange={(e) => setNewLayer(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  newLayer.dimension === '3d' 
                    ? 'https://example.com/tileset.json'
                    : 'https://example.com/{z}/{x}/{y}.png'
                }
              />
              <div className="mt-1 text-sm text-gray-500">
                {newLayer.dimension === '3d' 
                  ? 'URL to a 3D Tiles tileset.json file'
                  : 'Use {x}, {y}, {z} for tile coordinates'
                }
              </div>
            </div>
          )}

          {/* File Upload */}
          {newLayer.source === 'tiles' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tiles Folder
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  {...({ webkitdirectory: true } as any)}
                  multiple
                  onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
                  className="hidden"
                  id="tiles-upload"
                />
                <label htmlFor="tiles-upload" className="cursor-pointer">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <UploadIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-gray-900 font-medium">
                    Drop folder here or click to browse
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {newLayer.dimension === '3d' 
                      ? 'Select folder containing tileset.json'
                      : 'Select folder with z/x/y tile structure'
                    }
                  </div>
                </label>
              </div>

              {/* Detection Results */}
              {newLayer.detectedInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Auto-detected:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>{' '}
                      <span className="font-medium capitalize">
                        {newLayer.detectedInfo.dimension} {newLayer.detectedInfo.dataType}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Format:</span>{' '}
                      <span className="font-medium">{newLayer.detectedInfo.format}</span>
                    </div>
                    {newLayer.detectedInfo.tileInfo?.fileCount && (
                      <>
                        <div>
                          <span className="text-gray-600">Tiles:</span>{' '}
                          <span className="font-medium">{newLayer.detectedInfo.tileInfo.fileCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Zoom Levels:</span>{' '}
                          <span className="font-medium">
                            {Math.min(...newLayer.detectedInfo.tileInfo.zoomLevels)} - {Math.max(...newLayer.detectedInfo.tileInfo.zoomLevels)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={processing || !newLayer.name.trim() || 
                       (newLayer.source === 'url' && !newLayer.url.trim()) ||
                       (newLayer.source === 'tiles' && !newLayer.files)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Processing...' : 'Add Layer'}
            </button>
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

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

// Component definition
export const LayersComponent: ComponentDefinition = {
  id: 'layers',
  name: 'Layers',
  description: 'Manage 2D and 3D map layers with smart detection',
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

export default LayersComponent;

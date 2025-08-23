// Enhanced UnifiedMapComponent with proper 2D/3D tile support and auto-zoom
// Fixes: 1) Correct layer types 2) Auto-zoom to data 3) Load status indicators 4) 3D Tiles support

import React, { useCallback, useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { TileLayer } from '@deck.gl/geo-layers';
import { Tile3DLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import type { ViewState } from '../../types';

interface UnifiedMapComponentProps {
  viewState: ViewState;
  onViewStateChange: (viewState: ViewState) => void;
  tileLayers?: TileLayerConfig[];
  pointCloudLayers?: PointCloudLayerConfig[];
  onClick?: (event: any) => void;
  onHover?: (event: any) => void;
  is3D?: boolean;
}

interface TileLayerConfig {
  id: string;
  name: string;
  type: 'background' | 'orthophoto' | 'orthophoto-3d'; // Simplified - only these work properly
  data: string; // Tile URL template or tileset.json URL
  visible: boolean;
  opacity: number;
  minZoom?: number;
  maxZoom?: number;
  bounds?: [number, number, number, number]; // [west, south, east, north]
  tileSize?: number;
}

interface PointCloudLayerConfig {
  id: string;
  name: string;
  data: string;
  visible: boolean;
  opacity: number;
  pointSize?: number;
  coordinateSystem?: 'EPSG:4326' | 'EPSG:3857' | string;
  bounds?: [number, number, number, number];
}

interface LoadingStatus {
  [layerId: string]: {
    isLoading: boolean;
    loadedTiles: number;
    totalTiles: number;
    error?: string;
  };
}

const UnifiedMapComponent: React.FC<UnifiedMapComponentProps> = ({
  viewState,
  onViewStateChange,
  tileLayers = [],
  // pointCloudLayers = [], // Removed for now - not implemented
  onClick,
  onHover
}) => {
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({});
  const [autoZoomPending, setAutoZoomPending] = useState<string | null>(null);

  const handleViewStateChange = useCallback(
    (params: any) => {
      const { viewState: newViewState } = params;
      onViewStateChange(newViewState);
    },
    [onViewStateChange]
  );

  // Auto-zoom to layer bounds when loaded
  const zoomToLayer = useCallback((layer: TileLayerConfig) => {
    if (layer.bounds) {
      const [west, south, east, north] = layer.bounds;
      const longitude = (west + east) / 2;
      const latitude = (south + north) / 2;
      
      // Calculate zoom level based on bounds size
      const latDiff = north - south;
      const lonDiff = east - west;
      const maxDiff = Math.max(latDiff, lonDiff);
      
      // Rough zoom calculation (can be improved)
      const zoom = Math.max(1, Math.min(18, 10 - Math.log2(maxDiff)));
      
      onViewStateChange({
        longitude,
        latitude,
        zoom,
        bearing: viewState.bearing || 0,
        pitch: viewState.pitch || 0
      });
      
      console.log(`Auto-zoomed to layer: ${layer.name}`, { longitude, latitude, zoom });
    }
  }, [onViewStateChange, viewState.bearing, viewState.pitch]);

  // Create tile loading callbacks
  const createTileCallbacks = useCallback((layerId: string, layer: TileLayerConfig) => ({
    onTileLoad: (tile: any) => {
      setLoadingStatus(prev => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          loadedTiles: (prev[layerId]?.loadedTiles || 0) + 1,
          isLoading: false
        }
      }));
      
      // Auto-zoom to first loaded layer with bounds
      if (autoZoomPending === layerId && layer.bounds) {
        zoomToLayer(layer);
        setAutoZoomPending(null);
      }
      
      console.log(`Tile loaded for ${layer.name}:`, tile);
    },
    
    onTileError: (error: any) => {
      setLoadingStatus(prev => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          isLoading: false,
          error: error.message || 'Failed to load tile'
        }
      }));
      console.warn(`Tile error for ${layer.name}:`, error);
    },
    
    onViewportLoad: (tiles: any[]) => {
      setLoadingStatus(prev => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          isLoading: false,
          totalTiles: tiles.length
        }
      }));
      console.log(`Viewport loaded for ${layer.name}: ${tiles.length} tiles`);
    }
  }), [autoZoomPending, zoomToLayer]);

  // Create 3D tile callbacks
  const create3DTileCallbacks = useCallback((layerId: string, layer: TileLayerConfig) => ({
    onTilesetLoad: (tileset: any) => {
      setLoadingStatus(prev => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          isLoading: false
        }
      }));
      
      // Auto-zoom to tileset bounds
      if (autoZoomPending === layerId && tileset.cartographicCenter) {
        const [longitude, latitude] = tileset.cartographicCenter;
        const zoom = tileset.zoom || 16;
        
        onViewStateChange({
          longitude,
          latitude,
          zoom,
          bearing: viewState.bearing || 0,
          pitch: viewState.pitch || 0
        });
        
        setAutoZoomPending(null);
        console.log(`Auto-zoomed to 3D tileset: ${layer.name}`, { longitude, latitude, zoom });
      }
    },
    
    onTileLoad: (tileHeader: any) => {
      setLoadingStatus(prev => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          loadedTiles: (prev[layerId]?.loadedTiles || 0) + 1
        }
      }));
      console.log(`3D tile loaded for ${layer.name}:`, tileHeader);
    },
    
    onTileError: (_tileHeader: any, url: string, message: string) => {
      setLoadingStatus(prev => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          isLoading: false,
          error: message || 'Failed to load 3D tile'
        }
      }));
      console.warn(`3D tile error for ${layer.name}:`, { url, message });
    }
  }), [autoZoomPending, onViewStateChange, viewState.bearing, viewState.pitch]);

  // Initialize loading status when layers change
  useEffect(() => {
    const newStatus: LoadingStatus = {};
    tileLayers.forEach(layer => {
      if (layer.visible && !loadingStatus[layer.id]) {
        newStatus[layer.id] = {
          isLoading: true,
          loadedTiles: 0,
          totalTiles: 0
        };
        
        // Set auto-zoom pending for first layer with bounds
        if (!autoZoomPending && layer.bounds) {
          setAutoZoomPending(layer.id);
        }
      }
    });
    
    if (Object.keys(newStatus).length > 0) {
      setLoadingStatus(prev => ({ ...prev, ...newStatus }));
    }
  }, [tileLayers, loadingStatus, autoZoomPending]);

  // Render different layer types
  const renderLayer = useCallback((layer: TileLayerConfig) => {
    if (!layer.visible) return null;

    // Use a stable layer ID
    const layerId = `layer-${layer.id}`;

    switch (layer.type) {
      case 'background':
      case 'orthophoto':
        // 2D Orthophoto using TileLayer with XYZ tiles
        return new TileLayer({
          id: layerId,
          data: layer.data,
          minZoom: layer.minZoom || 0,
          maxZoom: layer.maxZoom || 19,
          tileSize: layer.tileSize || 256,
          opacity: layer.opacity,
          visible: layer.visible,
          renderSubLayers: (props: any) => {
            const { tile } = props;

            // Strict validation for tile.content
            const isValidImage = (img: any) => {
              // Accept HTMLImageElement, ImageBitmap, or string (URL)
              return (
                (typeof window !== 'undefined' && img instanceof window.Image) ||
                (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) ||
                (typeof img === 'string')
              );
            };

            if (!tile || !tile.content || !isValidImage(tile.content)) {
              console.warn('Invalid tile content for BitmapLayer:', tile?.content);
              return null;
            }

            // Use a stable BitmapLayer ID based on tile index
            const bitmapId = `${layerId}-bitmap-${tile.index ?? 'unknown'}`;

            return new BitmapLayer({
              ...props,
              id: bitmapId,
              image: tile.content,
              bounds: [
                tile.boundingBox[0][0],
                tile.boundingBox[0][1],
                tile.boundingBox[1][0],
                tile.boundingBox[1][1]
              ]
            });
          },
          ...createTileCallbacks(layer.id, layer)
        });

      case 'orthophoto-3d':
        // 3D Orthophoto using Tile3DLayer with 3D Tiles specification
        return new Tile3DLayer({
          id: layerId,
          data: layer.data, // Should be tileset.json URL
          opacity: layer.opacity,
          pointSize: 2, // For point cloud tiles
          ...create3DTileCallbacks(layer.id, layer)
        });

      default:
        console.warn(`Unsupported layer type: ${layer.type}`);
        return null;
    }
  }, [createTileCallbacks, create3DTileCallbacks]);

  // Memoize layers so they only update when tileLayers change
  const layers = React.useMemo(() => {
    return [
      ...tileLayers.map(renderLayer).filter(Boolean)
      // Point cloud layers would go here if needed
    ];
  }, [tileLayers, renderLayer]);

  return (
    <div className="relative w-full h-full">
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={layers}
        onClick={onClick}
        onHover={onHover}
      />
    </div>
  );
};

export default UnifiedMapComponent;

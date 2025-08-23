// Pure Deck.gl Map Component - No MapLibre dependency
// Handles all geospatial data types: 2D/3D orthophotos, DSM, DTM, point clouds

import React, { useCallback, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { TileLayer } from '@deck.gl/geo-layers';
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
  type: 'background' | 'orthophoto' | 'dsm' | 'dtm' | 'orthophoto-3d';
  data: string; // Tile URL template or file path
  visible: boolean;
  opacity: number;
  minZoom?: number;
  maxZoom?: number;
  bounds?: [number, number, number, number]; // [west, south, east, north]
  elevationData?: string; // For 3D orthophotos with elevation
  elevationScale?: number; // Vertical exaggeration
  tileSize?: number;
  colorMap?: string; // For DSM/DTM visualization
}

interface PointCloudLayerConfig {
  id: string;
  name: string;
  data: string; // Point cloud data URL/path
  visible: boolean;
  opacity: number;
  pointSize?: number;
  coordinateSystem?: 'EPSG:4326' | 'EPSG:3857' | string;
  bounds?: [number, number, number, number];
}

const UnifiedMapComponent: React.FC<UnifiedMapComponentProps> = ({
  viewState,
  onViewStateChange,
  tileLayers = [],
  pointCloudLayers = [],
  onClick,
  onHover,
  is3D = false
}) => {
  const [loadingTiles] = useState(new Set<string>());

  const handleViewStateChange = useCallback(
    (params: any) => {
      const { viewState: newViewState } = params;
      onViewStateChange({
        longitude: newViewState.longitude,
        latitude: newViewState.latitude,
        zoom: newViewState.zoom,
        bearing: newViewState.bearing || 0,
        pitch: is3D ? (newViewState.pitch || 45) : 0
      });
    },
    [onViewStateChange, is3D]
  );

  // Convert tile layer configs to Deck.gl layers
  const deckLayers = tileLayers
    .filter(layer => layer.visible)
    .sort((a, b) => {
      // Sort order: background < orthophoto < dsm < dtm < orthophoto-3d
      const order = { 
        background: 0, 
        orthophoto: 1, 
        dsm: 2, 
        dtm: 3, 
        'orthophoto-3d': 4 
      };
      return order[a.type] - order[b.type];
    })
    .map(layer => {
      // Handle different layer types
      switch (layer.type) {
        case 'orthophoto-3d':
          // 3D orthophoto with elevation data
          return new TileLayer({
            id: layer.id,
            data: layer.data,
            minZoom: layer.minZoom || 0,
            maxZoom: layer.maxZoom || 22,
            tileSize: layer.tileSize || 256,
            opacity: layer.opacity,
            visible: layer.visible,
            renderSubLayers: (props: any) => {
              const { tile } = props;
              return new BitmapLayer({
                ...props,
                id: `${layer.id}-3d-bitmap`,
                image: tile.content,
                bounds: tile.bbox,
                // TODO: Implement elevation data processing
                getElevation: (_position: [number, number]) => {
                  // Process elevation from elevationData
                  return (layer.elevationScale || 1) * 10; // Placeholder
                }
              });
            },
            onTileLoad: () => {
              console.log(`3D orthophoto tile loaded: ${layer.name}`);
            },
            onTileError: (error: any) => {
              console.warn(`3D orthophoto tile error for ${layer.name}:`, error);
            }
          });

        case 'dsm':
        case 'dtm':
          // Digital Surface/Terrain Models - render as elevation or colored tiles
          return new TileLayer({
            id: layer.id,
            data: layer.data,
            minZoom: layer.minZoom || 0,
            maxZoom: layer.maxZoom || 22,
            tileSize: layer.tileSize || 256,
            opacity: layer.opacity,
            visible: layer.visible,
            renderSubLayers: (props: any) => {
              const { tile } = props;
              return new BitmapLayer({
                ...props,
                id: `${layer.id}-elevation-bitmap`,
                image: tile.content,
                bounds: tile.bbox
                // TODO: Apply color mapping for elevation visualization
              });
            },
            onTileLoad: () => {
              console.log(`${layer.type.toUpperCase()} tile loaded: ${layer.name}`);
            },
            onTileError: (error: any) => {
              console.warn(`${layer.type.toUpperCase()} tile error for ${layer.name}:`, error);
            }
          });

        case 'background':
        case 'orthophoto':
        default:
          // Standard 2D tiles (background maps or orthophotos)
          return new TileLayer({
            id: layer.id,
            data: layer.data,
            minZoom: layer.minZoom || 0,
            maxZoom: layer.maxZoom || 22,
            tileSize: layer.tileSize || 256,
            opacity: layer.opacity,
            visible: layer.visible,
            bounds: layer.bounds,
            
            renderSubLayers: (props: any) => {
              const { tile } = props;
              return new BitmapLayer({
                ...props,
                id: `${layer.id}-bitmap`,
                image: tile.content,
                bounds: tile.bbox
              });
            },
            
            onTileLoad: () => {
              console.log(`${layer.type} tile loaded: ${layer.name}`);
            },
            
            onTileError: (error: any) => {
              console.warn(`Tile load error for ${layer.name}:`, error);
            }
          });
      }
    });

  // Add point cloud layers (placeholder for future implementation)
  const pointCloudDeckLayers = pointCloudLayers
    .filter(layer => layer.visible)
    .map(layer => {
      // Placeholder for point cloud support
      // Will implement when needed with PointCloudLayer
      console.log(`Point cloud layer ready: ${layer.name}`);
      return null;
    })
    .filter(Boolean);

  // Combine all layers
  const allLayers = [...deckLayers, ...pointCloudDeckLayers];

  return (
    <DeckGL
      viewState={{
        ...viewState,
        pitch: is3D ? (viewState.pitch || 45) : 0
      }}
      onViewStateChange={handleViewStateChange}
      layers={allLayers}
      onClick={onClick}
      onHover={onHover}
      controller={{
        touchRotate: is3D,
        touchZoom: true,
        dragPan: true,
        dragRotate: is3D,
        scrollZoom: true,
        doubleClickZoom: true,
        keyboard: true
      }}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {/* Loading indicator */}
      {loadingTiles.size > 0 && (
        <div 
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000
          }}
        >
          Loading tiles... ({loadingTiles.size})
        </div>
      )}
      
      {/* 3D mode indicator */}
      {is3D && (
        <div 
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: 'rgba(0,100,200,0.8)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            zIndex: 1000
          }}
        >
          3D Mode
        </div>
      )}
    </DeckGL>
  );
};

export default UnifiedMapComponent;

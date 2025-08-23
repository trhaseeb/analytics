# Tiled Maps Implementation - Enhanced for 2D/3D

## Overview

This document describes the enhanced tiled map implementation that properly supports standard tile map structures and integrates with Deck.gl for both 2D and 3D visualization.

## Key Improvements Made

### 1. **Standard Tile Structure Support**
- **Format**: Now properly handles `/zoom/x/y.png` structure instead of single files
- **Web Mercator**: Implements standard Web Mercator projection calculations
- **Multiple Formats**: Supports PNG, JPG, JPEG tiles plus XML metadata files
- **Folder Upload**: Uses `webkitdirectory` to allow entire folder structure uploads

### 2. **Enhanced Tile Processing**

#### Tile Structure Validation
```typescript
const tilePattern = /(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)$/i;
const xmlPattern = /\.(xml|tilesxml)$/i;
```

#### Automatic Bounds Calculation
- Analyzes tile coordinates to calculate geographic bounds
- Uses lowest zoom level tiles for overall extent
- Implements standard tile-to-coordinate conversion:
  ```typescript
  const n = Math.pow(2, minZ);
  bounds = {
    west: (minX / n * 360.0) - 180.0,
    east: ((maxX + 1) / n * 360.0) - 180.0,
    north: Math.atan(Math.sinh(Math.PI * (1 - 2 * minY / n))) * 180.0 / Math.PI,
    south: Math.atan(Math.sinh(Math.PI * (1 - 2 * (maxY + 1) / n))) * 180.0 / Math.PI
  };
  ```

#### Zoom Level Detection
- Automatically detects available zoom levels
- Tracks tile count per zoom level
- Provides zoom range information for optimization

### 3. **Deck.gl Integration for 2D/3D**

#### Why Deck.gl Over OpenStreetMap
- **Native 2D/3D Support**: Seamless switching between 2D and 3D views
- **WebGL Performance**: Superior rendering performance for large tile sets
- **Built-in TileLayer**: Designed specifically for tiled map rendering
- **Unified Framework**: Single technology stack for all mapping needs

#### TileLayer Implementation
```typescript
const createDeckGLLayers = (savedLayers: any[]) => {
  return savedLayers
    .filter(layer => layer.visible)
    .map(layer => ({
      id: layer.id,
      type: 'TileLayer',
      data: `tile://layers/${layer.name}/{z}/{x}/{y}.png`,
      minZoom: Math.min(...(tileInfo.zoomLevels || [0])),
      maxZoom: Math.max(...(tileInfo.zoomLevels || [18])),
      bounds: tileInfo.bounds,
      opacity: layer.opacity || 1.0,
      visible: layer.visible,
      pickable: true,
      is3D: layer.type === '3d-orthophoto'
    }));
};
```

### 4. **UI/UX Improvements**

#### Simplified Modal Interface
- **Removed Cancel Buttons**: All modals now only have the X close button at top-right
- **Cleaner Design**: Reduced visual clutter and improved user flow
- **Consistent Interaction**: Single close method across all modals

#### Enhanced File Upload
- **Directory Selection**: Users can select entire tile folders
- **Progress Tracking**: Visual progress indicator during tile processing
- **Smart Detection**: Automatically identifies tile structure and metadata
- **Validation Feedback**: Clear messages about tile structure validity

### 5. **Data Structure Enhancements**

#### Extended Layer Interface
```typescript
interface Layer {
  id: string;
  name: string;
  type: '2d-orthophoto' | '3d-orthophoto';
  tiles?: string; // JSON string with processed tile info
  url?: string; // External URL support
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
    zoomLevels?: number[]; // Available zoom levels
    tileCount?: number; // Total tiles
    structure?: 'tiled' | 'single'; // Structure type
  };
}
```

#### Processed Tile Information
```typescript
const tileInfo = {
  fileCount: number;
  zoomLevels: number[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  structure: 'tiled';
  metadataFiles: number;
};
```

## Technical Implementation Details

### 1. **Tile Coordinate System**
- **Standard Web Mercator**: EPSG:3857 projection
- **Zoom Levels**: Support for 0-22 (standard web map zoom range)
- **Tile Origin**: Top-left (0,0) at northwest corner
- **Tile Size**: Standard 256x256 pixels

### 2. **File Processing Pipeline**
1. **Upload**: User selects folder containing tile structure
2. **Validation**: Check for proper z/x/y.ext pattern
3. **Analysis**: Extract zoom levels, calculate bounds
4. **Storage**: Save processed metadata as JSON string
5. **Integration**: Create DeckGL layer configuration

### 3. **Performance Considerations**
- **Lazy Loading**: Tiles loaded on-demand as needed
- **Zoom-based LOD**: Appropriate level-of-detail based on zoom
- **Bounds Checking**: Only load tiles within view bounds
- **Cache Management**: Browser cache for tile reuse

## Usage Instructions

### Adding Tiled Maps

1. **Open Layers Component**: Click the Layers button in the sidebar
2. **Add New Layer**: Switch to "Add New" tab
3. **Select Type**: Choose between 2D or 3D orthophoto
4. **Upload Tiles**: 
   - Click "Click to select tiles folder"
   - Select the root folder containing your z/x/y structure
   - Wait for processing to complete
5. **Configure Layer**: Add name, metadata, and settings
6. **Save**: Click Save to add layer to map

### Expected Folder Structure
```
tiles/
├── 0/
│   └── 0/
│       └── 0.png
├── 1/
│   ├── 0/
│   │   ├── 0.png
│   │   └── 1.png
│   └── 1/
│       ├── 0.png
│       └── 1.png
├── 2/
│   └── ... (more zoom levels)
└── metadata.xml (optional)
```

### Supported Formats
- **Tile Images**: PNG, JPG, JPEG
- **Metadata**: XML, TilesXML
- **Structure**: Standard z/x/y web map tiles

## Future Enhancements

### Planned Features
1. **Full TileLayer Integration**: Complete @deck.gl/geo-layers TileLayer implementation
2. **Tile Server Support**: Direct integration with tile servers
3. **Caching Strategy**: Advanced tile caching and preloading
4. **3D Elevation**: Height data integration for true 3D orthophotos
5. **Performance Optimization**: WebWorker-based tile processing

### Advanced Features
1. **Custom Projections**: Support for non-Web Mercator projections
2. **Tile Pyramids**: Multi-resolution tile pyramid generation
3. **Real-time Updates**: Live tile updates and streaming
4. **Collaborative Editing**: Multi-user tile layer management

## Technical Benefits

1. **Standards Compliance**: Follows web mapping standards
2. **Performance**: Optimized for large tile sets
3. **Scalability**: Handles varying zoom levels efficiently
4. **Flexibility**: Supports both local and remote tiles
5. **Future-Proof**: Built on modern web technologies

This implementation provides a solid foundation for professional-grade tiled map visualization in both 2D and 3D contexts using modern web technologies and industry standards.

# Unified Deck.gl Architecture Plan

## Problem Statement
Current app uses multiple mapping frameworks:
- MapLibre-GL for base rendering
- OpenStreetMap/Google for background tiles
- Deck.gl for data layers
- Complex integration between systems

## Solution: Pure Deck.gl Architecture

### Core Principle
**Deck.gl handles EVERYTHING** - background tiles, data tiles, 2D/3D rendering, interactions.

### Why This Makes Sense

1. **Tiled Data Focus**: Your app is fundamentally about visualizing custom tiled orthophotos
2. **2D/3D Unity**: Deck.gl natively handles both without external dependencies  
3. **Performance**: Single WebGL context, no context switching
4. **Simplicity**: One framework, one API, one mental model
5. **Tile-Centric**: TileLayer is designed exactly for your use case

### Unified Layer Structure

```typescript
// Everything is a Deck.gl layer
const layers = [
  // Background tiles (optional)
  new TileLayer({
    id: 'basemap',
    data: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    minZoom: 0,
    maxZoom: 19
  }),
  
  // User's orthophoto tiles (primary content)
  new TileLayer({
    id: 'orthophoto-layer-1',
    data: 'file://tiles/project1/{z}/{x}/{y}.png',
    minZoom: 14,
    maxZoom: 22,
    opacity: 0.8
  }),
  
  // 3D orthophoto with elevation
  new TileLayer({
    id: 'orthophoto-3d',
    data: 'file://tiles/project2/{z}/{x}/{y}.png',
    minZoom: 14,
    maxZoom: 22,
    opacity: 0.9,
    elevationData: 'file://elevation/{z}/{x}/{y}.png' // Height data
  }),
  
  // Vector overlays if needed
  new GeoJsonLayer({
    id: 'annotations',
    data: annotationsData
  })
];
```

## Implementation Plan

### 1. Remove MapLibre Dependency
- Delete MapLibre-GL integration
- Remove react-map-gl wrapper
- Pure DeckGL component

### 2. Unified Tile Management
- Single TileLayer system for both background and data tiles
- No separation between "basemaps" and "layers"
- All tiles managed the same way

### 3. Simplified UI
- Single "Tiles" component instead of separate Basemaps/Layers
- Add/remove/reorder any tile source
- Priority/opacity/visibility controls

### 4. Performance Benefits
- Single WebGL context
- No tile duplication between systems
- Optimized memory usage
- Better 2D/3D transitions

## Component Restructure

### Current (Complex)
```
MapComponent (MapLibre)
├── DeckGL (overlay)
├── BasemapsComponent (OpenStreetMap tiles)
└── LayersComponent (Orthophoto tiles)
```

### Proposed (Simple)
```
DeckGLMapComponent
└── TileLayersManager
    ├── Background tiles (OSM, satellite, etc.)
    ├── Orthophoto tiles (user data)
    └── 3D elevation tiles
```

## Benefits for Your Use Case

1. **Consistency**: All tiles work the same way
2. **Performance**: Direct WebGL rendering without intermediate systems
3. **Flexibility**: Easy to add/remove/reorder any tile source
4. **3D Native**: Seamless 2D/3D mode switching
5. **Future-Proof**: Built for modern tiled data workflows

## Migration Strategy

1. **Phase 1**: Create pure DeckGL map component
2. **Phase 2**: Migrate tile management to single system
3. **Phase 3**: Remove MapLibre and react-map-gl
4. **Phase 4**: Optimize for performance

This approach treats your app as what it really is: **a professional tiled data visualization tool** rather than a traditional web map with data overlays.

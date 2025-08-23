# Deck.gl Tiled Maps Application

A modern web application for visualizing and managing 2D and 3D tiled maps using Deck.gl, React, and TypeScript.

## 🎯 Core Features

- **2D Tile Support**: XYZ tile format for standard web maps (OpenStreetMap, satellite imagery)
- **3D Tile Support**: 3D Tiles specification for point clouds and 3D datasets
- **Auto-zoom**: Automatic viewport adjustment to layer bounds
- **Load Status**: Real-time indicators for tile loading progress
- **Basemap Management**: Connection testing and preset basemap options
- **Modular Architecture**: Component-based design with clear separation of concerns

## 🏗️ Architecture

### Core Components

- **UnifiedMapComponent**: Main Deck.gl map renderer with proper 2D/3D tile handling
- **LayersComponent**: Layer management with format validation and auto-detection
- **BasemapsComponent**: Basemap management with connection testing
- **HomeButton**: Component launcher and navigation
- **UniversalModal**: Flexible modal system for all dialogs

### Project Structure

```
src/
├── components/
│   ├── domain/          # Business logic components
│   ├── Map/             # Map visualization components  
│   ├── UI/              # User interface components
│   └── index.ts         # Central component exports
├── systems/
│   ├── ComponentRegistry.ts  # Component management
│   └── StorageManager.ts     # Data persistence
├── hooks/
│   └── useModalManager.ts    # Modal state management
└── types/               # TypeScript definitions
```

## 🔧 Key Technical Improvements

### Research-Based Tile Handling
- **TileLayer**: For 2D raster tiles in XYZ format (`{z}/{x}/{y}.png`)
- **Tile3DLayer**: For 3D Tiles specification content (`tileset.json`)
- **Format Detection**: Automatic identification of tile types
- **Error Handling**: Comprehensive validation and user feedback

### Enhanced User Experience
- **Auto-zoom**: Layers automatically adjust viewport to their bounds
- **Status Indicators**: Visual feedback for loading, success, and error states
- **Connection Testing**: Verify basemap URLs before adding
- **Format Validation**: Check tile service compatibility

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

## 📋 Usage

### Adding 2D Tiles
1. Click the Home button
2. Select "Layers" 
3. Choose "Add 2D Orthophoto"
4. Enter XYZ tile URL: `https://example.com/tiles/{z}/{x}/{y}.png`
5. The layer will auto-zoom and show loading status

### Adding 3D Tiles
1. Click the Home button
2. Select "Layers"
3. Choose "Add 3D Orthophoto"  
4. Enter tileset URL: `https://example.com/tileset.json`
5. The 3D tileset will load and display

### Managing Basemaps
1. Click the Home button
2. Select "Basemaps"
3. Choose from preset options or add custom URLs
4. Test connections before adding
5. Switch between active basemaps

## 🔬 Research Foundation

This application is based on comprehensive research of official Deck.gl documentation:

- [TileLayer Documentation](https://deck.gl/docs/api-reference/layers/tile-layer)
- [Tile3DLayer Documentation](https://deck.gl/docs/api-reference/layers/tile-3d-layer)
- [3D Tiles Specification](https://docs.ogc.org/cs/22-025r4/22-025r4.html)

## 📚 Additional Documentation

- `RESEARCH_BASED_FIXES.md`: Detailed technical improvements and research
- `docs/`: Architecture decisions and implementation guides

## 🛠️ Development Notes

### Component Guidelines
- Domain components handle business logic
- UI components are purely presentational  
- Map components focus on visualization
- Use TypeScript for all new code
- Follow the modular architecture patterns

### Adding New Features
1. Create components in appropriate directory (`domain/`, `UI/`, `Map/`)
2. Register domain components in `ComponentRegistry`
3. Add exports to relevant `index.ts` files
4. Update types as needed
5. Test with `npm run build`

## 🔧 Troubleshooting

### Build Issues
- Ensure all imports use the centralized `components/index.ts`
- Check TypeScript errors with `npm run build`
- Remove unused parameters to avoid TS warnings

### Tile Loading Issues  
- Verify tile URL format matches layer type (XYZ vs 3D Tiles)
- Check CORS policy for external tile services
- Use connection testing in basemap manager
- Review browser console for network errors

---

This application provides a solid foundation for modern tiled map visualization with proper separation between 2D and 3D tile formats.

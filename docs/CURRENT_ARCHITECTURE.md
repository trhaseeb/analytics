# Current Architecture Overview

## Application Structure (Post-Cleanup)

### Core Files
- `src/App.tsx` - Main application entry point with clean imports
- `src/components/index.ts` - Central component export point
- `RESEARCH_BASED_FIXES.md` - Technical implementation details

### Component Architecture

```
src/components/
├── domain/              # Business Logic Components
│   ├── LayersComponent.tsx          # Layer management with 2D/3D support
│   ├── BasemapsComponent.tsx        # Basemap management with testing
│   ├── ProjectComponent.tsx         # Project settings
│   ├── SettingsComponent.tsx        # App settings
│   ├── DataImportComponent.tsx      # Data import utilities
│   ├── UnifiedTileManagerComponent.tsx  # Tile management
│   └── index.ts                     # Domain exports
├── Map/                 # Visualization Components  
│   ├── UnifiedMapComponent.tsx      # Main Deck.gl renderer
│   └── index.ts                     # Map exports
└── UI/                  # Interface Components
    ├── HomeButton.tsx               # Component launcher
    ├── UniversalModal.tsx           # Modal system
    └── index.ts                     # UI exports
```

### Systems Architecture
```
src/systems/
├── ComponentRegistry.ts     # Component management and registration
└── StorageManager.ts        # Data persistence and retrieval
```

### Type Definitions
```
src/types/
├── components.ts           # Component interfaces
├── minimal.ts             # Basic type definitions
└── index.ts               # Type exports
```

## Key Architectural Decisions

### 1. Research-Based Tile Handling
- **Separated 2D and 3D**: TileLayer vs Tile3DLayer based on official Deck.gl docs
- **Format Detection**: Automatic identification of XYZ vs 3D Tiles format
- **Auto-zoom**: Automatic viewport adjustment using layer bounds
- **Status Tracking**: Real-time loading indicators

### 2. Modular Component System
- **Domain Components**: Handle business logic and data management
- **UI Components**: Purely presentational interface elements
- **Map Components**: Focus on visualization and rendering
- **Central Exports**: Single import point via `components/index.ts`

### 3. Clean Import Structure
```typescript
// Before (messy):
import UnifiedMapComponent from './components/Map/UnifiedMapComponent';
import HomeButton from './components/UI/HomeButton';
import { LayersComponent } from './components/domain/LayersComponent';

// After (clean):
import { 
  UnifiedMapComponent,
  HomeButton,
  LayersComponent 
} from './components';
```

### 4. Removed Unnecessary Code
- **Archived**: All backup files and outdated documentation
- **Removed**: Empty layer stub files in `src/components/Layers/`
- **Eliminated**: Unused FloatingMenu component
- **Consolidated**: Documentation into relevant, up-to-date files

## Current State

### ✅ Completed
- Research-based tile layer implementation
- Auto-zoom functionality
- Load status indicators
- Basemap connection testing
- Clean modular architecture
- Updated documentation
- TypeScript compliance

### 🔄 Active Components
- **UnifiedMapComponent**: Research-fixed with proper 2D/3D tile support
- **LayersComponent**: Enhanced with format validation
- **BasemapsComponent**: Improved with connection testing
- **HomeButton**: Component launcher system
- **UniversalModal**: Flexible modal system

### 📋 Next Steps
1. Test with real 2D and 3D tile data
2. Verify auto-zoom functionality
3. Validate load status indicators
4. Performance optimization
5. User experience enhancements

## Development Guidelines

### Component Creation
1. Choose appropriate directory (`domain/`, `UI/`, `Map/`)
2. Follow TypeScript best practices
3. Add to relevant `index.ts` exports
4. Register domain components in ComponentRegistry
5. Test with `npm run build`

### Code Quality
- Use centralized imports from `components/index.ts`
- Follow the established modular patterns
- Remove unused parameters to avoid TS warnings
- Keep components focused and single-purpose

---

This architecture provides a solid foundation for scalable, maintainable map visualization applications.

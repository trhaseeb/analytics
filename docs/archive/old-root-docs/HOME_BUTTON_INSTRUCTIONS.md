# Home Button & Component Launcher System - Design Instructions

## Overview
Create a floating home button in the top-right corner that expands into a horizontal row of component icons. This serves as the central command center for launching all application components into the Universal Modal System.

## Core Concept
- **Central Access Point**: Single home button provides access to all components
- **Structure Provider**: Defines button layout, positioning, and interaction patterns
- **Component Agnostic**: Takes icons, colors, and content from component definitions
- **Modal Integration**: Launches components into Universal Modal System using component-provided configs

## Visual States

### 1. Collapsed State (Home Button Only)
```
                                                    ┌─────────────────┐
                                                    │       MAP       │
                                                    │                 │
                                               [🏠] │                 │
                                                    │                 │
                                                    │                 │
                                                    └─────────────────┘
```

### 2. Expanded State (Component Icon Row)
```
                                                    ┌─────────────────┐
                                                    │       MAP       │
                                                    │                 │
                               [📊][📁][⚙️][📍][🏠] │                 │
                                                    │                 │
                                                    │                 │
                                                    └─────────────────┘
```

### 3. With Tooltip (Hover State)
```
                                                    ┌─────────────────┐
                                                    │       MAP       │
                                         ┌─────────┐│                 │
                                         │Analysis ││                 │
                                         └─────────┘│                 │
                               [📊][📁][⚙️][📍][🏠] │                 │
                                                    │                 │
                                                    └─────────────────┘
```

## Technical Requirements

### 1. Home Button Component
```typescript
interface HomeButtonProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark' | 'auto';
  expandDirection?: 'left' | 'right' | 'down' | 'up';
  components: ComponentDefinition[];          // Provided by component registry
  onComponentLaunch: (modalConfig: ModalConfig) => void;  // Modal system callback
}

interface HomeButtonState {
  isExpanded: boolean;
  hoveredComponent: string | null;
}

// Home Button ONLY handles structure - content comes from components
interface HomeButtonStyling {
  // Button Structure
  buttonSize: number;                     // Base button dimensions
  iconSpacing: number;                    // Space between icons
  expandAnimationDuration: number;        // Animation timing
  hoverEffects: boolean;                  // Enable hover animations
  
  // Layout Calculations
  maxIconsBeforeScroll: number;           // Before showing scroll/more
  responsiveBreakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}
```

### 2. Feature Interface (Consumed by Home Button)
```typescript
### 2. Component Interface (Consumed by Home Button)
```typescript
// Components provide this data to Home Button
interface ComponentDefinition {
  id: string;                          // Unique component identifier
  name: string;
  description: string;
  
  // Visual Definition (Component's Responsibility)
  icon: React.ReactNode | string;      // Component-defined icon
  primaryColor: string;                // Component's brand color
  secondaryColor?: string;
  iconStyle?: 'solid' | 'outline';
  
  // Organization
  enabled?: boolean;                   // Component availability
  priority?: number;                   // Display order (lower = first)
  
  // Modal Integration (Component's Responsibility)

// What features provide to modal system
interface ModalConfig {
  id: string;
  title: string;
  content: React.ReactNode;            // Feature-provided content
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initialState?: 'modal' | 'sidebar';
  theme?: {                            // Feature can override modal theme
    primaryColor?: string;
    accentColor?: string;
    headerStyle?: 'default' | 'branded';
  };
}
```

### 3. Home Button Responsibilities (Structure Only)
```typescript
interface HomeButtonRenderer {
  // Layout Management
  calculateIconPositions: (features: FeatureDefinition[]) => IconPosition[];
  determineExpandDirection: (buttonRect: DOMRect, iconCount: number) => Direction;
  handleResponsiveLayout: (screenSize: ScreenSize) => LayoutConfig;
  
  // Animation Management
  animateExpansion: (direction: Direction, iconCount: number) => void;
  animateIconHover: (iconId: string, colors: FeatureColors) => void;
  animateIconClick: (iconId: string) => void;
  
  // Event Handling
  onIconClick: (feature: FeatureDefinition) => void;  // Calls feature.onLaunch()
  onIconHover: (feature: FeatureDefinition) => void;  // Shows tooltip
  onExpandToggle: () => void;                         // Toggle expansion
  
  // Accessibility
  setupKeyboardNavigation: () => void;
  announceStateChanges: (state: string) => void;
  manageFocusOrder: (features: FeatureDefinition[]) => void;
}

// Home Button provides consistent structure for any feature content
interface IconRenderer {
  renderIcon: (feature: FeatureDefinition) => React.ReactNode;
  applyFeatureColors: (feature: FeatureDefinition) => React.CSSProperties;
  renderTooltip: (feature: FeatureDefinition) => React.ReactNode;
}
```

### 4. Feature Integration Pattern (Features Define Content)
```typescript
// Example: Data Import Feature Definition (in features file)
const DataImportFeature: FeatureDefinition = {
  id: 'data-import',
  name: 'Import Data',
  description: 'Import GeoJSON, CSV, or other data formats',
  
  // Feature defines its visual identity
  icon: '📁',                         // Or <ImportIcon />
  primaryColor: '#3B82F6',           // Blue theme
  secondaryColor: '#93C5FD',         // Light blue accent
  iconStyle: 'solid',
  
  // Feature defines its behavior
  priority: 10,
  enabled: true,
  category: 'data',
  
  // Feature provides complete modal configuration
  onLaunch: () => ({
    id: 'data-import-modal',
    title: 'Import Data',
    content: <DataImportContent />,   // Feature's content component
    size: 'lg',
    initialState: 'modal',
    theme: {
      primaryColor: '#3B82F6',        // Feature's brand colors in modal
      headerStyle: 'branded'
    }
  })
};

// Home Button just renders whatever the feature provides
const renderFeatureIcon = (feature: FeatureDefinition) => (
  <button
    className="home-button-icon"
    style={{
      backgroundColor: feature.primaryColor,
      borderColor: feature.secondaryColor,
      // ... other structure styles from home button
    }}
    onClick={() => onFeatureLaunch(feature.onLaunch())}
  >
    {feature.icon}
  </button>
);
```

## Animation & Interaction Design

### 1. Expansion Animation
```css
/* Home button expansion */
.home-button-expanded {
  animation: expandIcons 300ms ease-out;
  transform-origin: right center;
}

.feature-icon {
  animation: slideInIcon 200ms ease-out;
  animation-delay: calc(var(--icon-index) * 50ms);
}

/* Staggered icon appearance */
@keyframes slideInIcon {
  from {
    opacity: 0;
    transform: translateX(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
```

### 2. Interaction States
- **Hover**: Icon highlights with subtle glow/scale effect
- **Click**: Brief press animation before launching modal
- **Disabled**: Grayed out with cursor not-allowed
- **Loading**: Spinner overlay during feature loading

### 3. Smart Positioning
```typescript
interface PositionCalculator {
  calculateOptimalPosition: (
    buttonRect: DOMRect,
    iconCount: number,
    viewportSize: { width: number; height: number }
  ) => {
    expandDirection: 'left' | 'right' | 'up' | 'down';
    containerStyle: React.CSSProperties;
  };
}
```

## Feature Categories & Organization

### 1. Default Categories
```typescript
const DefaultCategories: FeatureCategoryConfig[] = [
  {
    id: 'data',
    name: 'Data Management',
    color: '#3B82F6',
    icon: '📊',
    description: 'Import, export, and manage data'
  },
  {
    id: 'analysis',
    name: 'Analysis Tools',
    color: '#10B981',
    icon: '🔍',
    description: 'Analyze and process geographic data'
  },
  {
    id: 'visualization',
    name: 'Visualization',
    color: '#8B5CF6',
    icon: '🎨',
    description: 'Map styling and visual customization'
  },
  {
    id: 'settings',
    name: 'Settings',
    color: '#6B7280',
    icon: '⚙️',
    description: 'Application and project configuration'
  }
];
```

### 2. Feature Examples
```typescript
const CoreFeatures: FeatureDefinition[] = [
  // Data Management
  {
    id: 'data-import',
    name: 'Import',
    icon: '📁',
    category: 'data',
    priority: 10
  },
  {
    id: 'data-export',
    name: 'Export',
    icon: '💾',
    category: 'data',
    priority: 20
  },
  
  // Analysis Tools
  {
    id: 'spatial-analysis',
    name: 'Analysis',
    icon: '📊',
    category: 'analysis',
    priority: 30
  },
  {
    id: 'measurement-tools',
    name: 'Measure',
    icon: '📐',
    category: 'analysis',
    priority: 40
  },
  
  // Visualization
  {
    id: 'layer-manager',
    name: 'Layers',
    icon: '🗂️',
    category: 'visualization',
    priority: 50
  },
  {
    id: 'style-editor',
    name: 'Styling',
    icon: '🎨',
    category: 'visualization',
    priority: 60
  },
  
  // Settings
  {
    id: 'project-settings',
    name: 'Project',
    icon: '⚙️',
    category: 'settings',
    priority: 70
  }
];
```

## Layout Integration

### 1. App Layout with Home Button
```typescript
<div className="app-container">
  {/* Home Button - Top Right */}
  <div className="fixed top-4 right-4 z-50">
    <HomeButton
      features={featureRegistry.getEnabledFeatures()}
      onFeatureLaunch={(modalConfig) => modalStack.pushModal(modalConfig)}
      expandDirection="left"
    />
  </div>
  
  {/* Universal Modal System */}
  <UniversalModalSystem />
  
  {/* Main Map */}
  <div className="main-content">
    <MapComponent />
  </div>
</div>
```

### 2. Responsive Behavior
- **Desktop**: Full horizontal expansion with tooltips
- **Tablet**: Vertical dropdown or grid layout
- **Mobile**: Full-screen overlay with large touch targets

## User Experience Guidelines

### 1. Discovery & Accessibility
- **Prominent Placement**: Easily discoverable but not intrusive
- **Visual Hierarchy**: Home button clearly stands out
- **Keyboard Navigation**: Full keyboard support for all features
- **Screen Reader**: Proper ARIA labels and announcements

### 2. Performance Considerations
- **Lazy Loading**: Feature content loaded only when launched
- **Icon Optimization**: Efficient icon rendering and caching
- **Animation Performance**: Smooth 60fps animations
- **Memory Management**: Proper cleanup of modal instances

### 3. Customization Options
```typescript
interface HomeButtonCustomization {
  allowReordering?: boolean;           // User can drag to reorder icons
  collapsibleCategories?: boolean;     // Group icons by category
  customIcons?: Record<string, React.ReactNode>;  // Override default icons
  maxVisibleIcons?: number;            // Limit before "More" menu
  searchEnabled?: boolean;             // Search within features
}
```

## Implementation Phases

### Phase 1: Core Home Button
1. Create HomeButton component with expand/collapse
2. Implement FeatureRegistry system
3. Add basic animation and positioning
4. Test with 2-3 example features

### Phase 2: Feature Integration
1. Connect to Universal Modal System
2. Implement feature registration pattern
3. Add category organization
4. Create example features (import, settings)

### Phase 3: Enhanced UX
1. Add tooltips and hover effects
2. Implement responsive behavior
3. Add keyboard navigation
4. Performance optimization

### Phase 4: Advanced Features
1. User customization options
2. Feature search functionality
3. Dynamic feature loading
4. Analytics and usage tracking

## Success Criteria

### Functional Requirements
- ✅ Single access point for all application features
- ✅ Seamless integration with Universal Modal System
- ✅ Dynamic feature registration and organization
- ✅ Smooth animations and interactions

### User Experience Requirements
- ✅ Intuitive discovery and access to features
- ✅ Clean, unobtrusive interface when collapsed
- ✅ Clear visual feedback for all interactions
- ✅ Consistent behavior across devices

### Technical Requirements
- ✅ TypeScript type safety throughout
- ✅ Performance-optimized animations
- ✅ Accessibility compliance (WCAG 2.1)
- ✅ Mobile-responsive design

## Feature File Structure
```
src/
├── features/
│   ├── registry.ts              # Central feature registry
│   ├── types.ts                 # Feature type definitions
│   ├── categories.ts            # Default categories
│   └── examples/
│       ├── DataImportFeature.ts
│       ├── ProjectSettingsFeature.ts
│       └── AnalysisFeature.ts
├── components/
│   └── HomeButton/
│       ├── HomeButton.tsx       # Main component
│       ├── FeatureIcon.tsx      # Individual feature icon
│       └── FeatureTooltip.tsx   # Hover tooltips
```

This Home Button system will provide a clean, discoverable way to access all application features while maintaining the clean map interface. It perfectly complements the Universal Modal System by serving as the primary entry point for feature interactions.

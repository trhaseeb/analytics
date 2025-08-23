# Universal Modal System - Design Instructions

## Overvie  // Core Props (provided by component via ModalConfig)
  id: string;                          // Modal instance identifier
  title: string;                        // Component-provided title
  content: React.ReactNode;            // Component-provided content componenteate a single, standardized modal component that can handle all component interactions (import, project details, categories, analysis, etc.) and can seamlessly transform between modal, sidebar, and icon states.

## Core Concept
- **Universal Display System**: Single modal component handles all component interactions
- **Structure Provider**: Manages modal/sidebar/icon states and transitions  
- **Content Agnostic**: Renders any React component provided by components
- **Component Styling**: Applies theme and styling provided by component definitions

## Visual States

### 1. Modal State (Full Screen Overlay)
```
┌─────────────────────────────────────────────────────────┐
│                    [X Close]                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │           MODAL CONTENT AREA                    │   │
│  │                                                 │   │
│  │  [Component-specific content rendered here]      │   │
│  │                                                 │   │
│  │                                                 │   │
│  │           [Action Buttons]                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2. Sidebar State (Left Side Panel)
```
┌──────┐ ┌─────────────────────────────────────────────────┐
│      │ │                                                 │
│      │ │                                                 │
│ SIDE │ │              MAP AREA                           │
│ BAR  │ │                                                 │
│      │ │                                                 │
│ [≡]  │ │                                                 │
│      │ │                                                 │
└──────┘ └─────────────────────────────────────────────────┘
```

### 3. Icon State (Collapsed to Icon)
```
┌─┐ ┌───────────────────────────────────────────────────────┐
│≡│ │                                                       │
└─┘ │                                                       │
    │                    MAP AREA                           │
    │                                                       │
    │                                                       │
    └───────────────────────────────────────────────────────┘
```

## Technical Requirements

### 1. Modal Component Structure (Framework Only)
```typescript
interface UniversalModalProps {
  // Core Props (provided by feature via ModalConfig)
  id: string;                           // Unique identifier
  title: string;                        // Feature-provided title
  content: React.ReactNode;            // Feature-provided content component
  
  // State Management (modal system responsibility)
  isOpen: boolean;                     
  modalState: 'modal' | 'sidebar' | 'icon';
  
  // Callbacks (modal system responsibility)
  onClose: () => void;                 
  onStateChange: (state: 'modal' | 'sidebar' | 'icon') => void;
  
  // Configuration (component-provided via ModalConfig)
  size?: 'sm' | 'md' | 'lg' | 'xl';   
  sidebarWidth?: number;               
  theme?: ComponentTheme;                // Component's visual theme
  
  // Behavior (modal system defaults, component can override)
  closeable?: boolean;                 
  collapsible?: boolean;               
  stackable?: boolean;                 
}

// Components provide theme configuration
interface ComponentTheme {
  primaryColor?: string;               // Component's brand color
  accentColor?: string;                // Secondary color
  headerStyle?: 'default' | 'branded' | 'minimal';
  contentPadding?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg';
}
```

### 2. Modal Stack Manager
```typescript
interface ModalStackItem {
  id: string;
  title: string;
  component: React.ReactNode;
  state: 'modal' | 'sidebar' | 'icon';
  zIndex: number;
}

interface ModalStackManager {
  stack: ModalStackItem[];
  activeModalId: string | null;
  
  // Stack Operations
  pushModal: (modal: ModalStackItem) => void;
  popModal: (id: string) => void;
  promoteModal: (id: string) => void;    // Bring modal to front
  collapseModal: (id: string) => void;   // Move to sidebar
  minimizeModal: (id: string) => void;   // Move to icon
}
```

### 3. Content Interface (Components Must Implement)
```typescript
// Components provide content components that implement this interface
interface ModalContentProps {
  // Callbacks provided by modal system
  onAction?: (action: string, data?: any) => void;  // Generic action handler
  onClose?: () => void;                             // Request modal closure
  
  // Context provided by modal system  
  isCompact?: boolean;                              // True when in sidebar mode
  modalId?: string;                                 // Current modal instance ID
  
  // Component can access modal state for responsive behavior
  modalState?: 'modal' | 'sidebar' | 'icon';      // Current display state
}

// Modal system provides theme context to component content
interface ModalThemeContext {
  primaryColor: string;                // Component's primary color
  accentColor: string;                 // Component's accent color
  textColor: string;                   // Calculated text color for contrast
  borderColor: string;                 // Calculated border color
  backgroundColor: string;             // Calculated background color
  
  // Utility functions for consistent styling
  getButtonStyle: (variant: 'primary' | 'secondary') => React.CSSProperties;
  getInputStyle: () => React.CSSProperties;
  getHeaderStyle: () => React.CSSProperties;
}
```

## Animation & Transitions

### 1. State Transitions
- **Modal ↔ Sidebar**: Slide in/out from left, resize content
- **Sidebar ↔ Icon**: Collapse/expand with smooth width animation
- **Modal Stack**: New modals slide down, previous slide to sidebar
- **Duration**: 300ms for all transitions
- **Easing**: `ease-in-out` for smooth, professional feel

### 2. Visual Feedback
- **Hover Effects**: Subtle highlighting on interactive elements
- **Loading States**: Spinner/skeleton for content loading
- **Focus Management**: Proper keyboard navigation and focus trapping

## Component Integration Examples

### 1. Data Import Component (Component Defines Everything)
```typescript
// Component provides complete modal configuration
const openDataImport = () => {
  const modalConfig = DataImportFeature.onLaunch(); // Feature returns:
  // {
  //   id: 'data-import',
  //   title: 'Import Data', 
  //   content: <DataImportContent />,
  //   theme: { primaryColor: '#3B82F6', headerStyle: 'branded' }
  // }
  
  modalStack.pushModal(modalConfig);  // Modal system handles the rest
};

// Feature's content component
const DataImportContent: React.FC<ModalContentProps> = ({ 
  onAction, 
  onClose, 
  isCompact 
}) => {
  return (
    <div className={`import-content ${isCompact ? 'compact' : 'full'}`}>
      {/* Feature content here - modal handles structure */}
    </div>
  );
};
```

### 2. Project Details Feature (Feature Controls Theme)
```typescript
// Feature defines its modal appearance and behavior
const ProjectDetailsFeature = {
  onLaunch: () => ({
    id: 'project-details',
    title: 'Project Settings',
    content: <ProjectDetailsContent />,
    initialState: 'sidebar',
    theme: {
      primaryColor: '#10B981',         // Green theme
      accentColor: '#34D399',
      headerStyle: 'minimal',
      contentPadding: 'lg'
    }
  })
};

// Modal system applies feature's theme automatically
const ProjectDetailsContent: React.FC<ModalContentProps> = (props) => {
  // Content automatically gets feature's green theme applied
  return <div>Project settings content</div>;
};
```

### 3. Category Management
```typescript
// Categories that can switch between modal and sidebar
const openCategoryManager = () => {
  modalStack.pushModal({
    id: 'category-manager',
    title: 'Manage Categories',
    component: <CategoryManagerContent />,
    state: 'modal',
    zIndex: 1001
  });
};
```

## Layout Integration

### 1. App Layout Structure
```typescript
<div className="app-container">
  {/* Icon Stack (Left Edge) */}
  <div className="modal-icon-stack">
    {modalStack.filter(m => m.state === 'icon').map(modal => (
      <ModalIcon key={modal.id} modal={modal} onClick={promoteToSidebar} />
    ))}
  </div>
  
  {/* Sidebar Stack (Left Side) */}
  <div className="modal-sidebar-stack">
    {modalStack.filter(m => m.state === 'sidebar').map(modal => (
      <ModalSidebar key={modal.id} modal={modal} />
    ))}
  </div>
  
  {/* Main Content Area */}
  <div className="main-content">
    <MapComponent />
  </div>
  
  {/* Modal Overlays */}
  {modalStack.filter(m => m.state === 'modal').map(modal => (
    <ModalOverlay key={modal.id} modal={modal} />
  ))}
</div>
```

### 2. Responsive Behavior
- **Desktop**: Full modal, sidebar, and icon functionality
- **Tablet**: Modal and sidebar states only (no icon state)
- **Mobile**: Modal state only (full screen overlays)

## User Experience Guidelines

### 1. Modal Stacking Rules
1. **New Modal Opens**: Previous modal automatically collapses to sidebar
2. **Sidebar Click**: Promotes sidebar to modal, current modal to sidebar
3. **Icon Click**: Promotes icon to sidebar (or modal if no sidebar exists)
4. **Close Modal**: Next in stack promotes to modal, or closes stack if empty

### 2. Visual Hierarchy
- **Active Modal**: Highest z-index, full attention
- **Sidebar Items**: Medium z-index, quick access
- **Icon Items**: Lowest z-index, minimal space usage
- **Clear Visual States**: Distinct styling for each state

### 3. Accessibility
- **Focus Management**: Proper tab order and focus trapping
- **Screen Reader**: Appropriate ARIA labels and live regions
- **Keyboard Navigation**: Full keyboard control
- **High Contrast**: Compatible with accessibility themes

## Implementation Priority

### Phase 1: Core Modal Component
1. Create UniversalModal component with basic modal functionality
2. Implement state transitions (modal ↔ sidebar ↔ icon)
3. Add animation system
4. Create modal stack manager

### Phase 2: Feature Integration
1. Create content interface for feature components
2. Build example implementations (import, project details)
3. Test modal stacking behavior
4. Refine animations and UX

### Phase 3: Advanced Features
1. Add resize functionality for sidebars
2. Implement persistence (remember user preferences)
3. Add drag-and-drop reordering
4. Create advanced layout management

## Success Criteria

### Functional Requirements
- ✅ Single modal component handles all features
- ✅ Smooth transitions between all three states
- ✅ Proper modal stacking and management
- ✅ Feature content isolation and reusability

### User Experience Requirements
- ✅ Intuitive state transitions
- ✅ No jarring animations or layout shifts
- ✅ Quick access to multiple features simultaneously
- ✅ Efficient screen space utilization

### Technical Requirements
- ✅ TypeScript type safety
- ✅ React performance optimization
- ✅ Accessibility compliance
- ✅ Mobile responsiveness

This universal modal system will provide a consistent, efficient, and scalable foundation for all feature interactions in the application while maintaining a clean and professional user experience.

# Component Development Guide - Content & Behavior Definition

## Overview
Components define their own visual identity, content, and behavior while leveraging the Home Button and Universal Modal systems for structure and interaction. This creates a clean separation where components focus on business logic and the UI systems handle presentation.

## Core Concept
- **Visual Identity**: Components define their icons, colors, and branding
- **Content Ownership**: Components provide their own React components and logic
- **Modal Configuration**: Components specify how they want to be displayed
- **System Integration**: Components plug into Home Button and Modal systems seamlessly

## Component Definition Structure

### 1. Complete Component Definition
```typescript
// Example: Data Import Component
export const DataImportComponent: ComponentDefinition = {
  // Identity
  id: 'data-import',
  name: 'Import Data',
  description: 'Import GeoJSON, CSV, KML, and other geographic data formats',
  
  // Visual Identity (Component's Responsibility)
  icon: <ImportIcon />,               // Custom React component
  primaryColor: '#3B82F6',           // Blue brand color
  secondaryColor: '#93C5FD',         // Light blue accent
  iconStyle: 'solid',                // Icon rendering preference
  
  // Organization
  category: 'data',
  priority: 10,                      // Lower number = appears first
  enabled: true,
  
  // Modal Integration (Component Controls Everything)
  onLaunch: () => ({
    id: 'data-import-modal',
    title: 'Import Geographic Data',
    content: <DataImportContent />,   // Component's content component
    size: 'lg',
    initialState: 'modal',
    theme: {
      primaryColor: '#3B82F6',
      accentColor: '#93C5FD',
      headerStyle: 'branded',
      contentPadding: 'md'
    }
  }),
  
  // Access Control
  requiredPermissions: ['data.import'],
  betaComponent: false
};
```

### 2. Component Content Component
```typescript
// Component's main content component
interface DataImportContentProps extends ModalContentProps {
  // Additional props specific to this component
}

export const DataImportContent: React.FC<DataImportContentProps> = ({
  onAction,
  onClose,
  isCompact,
  modalState
}) => {
  const [importState, setImportState] = useState<ImportState>('idle');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Component handles its own business logic
  const handleFileImport = async (files: File[]) => {
    setImportState('importing');
    try {
      const result = await importGeographicData(files);
      onAction?.('import-complete', result);
      onClose?.();
    } catch (error) {
      setImportState('error');
    }
  };
  
  // Component adapts to modal state
  const isMinimal = isCompact || modalState === 'sidebar';
  
  return (
    <div className={`data-import-content ${isMinimal ? 'compact' : 'full'}`}>
      {/* Component-specific UI */}
      <FileUploadZone
        onFilesSelected={setSelectedFiles}
        acceptedTypes={['.geojson', '.csv', '.kml', '.gpx']}
        maxSize="10MB"
      />
      
      {selectedFiles.length > 0 && (
        <ImportPreview
          files={selectedFiles}
          onImport={handleFileImport}
          isCompact={isMinimal}
        />
      )}
      
      <ImportStatus
        state={importState}
        onRetry={() => setImportState('idle')}
      />
    </div>
  );
};
```

## Component Categories & Organization

### 1. Component Categories
```typescript
// Components organize themselves into logical categories
export const ComponentCategories = {
  DATA: 'data',
  ANALYSIS: 'analysis', 
  VISUALIZATION: 'visualization',
  SETTINGS: 'settings',
  TOOLS: 'tools'
} as const;

// Category definitions with default styling
export const CategoryConfigs: Record<string, CategoryConfig> = {
  data: {
    name: 'Data Management',
    defaultColor: '#3B82F6',      // Blue
    icon: '📊',
    description: 'Import, export, and manage geographic data'
  },
  analysis: {
    name: 'Analysis Tools', 
    defaultColor: '#10B981',      // Green
    icon: '🔍',
    description: 'Spatial analysis and data processing'
  },
  visualization: {
    name: 'Visualization',
    defaultColor: '#8B5CF6',      // Purple  
    icon: '🎨',
    description: 'Map styling and visual customization'
  },
  settings: {
    name: 'Settings',
    defaultColor: '#6B7280',      // Gray
    icon: '⚙️', 
    description: 'Application and project configuration'
  }
};
```

### 2. Example Components Collection
```typescript
// Data Management Components
export const DataExportComponent: ComponentDefinition = {
  id: 'data-export',
  name: 'Export Data',
  description: 'Export map data to various formats',
  icon: <ExportIcon />,
  primaryColor: '#059669',        // Dark green
  secondaryColor: '#34D399',
  category: 'data',
  priority: 20,
  onLaunch: () => ({
    id: 'data-export-modal',
    title: 'Export Geographic Data',
    content: <DataExportContent />,
    size: 'md',
    theme: { primaryColor: '#059669', headerStyle: 'default' }
  })
};

// Analysis Components  
export const SpatialAnalysisComponent: ComponentDefinition = {
  id: 'spatial-analysis',
  name: 'Spatial Analysis',
  description: 'Perform spatial queries and analysis',
  icon: <AnalysisIcon />,
  primaryColor: '#7C2D12',        // Brown
  secondaryColor: '#F97316',      // Orange
  category: 'analysis',
  priority: 30,
  onLaunch: () => ({
    id: 'analysis-modal',
    title: 'Spatial Analysis Tools',
    content: <SpatialAnalysisContent />,
    size: 'xl',
    initialState: 'modal',
    theme: { 
      primaryColor: '#7C2D12',
      headerStyle: 'branded',
      contentPadding: 'lg'
    }
  })
};

// Visualization Components
export const LayerManagerComponent: ComponentDefinition = {
  id: 'layer-manager',
  name: 'Layer Manager', 
  description: 'Manage map layers and visibility',
  icon: <LayersIcon />,
  primaryColor: '#7C3AED',        // Purple
  secondaryColor: '#A78BFA',
  category: 'visualization',
  priority: 40,
  onLaunch: () => ({
    id: 'layers-modal',
    title: 'Layer Management',
    content: <LayerManagerContent />,
    size: 'md',
    initialState: 'sidebar',       // Starts as sidebar
    theme: { primaryColor: '#7C3AED' }
  })
};

// Settings Components
export const ProjectSettingsComponent: ComponentDefinition = {
  id: 'project-settings',
  name: 'Project Settings',
  description: 'Configure project properties and preferences',
  icon: <SettingsIcon />,
  primaryColor: '#374151',        // Dark gray
  secondaryColor: '#9CA3AF',      // Light gray
  category: 'settings',
  priority: 50,
  onLaunch: () => ({
    id: 'project-settings-modal',
    title: 'Project Configuration',
    content: <ProjectSettingsContent />,
    size: 'lg',
    theme: { 
      primaryColor: '#374151',
      headerStyle: 'minimal'
    }
  })
};
```

## Feature Registration System

### 1. Feature Registry
```typescript
## Component Registration System

### 1. Component Registry
```typescript
// Central registry for all components
class ComponentRegistry {
  private components = new Map<string, ComponentDefinition>();

  // Register a component
  register(component: ComponentDefinition): void {
    this.components.set(component.id, component);
  }

  // Get components for home button
  getEnabledComponents(): ComponentDefinition[] {
    return Array.from(this.components.values())
      .filter(component => component.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  // Get components by category
  getComponentsByCategory(category: string): ComponentDefinition[] {
    return this.getEnabledComponents()
      .filter(component => component.category === category);
  }

  // Update component status
  updateComponent(id: string, updates: Partial<ComponentDefinition>): void {
    const component = this.components.get(id);
    if (component) {
      this.components.set(id, { ...component, ...updates });
    }
  }
```

### 2. Component Registration (App Initialization)
```typescript
// Register all components on app startup
export const initializeComponents = () => {
  // Data components
  componentRegistry.register(DataImportComponent);
  componentRegistry.register(DataExportComponent);
  
  // Analysis components
  componentRegistry.register(SpatialAnalysisComponent);
  componentRegistry.register(MeasurementComponent);
  
  // Visualization components  
  componentRegistry.register(LayerManagerComponent);
  componentRegistry.register(StyleEditorComponent);
  
  // Settings features
  featureRegistry.register(ProjectSettingsFeature);
  featureRegistry.register(UserPreferencesFeature);
};

// App.tsx
function App() {
  useEffect(() => {
    initializeFeatures();
  }, []);
  
  return (
    <div className="app">
      <HomeButton 
        features={featureRegistry.getEnabledFeatures()}
        onFeatureLaunch={(modalConfig) => modalStack.pushModal(modalConfig)}
      />
      <UniversalModalSystem />
      <MapComponent />
    </div>
  );
}
```

## Feature Development Patterns

### 1. Feature Content Components
```typescript
// Pattern 1: Simple Feature Content
export const SimpleFeatureContent: React.FC<ModalContentProps> = ({
  onClose,
  isCompact
}) => {
  return (
    <div className="simple-feature">
      {/* Feature UI here */}
      <button onClick={onClose}>Done</button>
    </div>
  );
};

// Pattern 2: Multi-step Feature Content
export const WizardFeatureContent: React.FC<ModalContentProps> = ({
  onAction,
  onClose,
  modalState
}) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({});
  
  const handleStepComplete = (stepData: any) => {
    setData(prev => ({ ...prev, ...stepData }));
    if (step < 3) {
      setStep(step + 1);
    } else {
      onAction?.('wizard-complete', data);
      onClose?.();
    }
  };
  
  return (
    <div className="wizard-feature">
      <StepIndicator current={step} total={3} />
      <StepContent 
        step={step} 
        data={data}
        onComplete={handleStepComplete}
        isCompact={modalState === 'sidebar'}
      />
    </div>
  );
};

// Pattern 3: Persistent Sidebar Feature
export const PersistentFeatureContent: React.FC<ModalContentProps> = ({
  modalState,
  onAction
}) => {
  // This feature is designed to stay in sidebar mode
  useEffect(() => {
    if (modalState === 'modal') {
      // Auto-collapse to sidebar after 2 seconds
      setTimeout(() => {
        onAction?.('request-sidebar');
      }, 2000);
    }
  }, [modalState]);
  
  return (
    <div className={`persistent-feature ${modalState}`}>
      {/* Always-available feature content */}
    </div>
  );
};
```

### 2. Feature State Management
```typescript
// Feature can maintain its own state
export const StatefulFeatureContent: React.FC<ModalContentProps> = (props) => {
  // Local state for feature
  const [featureState, setFeatureState] = useState<FeatureState>({
    activeTab: 'overview',
    data: null,
    loading: false
  });
  
  // Persist state when modal changes state
  useEffect(() => {
    saveFeatureState(props.modalId!, featureState);
  }, [featureState, props.modalId]);
  
  // Restore state when modal reopens
  useEffect(() => {
    const savedState = loadFeatureState(props.modalId!);
    if (savedState) {
      setFeatureState(savedState);
    }
  }, [props.modalId]);
  
  return (
    <div className="stateful-feature">
      {/* Feature maintains state across modal state changes */}
    </div>
  );
};
```

## Feature Icons & Styling

### 1. Icon Guidelines
```typescript
// Pattern 1: React Icon Components (Recommended)
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

export const ImportFeature = {
  icon: <DocumentArrowUpIcon className="w-6 h-6" />,
  // ...
};

// Pattern 2: Emoji Icons (Simple)
export const EmojiFeature = {
  icon: '📊',  // Simple but effective
  // ...
};

// Pattern 3: Custom Icon Component
const CustomIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    {/* Custom SVG path */}
  </svg>
);

export const CustomFeature = {
  icon: <CustomIcon />,
  // ...
};
```

### 2. Color Schemes
```typescript
// Recommended color palettes for different feature types
export const FeatureColors = {
  // Data operations - Blues
  DATA_PRIMARY: '#3B82F6',
  DATA_SECONDARY: '#93C5FD',
  
  // Analysis operations - Greens
  ANALYSIS_PRIMARY: '#10B981', 
  ANALYSIS_SECONDARY: '#34D399',
  
  // Visualization - Purples
  VIZ_PRIMARY: '#8B5CF6',
  VIZ_SECONDARY: '#C4B5FD',
  
  // Settings - Grays
  SETTINGS_PRIMARY: '#6B7280',
  SETTINGS_SECONDARY: '#9CA3AF',
  
  // Tools - Oranges
  TOOLS_PRIMARY: '#F59E0B',
  TOOLS_SECONDARY: '#FBBF24',
  
  // Alerts/Destructive - Reds
  ALERT_PRIMARY: '#EF4444',
  ALERT_SECONDARY: '#FCA5A5'
};
```

## Success Criteria

### Feature Implementation Checklist
- ✅ Feature defines complete visual identity (icon, colors)
- ✅ Feature provides self-contained content component
- ✅ Feature specifies modal configuration and behavior
- ✅ Feature handles responsive design (modal vs sidebar)
- ✅ Feature integrates with registry system
- ✅ Feature follows accessibility guidelines
- ✅ Feature includes proper error handling
- ✅ Feature provides user feedback and loading states

### Integration Requirements
- ✅ Works seamlessly with Home Button system
- ✅ Integrates properly with Universal Modal system
- ✅ Maintains consistent interaction patterns
- ✅ Provides proper TypeScript types
- ✅ Follows established naming conventions

This feature development guide ensures that all features integrate seamlessly with the Home Button and Modal systems while maintaining their own unique identity and functionality.

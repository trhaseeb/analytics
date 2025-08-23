# Nomenclature Standardization - August 22, 2025

## Overview
Updated terminology throughout all documentation to create clear distinction between system components and on-map geographic features.

## Standardized Terms

### System Components
- **Previous**: "System Features", "Features" (when referring to UI functionality)
- **Current**: "Components" 
- **Definition**: UI system modules like Data Import, Analysis Tools, Settings, etc.
- **Examples**: DataImportComponent, LayerManagerComponent, SpatialAnalysisComponent

### On-Map Features  
- **Previous**: "Features" (when referring to geographic data)
- **Current**: "Features" (unchanged)
- **Definition**: Geographic data points, polygons, lines drawn on the map
- **Examples**: GeoJSON features, drawn polygons, imported geographic data

## Updated Files

### File Renames
- `FEATURE_INSTRUCTIONS.md` → `COMPONENT_INSTRUCTIONS.md`

### Interface/Type Updates
- `FeatureDefinition` → `ComponentDefinition`
- `FeatureTheme` → `ComponentTheme`
- `FeatureRegistry` → `ComponentRegistry`
- `featureRegistry` → `componentRegistry`
- `onFeatureLaunch` → `onComponentLaunch`
- `hoveredFeature` → `hoveredComponent`
- `betaFeature` → `betaComponent`

### Content Updates
- All references to "system features" changed to "components"
- All documentation headers updated
- Example code updated with new naming
- Comments and explanations updated for clarity

### Files Modified
1. **COMPONENT_INSTRUCTIONS.md** (renamed from FEATURE_INSTRUCTIONS.md)
   - Complete terminology update throughout
   - Interface definitions updated
   - Example code updated

2. **HOME_BUTTON_INSTRUCTIONS.md**
   - Updated to reference "Component Launcher System"
   - Interface props updated
   - Documentation content updated

3. **UNIVERSAL_MODAL_INSTRUCTIONS.md**
   - Updated to handle "component interactions"
   - Theme interfaces updated
   - Integration examples updated

4. **ARCHITECTURE_OVERVIEW.md**
   - Core architecture description updated
   - Benefits and workflow sections updated
   - Example code updated

5. **README.md**
   - Quick start guide updated
   - Development section updated
   - Documentation links updated

6. **DOCUMENTATION_CLEANUP_SUMMARY.md**
   - File listing updated
   - Tree structure updated

## Benefits of Standardization

### 🎯 **Clarity**
- Clear distinction between UI system modules and geographic data
- No more confusion about which "feature" is being discussed
- Consistent terminology across all documentation

### 🔧 **Developer Experience**
- More intuitive naming for system architecture
- Easier onboarding for new developers
- Better code organization and maintenance

### 📚 **Documentation**
- Consistent language across all guides
- Clear separation of concerns in documentation
- Better searchability and navigation

## Implementation

All changes are documentation-only at this stage. When implementing the actual code:

1. Use `ComponentDefinition` interface for system modules
2. Use `ComponentRegistry` for managing system components  
3. Keep "Features" for geographic data handling
4. Follow the established naming patterns throughout

This standardization creates a solid foundation for the upcoming implementation phase while maintaining clarity about the distinct roles of system components versus geographic features.

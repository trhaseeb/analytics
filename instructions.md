# AI Migration Instructions: Mapbox to MapLibre

## TASK DEFINITION
- OBJECTIVE: Migrate geospatial application from Mapbox to MapLibre while enhancing features
- INPUT: JavaScript codebase with Mapbox dependencies
- OUTPUT: Working application with MapLibre implementation and enhanced features
- SUCCESS_CRITERIA: Application runs without errors, maintains all original functionality

## EXECUTION SEQUENCE
1. ANALYZE_CODEBASE
2. PLAN_MIGRATION
3. IMPLEMENT_CORE_CHANGES
4. ENHANCE_FEATURES
5. IMPLEMENT_ERROR_HANDLING
6. TEST_AND_VALIDATE

## FUNCTION: ANALYZE_CODEBASE
- INPUT: repository_path
- OUTPUT: Codebase analysis object with dependencies, references, and features
- PROCESS:
  1. Scan all JavaScript files for import/require statements
  2. Identify all Mapbox API references and usage patterns
  3. Catalog existing features by analyzing function calls
  4. Check for custom styles and tile sources
  5. Identify initialization sequence and component structure

## FUNCTION: PLAN_MIGRATION
- INPUT: codebase_analysis
- OUTPUT: Migration plan with steps, dependency changes, and file changes
- PROCESS:
  1. Prioritize core map initialization changes
  2. Identify critical path dependencies
  3. Create topological ordering of changes
  4. Plan for backward compatibility where needed

## FUNCTION: IMPLEMENT_CORE_CHANGES
- INPUT: migration_plan, codebase_path
- OUTPUT: List of changed files and status
- PROCESS:
  1. Update package dependencies
     - Add maplibre-gl
     - Remove mapbox-gl or keep as fallback
  2. Transform map initialization code to use MapLibre
  3. Replace Mapbox-specific styling
  4. Update event handlers and controls
  5. Create compatibility adapter for Mapbox-specific APIs

## FUNCTION: ENHANCE_FEATURES
- INPUT: codebase_path, existing_features, enhancement_targets
- OUTPUT: List of enhanced features and status
- PROCESS:
  1. Implement enhanced data handling
     - Add support for additional geospatial formats
     - Implement efficient data loading with web workers
  2. Improve visualization capabilities
     - Add heatmap, cluster, and 3D visualization
     - Implement animation for temporal data
  3. Enhance user interface
     - Add responsive design
     - Implement theme switching
  4. Improve reporting capabilities
     - Add export to multiple formats
     - Implement chart generation

## FUNCTION: IMPLEMENT_ERROR_HANDLING
- INPUT: codebase_path
- OUTPUT: Error handling implementation status
- PROCESS:
  1. Create global error handler
  2. Implement recovery mechanisms
     - Map initialization fallbacks
     - Data loading retries
     - Rendering fallbacks
  3. Add user-friendly error messages
  4. Implement logging and reporting

## FUNCTION: TEST_AND_VALIDATE
- INPUT: codebase_path
- OUTPUT: Test results and performance metrics
- PROCESS:
  1. Test map initialization
  2. Validate layer rendering
  3. Test data loading
  4. Verify user interactions
  5. Check reporting functionality
  6. Measure performance metrics
  7. Perform browser compatibility testing

## DECISION TREE: ERROR RECOVERY
- IF map_initialization_fails:
  - Try alternative style URL
  - Fall back to minimal map configuration
  - Display error message with troubleshooting steps
- IF data_loading_fails:
  - Retry with exponential backoff
  - Attempt to parse data with alternative method
  - Show partial data if available
- IF rendering_error:
  - Fall back to simpler visualization
  - Reduce data complexity
  - Use CPU rendering fallback if available

## CODE IMPLEMENTATION EXAMPLES

### MapLibre Initialization
- Replace Mapbox initialization with MapLibre
- Create a MapController class with proper error handling
- Add default controls and event listeners
- Implement fallback mechanisms for failures

### Data Handler Implementation
- Create a GeoDataHandler class supporting multiple formats
- Implement async data loading with proper error handling
- Add processors for different data types (GeoJSON, CSV, KML, TopoJSON)
- Include recovery mechanisms for data loading failures

### Visualization Engine
- Create a VisualizationEngine class for different layer types
- Support heatmap, cluster, choropleth, and 3D visualizations
- Implement level-of-detail rendering for performance
- Add animation capabilities for temporal data

### Error Handling System
- Implement global error handler with detailed logging
- Create user-friendly error messages
- Add recovery strategies for different error scenarios
- Include performance monitoring and reporting

### Integration System
- Create module registration and dependency management
- Implement proper initialization sequence
- Add compatibility layers for existing code
- Include testing
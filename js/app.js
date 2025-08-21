// Main Application Namespace and State Management
window.App = {
    state: {
        map: null, snapshotMap: null, layersControl: null, geojsonLayer: null,
        decoratorLayers: [], dsmLegendControl: null, svgPatternDefs: null,
        projectBoundary: { layer: null, geojson: null },
        boundaryDrawer: null,
        data: {
            ortho: { georaster: null, fileBuffer: null, layer: null },
            dsm: { georaster: null, fileBuffer: null, layer: null },
            geojson: { data: { type: 'FeatureCollection', features: [] }, fileContent: null }, 
            logo: null, 
            categories: {}, 
            contributors: [{ name: 'Default User', role: 'Project Lead', bio: '<p>Initial user for this project.</p>', image: null }],
            reportInfo: { 
                clientName: '', clientContact: '', clientAddress: '',
                projectId: '', reportDate: '', reportStatus: 'Draft'
            },
        },
        featureIdToLayerMap: new Map(),
        categoryVisibility: {},
        showOnlyWithObservations: false,
        quillInstances: {
            contributorBio: null
        }
    },
    async init() {
        try {
            console.log('Starting application initialization...');
            
            // Initialize error handler first
            if (typeof App.ErrorHandler !== 'undefined' && App.ErrorHandler.init) {
                App.ErrorHandler.init();
                console.log('Error handler initialized');
            }
            
            // Initialize UI components
            if (typeof App.UI !== 'undefined' && App.UI.init) {
                App.UI.init();
                console.log('UI initialized');
            }
            
            // Initialize utilities
            if (typeof App.Utils !== 'undefined' && App.Utils.init) {
                App.Utils.init();
            }
            
            // Initialize data handler
            if (typeof App.Data !== 'undefined' && App.Data.init) {
                App.Data.init();
            }
            
            // Initialize geodata handler
            if (typeof App.GeoDataHandler !== 'undefined' && App.GeoDataHandler.init) {
                App.GeoDataHandler.init();
                console.log('GeoData handler initialized');
            }
            
            // Initialize visualization engine
            if (typeof App.VisualizationEngine !== 'undefined' && App.VisualizationEngine.init) {
                App.VisualizationEngine.init();
                console.log('Visualization engine initialized');
            }
            
            // Initialize map controller first, then enhanced map
            if (typeof App.MapController !== 'undefined' && App.MapController.init) {
                await App.MapController.init();
                console.log('Map controller initialized');
            }
            
            // Initialize enhanced map functionality
            if (typeof App.Map !== 'undefined' && App.Map.init) {
                await App.Map.init();
                console.log('Enhanced map initialized');
            }
            
            // Initialize other modules that depend on the map
            if (typeof App.Events !== 'undefined' && App.Events.init) {
                App.Events.init();
                console.log('Events initialized');
            }
            
            // Initialize category and contributor managers
            if (typeof App.CategoryManager !== 'undefined') {
                if (App.CategoryManager.init) App.CategoryManager.init();
                if (App.CategoryManager.render) App.CategoryManager.render();
                console.log('Category manager initialized');
            }
            
            if (typeof App.ContributorManager !== 'undefined' && App.ContributorManager.init) {
                App.ContributorManager.init();
                console.log('Contributor manager initialized');
            }
            
            // Initialize legend
            if (typeof App.Legend !== 'undefined' && App.Legend.render) {
                App.Legend.render();
                console.log('Legend initialized');
            }
            
            // Initialize import/export functionality
            if (typeof App.ImportExport !== 'undefined' && App.ImportExport.init) {
                App.ImportExport.init();
            }
            
            // Initialize image annotator
            if (typeof App.ImageAnnotator !== 'undefined' && App.ImageAnnotator.init) {
                App.ImageAnnotator.init();
            }
            
            // Update UI components
            if (typeof App.UI !== 'undefined' && App.UI.updateReportStatusDisplay) {
                App.UI.updateReportStatusDisplay();
            }
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Application initialization failed:', error);
            if (typeof App.ErrorHandler !== 'undefined' && App.ErrorHandler.handleError) {
                App.ErrorHandler.handleError({
                    type: 'initialization',
                    message: `App initialization failed: ${error.message}`,
                    timestamp: new Date().toISOString()
                });
            }
            throw error; // Re-throw to trigger fallback UI
        }
    }
};

// Initialization will be called after all modules are loaded
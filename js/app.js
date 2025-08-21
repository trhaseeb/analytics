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
            // Initialize error handler first
            if (App.ErrorHandler) {
                App.ErrorHandler.init();
            }
            
            // Initialize UI
            this.UI.init(); 
            
            // Initialize enhanced data handler
            if (App.GeoDataHandler) {
                App.GeoDataHandler.init();
            }
            
            // Initialize visualization engine
            if (App.VisualizationEngine) {
                App.VisualizationEngine.init();
            }
            
            // Initialize map (this is async now)
            await this.Map.init();
            
            // Initialize other modules
            this.Events.init();
            this.CategoryManager.render(); 
            this.Legend.render(); 
            this.ContributorManager.init();
            this.UI.updateReportStatusDisplay();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Application initialization failed:', error);
            if (App.ErrorHandler) {
                App.ErrorHandler.handleError({
                    type: 'initialization',
                    message: `App initialization failed: ${error.message}`,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
};

// Initialization will be called after all modules are loaded
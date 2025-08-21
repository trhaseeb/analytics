// Application initialization wrapper with error handling
window.App = window.App || {};

// Initialize core state first
App.state = App.state || {
    map: null,
    snapshotMap: null,
    layersControl: null,
    geojsonLayer: null,
    decoratorLayers: [],
    dsmLegendControl: null,
    svgPatternDefs: null,
    projectBoundary: { layer: null, geojson: null },
    boundaryDrawer: null,
    data: {
        ortho: { georaster: null, fileBuffer: null, layer: null },
        dsm: { georaster: null, fileBuffer: null, layer: null },
        geojson: { 
            data: { type: 'FeatureCollection', features: [] }, 
            fileContent: null 
        }, 
        logo: null, 
        categories: {}, 
        contributors: [{ 
            name: 'Default User', 
            role: 'Project Lead', 
            bio: '<p>Initial user for this project.</p>', 
            image: null 
        }],
        reportInfo: { 
            clientName: '', 
            clientContact: '', 
            clientAddress: '',
            projectId: '', 
            reportDate: '', 
            reportStatus: 'Draft'
        },
    },
    featureIdToLayerMap: new Map(),
    categoryVisibility: {},
    showOnlyWithObservations: false,
    layerVisibility: {
        features: true,
        ortho: true,
        dsm: true,
        dtm: true
    },
    editingMode: null,
    measurementMode: null,
    measurementPoints: [],
    heatmap: false,
    terrain: false,
    pointCloudStyling: 'elevation',
    quillInstances: {
        contributorBio: null
    }
};

// Application initialization with dependency checking
App.init = async function() {
    try {
        console.log('Starting application initialization...');
        
        // Check for required dependencies
        const requiredLibraries = [
            { name: 'maplibregl', global: 'maplibregl' },
            { name: 'deck.gl', global: 'deck' },
            { name: 'Turf.js', global: 'turf' }
        ];

        const missingLibraries = requiredLibraries.filter(lib => !window[lib.global]);
        if (missingLibraries.length > 0) {
            console.warn('Missing libraries:', missingLibraries.map(lib => lib.name));
        }

        // Initialize error handler first
        if (typeof App.ErrorHandler !== 'undefined' && App.ErrorHandler.init) {
            App.ErrorHandler.init();
            console.log('✓ Error handler initialized');
        } else {
            console.warn('⚠ Error handler not available');
        }
        
        // Initialize UI components
        if (typeof App.UI !== 'undefined' && App.UI.init) {
            App.UI.init();
            console.log('✓ UI initialized');
        } else {
            console.warn('⚠ UI module not available');
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
            console.log('✓ GeoData handler initialized');
        } else {
            console.warn('⚠ GeoData handler not available');
        }
        
        // Initialize visualization engine
        if (typeof App.VisualizationEngine !== 'undefined' && App.VisualizationEngine.init) {
            App.VisualizationEngine.init();
            console.log('✓ Visualization engine initialized');
        } else {
            console.warn('⚠ Visualization engine not available');
        }
        
        // Initialize map controller first, then enhanced map
        if (typeof App.MapController !== 'undefined' && App.MapController.init) {
            await App.MapController.init();
            console.log('✓ Map controller initialized');
        } else {
            console.error('✗ Map controller not available - critical error');
            throw new Error('Map controller is required but not available');
        }
        
        // Initialize enhanced map functionality
        if (typeof App.Map !== 'undefined' && App.Map.init) {
            await App.Map.init();
            console.log('✓ Enhanced map initialized');
        } else {
            console.warn('⚠ Enhanced map not available');
        }
        
        // Initialize other modules that depend on the map
        if (typeof App.Events !== 'undefined' && App.Events.init) {
            App.Events.init();
            console.log('✓ Events initialized');
        } else {
            console.warn('⚠ Events module not available');
        }
        
        // Initialize category and contributor managers
        if (typeof App.CategoryManager !== 'undefined') {
            if (App.CategoryManager.init) App.CategoryManager.init();
            if (App.CategoryManager.render) App.CategoryManager.render();
            console.log('✓ Category manager initialized');
        } else {
            console.warn('⚠ Category manager not available');
        }
        
        if (typeof App.ContributorManager !== 'undefined' && App.ContributorManager.init) {
            App.ContributorManager.init();
            console.log('✓ Contributor manager initialized');
        } else {
            console.warn('⚠ Contributor manager not available');
        }
        
        // Initialize legend
        if (typeof App.Legend !== 'undefined' && App.Legend.render) {
            App.Legend.render();
            console.log('✓ Legend initialized');
        } else {
            console.warn('⚠ Legend not available');
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
        
        console.log('🎉 Application initialized successfully');
        
        // Show success message
        if (App.UI && App.UI.showMessage) {
            setTimeout(() => {
                App.UI.showMessage('Application Ready', 'Geospatial analytics application loaded successfully with API-free libraries.');
            }, 1000);
        }
        
    } catch (error) {
        console.error('💥 Application initialization failed:', error);
        
        if (typeof App.ErrorHandler !== 'undefined' && App.ErrorHandler.handleError) {
            App.ErrorHandler.handleError({
                type: 'initialization',
                message: `App initialization failed: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        }
        
        // Show fallback UI
        App.showFallbackUI(error);
        throw error;
    }
};

// Fallback UI for when everything fails
App.showFallbackUI = function(error) {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100%; 
                background: linear-gradient(45deg, #1f2937 25%, #374151 25%, #374151 50%, #1f2937 50%, #1f2937 75%, #374151 75%);
                background-size: 20px 20px;
                color: white; 
                font-family: Inter, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div style="max-width: 500px;">
                    <h2 style="margin-bottom: 16px; color: #ef4444;">⚠️ Application Error</h2>
                    <p style="margin-bottom: 16px;">The geospatial application failed to initialize properly.</p>
                    <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 4px; margin: 16px 0; font-family: monospace; font-size: 12px; text-align: left;">
                        ${error.message}
                    </div>
                    <div style="margin-top: 20px;">
                        <button onclick="location.reload()" style="
                            background: #3b82f6; 
                            color: white; 
                            border: none; 
                            padding: 12px 24px; 
                            border-radius: 6px; 
                            cursor: pointer;
                            margin-right: 10px;
                            font-weight: bold;
                        ">🔄 Reload Application</button>
                        <button onclick="console.log('Debug info:', App)" style="
                            background: #6b7280; 
                            color: white; 
                            border: none; 
                            padding: 12px 24px; 
                            border-radius: 6px; 
                            cursor: pointer;
                            font-weight: bold;
                        ">🐛 Debug Info</button>
                    </div>
                    <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                        Check the browser console for detailed error information.
                    </p>
                </div>
            </div>
        `;
    }
};

// Library compatibility check
App.checkLibraryCompatibility = function() {
    const compatibility = {
        maplibregl: !!window.maplibregl,
        deckgl: !!window.deck,
        turf: !!window.turf,
        quill: !!window.Quill,
        chroma: !!window.chroma,
        jspdf: !!window.jsPDF,
        jszip: !!window.JSZip
    };
    
    console.log('Library compatibility check:', compatibility);
    return compatibility;
};

console.log('Application core loaded. Call App.init() to start initialization.');

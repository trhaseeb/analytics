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
            tileset: { data: null, url: null },
            pointcloud: { data: null, url: null },
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
        editingMode: null,
        measurementMode: null,
        measurementPoints: [],
        layerVisibility: {
            features: true,
            ortho: false,
            dsm: false,
            dtm: false
        },
        terrain: false,
        pointCloudStyling: 'none',
        heatmap: false,
        quillInstances: {
            contributorBio: null
        }
    },
    init() {
        this.UI.init(); 
        this.Map.init();
        this.Events.init();
        this.CategoryManager.render(); 
        this.Legend.render(); 
        this.ContributorManager.init();
        this.UI.updateReportStatusDisplay();
    }
};

// Initialization will be called after all modules are loaded
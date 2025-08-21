// Data handling
window.App = window.App || {};

App.Data = {
    getFeatureById: id => App.state.data.geojson.data?.features.find(f => f.properties._internalId === id),
    async handleRasterUpload(event, type) {
        App.UI.showPrompt('Enter Tile URL Template', [{ id: 'url', label: 'URL Template', value: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', type: 'text' }], (results) => {
            if (results.url) {
                App.state.data[type].url = results.url;
                App.Map.renderLayers();
                App.UI.elements.geodataModal.classList.add('hidden');
            }
        });
    },
    processAndInitializeFeatures(geojson) {
        if (!geojson?.features) return;
        if (geojson.properties?.categories) Object.assign(App.state.data.categories, geojson.properties.categories);
        if (geojson.properties?.contributors) App.state.data.contributors = geojson.properties.contributors; 
        
        let defaultCategoryName = Object.keys(App.state.data.categories)[0];
        let assignedDefaultCount = 0;
        if (!defaultCategoryName) {
            defaultCategoryName = "Imported";
            App.state.data.categories[defaultCategoryName] = App.CategoryManager.getDefaultCategory();
        }
        geojson.features.forEach((feature) => {
            if (!feature.properties) feature.properties = {};
            feature.properties._internalId = feature.properties._internalId || crypto.randomUUID(); 
            if (!feature.properties.images) feature.properties.images = [];
            if (!feature.properties.observations) feature.properties.observations = [];

            if (!feature.properties.category || !App.state.data.categories[feature.properties.category]) {
                feature.properties.category = defaultCategoryName;
                assignedDefaultCount++;
            }
            if (typeof App.state.categoryVisibility[feature.properties.category] === 'undefined') {
                App.state.categoryVisibility[feature.properties.category] = true;
            }
            if (typeof feature.properties.showLabel === 'undefined') feature.properties.showLabel = true;
        });
        if (assignedDefaultCount > 0) {
            App.UI.showMessage('Import Note', `${assignedDefaultCount} feature(s) had missing or invalid categories and were assigned to the "${defaultCategoryName}" category.`);
        }
    },
    /**
     * This function resets the application to a clean state, ready for a new project import.
     * It surgically removes only the application-specific overlay layers and data,
     * preserving the base map and main controls for a smoother user experience.
    */
    resetAppState() {
        // 1. Reset project boundary
        App.Map.clearBoundary();

        // 2. Remove DSM legend if it exists
        if (App.state.dsmLegendControl) {
            App.state.dsmLegendControl.remove();
            App.state.dsmLegendControl = null;
        }

        // 5. Reset state data object to its default using a deep copy
        const defaultStateData = {
            ortho: { georaster: null, fileBuffer: null, layer: null },
            dsm: { georaster: null, fileBuffer: null, layer: null },
            geojson: { data: { type: 'FeatureCollection', features: [] }, fileContent: null },
            logo: null,
            categories: {},
            contributors: [{ name: 'Default User', role: 'Project Lead', bio: '<p>Initial user for this project.</p>', image: null }],
            reportInfo: { clientName: '', clientContact: '', clientAddress: '', projectId: '', reportDate: '', reportStatus: 'Draft' }
        };
        App.state.data = JSON.parse(JSON.stringify(defaultStateData));

        // 6. Clear helper maps and flags
        App.state.featureIdToLayerMap.clear();
        App.state.decoratorLayers = [];
        App.state.showOnlyWithObservations = false;
        App.state.categoryVisibility = {};

        // 7. Reset UI elements to their default state
        document.getElementById('show-only-with-observations-toggle').checked = false;
        document.getElementById('main-title').childNodes[0].nodeValue = 'Site Analysis Report ';
        document.getElementById('main-description').innerHTML = 'An interactive overview of the site features and raster data.';
        document.getElementById('logo-img').src = 'https://placehold.co/80x80/e2e8f0/334155?text=Logo';
        document.getElementById('snapshot-container').innerHTML = '<p>Select a feature from the legend or map to view its details and a visual snapshot.</p>';

        // 8. Clear file input values
        ['ortho-input', 'dsm-input', 'import-project-input', 'import-categories-input'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        // 9. Re-render UI components that depend on the cleared state
        App.Legend.render();
        App.CategoryManager.render();
        App.ContributorManager.render();
        App.UI.updateReportStatusDisplay();
    },

    async handleTilesetUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        App.state.data.tileset.url = URL.createObjectURL(file);
        App.Map.renderLayers();
        App.UI.elements.geodataModal.classList.add('hidden');
    },

    async handlePointCloudUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        App.UI.showLoader('Loading Point Cloud...');
        try {
            const { LASLoader } = loaders;
            const data = await LASLoader.parse(file);
            App.state.data.pointcloud.data = data;
            App.Map.renderLayers();
        } catch (err) {
            App.UI.showMessage('Error', `Failed to load point cloud: ${err.message}`);
        } finally {
            App.UI.hideLoader();
            App.UI.elements.geodataModal.classList.add('hidden');
        }
    },
};
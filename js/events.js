// Event handling
window.App = window.App || {};

App.Events = {
    init() {
        console.log('Initializing event handlers...');
        
        // Helper function to safely add event listeners
        const safeAddEventListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Element with id '${id}' not found, skipping event listener`);
            }
        };

        const safeSetOnClick = (id, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.onclick = handler;
            } else {
                console.warn(`Element with id '${id}' not found, skipping onclick handler`);
            }
        };

        // Logo and report info events
        safeAddEventListener('logo-input', 'change', async e => { 
            if (e.target.files[0]) { 
                App.state.data.logo = await App.Utils.readFile(e.target.files[0], 'dataURL'); 
                const logoImg = document.getElementById('logo-img');
                if (logoImg) {
                    logoImg.src = App.state.data.logo;
                    logoImg.style.display = 'block';
                }
            } 
        });
        
        safeSetOnClick('logo-img', () => {
            if (App.Events.showEditReportInfoModal) {
                App.Events.showEditReportInfoModal();
            }
        });

        // Geodata modal events
        safeSetOnClick('open-geodata-modal-btn', () => {
            if (App.UI && App.UI.elements && App.UI.elements.geodataModal) {
                App.UI.elements.geodataModal.classList.remove('hidden');
            }
        });
        
        safeSetOnClick('close-geodata-modal-btn', () => {
            if (App.UI && App.UI.elements && App.UI.elements.geodataModal) {
                App.UI.elements.geodataModal.classList.add('hidden');
            }
        });

        // Data upload events
        safeAddEventListener('ortho-input', 'change', e => {
            if (App.Data && App.Data.handleRasterUpload) {
                App.Data.handleRasterUpload(e, 'ortho');
            }
        });
        
        safeAddEventListener('dsm-input', 'change', e => {
            if (App.Data && App.Data.handleRasterUpload) {
                App.Data.handleRasterUpload(e, 'dsm');
            }
        });
        
        safeAddEventListener('tileset-input', 'change', e => {
            if (App.Data && App.Data.handleTilesetUpload) {
                App.Data.handleTilesetUpload(e);
            }
        });
        
        safeAddEventListener('pointcloud-input', 'change', e => {
            if (App.Data && App.Data.handlePointCloudUpload) {
                App.Data.handlePointCloudUpload(e);
            }
        });
        
        safeAddEventListener('dtm-input', 'change', e => {
            if (App.Data && App.Data.handleRasterUpload) {
                App.Data.handleRasterUpload(e, 'dtm');
            }
        });

        // Import/Export events
        safeAddEventListener('import-project-input', 'change', e => {
            if (App.ImportExport && App.ImportExport.importProjectOrFeatures) {
                App.ImportExport.importProjectOrFeatures(e);
            }
        });
        
        safeSetOnClick('export-project-btn', () => {
            if (App.ImportExport && App.ImportExport.showExportDataModal) {
                App.ImportExport.showExportDataModal();
            }
        });

        // Category management events
        safeSetOnClick('add-category-btn', () => {
            if (App.CategoryManager && App.CategoryManager.addCategory) {
                App.CategoryManager.addCategory();
            }
        });
        
        safeSetOnClick('export-categories-btn', () => {
            if (App.ImportExport && App.ImportExport.exportCategories) {
                App.ImportExport.exportCategories();
            }
        });
        
        safeAddEventListener('import-categories-input', 'change', e => {
            if (App.ImportExport && App.ImportExport.importCategories) {
                App.ImportExport.importCategories(e);
            }
        });

        // Contributor events
        safeSetOnClick('add-contributor-btn', () => {
            if (App.ContributorManager && App.ContributorManager.addContributor) {
                App.ContributorManager.addContributor();
            }
        });

        // Layer visibility events
        safeAddEventListener('show-only-with-observations-toggle', 'change', e => {
            App.state.showOnlyWithObservations = e.target.checked;
            if (App.Map && App.Map.renderLayers) {
                App.Map.renderLayers();
            }
        });

        // Boundary events
        if (App.UI && App.UI.elements) {
            if (App.UI.elements.defineBoundaryBtn) {
                App.UI.elements.defineBoundaryBtn.onclick = () => this.startBoundaryDraw();
            }
            if (App.UI.elements.clearBoundaryBtn) {
                App.UI.elements.clearBoundaryBtn.onclick = () => {
                    if (App.Map && App.Map.clearBoundary) {
                        App.Map.clearBoundary();
                    }
                };
            }
        }

        // Drawing tool events
        safeSetOnClick('draw-polygon-btn', () => this.setEditingMode('drawPolygon'));
        safeSetOnClick('draw-line-btn', () => this.setEditingMode('drawLine'));
        safeSetOnClick('draw-marker-btn', () => this.setEditingMode('drawMarker'));
        safeSetOnClick('split-polygon-btn', () => this.setEditingMode('splitPolygon'));
        safeSetOnClick('rotate-feature-btn', () => this.setEditingMode('rotate'));
        safeSetOnClick('finish-editing-btn', () => this.setEditingMode(null));

        // Layer toggle events
        const layerToggles = [
            ['features-layer-toggle', 'features'],
            ['ortho-layer-toggle', 'ortho'],
            ['dsm-layer-toggle', 'dsm'],
            ['dtm-layer-toggle', 'dtm']
        ];
        
        layerToggles.forEach(([elementId, layerName]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.onchange = (e) => this.toggleLayerVisibility(layerName, e.target.checked);
            }
        });

        // Measurement events
        safeSetOnClick('measure-distance-btn', () => this.setMeasurementMode('distance'));
        safeSetOnClick('measure-area-btn', () => this.setMeasurementMode('area'));
        safeSetOnClick('finish-measurement-btn', () => this.finishMeasurement());

        // Map control events
        const rotationSlider = document.getElementById('rotation-slider');
        if (rotationSlider) {
            rotationSlider.oninput = (e) => this.setMapRotation(e.target.value);
        }
        
        safeSetOnClick('toggle-terrain-btn', () => this.toggleTerrain());
        safeSetOnClick('toggle-heatmap-btn', () => this.toggleHeatmap());

        // Sidebar toggle events
        safeSetOnClick('open-sidebar-btn', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('-translate-x-full');
        });
        
        safeSetOnClick('close-sidebar-btn', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.add('-translate-x-full');
        });

        // Point cloud styling
        const pointcloudSelect = document.getElementById('pointcloud-styling-select');
        if (pointcloudSelect) {
            pointcloudSelect.onchange = (e) => this.setPointCloudStyling(e.target.value);
        }

        // Category and contributor manager toggles
        safeSetOnClick('manage-categories-btn', () => {
            const panel = document.getElementById('category-manager-panel');
            if (panel) panel.classList.remove('hidden');
        });
        
        safeSetOnClick('close-category-manager-btn', () => {
            const panel = document.getElementById('category-manager-panel');
            if (panel) panel.classList.add('hidden');
        });
        
        safeSetOnClick('manage-contributors-btn', () => {
            const panel = document.getElementById('contributor-manager-panel');
            if (panel) panel.classList.remove('hidden');
        });
        
        safeSetOnClick('close-contributor-manager-btn', () => {
            const panel = document.getElementById('contributor-manager-panel');
            if (panel) panel.classList.add('hidden');
        });

        console.log('Event handlers initialized');
    },

    toggleHeatmap() {
        if (!App.state.heatmap) App.state.heatmap = false;
        App.state.heatmap = !App.state.heatmap;
        if (App.Map && App.Map.renderLayers) {
            App.Map.renderLayers();
        }
        console.log('Heatmap toggled:', App.state.heatmap);
    },

    setPointCloudStyling(style) {
        App.state.pointCloudStyling = style;
        if (App.Map && App.Map.renderLayers) {
            App.Map.renderLayers();
        }
        console.log('Point cloud styling set to:', style);
    },

    toggleTerrain() {
        if (!App.state.terrain) App.state.terrain = false;
        App.state.terrain = !App.state.terrain;
        if (App.Map && App.Map.renderLayers) {
            App.Map.renderLayers();
        }
        console.log('Terrain toggled:', App.state.terrain);
    },

    finishMeasurement() {
        try {
            const points = App.state.measurementPoints || [];
            const mode = App.state.measurementMode;
            let measurementText = '';

            if (mode === 'distance' && points.length >= 2) {
                if (typeof turf !== 'undefined') {
                    const line = turf.lineString(points);
                    const length = turf.length(line, { units: 'feet' });
                    measurementText = `Measured Distance: ${length.toFixed(2)} ft`;
                } else {
                    measurementText = 'Distance measurement requires Turf.js library';
                }
            } else if (mode === 'area' && points.length >= 3) {
                if (typeof turf !== 'undefined') {
                    const polygon = turf.polygon([points.concat([points[0]])]);
                    const area = turf.area(polygon) * 10.764; // sq meters to sq feet
                    measurementText = `Measured Area: ${area.toFixed(2)} sq ft`;
                } else {
                    measurementText = 'Area measurement requires Turf.js library';
                }
            }

            if (measurementText && App.UI && App.UI.showMessage) {
                App.UI.showMessage('Measurement Result', measurementText);
            }

            this.setMeasurementMode(null);
        } catch (error) {
            console.error('Error finishing measurement:', error);
            if (App.UI && App.UI.showMessage) {
                App.UI.showMessage('Error', 'Failed to complete measurement');
            }
        }
    },

    setMapRotation(bearing) {
        try {
            if (App.state.map && App.state.map.setProps) {
                App.state.map.setProps({
                    viewState: {
                        ...App.state.map.props.viewState,
                        bearing: Number(bearing),
                        transitionDuration: 300
                    }
                });
            } else if (App.MapController && App.MapController.map) {
                // Fallback for MapLibre map
                App.MapController.map.setBearing(Number(bearing));
            }
        } catch (error) {
            console.error('Error setting map rotation:', error);
        }
    },

    setMeasurementMode(mode) {
        App.state.measurementMode = mode;
        App.state.measurementPoints = [];
        if (App.Map && App.Map.renderLayers) {
            App.Map.renderLayers();
        }
        const finishBtn = document.getElementById('finish-measurement-btn');
        if (finishBtn) {
            finishBtn.classList.toggle('hidden', mode === null);
        }
    },

    toggleLayerVisibility(layer, isVisible) {
        if (!App.state.layerVisibility) {
            App.state.layerVisibility = {};
        }
        App.state.layerVisibility[layer] = isVisible;
        if (App.Map && App.Map.renderLayers) {
            App.Map.renderLayers();
        }
        console.log(`Layer ${layer} visibility set to:`, isVisible);
    },

    setEditingMode(mode) {
        App.state.editingMode = mode;
        if (App.Map && App.Map.renderLayers) {
            App.Map.renderLayers();
        }
        const finishBtn = document.getElementById('finish-editing-btn');
        if (finishBtn) {
            finishBtn.classList.toggle('hidden', mode === null);
        }
        console.log('Editing mode set to:', mode);
    },

    startBoundaryDraw() {
        this.setEditingMode('drawPolygon');
        if (App.UI && App.UI.showMessage) {
            App.UI.showMessage('Define Boundary', 'Draw a polygon on the map to define the project boundary. Click the first point to finish.');
        }
    },
    showEditReportInfoModal() {
        const info = App.state.data.reportInfo;
        const titleElement = document.getElementById('main-title');
        const descriptionElement = document.getElementById('main-description');
        const reportTitle = titleElement.childNodes[0].nodeValue.trim();

        App.UI.showPrompt('Edit Report Information', [
            { id: 'logoFile', label: 'Change Report Logo', type: 'file', accept: 'image/*' },
            { id: 'newTitle', label: 'Report Title', value: reportTitle, type: 'text' },
            { id: 'Description', label: 'Report Description', value: descriptionElement.innerHTML, type: 'quill' },
            { id: 'clientName', label: 'Client Name', value: info.clientName, type: 'text' },
            { id: 'clientContact', label: 'Client Contact', value: info.clientContact, type: 'text' },
            { id: 'clientAddress', label: 'Client Address', value: info.clientAddress, type: 'text' },
            { id: 'projectId', label: 'Project ID', value: info.projectId, type: 'text' },
            { id: 'reportDate', label: 'Report Date', value: App.Utils.formatDate(info.reportDate || new Date()), type: 'date' },
            { id: 'reportStatus', label: 'Report Status', value: info.reportStatus, type: 'select', 
                options: [{label:'Draft',value:'Draft'},{label:'Under Review',value:'Under Review'},{label:'Final',value:'Final'},{label:'Archived',value:'Archived'}] }
        ], async (results) => { 
            if (results.newTitle) {
                titleElement.childNodes[0].nodeValue = results.newTitle + ' ';
            }
            if (results.Description) descriptionElement.innerHTML = results.Description;
            
            if (results.logoFile) { 
                App.state.data.logo = await App.Utils.readFile(results.logoFile, 'dataURL');
                document.getElementById('logo-img').src = App.state.data.logo;
            }

            App.state.data.reportInfo = {
                clientName: results.clientName, clientContact: results.clientContact, clientAddress: results.clientAddress,
                projectId: results.projectId, reportDate: results.reportDate, reportStatus: results.reportStatus
            };
            App.UI.updateReportStatusDisplay();
        }, 'edit-report-info-modal'); 
    },
    handleDrawNewFeature(e) {
        // Ignore if this was a boundary draw
        if (App.state.boundaryDrawer) return;

        const categoryOptions = Object.keys(App.state.data.categories).map(name => ({ label: name, value: name }));
        if (categoryOptions.length === 0) { 
            App.UI.showMessage('No Categories', 'Please create a category first using the "Manage Categories" button.'); 
            App.state.map.removeLayer(e.layer);
            return; 
        }
        
        const newFeature = e.layer.toGeoJSON();
        App.UI.showPrompt('New Feature Details', [
            { id: 'Name', label: 'Name', value: 'New Feature', type: 'text' },
            { id: 'Description', label: 'Description', value: '', type: 'quill' },
            { id: 'category', label: 'Category', value: categoryOptions[0].value, type: 'select', options: categoryOptions },
            { id: 'showLabel', label: 'Show Label on Map', value: true, type: 'checkbox' },
        ], (results) => {
            newFeature.properties = results;
            newFeature.properties._internalId = crypto.randomUUID(); 
            newFeature.properties.observations = [];
            if (!App.state.data.geojson.data) App.state.data.geojson.data = { type: 'FeatureCollection', features: [] };
            App.state.data.geojson.data.features.push(newFeature);
            App.Map.renderLayers();
            App.Events.selectFeature(newFeature.properties._internalId);
        });
    },
    selectFeature(featureId) {
        const feature = App.Data.getFeatureById(featureId);
        if (!feature) return;

        // Fly to feature
        const [minX, minY, maxX, maxY] = turf.bbox(feature);
        const { longitude, latitude, zoom } = new deck.WebMercatorViewport({
            width: App.state.map.width,
            height: App.state.map.height
        }).fitBounds([[minX, minY], [maxX, maxY]], { padding: {top: 20, bottom: 40, left: 20, right: 20} });

        App.state.map.setProps({
            viewState: {
                ...App.state.map.props.viewState,
                longitude,
                latitude,
                zoom: Math.min(zoom, 18), // Cap zoom level
                transitionDuration: 1000,
                transitionInterpolator: new deck.FlyToInterpolator()
            }
        });

        document.querySelectorAll('.legend-item.selected').forEach(item => item.classList.remove('selected'));
        const listItem = document.querySelector(`.legend-item[data-feature-id="${featureId}"]`);
        if (listItem) { listItem.classList.add('selected'); listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
        App.Snapshot.render(feature);
    },
    editFeatureProperties(feature) {
        App.state.map.closePopup();
        
        const fields = [
            { id: 'Name', label: 'Name', value: feature.properties.Name || '', type: 'text' },
            { id: 'Description', label: 'Description', value: feature.properties.Description || '', type: 'quill' },
            { id: 'category', label: 'Category', value: feature.properties.category, type: 'select', options: Object.keys(App.state.data.categories).map(name => ({ label: name, value: name })) },
            { id: 'showLabel', label: 'Show Label on Map', value: !!feature.properties.showLabel, type: 'checkbox' },
        ];

        App.UI.showPrompt('Edit Feature', fields, (results) => {
            Object.assign(feature.properties, results);
            App.Map.renderLayers();
            this.selectFeature(feature.properties._internalId);
        });

        // After showing the main prompt, inject the observations section
        const modalBody = document.getElementById('modal-body');
        const obsContainer = document.createElement('div');
        obsContainer.className = 'mt-6 border-t pt-4';
        obsContainer.innerHTML = `<h4 class="text-lg font-semibold mb-2">Observations</h4><div id="observation-list" class="space-y-3"></div><button id="add-observation-btn" class="mt-4 bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded">Add Observation</button>`;
        modalBody.appendChild(obsContainer);

        this.renderObservationsList(feature, obsContainer.querySelector('#observation-list'));

        obsContainer.querySelector('#add-observation-btn').onclick = () => {
            this.showObservationModal(feature);
        };
    },
    editFeatureShape(feature) {
        this.setEditingMode('edit');

        const featureIndex = App.state.data.geojson.data.features.findIndex(
            f => f.properties._internalId === feature.properties._internalId
        );

        if (featureIndex !== -1) {
            const layer = App.state.map.props.layers.find(l => l.id === 'geojson-layer');
            if (layer) {
                const newProps = {
                    ...layer.props,
                    selectedFeatureIndexes: [featureIndex]
                };
                const newLayer = new nebula.EditableGeoJsonLayer(newProps);
                App.state.map.setProps({ layers: [newLayer] });
            }
        }
    },
    finishEditing() {
        this.setEditingMode(null);
    },
    renderObservationsList(feature, container) {
        container.innerHTML = '';
        if (!feature.properties.observations || feature.properties.observations.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500">No observations for this feature.</p>';
            return;
        }

        feature.properties.observations.forEach((obs, index) => {
            const obsDiv = document.createElement('div');
            obsDiv.className = 'p-3 border rounded-lg bg-gray-50';
            const contributor = App.state.data.contributors.find(c => c.name === obs.contributor);
            obsDiv.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold">${obs.observationType || 'General Observation'}</p>
                        <p class="text-sm text-gray-600">Severity: ${obs.severity}</p>
                        ${contributor ? `<p class="text-sm text-gray-600">By: ${contributor.name}</p>` : ''}
                    </div>
                    <div>
                        <button class="edit-obs-btn text-sm text-blue-600 hover:underline mr-2" data-index="${index}">Edit</button>
                        <button class="delete-obs-btn text-sm text-red-600 hover:underline" data-index="${index}">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(obsDiv);
        });

        container.querySelectorAll('.edit-obs-btn').forEach(btn => {
            btn.onclick = () => this.showObservationModal(feature, parseInt(btn.dataset.index));
        });
        container.querySelectorAll('.delete-obs-btn').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                App.UI.showConfirm('Delete Observation?', 'Are you sure you want to delete this observation?', () => {
                    feature.properties.observations.splice(index, 1);
                    this.renderObservationsList(feature, container);
                    App.Map.renderLayers();
                    App.Snapshot.render(feature);
                });
            };
        });
    },
    showObservationModal(feature, obsIndex = -1) {
        const isEditing = obsIndex > -1;
        const observation = isEditing ? feature.properties.observations[obsIndex] : {};
        const title = isEditing ? 'Edit Observation' : 'Add Observation';

        const contributorOptions = App.state.data.contributors.map(c => ({ label: `${c.name} (${c.role || 'N/A'})`, value: c.name }));
        contributorOptions.unshift({ label: 'None', value: '' });

        const fields = [
            { id: 'observationType', label: 'Observation Type (e.g., Stormwater, Waste)', value: observation.observationType || '', type: 'text' },
            { id: 'severity', label: 'Severity', value: observation.severity || 'Low', type: 'select', options: [{label:'Low',value:'Low'},{label:'Medium',value:'Medium'},{label:'High',value:'High'},{label:'Critical',value:'Critical'}] },
            { id: 'contributor', label: 'Observed By', value: observation.contributor || '', type: 'select', options: contributorOptions },
            { id: 'recommendation', label: 'Recommendation', value: observation.recommendation || '', type: 'quill' },
            { id: 'images', label: 'Images', value: observation.images || [], type: 'images' }
        ];

        App.UI.showPrompt(title, fields, (results) => {
            const newObservation = {
                id: observation.id || crypto.randomUUID(),
                ...results
            };
            if (isEditing) {
                feature.properties.observations[obsIndex] = newObservation;
            } else {
                feature.properties.observations.push(newObservation);
            }
            // Re-render the list in the main edit modal
            this.renderObservationsList(feature, document.getElementById('observation-list'));
            App.Map.renderLayers();
            App.Snapshot.render(feature);
        }, 'observation-modal');
    },
    deleteFeature(featureToDelete) {
        const existingPopup = document.querySelector('.deck-popup');
        if (existingPopup) existingPopup.remove();

        App.UI.showConfirm('Delete Feature', `Are you sure you want to delete "${featureToDelete.properties.Name || 'this feature'}"?`, () => {
            App.state.data.geojson.data.features = App.state.data.geojson.data.features.filter(f => f.properties._internalId !== featureToDelete.properties._internalId);
            document.getElementById('snapshot-container').innerHTML = '<p>Select a feature from the legend or map to view its details and a visual snapshot.</p>';
            App.Map.renderLayers();
        });
    },
    handleOverlayToggle(e) {
        if (e.name === 'Digital Surface Model' && App.state.dsmLegendControl) {
            if (e.type === 'overlayadd') App.state.dsmLegendControl.addTo(App.state.map);
            else App.state.map.removeControl(App.state.dsmLegendControl);
        }
    },
};

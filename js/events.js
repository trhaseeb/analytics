// Event handling
window.App = window.App || {};

App.Events = {
    init() {
        document.getElementById('logo-input').addEventListener('change', async e => { 
            if (e.target.files[0]) { 
                App.state.data.logo = await App.Utils.readFile(e.target.files[0], 'dataURL'); 
                document.getElementById('logo-img').src = App.state.data.logo; 
            } 
        });
        document.getElementById('logo-img').onclick = () => App.Events.showEditReportInfoModal();
        document.getElementById('open-geodata-modal-btn').onclick = () => App.UI.elements.geodataModal.classList.remove('hidden');
        document.getElementById('close-geodata-modal-btn').onclick = () => App.UI.elements.geodataModal.classList.add('hidden');
        document.getElementById('ortho-input').addEventListener('change', e => App.Data.handleRasterUpload(e, 'ortho'));
        document.getElementById('dsm-input').addEventListener('change', e => App.Data.handleRasterUpload(e, 'dsm'));
        document.getElementById('tileset-input').addEventListener('change', e => App.Data.handleTilesetUpload(e));
        document.getElementById('pointcloud-input').addEventListener('change', e => App.Data.handlePointCloudUpload(e));
        document.getElementById('dtm-input').addEventListener('change', e => App.Data.handleRasterUpload(e, 'dtm'));
        document.getElementById('import-project-input').addEventListener('change', e => App.ImportExport.importProjectOrFeatures(e));
        document.getElementById('export-project-btn').addEventListener('click', () => App.ImportExport.showExportDataModal()); 
        document.getElementById('add-category-btn').onclick = () => App.CategoryManager.addCategory();
        document.getElementById('export-categories-btn').onclick = () => App.ImportExport.exportCategories();
        document.getElementById('import-categories-input').addEventListener('change', e => App.ImportExport.importCategories(e));
        document.getElementById('add-contributor-btn').onclick = () => App.ContributorManager.addContributor();
        document.getElementById('show-only-with-observations-toggle').addEventListener('change', e => {
            App.state.showOnlyWithObservations = e.target.checked;
            App.Map.renderLayers();
        });
        App.UI.elements.defineBoundaryBtn.onclick = () => this.startBoundaryDraw();
        App.UI.elements.clearBoundaryBtn.onclick = () => App.Map.clearBoundary();

        document.getElementById('draw-polygon-btn').onclick = () => this.setEditingMode('drawPolygon');
        document.getElementById('draw-line-btn').onclick = () => this.setEditingMode('drawLine');
        document.getElementById('draw-marker-btn').onclick = () => this.setEditingMode('drawMarker');
        document.getElementById('split-polygon-btn').onclick = () => this.setEditingMode('splitPolygon');
        document.getElementById('rotate-feature-btn').onclick = () => this.setEditingMode('rotate');
        document.getElementById('finish-editing-btn').onclick = () => this.setEditingMode(null);

        document.getElementById('features-layer-toggle').onchange = (e) => this.toggleLayerVisibility('features', e.target.checked);
        document.getElementById('ortho-layer-toggle').onchange = (e) => this.toggleLayerVisibility('ortho', e.target.checked);
        document.getElementById('dsm-layer-toggle').onchange = (e) => this.toggleLayerVisibility('dsm', e.target.checked);
        document.getElementById('dtm-layer-toggle').onchange = (e) => this.toggleLayerVisibility('dtm', e.target.checked);

        document.getElementById('measure-distance-btn').onclick = () => this.setMeasurementMode('distance');
        document.getElementById('measure-area-btn').onclick = () => this.setMeasurementMode('area');
        document.getElementById('finish-measurement-btn').onclick = () => this.finishMeasurement();
        document.getElementById('rotation-slider').oninput = (e) => this.setMapRotation(e.target.value);
        document.getElementById('toggle-terrain-btn').onclick = () => this.toggleTerrain();
        document.getElementById('toggle-heatmap-btn').onclick = () => this.toggleHeatmap();
        document.getElementById('pointcloud-styling-select').onchange = (e) => this.setPointCloudStyling(e.target.value);

        document.getElementById('open-sidebar-btn').onclick = () => document.getElementById('sidebar').classList.remove('-translate-x-full');
        document.getElementById('close-sidebar-btn').onclick = () => document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('manage-categories-btn').onclick = () => document.getElementById('category-manager-panel').classList.remove('hidden');
        document.getElementById('close-category-manager-btn').onclick = () => document.getElementById('category-manager-panel').classList.add('hidden');
        document.getElementById('manage-contributors-btn').onclick = () => document.getElementById('contributor-manager-panel').classList.remove('hidden');
        document.getElementById('close-contributor-manager-btn').onclick = () => document.getElementById('contributor-manager-panel').classList.add('hidden');
    },

    toggleHeatmap() {
        App.state.heatmap = !App.state.heatmap;
        App.Map.renderLayers();
    },

    setPointCloudStyling(style) {
        App.state.pointCloudStyling = style;
        App.Map.renderLayers();
    },

    toggleTerrain() {
        App.state.terrain = !App.state.terrain;
        App.Map.renderLayers();
    },

    finishMeasurement() {
        const points = App.state.measurementPoints;
        const mode = App.state.measurementMode;
        let measurementText = '';

        if (mode === 'distance' && points.length >= 2) {
            const line = turf.lineString(points);
            const length = turf.length(line, { units: 'feet' });
            measurementText = `Measured Distance: ${length.toFixed(2)} ft`;
        } else if (mode === 'area' && points.length >= 3) {
            const polygon = turf.polygon([points.concat([points[0]])]);
            const area = turf.area(polygon) * 10.764; // sq meters to sq feet
            measurementText = `Measured Area: ${area.toFixed(2)} sq ft`;
        }

        if (measurementText) {
            App.UI.showMessage('Measurement Result', measurementText);
        }

        this.setMeasurementMode(null);
    },

    setMapRotation(bearing) {
        App.state.map.setProps({
            viewState: {
                ...App.state.map.props.viewState,
                bearing: Number(bearing),
                transitionDuration: 300
            }
        });
    },

    setMeasurementMode(mode) {
        App.state.measurementMode = mode;
        App.state.measurementPoints = [];
        App.Map.renderLayers();
        document.getElementById('finish-measurement-btn').classList.toggle('hidden', mode === null);
    },

    toggleLayerVisibility(layer, isVisible) {
        App.state.layerVisibility[layer] = isVisible;
        App.Map.renderLayers(); // This will need to be updated to render all layers
    },

    setEditingMode(mode) {
        App.state.editingMode = mode;
        App.Map.renderLayers();
        document.getElementById('finish-editing-btn').classList.toggle('hidden', mode === null);
    },

    startBoundaryDraw() {
        this.setEditingMode('drawPolygon');
        App.UI.showMessage('Define Boundary', 'Draw a polygon on the map to define the project boundary. Click the first point to finish.');
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
        const layer = App.state.featureIdToLayerMap.get(featureId);
        if (layer) {
            if (layer.getBounds) App.state.map.fitBounds(layer.getBounds(), { paddingTopLeft: [350, 20], paddingBottomRight: [20, 20], maxZoom: 19 });
            else if (layer.getLatLng) App.state.map.setView(layer.getLatLng(), Math.max(App.state.map.getZoom(), 18));
            if (layer.openPopup) layer.openPopup();
        }
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
        App.state.map.closePopup();
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
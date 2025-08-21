// Map management
window.App = window.App || {};

const { WebMercatorViewport, FlyToInterpolator } = deck;

App.Map = {
    init() {
        const { DeckGL, MapView } = deck;

        const deckgl = new DeckGL({
            container: 'map',
            mapStyle: 'mapbox://styles/mapbox/satellite-v9',
            initialViewState: {
                longitude: -95.3698,
                latitude: 29.7604,
                zoom: 12,
                pitch: 0,
                bearing: 0
            },
            controller: true,
            viewState: {
                transitionDuration: 1000,
                transitionInterpolator: new deck.FlyToInterpolator()
            },
            mapboxApiAccessToken: 'pk.eyJ1IjoiZGVmYXVsdC11c2VyIiwiYSI6ImNscjB4Z2t2bjFwZWMya3FzMHV2M3M3N2cifQ.50t0m5s-s2FSp3uLwH2nhQ', // Replace with your Mapbox access token

            onHover: ({object, x, y}) => {
                const tooltip = App.state.tooltip;
                if (object) {
                    const feature = object;
                    tooltip.style.left = `${x}px`;
                    tooltip.style.top = `${y}px`;
                    const hasObservations = feature.properties.observations && feature.properties.observations.length > 0;
                    let labelContent = '';
                    if (feature.properties.showLabel) {
                        labelContent += `<span>${feature.properties.Name}</span>`;
                    }
                    if (hasObservations) {
                        const highestSeverity = App.Utils.getHighestSeverity(feature.properties.observations);
                        const color = App.Utils.getColorForSeverity(highestSeverity);
                        const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="${color}" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.5));"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V7h2v7z"/></svg>`;
                        labelContent += iconSvg;
                    }
                    tooltip.innerHTML = labelContent;
                    tooltip.style.display = 'block';
                } else {
                    tooltip.style.display = 'none';
                }
            },

            onClick: ({object, x, y, coordinate}) => {
                if (App.state.measurementMode) {
                    App.state.measurementPoints.push(coordinate);
                    this.renderLayers();
                    return;
                }

                if (object) {
                    // Close any existing popups
                    const existingPopup = document.querySelector('.deck-popup');
                    if (existingPopup) existingPopup.remove();

                    App.Events.selectFeature(object.properties._internalId);
                    const popup = this._createPopup(object, x, y);
                    App.state.map.getCanvas().parentElement.appendChild(popup);
                } else {
                    // Close popup if clicking on the map
                    const existingPopup = document.querySelector('.deck-popup');
                    if (existingPopup) existingPopup.remove();
                }
            }
        });

        App.state.map = deckgl;

        // Add a tooltip element to the map container
        const tooltip = document.createElement('div');
        tooltip.className = 'deck-tooltip';
        deckgl.getCanvas().parentElement.appendChild(tooltip);
        App.state.tooltip = tooltip;
    },

    _createPopup(feature, x, y) {
        const popup = document.createElement('div');
        popup.className = 'deck-popup';
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;

        const hasObservations = feature.properties.observations && feature.properties.observations.length > 0;
        let observationBadge = hasObservations ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">Observation</span>` : '';

        let content = `<strong class="text-base">${observationBadge}${feature.properties.Name || 'Unnamed Feature'}</strong><div class="text-sm mt-1 prose max-w-none">${feature.properties.Description || ''}</div>`;
        
        if (hasObservations) {
            const obsSummary = feature.properties.observations.map(obs => `<li>${obs.observationType || 'General'} (${obs.severity})</li>`).join('');
            content += `<div class="text-sm mt-2"><strong class="font-medium">Observations:</strong><ul class="list-disc list-inside">${obsSummary}</ul></div>`;
        }

        popup.innerHTML = content;

        const buttons = document.createElement('div');
        buttons.className = 'mt-2 flex gap-2';

        const editBtn = document.createElement('button');
        editBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded';
        editBtn.innerText = 'Edit Props';
        editBtn.onclick = () => App.Events.editFeatureProperties(feature);
        buttons.appendChild(editBtn);

        const editShapeBtn = document.createElement('button');
        editShapeBtn.className = 'bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded';
        editShapeBtn.innerText = 'Edit Shape';
        editShapeBtn.onclick = () => App.Events.editFeatureShape(feature);
        buttons.appendChild(editShapeBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'bg-red-500 hover:red-600 text-white text-xs py-1 px-2 rounded';
        delBtn.innerText = 'Delete';
        delBtn.onclick = () => App.Events.deleteFeature(feature);
        buttons.appendChild(delBtn);

        popup.appendChild(buttons);

        const closeButton = document.createElement('button');
        closeButton.className = 'deck-popup-close-button';
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => popup.remove();
        popup.appendChild(closeButton);

        return popup;
    },

    renderLayers() {
        const layers = [];
        const { GeoJsonLayer, TerrainLayer } = deck;
        const { MaskExtension } = deck_extensions;

        if (App.state.heatmap) {
            const { HeatmapLayer } = deck_aggregation;
            const observationPoints = App.state.data.geojson.data.features.flatMap(f =>
                (f.properties.observations || []).map(o => ({
                    coordinates: f.geometry.coordinates,
                    severity: o.severity
                }))
            );
            const weights = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 };

            layers.push(new HeatmapLayer({
                id: 'heatmap-layer',
                data: observationPoints,
                getPosition: d => d.coordinates,
                getWeight: d => weights[d.severity] || 1,
                radiusPixels: 60,
                intensity: 1,
                threshold: 0.03
            }));
        }

        if (App.state.terrain) {
            layers.push(new TerrainLayer({
                id: 'terrain-layer',
                minZoom: 0,
                maxZoom: 19,
                strategy: 'no-overlap',
                elevationDecoder: {
                    rScaler: 6553.6,
                    gScaler: 25.6,
                    bScaler: 0.1,
                    offset: -10000
                },
                elevationData: `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=${App.state.map.props.mapboxApiAccessToken}`,
                texture: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${App.state.map.props.mapboxApiAccessToken}`,
                wireframe: false,
                color: [255, 255, 255]
            }));
        }

        // Render raster layers first, so they appear underneath the vector features
        this._renderRasterLayers(layers);

        if (App.state.measurementMode && App.state.measurementPoints.length > 0) {
            this._renderMeasurementLayer(layers);
        }

        if (App.state.projectBoundary.geojson) {
            layers.push(new GeoJsonLayer({
                id: 'boundary-layer',
                data: App.state.projectBoundary.geojson,
                stroked: true,
                filled: false,
                getLineColor: [239, 68, 68, 255],
                getLineWidth: 3,
                getLineDashArray: [10, 5]
            }));
        }

        if (App.state.layerVisibility.features) {
            this._renderPolylineDecorators(layers);
            const { EditableGeoJsonLayer, DrawPolygonMode, DrawLineStringMode, DrawPointMode, ModifyMode, SplitPolygonMode, RotateMode } = nebula;

            const featuresToRender = App.state.data.geojson.data.features.filter(f => {
                const isVisibleByCategory = App.state.categoryVisibility[f.properties.category] !== false;
                const matchesObservationFilter = !App.state.showOnlyWithObservations || (f.properties.observations && f.properties.observations.length > 0);
                return isVisibleByCategory && matchesObservationFilter;
            });

            let mode;
            switch (App.state.editingMode) {
                case 'drawPolygon':
                    mode = new DrawPolygonMode();
                    break;
                case 'drawLine':
                    mode = new DrawLineStringMode();
                    break;
                case 'drawMarker':
                    mode = new DrawPointMode();
                    break;
                case 'edit':
                    mode = new ModifyMode();
                    break;
            case 'splitPolygon':
                mode = new SplitPolygonMode();
                break;
            case 'rotate':
                mode = new RotateMode();
                break;
                default:
                    mode = null;
            }

            const editableLayer = new EditableGeoJsonLayer({
                id: 'geojson-layer',
                data: {
                    type: 'FeatureCollection',
                    features: featuresToRender
                },
                mode: mode,
                selectedFeatureIndexes: [],

                onEdit: ({ updatedData, editType, featureIndexes }) => {
                    if (editType === 'addFeature') {
                        const newFeature = updatedData.features[featureIndexes[0]];
                        App.Events.handleDrawNewFeature({
                            layer: { toGeoJSON: () => newFeature }
                        });
                    } else {
                        App.state.data.geojson.data.features = updatedData.features;
                        App.Map.renderLayers();
                    }
                },

                extensions: [new MaskExtension(), new deck_extensions.TerrainExtension()],
                maskId: 'boundary-layer',

                // Snapping
                enableSnapping: true,
                getSnapPoints: (p, { layer }) => {
                    const snapPoints = [];
                    const features = layer.props.data.features;
                    for (const feature of features) {
                        const coords = turf.getCoords(feature);
                        for (const coord of coords) {
                            if (Array.isArray(coord[0])) {
                                for (const c of coord) {
                                    snapPoints.push(c);
                                }
                            } else {
                                snapPoints.push(coord);
                            }
                        }
                    }
                    return snapPoints;
                },

                pickable: true,
                stroked: true,
                filled: true,
                pointType: 'circle',

                getFillColor: f => {
                    const style = App.CategoryManager.getCategoryStyleForFeature(f);
                    const color = chroma(style.fillColor || '#ff8c00').rgb();
                    return [color[0], color[1], color[2], (style.fillOpacity || 0.8) * 255];
                },
                getLineColor: f => {
                    const style = App.CategoryManager.getCategoryStyleForFeature(f);
                    const color = chroma(style.color || '#000000').rgb();
                    return [color[0], color[1], color[2], (style.opacity || 1) * 255];
                },
                getLineWidth: f => {
                    const style = App.CategoryManager.getCategoryStyleForFeature(f);
                    return style.weight || 1;
                },
                getPointRadius: f => {
                    const style = App.CategoryManager.getCategoryStyleForFeature(f);
                    return style.size ? style.size / 2 : 8;
                },
                updateTriggers: {
                    getFillColor: [App.state.data.categories, App.state.showOnlyWithObservations, App.state.categoryVisibility],
                    getLineColor: [App.state.data.categories, App.state.showOnlyWithObservations, App.state.categoryVisibility],
                    getLineWidth: [App.state.data.categories, App.state.showOnlyWithObservations, App.state.categoryVisibility],
                    getPointRadius: [App.state.data.categories, App.state.showOnlyWithObservations, App.state.categoryVisibility],
                }
            });
            layers.push(editableLayer);
        }

        App.state.map.setProps({ layers });
        App.Legend.render();
    },

    _renderRasterLayers(layers) {
        const { TileLayer, BitmapLayer, Tile3DLayer, PointCloudLayer } = deck;
        const { Tiles3DLoader, LASLoader } = loaders;

        if (App.state.data.tileset.url) {
            layers.push(new Tile3DLayer({
                id: 'tile-3d-layer',
                data: App.state.data.tileset.url,
                loader: Tiles3DLoader,
                onTilesetLoad: (tileset) => {
                    const { cartographicCenter, zoom } = tileset;
                    App.state.map.setProps({
                        initialViewState: {
                            ...App.state.map.props.initialViewState,
                            longitude: cartographicCenter[0],
                            latitude: cartographicCenter[1],
                            zoom: zoom
                        }
                    });
                }
            }));
        }

        if (App.state.data.pointcloud.data) {
            const styling = App.state.pointCloudStyling;
            const colorScheme = {
                classification: {
                    1: [150, 75, 0], // Unclassified
                    2: [139, 69, 19], // Ground
                    5: [255, 0, 0], // High Vegetation
                    6: [0, 0, 255], // Building
                },
                intensity: chroma.scale(['#fafa6e', '#2A4858']).domain([0, 65535]),
                elevation: chroma.scale(['#3b82f6', '#6ee7b7', '#fde047', '#f97316', '#ef4444']).domain([App.state.data.pointcloud.data.header.mins[2], App.state.data.pointcloud.data.header.maxs[2]])
            };

            layers.push(new PointCloudLayer({
                id: 'point-cloud-layer',
                data: App.state.data.pointcloud.data,
                getPositions: d => d.position,
                getColor: d => {
                    if (styling === 'classification') {
                        return colorScheme.classification[d.classification] || [255, 255, 255];
                    } else if (styling === 'intensity') {
                        return colorScheme.intensity(d.intensity).rgb();
                    } else if (styling === 'elevation') {
                        return colorScheme.elevation(d.position[2]).rgb();
                    }
                    return [255, 255, 255, 128];
                },
                pointSize: 1
            }));
            this._renderPointCloudLegend(styling, colorScheme);
        } else {
            this._renderPointCloudLegend(null);
        }

        if (App.state.layerVisibility.ortho && App.state.data.ortho.url) {
            layers.push(new TileLayer({
                id: 'ortho-layer',
                data: App.state.data.ortho.url,
                minZoom: 0,
                maxZoom: 19,
                tileSize: 256,
                extensions: [new deck_extensions.TerrainExtension()],
                renderSubLayers: props => {
                    const { west, south, east, north } = props.tile.bbox;
                    return new BitmapLayer(props, {
                        data: null,
                        image: props.data,
                        bounds: [west, south, east, north]
                    });
                }
            }));
        }
        if (App.state.layerVisibility.dsm && App.state.data.dsm.url) {
            layers.push(new TileLayer({
                id: 'dsm-layer',
                data: App.state.data.dsm.url,
                minZoom: 0,
                maxZoom: 19,
                tileSize: 256,
                extensions: [new deck_extensions.TerrainExtension()],
                renderSubLayers: props => {
                    const { west, south, east, north } = props.tile.bbox;
                    return new BitmapLayer(props, {
                        data: null,
                        image: props.data,
                        bounds: [west, south, east, north]
                    });
                }
            }));
        }
        if (App.state.layerVisibility.dtm && App.state.data.dtm.url) {
            layers.push(new TileLayer({
                id: 'dtm-layer',
                data: App.state.data.dtm.url,
                minZoom: 0,
                maxZoom: 19,
                tileSize: 256,
                extensions: [new deck_extensions.TerrainExtension()],
                renderSubLayers: props => {
                    const { west, south, east, north } = props.tile.bbox;
                    return new BitmapLayer(props, {
                        data: null,
                        image: props.data,
                        bounds: [west, south, east, north]
                    });
                }
            }));
        }
    },

    updateFeatureDecorator(layer) {
        // This will be implemented in a later step
    },

    bindFeatureInteractions(feature, layer) {
        // This will be implemented in a later step
    },

    setBoundary(boundaryGeoJSON, fitView = false) {
        App.state.projectBoundary.geojson = boundaryGeoJSON;
        this.renderLayers();

        if (fitView) {
            const { DeckGL, MapView } = deck;
            const [minX, minY, maxX, maxY] = turf.bbox(boundaryGeoJSON);
            const { longitude, latitude, zoom } = new WebMercatorViewport({
                width: App.state.map.width,
                height: App.state.map.height
            }).fitBounds([[minX, minY], [maxX, maxY]], { padding: 20 });

            App.state.map.setProps({
                viewState: {
                    ...App.state.map.props.viewState,
                    longitude,
                    latitude,
                    zoom,
                    transitionDuration: 1000,
                    transitionInterpolator: new FlyToInterpolator()
                }
            });
        }
        
        App.UI.elements.defineBoundaryBtn.classList.add('hidden');
        App.UI.elements.clearBoundaryBtn.classList.remove('hidden');
    },

    clearBoundary() {
        App.state.projectBoundary.geojson = null;
        this.renderLayers();
        App.UI.elements.defineBoundaryBtn.classList.remove('hidden');
        App.UI.elements.clearBoundaryBtn.classList.add('hidden');
    },

    _renderPointCloudLegend(styling, colorScheme) {
        const existingLegend = document.querySelector('.pointcloud-legend');
        if (existingLegend) existingLegend.remove();

        if (!styling || styling === 'none') return;

        const div = document.createElement('div');
        div.className = 'pointcloud-legend absolute bottom-2 left-2 bg-white p-2 rounded shadow-lg z-10';
        
        let legendHtml = `<div class="font-bold mb-2">Point Cloud Legend</div>`;

        if (styling === 'classification') {
            legendHtml += '<ul>';
            for (const key in colorScheme.classification) {
                const color = colorScheme.classification[key];
                legendHtml += `<li><span style="background-color: rgb(${color[0]},${color[1]},${color[2]})" class="inline-block w-4 h-4 mr-2"></span>Classification ${key}</li>`;
            }
            legendHtml += '</ul>';
        } else if (styling === 'intensity' || styling === 'elevation') {
            const scale = colorScheme[styling];
            const gradientStyle = `linear-gradient(to top, ${scale.colors(10).join(',')})`;
            legendHtml += `<div class="flex"><div class="dsm-legend-gradient" style="background: ${gradientStyle};"></div><div class="dsm-legend-labels ml-1">${[...Array(6)].map((_, i) => { const value = scale.domain()[0] + (i / 5) * (scale.domain()[1] - scale.domain()[0]); return `<span style="top: ${100 - (i/5)*100}%;">${value.toFixed(1)}</span>`; }).join('')}</div></div>`;
        }

        div.innerHTML = legendHtml;
        App.state.map.getCanvas().parentElement.appendChild(div);
    },

    _renderPolylineDecorators(layers) {
        const { IconLayer } = deck;
        const arrowData = [];

        App.state.data.geojson.data.features.forEach(feature => {
            const style = App.CategoryManager.getCategoryStyleForFeature(feature);
            if (feature.geometry.type === 'LineString' && style.linePattern === 'arrows') {
                const line = feature.geometry.coordinates;
                const length = turf.length(feature, { units: 'meters' });
                const spacing = (style.lineSpacing || 10) * 5; // Adjust spacing
                for (let i = spacing; i < length; i += spacing) {
                    const point = turf.along(feature, i, { units: 'meters' });
                    const bearing = turf.bearing(
                        turf.along(feature, i - 1, { units: 'meters' }),
                        point
                    );
                    arrowData.push({
                        position: point.geometry.coordinates,
                        angle: -bearing + 90,
                        color: chroma(style.color || '#000000').rgb()
                    });
                }
            }
        });

        if (arrowData.length > 0) {
            layers.push(new IconLayer({
                id: 'arrow-decorator-layer',
                data: arrowData,
                iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
                iconMapping: {
                    marker: { x: 0, y: 0, width: 128, height: 128, mask: true }
                },
                getIcon: d => 'marker',
                sizeScale: 15,
                getPosition: d => d.position,
                getSize: d => 5,
                getColor: d => d.color,
                getAngle: d => d.angle,
            }));
        }
    },

    _renderMeasurementLayer(layers) {
        const { GeoJsonLayer, TextLayer, PathLayer } = deck;
        const points = App.state.measurementPoints;
        let measurementText = '';

        if (App.state.measurementMode === 'distance' && points.length >= 2) {
            const line = turf.lineString(points);
            const length = turf.length(line, { units: 'feet' });
            measurementText = `${length.toFixed(2)} ft`;
            layers.push(new PathLayer({
                id: 'measurement-path-layer',
                data: [{ path: points }],
                getPath: d => d.path,
                getColor: [255, 255, 0, 255],
                getWidth: 3
            }));
        } else if (App.state.measurementMode === 'area' && points.length >= 3) {
            const polygon = turf.polygon([points.concat([points[0]])]);
            const area = turf.area(polygon) * 10.764; // sq meters to sq feet
            measurementText = `${area.toFixed(2)} sq ft`;
            layers.push(new GeoJsonLayer({
                id: 'measurement-area-layer',
                data: polygon,
                getFillColor: [255, 255, 0, 100],
                getLineColor: [255, 255, 0, 255],
                getLineWidth: 3
            }));
        }

        if (measurementText) {
            layers.push(new TextLayer({
                id: 'measurement-text-layer',
                data: [{ position: points[points.length - 1], text: measurementText }],
                getPosition: d => d.position,
                getText: d => d.text,
                getSize: 16,
                getColor: [255, 255, 255, 255],
                getBackgroundColor: [0, 0, 0, 128],
                getPixelOffset: [10, 0]
            }));
        }
    },
};

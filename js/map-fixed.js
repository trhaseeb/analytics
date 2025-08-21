// Map management with MapLibre integration
window.App = window.App || {};

const { WebMercatorViewport, FlyToInterpolator } = deck;
const { TerrainExtension } = deck;

App.Map = {
    async init() {
        try {
            // Initialize MapLibre-based map controller
            await App.MapController.init();
            
            // Set up deck.gl overlay with MapLibre integration
            this.initializeDeckGLOverlay();
            
            App.UI.showMessage('Success', 'Map initialized successfully');
        } catch (error) {
            console.error('Map initialization failed:', error);
            if (App.ErrorHandler) {
                App.ErrorHandler.handleError({
                    type: 'map',
                    message: `Map initialization failed: ${error.message}`,
                    timestamp: new Date().toISOString()
                });
            }
        }
    },

    initializeDeckGLOverlay() {
        if (!App.state.deckgl) {
            console.warn('Deck.GL not available, using fallback');
            return;
        }

        // Set up event handlers for deck.gl
        this.onHover = ({object, x, y}) => {
            const tooltip = App.state.tooltip;
            if (!tooltip) return;

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
                    const highestSeverity = App.Utils?.getHighestSeverity(feature.properties.observations) || 'Low';
                    const color = App.Utils?.getColorForSeverity(highestSeverity) || '#fbbf24';
                    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="${color}" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.5));"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V7h2v7z"/></svg>`;
                    labelContent += iconSvg;
                }
                tooltip.innerHTML = labelContent;
                tooltip.style.display = 'block';
            } else {
                tooltip.style.display = 'none';
            }
        };

        this.onClick = ({object, x, y, coordinate}) => {
            if (App.state.measurementMode) {
                App.state.measurementPoints = App.state.measurementPoints || [];
                App.state.measurementPoints.push(coordinate);
                this.renderLayers();
                return;
            }

            if (object) {
                // Close any existing popups
                const existingPopup = document.querySelector('.deck-popup');
                if (existingPopup) existingPopup.remove();

                if (App.Events?.selectFeature) {
                    App.Events.selectFeature(object.properties._internalId);
                }
                const popup = this._createPopup(object, x, y);
                App.state.deckgl.getCanvas().parentElement.appendChild(popup);
            } else {
                // Close popup if clicking on the map
                const existingPopup = document.querySelector('.deck-popup');
                if (existingPopup) existingPopup.remove();
            }
        };

        // Update deck.gl with event handlers
        App.state.deckgl.setProps({
            onHover: this.onHover,
            onClick: this.onClick
        });

        // Add a tooltip element to the map container
        if (!App.state.tooltip) {
            const tooltip = document.createElement('div');
            tooltip.className = 'deck-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                z-index: 1000;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                display: none;
                max-width: 200px;
            `;
            App.state.deckgl.getCanvas().parentElement.appendChild(tooltip);
            App.state.tooltip = tooltip;
        }
    },

    _createPopup(feature, x, y) {
        const popup = document.createElement('div');
        popup.className = 'deck-popup';
        popup.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            max-width: 300px;
            color: black;
        `;

        const properties = feature.properties || {};
        let content = `
            <div class="popup-header" style="margin-bottom: 12px;">
                <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${properties.Name || 'Feature'}</h3>
                ${properties.category ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">Category: ${properties.category}</div>` : ''}
            </div>
        `;

        if (properties.observations && properties.observations.length > 0) {
            content += `
                <div class="observations-section" style="margin-bottom: 12px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 14px;">Observations (${properties.observations.length})</h4>
                    <div style="max-height: 120px; overflow-y: auto;">
            `;
            
            properties.observations.forEach(obs => {
                const severityColor = this.getSeverityColor(obs.severity);
                content += `
                    <div style="margin-bottom: 8px; padding: 8px; background: #f9f9f9; border-radius: 4px; border-left: 3px solid ${severityColor};">
                        <div style="font-weight: bold; color: ${severityColor};">${obs.severity}</div>
                        <div style="font-size: 12px; margin-top: 2px;">${obs.description}</div>
                    </div>
                `;
            });
            
            content += '</div></div>';
        }

        // Add other properties
        const excludeProps = ['_internalId', 'Name', 'category', 'observations', 'showLabel'];
        const otherProps = Object.keys(properties).filter(key => !excludeProps.includes(key));
        
        if (otherProps.length > 0) {
            content += '<div class="properties-section"><h4 style="margin: 0 0 8px 0; font-size: 14px;">Properties</h4>';
            otherProps.forEach(key => {
                if (properties[key] !== null && properties[key] !== undefined && properties[key] !== '') {
                    content += `<div style="margin-bottom: 4px; font-size: 12px;"><strong>${key}:</strong> ${properties[key]}</div>`;
                }
            });
            content += '</div>';
        }

        // Add close button
        content += `
            <button onclick="this.parentElement.remove()" style="
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #999;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">&times;</button>
        `;

        popup.innerHTML = content;
        return popup;
    },

    getSeverityColor(severity) {
        const colors = {
            'Low': '#fbbf24',      // yellow
            'Medium': '#fb923c',   // orange  
            'High': '#ef4444',     // red
            'Critical': '#dc2626'  // dark red
        };
        return colors[severity] || '#6b7280';
    },

    renderLayers() {
        try {
            const layers = [];
            const { GeoJsonLayer, TerrainLayer, HeatmapLayer, ScatterplotLayer } = deck;
            const { MaskExtension } = deck;

            // Initialize state properties if they don't exist
            App.state.heatmap = App.state.heatmap || false;
            App.state.terrain = App.state.terrain || false;
            App.state.layerVisibility = App.state.layerVisibility || {
                features: true,
                ortho: true,
                dsm: false,
                dtm: false
            };
            App.state.measurementMode = App.state.measurementMode || null;
            App.state.measurementPoints = App.state.measurementPoints || [];
            App.state.projectBoundary = App.state.projectBoundary || { geojson: null };
            App.state.data = App.state.data || { geojson: { data: { features: [] } } };
            App.state.categoryVisibility = App.state.categoryVisibility || {};
            App.state.showOnlyWithObservations = App.state.showOnlyWithObservations || false;

            // Heatmap layer
            if (App.state.heatmap) {
                const observationPoints = App.state.data.geojson.data.features.flatMap(f =>
                    (f.properties.observations || []).map(o => ({
                        coordinates: f.geometry.type === 'Point' ? f.geometry.coordinates : 
                                   f.geometry.type === 'Polygon' ? this.getPolygonCenter(f.geometry.coordinates) :
                                   f.geometry.coordinates[0] || [0, 0],
                        severity: o.severity
                    }))
                );
                const weights = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 };

                if (observationPoints.length > 0) {
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
            }

            // Terrain layer - Updated to use MapTiler instead of Mapbox
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
                    elevationData: `https://cloud.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png`,
                    texture: `https://cloud.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg`,
                    wireframe: false,
                    color: [255, 255, 255]
                }));
            }

            // Render raster layers first
            this._renderRasterLayers(layers);

            // Measurement layer
            if (App.state.measurementMode && App.state.measurementPoints.length > 0) {
                this._renderMeasurementLayer(layers);
            }

            // Project boundary
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

            // Features layer
            if (App.state.layerVisibility.features) {
                this._renderPolylineDecorators(layers);
                
                const featuresToRender = App.state.data.geojson.data.features.filter(f => {
                    const isVisibleByCategory = App.state.categoryVisibility[f.properties.category] !== false;
                    const matchesObservationFilter = !App.state.showOnlyWithObservations || 
                        (f.properties.observations && f.properties.observations.length > 0);
                    return isVisibleByCategory && matchesObservationFilter;
                });

                if (featuresToRender.length > 0) {
                    layers.push(new GeoJsonLayer({
                        id: 'geojson-layer',
                        data: {
                            type: 'FeatureCollection',
                            features: featuresToRender
                        },
                        pickable: true,
                        stroked: true,
                        filled: true,
                        pointType: 'circle',
                        getFillColor: f => {
                            const style = App.CategoryManager?.getCategoryStyleForFeature(f) || 
                                         { fillColor: '#3b82f6', fillOpacity: 0.6 };
                            const color = this.parseColor(style.fillColor || style.color || '#3b82f6');
                            const opacity = Math.round((style.fillOpacity || 0.6) * 255);
                            return [...color, opacity];
                        },
                        getLineColor: f => {
                            const style = App.CategoryManager?.getCategoryStyleForFeature(f) || 
                                         { color: '#1e40af' };
                            return this.parseColor(style.color || '#1e40af');
                        },
                        getLineWidth: f => {
                            const style = App.CategoryManager?.getCategoryStyleForFeature(f) || 
                                         { weight: 2 };
                            return style.weight || 2;
                        },
                        getPointRadius: f => {
                            const style = App.CategoryManager?.getCategoryStyleForFeature(f) || 
                                         { radius: 5 };
                            return style.radius || 5;
                        }
                    }));
                }
            }

            // Update deck.gl layers
            if (App.state.deckgl) {
                App.state.deckgl.setProps({ layers });
            }

            // Update legend
            if (App.Legend?.render) {
                App.Legend.render();
            }
        } catch (error) {
            console.error('Error rendering layers:', error);
            if (App.ErrorHandler) {
                App.ErrorHandler.handleError({
                    type: 'render',
                    message: `Layer rendering failed: ${error.message}`,
                    timestamp: new Date().toISOString()
                });
            }
        }
    },

    _renderRasterLayers(layers) {
        // Placeholder for raster layer rendering
        // This would include orthophotos, DSM, DTM, etc.
        console.log('Rendering raster layers...');
    },

    _renderMeasurementLayer(layers) {
        const { GeoJsonLayer, TextLayer, PathLayer } = deck;
        const points = App.state.measurementPoints;
        let measurementText = '';

        if (App.state.measurementMode === 'distance' && points.length >= 2) {
            if (window.turf) {
                const line = turf.lineString(points);
                const length = turf.length(line, { units: 'feet' });
                measurementText = `${length.toFixed(2)} ft`;
            }
            
            layers.push(new PathLayer({
                id: 'measurement-path-layer',
                data: [{ path: points }],
                getPath: d => d.path,
                getColor: [255, 255, 0, 255],
                getWidth: 3
            }));
        } else if (App.state.measurementMode === 'area' && points.length >= 3) {
            if (window.turf) {
                const polygon = turf.polygon([points.concat([points[0]])]);
                const area = turf.area(polygon) * 10.764; // sq meters to sq feet
                measurementText = `${area.toFixed(2)} sq ft`;
            }
            
            layers.push(new GeoJsonLayer({
                id: 'measurement-area-layer',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [points.concat([points[0]])]
                    }
                },
                getFillColor: [255, 255, 0, 100],
                getLineColor: [255, 255, 0, 255],
                getLineWidth: 3
            }));
        }

        if (measurementText && points.length > 0) {
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

    _renderPolylineDecorators(layers) {
        // Placeholder for polyline decorators (arrows, etc.)
        console.log('Rendering polyline decorators...');
    },

    parseColor(colorString) {
        // Simple color parser - expand as needed
        if (colorString.startsWith('#')) {
            const hex = colorString.substring(1);
            if (hex.length === 3) {
                return [
                    parseInt(hex[0] + hex[0], 16),
                    parseInt(hex[1] + hex[1], 16),
                    parseInt(hex[2] + hex[2], 16)
                ];
            } else if (hex.length === 6) {
                return [
                    parseInt(hex.substring(0, 2), 16),
                    parseInt(hex.substring(2, 4), 16),
                    parseInt(hex.substring(4, 6), 16)
                ];
            }
        }
        // Default color
        return [59, 130, 246]; // blue
    },

    getPolygonCenter(coordinates) {
        // Simple centroid calculation
        if (!coordinates || !coordinates[0]) return [0, 0];
        
        const ring = coordinates[0];
        let x = 0, y = 0;
        
        for (let i = 0; i < ring.length - 1; i++) {
            x += ring[i][0];
            y += ring[i][1];
        }
        
        return [x / (ring.length - 1), y / (ring.length - 1)];
    },

    // Boundary management
    setBoundary(boundaryGeoJSON, fitView = false) {
        App.state.projectBoundary.geojson = boundaryGeoJSON;
        this.renderLayers();

        if (fitView && App.MapController) {
            try {
                if (window.turf) {
                    const bbox = turf.bbox(boundaryGeoJSON);
                    App.MapController.fitBounds([
                        [bbox[0], bbox[1]],
                        [bbox[2], bbox[3]]
                    ]);
                }
            } catch (error) {
                console.warn('Could not fit bounds:', error);
            }
        }
        
        if (App.UI?.elements?.defineBoundaryBtn) {
            App.UI.elements.defineBoundaryBtn.classList.add('hidden');
        }
        if (App.UI?.elements?.clearBoundaryBtn) {
            App.UI.elements.clearBoundaryBtn.classList.remove('hidden');
        }
    },

    clearBoundary() {
        App.state.projectBoundary.geojson = null;
        this.renderLayers();
        
        if (App.UI?.elements?.defineBoundaryBtn) {
            App.UI.elements.defineBoundaryBtn.classList.remove('hidden');
        }
        if (App.UI?.elements?.clearBoundaryBtn) {
            App.UI.elements.clearBoundaryBtn.classList.add('hidden');
        }
    }
};

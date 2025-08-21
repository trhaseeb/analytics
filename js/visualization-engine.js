// Enhanced Visualization Engine
window.App = window.App || {};

App.VisualizationEngine = {
    activeVisualizations: new Map(),
    animationFrameId: null,
    temporalData: null,
    animationState: {
        isPlaying: false,
        currentFrame: 0,
        totalFrames: 0,
        speed: 1
    },

    init() {
        this.setupVisualizationControls();
        this.initializeColorSchemes();
    },

    setupVisualizationControls() {
        // Add visualization controls to the UI
        const controlsContainer = document.getElementById('controls-container');
        if (!controlsContainer) return;

        const visualizationSection = document.createElement('div');
        visualizationSection.innerHTML = `
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-3">Visualization</h3>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Visualization Type</label>
                    <select id="visualization-type" class="w-full p-2 border rounded-md bg-gray-800 border-gray-600">
                        <option value="standard">Standard</option>
                        <option value="heatmap">Heatmap</option>
                        <option value="cluster">Cluster</option>
                        <option value="choropleth">Choropleth</option>
                        <option value="3d-extrusion">3D Extrusion</option>
                        <option value="temporal">Temporal Animation</option>
                    </select>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Color Scheme</label>
                    <select id="color-scheme" class="w-full p-2 border rounded-md bg-gray-800 border-gray-600">
                        <option value="viridis">Viridis</option>
                        <option value="plasma">Plasma</option>
                        <option value="magma">Magma</option>
                        <option value="inferno">Inferno</option>
                        <option value="turbo">Turbo</option>
                        <option value="categorical">Categorical</option>
                    </select>
                </div>

                <div class="mb-4" id="heatmap-controls" style="display: none;">
                    <label class="block text-sm font-medium mb-2">Heatmap Radius</label>
                    <input type="range" id="heatmap-radius" min="10" max="100" value="40" class="w-full">
                    <span class="text-sm text-gray-400" id="heatmap-radius-value">40px</span>
                </div>

                <div class="mb-4" id="cluster-controls" style="display: none;">
                    <label class="block text-sm font-medium mb-2">Cluster Radius</label>
                    <input type="range" id="cluster-radius" min="20" max="200" value="80" class="w-full">
                    <span class="text-sm text-gray-400" id="cluster-radius-value">80px</span>
                </div>

                <div class="mb-4" id="extrusion-controls" style="display: none;">
                    <label class="block text-sm font-medium mb-2">Extrusion Scale</label>
                    <input type="range" id="extrusion-scale" min="1" max="1000" value="100" class="w-full">
                    <span class="text-sm text-gray-400" id="extrusion-scale-value">100</span>
                </div>

                <div class="mb-4" id="temporal-controls" style="display: none;">
                    <div class="mb-2">
                        <label class="block text-sm font-medium mb-1">Time Field</label>
                        <select id="temporal-field" class="w-full p-2 border rounded-md bg-gray-800 border-gray-600">
                            <option value="">Select time field...</option>
                        </select>
                    </div>
                    
                    <div class="mb-2">
                        <button id="temporal-play" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Play</button>
                        <button id="temporal-pause" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Pause</button>
                        <button id="temporal-reset" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Reset</button>
                    </div>
                    
                    <div class="mb-2">
                        <label class="block text-sm font-medium mb-1">Animation Speed</label>
                        <input type="range" id="temporal-speed" min="0.1" max="3" step="0.1" value="1" class="w-full">
                        <span class="text-sm text-gray-400" id="temporal-speed-value">1x</span>
                    </div>
                    
                    <div class="mb-2">
                        <label class="block text-sm font-medium mb-1">Current Frame</label>
                        <input type="range" id="temporal-frame" min="0" max="100" value="0" class="w-full">
                        <span class="text-sm text-gray-400" id="temporal-frame-value">0 / 0</span>
                    </div>
                </div>

                <div class="mb-4">
                    <button id="apply-visualization" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                        Apply Visualization
                    </button>
                </div>
            </div>
        `;

        controlsContainer.appendChild(visualizationSection);
        this.bindVisualizationEvents();
    },

    bindVisualizationEvents() {
        const visualizationType = document.getElementById('visualization-type');
        const applyBtn = document.getElementById('apply-visualization');
        
        visualizationType?.addEventListener('change', (e) => {
            this.showRelevantControls(e.target.value);
            this.updateTemporalFields();
        });

        applyBtn?.addEventListener('click', () => {
            this.applyVisualization();
        });

        // Heatmap controls
        const heatmapRadius = document.getElementById('heatmap-radius');
        heatmapRadius?.addEventListener('input', (e) => {
            document.getElementById('heatmap-radius-value').textContent = e.target.value + 'px';
        });

        // Cluster controls
        const clusterRadius = document.getElementById('cluster-radius');
        clusterRadius?.addEventListener('input', (e) => {
            document.getElementById('cluster-radius-value').textContent = e.target.value + 'px';
        });

        // Extrusion controls
        const extrusionScale = document.getElementById('extrusion-scale');
        extrusionScale?.addEventListener('input', (e) => {
            document.getElementById('extrusion-scale-value').textContent = e.target.value;
        });

        // Temporal controls
        const temporalPlay = document.getElementById('temporal-play');
        const temporalPause = document.getElementById('temporal-pause');
        const temporalReset = document.getElementById('temporal-reset');
        const temporalSpeed = document.getElementById('temporal-speed');
        const temporalFrame = document.getElementById('temporal-frame');

        temporalPlay?.addEventListener('click', () => this.playTemporalAnimation());
        temporalPause?.addEventListener('click', () => this.pauseTemporalAnimation());
        temporalReset?.addEventListener('click', () => this.resetTemporalAnimation());
        
        temporalSpeed?.addEventListener('input', (e) => {
            this.animationState.speed = parseFloat(e.target.value);
            document.getElementById('temporal-speed-value').textContent = e.target.value + 'x';
        });

        temporalFrame?.addEventListener('input', (e) => {
            this.animationState.currentFrame = parseInt(e.target.value);
            this.updateTemporalVisualization();
            document.getElementById('temporal-frame-value').textContent = 
                `${e.target.value} / ${this.animationState.totalFrames}`;
        });
    },

    showRelevantControls(type) {
        const controls = {
            'heatmap': 'heatmap-controls',
            'cluster': 'cluster-controls',
            '3d-extrusion': 'extrusion-controls',
            'temporal': 'temporal-controls'
        };

        // Hide all controls
        Object.values(controls).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });

        // Show relevant controls
        if (controls[type]) {
            const element = document.getElementById(controls[type]);
            if (element) element.style.display = 'block';
        }
    },

    updateTemporalFields() {
        const temporalField = document.getElementById('temporal-field');
        if (!temporalField) return;

        // Clear existing options
        temporalField.innerHTML = '<option value="">Select time field...</option>';

        // Get available fields from data
        const features = App.state.data.geojson.data?.features || [];
        if (features.length > 0) {
            const sampleProperties = features[0].properties || {};
            const timeFields = Object.keys(sampleProperties).filter(key => {
                // Look for fields that might contain dates or timestamps
                const value = sampleProperties[key];
                return typeof value === 'string' && (
                    key.toLowerCase().includes('date') ||
                    key.toLowerCase().includes('time') ||
                    key.toLowerCase().includes('timestamp') ||
                    !isNaN(Date.parse(value))
                );
            });

            timeFields.forEach(field => {
                const option = document.createElement('option');
                option.value = field;
                option.textContent = field;
                temporalField.appendChild(option);
            });
        }
    },

    initializeColorSchemes() {
        this.colorSchemes = {
            viridis: chroma.scale(['#440154', '#404387', '#2a788e', '#22a884', '#7ad151', '#fde725']),
            plasma: chroma.scale(['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921']),
            magma: chroma.scale(['#000004', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf']),
            inferno: chroma.scale(['#000004', '#420a68', '#932667', '#dd513a', '#fca50a', '#fcffa4']),
            turbo: chroma.scale(['#30123b', '#4777ef', '#1ac7c2', '#5dd54a', '#f2e41e', '#ca2a04']),
            categorical: chroma.scale(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'])
        };
    },

    applyVisualization() {
        const type = document.getElementById('visualization-type')?.value || 'standard';
        const colorScheme = document.getElementById('color-scheme')?.value || 'viridis';

        try {
            this.clearActiveVisualizations();

            switch (type) {
                case 'heatmap':
                    this.createHeatmapVisualization(colorScheme);
                    break;
                case 'cluster':
                    this.createClusterVisualization(colorScheme);
                    break;
                case 'choropleth':
                    this.createChoroplethVisualization(colorScheme);
                    break;
                case '3d-extrusion':
                    this.create3DExtrusionVisualization(colorScheme);
                    break;
                case 'temporal':
                    this.createTemporalVisualization(colorScheme);
                    break;
                default:
                    this.createStandardVisualization(colorScheme);
            }

            App.UI.showMessage('Success', `Applied ${type} visualization`);
        } catch (error) {
            console.error('Visualization error:', error);
            App.UI.showMessage('Error', `Failed to apply visualization: ${error.message}`);
        }
    },

    clearActiveVisualizations() {
        this.activeVisualizations.clear();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.animationState.isPlaying = false;
    },

    createHeatmapVisualization(colorScheme) {
        const { HeatmapLayer } = deck;
        const radius = parseInt(document.getElementById('heatmap-radius')?.value || 40);
        
        const features = App.state.data.geojson.data?.features || [];
        const pointData = features
            .filter(f => f.geometry.type === 'Point')
            .map(f => ({
                position: f.geometry.coordinates,
                weight: this.getFeatureWeight(f)
            }));

        if (pointData.length === 0) {
            throw new Error('No point features found for heatmap visualization');
        }

        const heatmapLayer = new HeatmapLayer({
            id: 'heatmap-visualization',
            data: pointData,
            getPosition: d => d.position,
            getWeight: d => d.weight,
            radiusPixels: radius,
            intensity: 1,
            threshold: 0.03,
            colorRange: this.getColorRange(colorScheme, 6)
        });

        this.activeVisualizations.set('heatmap', heatmapLayer);
        this.updateMapLayers();
    },

    createClusterVisualization(colorScheme) {
        // Implement clustering logic using supercluster or similar
        const features = App.state.data.geojson.data?.features || [];
        const pointFeatures = features.filter(f => f.geometry.type === 'Point');
        
        if (pointFeatures.length === 0) {
            throw new Error('No point features found for cluster visualization');
        }

        // Simple clustering implementation
        const clusters = this.performClustering(pointFeatures);
        
        const { ScatterplotLayer, TextLayer } = deck;
        const radius = parseInt(document.getElementById('cluster-radius')?.value || 80);

        const clusterLayer = new ScatterplotLayer({
            id: 'cluster-visualization',
            data: clusters,
            getPosition: d => d.coordinates,
            getRadius: d => Math.sqrt(d.count) * 10,
            getFillColor: d => this.getClusterColor(d.count, colorScheme),
            pickable: true,
            radiusScale: 1,
            radiusMinPixels: 10,
            radiusMaxPixels: radius
        });

        const labelLayer = new TextLayer({
            id: 'cluster-labels',
            data: clusters.filter(d => d.count > 1),
            getPosition: d => d.coordinates,
            getText: d => d.count.toString(),
            getSize: 12,
            getColor: [255, 255, 255],
            getBackgroundColor: [0, 0, 0, 128]
        });

        this.activeVisualizations.set('cluster', clusterLayer);
        this.activeVisualizations.set('cluster-labels', labelLayer);
        this.updateMapLayers();
    },

    createChoroplethVisualization(colorScheme) {
        const { GeoJsonLayer } = deck;
        const features = App.state.data.geojson.data?.features || [];
        const polygonFeatures = features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
        
        if (polygonFeatures.length === 0) {
            throw new Error('No polygon features found for choropleth visualization');
        }

        // Get numeric property for choropleth
        const numericProperty = this.findNumericProperty(polygonFeatures);
        if (!numericProperty) {
            throw new Error('No numeric property found for choropleth visualization');
        }

        const values = polygonFeatures.map(f => parseFloat(f.properties[numericProperty])).filter(v => !isNaN(v));
        const min = Math.min(...values);
        const max = Math.max(...values);
        const colorScale = this.colorSchemes[colorScheme].domain([min, max]);

        const choroplethLayer = new GeoJsonLayer({
            id: 'choropleth-visualization',
            data: {
                type: 'FeatureCollection',
                features: polygonFeatures
            },
            filled: true,
            stroked: true,
            getFillColor: f => {
                const value = parseFloat(f.properties[numericProperty]);
                return isNaN(value) ? [128, 128, 128, 128] : colorScale(value).rgb();
            },
            getLineColor: [255, 255, 255, 100],
            getLineWidth: 1,
            pickable: true
        });

        this.activeVisualizations.set('choropleth', choroplethLayer);
        this.updateMapLayers();
        this.createChoroplethLegend(numericProperty, min, max, colorScale);
    },

    create3DExtrusionVisualization(colorScheme) {
        const { GeoJsonLayer } = deck;
        const features = App.state.data.geojson.data?.features || [];
        const polygonFeatures = features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
        
        if (polygonFeatures.length === 0) {
            throw new Error('No polygon features found for 3D extrusion visualization');
        }

        const numericProperty = this.findNumericProperty(polygonFeatures);
        if (!numericProperty) {
            throw new Error('No numeric property found for 3D extrusion visualization');
        }

        const scale = parseInt(document.getElementById('extrusion-scale')?.value || 100);
        const values = polygonFeatures.map(f => parseFloat(f.properties[numericProperty])).filter(v => !isNaN(v));
        const min = Math.min(...values);
        const max = Math.max(...values);
        const colorScale = this.colorSchemes[colorScheme].domain([min, max]);

        const extrusionLayer = new GeoJsonLayer({
            id: '3d-extrusion-visualization',
            data: {
                type: 'FeatureCollection',
                features: polygonFeatures
            },
            filled: true,
            extruded: true,
            getFillColor: f => {
                const value = parseFloat(f.properties[numericProperty]);
                return isNaN(value) ? [128, 128, 128, 200] : [...colorScale(value).rgb(), 200];
            },
            getElevation: f => {
                const value = parseFloat(f.properties[numericProperty]);
                return isNaN(value) ? 0 : ((value - min) / (max - min)) * scale;
            },
            getLineColor: [255, 255, 255, 100],
            getLineWidth: 1,
            pickable: true
        });

        this.activeVisualizations.set('3d-extrusion', extrusionLayer);
        this.updateMapLayers();
    },

    createTemporalVisualization(colorScheme) {
        const temporalField = document.getElementById('temporal-field')?.value;
        if (!temporalField) {
            throw new Error('Please select a time field for temporal visualization');
        }

        const features = App.state.data.geojson.data?.features || [];
        
        // Parse and sort features by time
        this.temporalData = features
            .map(f => ({
                ...f,
                timestamp: new Date(f.properties[temporalField]).getTime()
            }))
            .filter(f => !isNaN(f.timestamp))
            .sort((a, b) => a.timestamp - b.timestamp);

        if (this.temporalData.length === 0) {
            throw new Error('No valid temporal data found');
        }

        // Set up animation parameters
        this.animationState.totalFrames = Math.min(this.temporalData.length, 100);
        this.animationState.currentFrame = 0;
        
        document.getElementById('temporal-frame').max = this.animationState.totalFrames - 1;
        document.getElementById('temporal-frame-value').textContent = `0 / ${this.animationState.totalFrames}`;

        this.updateTemporalVisualization();
    },

    updateTemporalVisualization() {
        if (!this.temporalData) return;

        const { ScatterplotLayer } = deck;
        const currentIndex = Math.floor((this.animationState.currentFrame / this.animationState.totalFrames) * this.temporalData.length);
        const visibleFeatures = this.temporalData.slice(0, currentIndex);

        const temporalLayer = new ScatterplotLayer({
            id: 'temporal-visualization',
            data: visibleFeatures,
            getPosition: f => f.geometry.coordinates,
            getRadius: 100,
            getFillColor: f => {
                const age = currentIndex - this.temporalData.indexOf(f);
                const opacity = Math.max(50, 255 - (age * 5));
                return [255, 100, 100, opacity];
            },
            pickable: true
        });

        this.activeVisualizations.set('temporal', temporalLayer);
        this.updateMapLayers();
    },

    createStandardVisualization(colorScheme) {
        // Fallback to standard rendering
        if (App.Map && App.Map.renderLayers) {
            App.Map.renderLayers();
        }
    },

    playTemporalAnimation() {
        if (!this.temporalData) return;

        this.animationState.isPlaying = true;
        
        const animate = () => {
            if (!this.animationState.isPlaying) return;

            this.animationState.currentFrame += this.animationState.speed;
            
            if (this.animationState.currentFrame >= this.animationState.totalFrames) {
                this.animationState.currentFrame = 0;
            }

            document.getElementById('temporal-frame').value = Math.floor(this.animationState.currentFrame);
            document.getElementById('temporal-frame-value').textContent = 
                `${Math.floor(this.animationState.currentFrame)} / ${this.animationState.totalFrames}`;

            this.updateTemporalVisualization();
            this.animationFrameId = requestAnimationFrame(animate);
        };

        animate();
    },

    pauseTemporalAnimation() {
        this.animationState.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    },

    resetTemporalAnimation() {
        this.pauseTemporalAnimation();
        this.animationState.currentFrame = 0;
        document.getElementById('temporal-frame').value = 0;
        document.getElementById('temporal-frame-value').textContent = `0 / ${this.animationState.totalFrames}`;
        this.updateTemporalVisualization();
    },

    updateMapLayers() {
        if (App.state.deckgl) {
            const layers = Array.from(this.activeVisualizations.values());
            App.state.deckgl.setProps({ layers });
        }
    },

    getFeatureWeight(feature) {
        // Try to find a numeric property to use as weight
        const props = feature.properties || {};
        const numericProps = Object.keys(props).filter(key => {
            const value = props[key];
            return typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
        });

        if (numericProps.length > 0) {
            return Math.abs(parseFloat(props[numericProps[0]])) || 1;
        }
        
        return 1;
    },

    findNumericProperty(features) {
        if (features.length === 0) return null;

        const sampleProps = features[0].properties || {};
        return Object.keys(sampleProps).find(key => {
            const value = sampleProps[key];
            return typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
        });
    },

    performClustering(features) {
        // Simple grid-based clustering
        const gridSize = 0.01; // Degrees
        const clusters = new Map();

        features.forEach(feature => {
            const [lon, lat] = feature.geometry.coordinates;
            const gridX = Math.floor(lon / gridSize) * gridSize;
            const gridY = Math.floor(lat / gridSize) * gridSize;
            const key = `${gridX},${gridY}`;

            if (!clusters.has(key)) {
                clusters.set(key, {
                    coordinates: [gridX + gridSize/2, gridY + gridSize/2],
                    count: 0,
                    features: []
                });
            }

            const cluster = clusters.get(key);
            cluster.count++;
            cluster.features.push(feature);
        });

        return Array.from(clusters.values());
    },

    getClusterColor(count, colorScheme) {
        const maxCount = 20;
        const intensity = Math.min(count / maxCount, 1);
        return this.colorSchemes[colorScheme](intensity).rgb();
    },

    getColorRange(colorScheme, steps = 6) {
        const colors = [];
        for (let i = 0; i < steps; i++) {
            const intensity = i / (steps - 1);
            colors.push(this.colorSchemes[colorScheme](intensity).rgb());
        }
        return colors;
    },

    createChoroplethLegend(property, min, max, colorScale) {
        const legendContainer = document.getElementById('legend-content');
        if (!legendContainer) return;

        const legendDiv = document.createElement('div');
        legendDiv.innerHTML = `
            <div class="mb-4">
                <h4 class="font-semibold mb-2">Choropleth: ${property}</h4>
                <div class="flex items-center justify-between text-sm mb-2">
                    <span>${min.toFixed(2)}</span>
                    <span>${max.toFixed(2)}</span>
                </div>
                <div class="h-4 rounded" style="background: linear-gradient(to right, ${this.createGradientString(colorScale, 10)})"></div>
            </div>
        `;

        legendContainer.appendChild(legendDiv);
    },

    createGradientString(colorScale, steps) {
        const colors = [];
        for (let i = 0; i < steps; i++) {
            const intensity = i / (steps - 1);
            colors.push(colorScale(intensity).hex());
        }
        return colors.join(', ');
    }
};

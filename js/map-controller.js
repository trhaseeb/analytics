// MapLibre Map Controller with Error Handling
window.App = window.App || {};

App.MapController = {
    map: null,
    fallbackInitialized: false,
    initializationAttempts: 0,
    maxInitializationAttempts: 3,

    async init() {
        try {
            await this.initializeMapLibre();
        } catch (error) {
            console.error('MapLibre initialization failed:', error);
            await this.initializeFallback();
        }
    },

    async initializeMapLibre() {
        this.initializationAttempts++;
        
        if (!window.maplibregl) {
            throw new Error('MapLibre GL JS not loaded');
        }

        const mapConfig = {
            container: 'map',
            style: {
                version: 8,
                sources: {
                    'satellite': {
                        type: 'raster',
                        tiles: [
                            'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
                        ],
                        tileSize: 256,
                        attribution: '© MapTiler © OpenStreetMap contributors'
                    },
                    'osm': {
                        type: 'raster',
                        tiles: [
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                        ],
                        tileSize: 256,
                        attribution: '© OpenStreetMap contributors'
                    }
                },
                layers: [
                    {
                        id: 'satellite-layer',
                        type: 'raster',
                        source: 'satellite',
                        minzoom: 0,
                        maxzoom: 22
                    }
                ]
            },
            center: [-95.3698, 29.7604],
            zoom: 12,
            pitch: 0,
            bearing: 0,
            antialias: true,
            preserveDrawingBuffer: true
        };

        try {
            this.map = new maplibregl.Map(mapConfig);
            
            this.map.on('load', () => {
                console.log('MapLibre map loaded successfully');
                this.addMapControls();
                this.setupEventHandlers();
                App.state.map = this.map;
                
                // Initialize deck.gl overlay
                this.initializeDeckGLOverlay();
            });

            this.map.on('error', (e) => {
                console.error('MapLibre error:', e);
                if (this.initializationAttempts < this.maxInitializationAttempts) {
                    setTimeout(() => this.initializeMapLibre(), 2000);
                } else {
                    this.initializeFallback();
                }
            });

            return this.map;
        } catch (error) {
            console.error('MapLibre initialization error:', error);
            throw error;
        }
    },

    initializeDeckGLOverlay() {
        if (!window.deck) {
            console.error('Deck.GL not available');
            return;
        }

        const { DeckGL, MapView } = deck;
        const { WebMercatorViewport, FlyToInterpolator } = deck;

        // Create deck.gl overlay that uses MapLibre as base map
        const deckgl = new DeckGL({
            canvas: 'deck-canvas',
            width: '100%',
            height: '100%',
            initialViewState: {
                longitude: -95.3698,
                latitude: 29.7604,
                zoom: 12,
                pitch: 0,
                bearing: 0
            },
            controller: true,
            onViewStateChange: ({viewState}) => {
                // Sync MapLibre view with deck.gl
                this.map.jumpTo({
                    center: [viewState.longitude, viewState.latitude],
                    zoom: viewState.zoom,
                    bearing: viewState.bearing,
                    pitch: viewState.pitch
                });
            },
            onHover: App.Map.onHover,
            onClick: App.Map.onClick
        });

        // Sync deck.gl view with MapLibre
        this.map.on('move', () => {
            const center = this.map.getCenter();
            const zoom = this.map.getZoom();
            const bearing = this.map.getBearing();
            const pitch = this.map.getPitch();

            deckgl.setProps({
                viewState: {
                    longitude: center.lng,
                    latitude: center.lat,
                    zoom: zoom,
                    bearing: bearing,
                    pitch: pitch
                }
            });
        });

        App.state.deckgl = deckgl;
        return deckgl;
    },

    async initializeFallback() {
        if (this.fallbackInitialized) return;
        
        console.warn('Initializing fallback map without MapLibre');
        this.fallbackInitialized = true;

        // Simple canvas-based fallback
        const mapContainer = document.getElementById('map');
        mapContainer.innerHTML = `
            <div style="
                width: 100%; 
                height: 100%; 
                background: #2d3748; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                color: white;
                font-family: Inter, sans-serif;
            ">
                <div style="text-align: center;">
                    <h3>Map Loading Error</h3>
                    <p>Using fallback view. Some features may be limited.</p>
                    <button onclick="location.reload()" style="
                        background: #3182ce; 
                        color: white; 
                        border: none; 
                        padding: 8px 16px; 
                        border-radius: 4px; 
                        cursor: pointer;
                    ">Retry</button>
                </div>
            </div>
        `;

        // Initialize minimal deck.gl for data visualization
        if (window.deck) {
            this.initializeDeckGLFallback();
        }
    },

    initializeDeckGLFallback() {
        const { DeckGL } = deck;
        
        const deckgl = new DeckGL({
            container: 'map',
            initialViewState: {
                longitude: -95.3698,
                latitude: 29.7604,
                zoom: 12,
                pitch: 0,
                bearing: 0
            },
            controller: true,
            layers: []
        });

        App.state.deckgl = deckgl;
        App.state.map = {
            // Mock methods for compatibility
            setCenter: () => {},
            setZoom: () => {},
            setBearing: () => {},
            setPitch: () => {},
            fitBounds: () => {},
            getCenter: () => ({ lng: -95.3698, lat: 29.7604 }),
            getZoom: () => 12,
            getBearing: () => 0,
            getPitch: () => 0
        };
    },

    addMapControls() {
        if (!this.map) return;

        // Add navigation controls
        this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
        
        // Add fullscreen control
        this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');
        
        // Add scale control
        this.map.addControl(new maplibregl.ScaleControl({
            maxWidth: 100,
            unit: 'imperial'
        }), 'bottom-left');

        // Add geolocate control
        this.map.addControl(new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }), 'top-right');
    },

    setupEventHandlers() {
        if (!this.map) return;

        this.map.on('click', (e) => {
            App.Events.handleMapClick(e);
        });

        this.map.on('mousemove', (e) => {
            App.Events.handleMapMouseMove(e);
        });

        this.map.on('resize', () => {
            this.map.resize();
        });
    },

    // Utility methods for map operations
    flyTo(options) {
        if (this.map && this.map.flyTo) {
            this.map.flyTo(options);
        }
    },

    fitBounds(bounds, options = {}) {
        if (this.map && this.map.fitBounds) {
            this.map.fitBounds(bounds, { padding: 20, ...options });
        }
    },

    addLayer(layer) {
        if (this.map && this.map.addLayer) {
            try {
                this.map.addLayer(layer);
            } catch (error) {
                console.error('Error adding layer:', error);
            }
        }
    },

    removeLayer(layerId) {
        if (this.map && this.map.getLayer && this.map.removeLayer) {
            try {
                if (this.map.getLayer(layerId)) {
                    this.map.removeLayer(layerId);
                }
            } catch (error) {
                console.error('Error removing layer:', error);
            }
        }
    },

    addSource(sourceId, source) {
        if (this.map && this.map.addSource) {
            try {
                if (!this.map.getSource(sourceId)) {
                    this.map.addSource(sourceId, source);
                }
            } catch (error) {
                console.error('Error adding source:', error);
            }
        }
    },

    removeSource(sourceId) {
        if (this.map && this.map.getSource && this.map.removeSource) {
            try {
                if (this.map.getSource(sourceId)) {
                    this.map.removeSource(sourceId);
                }
            } catch (error) {
                console.error('Error removing source:', error);
            }
        }
    },

    // Base map style switching
    switchBaseMap(style) {
        const styles = {
            satellite: {
                version: 8,
                sources: {
                    'satellite': {
                        type: 'raster',
                        tiles: [
                            'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
                        ],
                        tileSize: 256
                    }
                },
                layers: [
                    {
                        id: 'satellite-layer',
                        type: 'raster',
                        source: 'satellite'
                    }
                ]
            },
            streets: {
                version: 8,
                sources: {
                    'osm': {
                        type: 'raster',
                        tiles: [
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                        ],
                        tileSize: 256
                    }
                },
                layers: [
                    {
                        id: 'osm-layer',
                        type: 'raster',
                        source: 'osm'
                    }
                ]
            },
            terrain: {
                version: 8,
                sources: {
                    'terrain': {
                        type: 'raster',
                        tiles: [
                            'https://api.maptiler.com/maps/terrain/{z}/{x}/{y}.jpg?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
                        ],
                        tileSize: 256
                    }
                },
                layers: [
                    {
                        id: 'terrain-layer',
                        type: 'raster',
                        source: 'terrain'
                    }
                ]
            }
        };

        if (this.map && styles[style]) {
            this.map.setStyle(styles[style]);
        }
    }
};

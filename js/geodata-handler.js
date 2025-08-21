// Enhanced GeoData Handler with Multiple Format Support
window.App = window.App || {};

App.GeoDataHandler = {
    supportedFormats: ['geojson', 'csv', 'kml', 'gpx', 'shapefile', 'topojson'],
    workers: new Map(),
    cache: new Map(),
    
    init() {
        this.initializeWorkers();
        this.setupEventListeners();
    },

    initializeWorkers() {
        // Create web workers for heavy data processing
        if (typeof Worker !== 'undefined') {
            try {
                // Create a simple worker for data processing
                const workerBlob = new Blob([`
                    self.onmessage = function(e) {
                        const { type, data, options } = e.data;
                        
                        try {
                            let result;
                            switch(type) {
                                case 'parseCSV':
                                    result = parseCSVData(data, options);
                                    break;
                                case 'processGeoJSON':
                                    result = processGeoJSONData(data, options);
                                    break;
                                case 'convertToGeoJSON':
                                    result = convertToGeoJSON(data, options);
                                    break;
                                default:
                                    throw new Error('Unknown worker task: ' + type);
                            }
                            
                            self.postMessage({ success: true, result });
                        } catch (error) {
                            self.postMessage({ success: false, error: error.message });
                        }
                    };
                    
                    function parseCSVData(csvText, options) {
                        const lines = csvText.split('\\n');
                        const headers = lines[0].split(',').map(h => h.trim());
                        const features = [];
                        
                        const latCol = options.latColumn || findColumn(headers, ['lat', 'latitude', 'y']);
                        const lonCol = options.lonColumn || findColumn(headers, ['lon', 'lng', 'longitude', 'x']);
                        
                        if (latCol === -1 || lonCol === -1) {
                            throw new Error('Could not find latitude/longitude columns');
                        }
                        
                        for (let i = 1; i < lines.length; i++) {
                            const values = lines[i].split(',');
                            if (values.length === headers.length) {
                                const lat = parseFloat(values[latCol]);
                                const lon = parseFloat(values[lonCol]);
                                
                                if (!isNaN(lat) && !isNaN(lon)) {
                                    const properties = {};
                                    headers.forEach((header, index) => {
                                        if (index !== latCol && index !== lonCol) {
                                            properties[header] = values[index].trim();
                                        }
                                    });
                                    
                                    features.push({
                                        type: 'Feature',
                                        geometry: {
                                            type: 'Point',
                                            coordinates: [lon, lat]
                                        },
                                        properties
                                    });
                                }
                            }
                        }
                        
                        return {
                            type: 'FeatureCollection',
                            features
                        };
                    }
                    
                    function findColumn(headers, possibleNames) {
                        for (let name of possibleNames) {
                            const index = headers.findIndex(h => 
                                h.toLowerCase().includes(name.toLowerCase())
                            );
                            if (index !== -1) return index;
                        }
                        return -1;
                    }
                    
                    function processGeoJSONData(geojson, options) {
                        // Add internal IDs and validate features
                        if (geojson.features) {
                            geojson.features.forEach((feature, index) => {
                                feature.properties = feature.properties || {};
                                feature.properties._internalId = feature.properties._internalId || 
                                    'feature_' + Date.now() + '_' + index;
                            });
                        }
                        return geojson;
                    }
                    
                    function convertToGeoJSON(data, options) {
                        // Convert various formats to GeoJSON
                        const { format } = options;
                        
                        switch(format) {
                            case 'csv':
                                return parseCSVData(data, options);
                            default:
                                throw new Error('Unsupported format: ' + format);
                        }
                    }
                `], { type: 'application/javascript' });

                const worker = new Worker(URL.createObjectURL(workerBlob));
                this.workers.set('dataProcessor', worker);
            } catch (error) {
                console.warn('Could not create web worker:', error);
            }
        }
    },

    setupEventListeners() {
        // Handle file drop events
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.addEventListener('dragover', this.handleDragOver.bind(this));
            mapContainer.addEventListener('drop', this.handleFileDrop.bind(this));
        }
    },

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    },

    async handleFileDrop(event) {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);
        
        for (const file of files) {
            try {
                await this.loadFile(file);
            } catch (error) {
                App.UI.showMessage('Error', `Failed to load ${file.name}: ${error.message}`);
            }
        }
    },

    async loadFile(file) {
        App.UI.showLoader(`Loading ${file.name}...`);
        
        try {
            const extension = file.name.split('.').pop().toLowerCase();
            const fileContent = await this.readFile(file);
            
            let geoData;
            switch (extension) {
                case 'json':
                case 'geojson':
                    geoData = await this.parseGeoJSON(fileContent);
                    break;
                case 'csv':
                    geoData = await this.parseCSV(fileContent);
                    break;
                case 'kml':
                    geoData = await this.parseKML(fileContent);
                    break;
                case 'gpx':
                    geoData = await this.parseGPX(fileContent);
                    break;
                case 'zip':
                    geoData = await this.parseShapefile(file);
                    break;
                default:
                    throw new Error(`Unsupported file format: ${extension}`);
            }

            // Process and load the data
            await this.processAndLoadGeoData(geoData, file.name);
            
        } catch (error) {
            console.error('Error loading file:', error);
            throw error;
        } finally {
            App.UI.hideLoader();
        }
    },

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },

    async parseGeoJSON(content) {
        try {
            const geojson = typeof content === 'string' ? JSON.parse(content) : content;
            
            // Validate GeoJSON structure
            if (!geojson.type || (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature')) {
                throw new Error('Invalid GeoJSON format');
            }

            // Convert single feature to FeatureCollection
            if (geojson.type === 'Feature') {
                return {
                    type: 'FeatureCollection',
                    features: [geojson]
                };
            }

            // Use worker for processing if available
            if (this.workers.has('dataProcessor')) {
                return await this.runWorkerTask('processGeoJSON', geojson);
            } else {
                // Process directly
                return this.processGeoJSONSync(geojson);
            }
        } catch (error) {
            throw new Error(`GeoJSON parsing failed: ${error.message}`);
        }
    },

    async parseCSV(content, options = {}) {
        try {
            if (this.workers.has('dataProcessor')) {
                return await this.runWorkerTask('parseCSV', content, options);
            } else {
                return this.parseCSVSync(content, options);
            }
        } catch (error) {
            throw new Error(`CSV parsing failed: ${error.message}`);
        }
    },

    async parseKML(content) {
        try {
            // Simple KML to GeoJSON conversion
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(content, 'text/xml');
            
            if (kmlDoc.getElementsByTagName('parsererror').length > 0) {
                throw new Error('Invalid KML format');
            }

            const features = [];
            const placemarks = kmlDoc.getElementsByTagName('Placemark');
            
            for (let i = 0; i < placemarks.length; i++) {
                const placemark = placemarks[i];
                const feature = this.parseKMLPlacemark(placemark);
                if (feature) features.push(feature);
            }

            return {
                type: 'FeatureCollection',
                features
            };
        } catch (error) {
            throw new Error(`KML parsing failed: ${error.message}`);
        }
    },

    parseKMLPlacemark(placemark) {
        const name = placemark.querySelector('name')?.textContent || '';
        const description = placemark.querySelector('description')?.textContent || '';
        
        // Parse coordinates from Point, LineString, or Polygon
        const point = placemark.querySelector('Point coordinates');
        const lineString = placemark.querySelector('LineString coordinates');
        const polygon = placemark.querySelector('Polygon outerBoundaryIs LinearRing coordinates');
        
        let geometry = null;
        
        if (point) {
            const coords = point.textContent.trim().split(',');
            geometry = {
                type: 'Point',
                coordinates: [parseFloat(coords[0]), parseFloat(coords[1])]
            };
        } else if (lineString) {
            const coordsText = lineString.textContent.trim();
            const coordinates = coordsText.split(/\s+/).map(coord => {
                const parts = coord.split(',');
                return [parseFloat(parts[0]), parseFloat(parts[1])];
            });
            geometry = {
                type: 'LineString',
                coordinates
            };
        } else if (polygon) {
            const coordsText = polygon.textContent.trim();
            const coordinates = coordsText.split(/\s+/).map(coord => {
                const parts = coord.split(',');
                return [parseFloat(parts[0]), parseFloat(parts[1])];
            });
            geometry = {
                type: 'Polygon',
                coordinates: [coordinates]
            };
        }
        
        if (geometry) {
            return {
                type: 'Feature',
                geometry,
                properties: {
                    name,
                    description,
                    _internalId: 'kml_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                }
            };
        }
        
        return null;
    },

    async parseGPX(content) {
        try {
            const parser = new DOMParser();
            const gpxDoc = parser.parseFromString(content, 'text/xml');
            
            if (gpxDoc.getElementsByTagName('parsererror').length > 0) {
                throw new Error('Invalid GPX format');
            }

            const features = [];
            
            // Parse waypoints
            const waypoints = gpxDoc.getElementsByTagName('wpt');
            for (let i = 0; i < waypoints.length; i++) {
                const wpt = waypoints[i];
                const lat = parseFloat(wpt.getAttribute('lat'));
                const lon = parseFloat(wpt.getAttribute('lon'));
                const name = wpt.querySelector('name')?.textContent || '';
                
                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [lon, lat]
                    },
                    properties: {
                        name,
                        type: 'waypoint',
                        _internalId: 'gpx_wpt_' + Date.now() + '_' + i
                    }
                });
            }
            
            // Parse tracks
            const tracks = gpxDoc.getElementsByTagName('trk');
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                const name = track.querySelector('name')?.textContent || `Track ${i + 1}`;
                const segments = track.getElementsByTagName('trkseg');
                
                for (let j = 0; j < segments.length; j++) {
                    const segment = segments[j];
                    const points = segment.getElementsByTagName('trkpt');
                    const coordinates = [];
                    
                    for (let k = 0; k < points.length; k++) {
                        const pt = points[k];
                        const lat = parseFloat(pt.getAttribute('lat'));
                        const lon = parseFloat(pt.getAttribute('lon'));
                        coordinates.push([lon, lat]);
                    }
                    
                    if (coordinates.length > 0) {
                        features.push({
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates
                            },
                            properties: {
                                name,
                                type: 'track',
                                _internalId: 'gpx_trk_' + Date.now() + '_' + i + '_' + j
                            }
                        });
                    }
                }
            }

            return {
                type: 'FeatureCollection',
                features
            };
        } catch (error) {
            throw new Error(`GPX parsing failed: ${error.message}`);
        }
    },

    async parseShapefile(file) {
        // Placeholder for shapefile parsing - would need additional library
        throw new Error('Shapefile parsing not yet implemented. Please convert to GeoJSON first.');
    },

    runWorkerTask(taskType, data, options = {}) {
        return new Promise((resolve, reject) => {
            const worker = this.workers.get('dataProcessor');
            if (!worker) {
                reject(new Error('Worker not available'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Worker task timeout'));
            }, 30000); // 30 second timeout

            worker.onmessage = (e) => {
                clearTimeout(timeout);
                if (e.data.success) {
                    resolve(e.data.result);
                } else {
                    reject(new Error(e.data.error));
                }
            };

            worker.postMessage({ type: taskType, data, options });
        });
    },

    processGeoJSONSync(geojson) {
        if (geojson.features) {
            geojson.features.forEach((feature, index) => {
                feature.properties = feature.properties || {};
                feature.properties._internalId = feature.properties._internalId || 
                    'feature_' + Date.now() + '_' + index;
            });
        }
        return geojson;
    },

    parseCSVSync(content, options = {}) {
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const features = [];
        
        const latCol = options.latColumn || this.findColumn(headers, ['lat', 'latitude', 'y']);
        const lonCol = options.lonColumn || this.findColumn(headers, ['lon', 'lng', 'longitude', 'x']);
        
        if (latCol === -1 || lonCol === -1) {
            throw new Error('Could not find latitude/longitude columns');
        }
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const lat = parseFloat(values[latCol]);
                const lon = parseFloat(values[lonCol]);
                
                if (!isNaN(lat) && !isNaN(lon)) {
                    const properties = {};
                    headers.forEach((header, index) => {
                        if (index !== latCol && index !== lonCol) {
                            properties[header] = values[index].trim();
                        }
                    });
                    
                    features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [lon, lat]
                        },
                        properties: {
                            ...properties,
                            _internalId: 'csv_' + Date.now() + '_' + i
                        }
                    });
                }
            }
        }
        
        return {
            type: 'FeatureCollection',
            features
        };
    },

    findColumn(headers, possibleNames) {
        for (let name of possibleNames) {
            const index = headers.findIndex(h => 
                h.toLowerCase().includes(name.toLowerCase())
            );
            if (index !== -1) return index;
        }
        return -1;
    },

    async processAndLoadGeoData(geoData, filename) {
        try {
            // Validate and process the data
            if (!geoData || !geoData.features || !Array.isArray(geoData.features)) {
                throw new Error('Invalid GeoJSON structure');
            }

            // Cache the data
            this.cache.set(filename, geoData);

            // Load into application
            App.state.data.geojson = {
                data: geoData,
                fileContent: JSON.stringify(geoData)
            };

            // Process and initialize features
            App.Data.processAndInitializeFeatures(geoData);

            // Update visualization
            App.CategoryManager.updateSvgPatternDefs();
            App.CategoryManager.render();
            
            // Render map layers
            if (App.Map && App.Map.renderLayers) {
                App.Map.renderLayers();
            }

            // Fit map to data bounds
            this.fitMapToBounds(geoData);

            App.UI.showMessage('Success', `Loaded ${geoData.features.length} features from ${filename}`);
            
        } catch (error) {
            console.error('Error processing geo data:', error);
            throw error;
        }
    },

    fitMapToBounds(geoData) {
        try {
            if (!geoData.features || geoData.features.length === 0) return;

            // Calculate bounds
            let minLng = Infinity, minLat = Infinity;
            let maxLng = -Infinity, maxLat = -Infinity;

            geoData.features.forEach(feature => {
                if (feature.geometry && feature.geometry.coordinates) {
                    this.extractCoordinates(feature.geometry.coordinates).forEach(coord => {
                        const [lng, lat] = coord;
                        minLng = Math.min(minLng, lng);
                        maxLng = Math.max(maxLng, lng);
                        minLat = Math.min(minLat, lat);
                        maxLat = Math.max(maxLat, lat);
                    });
                }
            });

            // Fit map to bounds
            if (App.MapController && App.MapController.fitBounds) {
                App.MapController.fitBounds([
                    [minLng, minLat],
                    [maxLng, maxLat]
                ]);
            }
        } catch (error) {
            console.warn('Could not fit map to data bounds:', error);
        }
    },

    extractCoordinates(coords) {
        const result = [];
        
        function extract(arr) {
            if (typeof arr[0] === 'number') {
                result.push(arr);
            } else {
                arr.forEach(extract);
            }
        }
        
        extract(coords);
        return result;
    },

    // Export functionality
    exportData(format = 'geojson') {
        const data = App.state.data.geojson.data;
        if (!data || !data.features) {
            App.UI.showMessage('Error', 'No data to export');
            return;
        }

        let content, filename, mimeType;

        switch (format) {
            case 'geojson':
                content = JSON.stringify(data, null, 2);
                filename = `export_${Date.now()}.geojson`;
                mimeType = 'application/json';
                break;
            case 'csv':
                content = this.convertToCSV(data);
                filename = `export_${Date.now()}.csv`;
                mimeType = 'text/csv';
                break;
            case 'kml':
                content = this.convertToKML(data);
                filename = `export_${Date.now()}.kml`;
                mimeType = 'application/vnd.google-earth.kml+xml';
                break;
            default:
                App.UI.showMessage('Error', `Unsupported export format: ${format}`);
                return;
        }

        this.downloadFile(content, filename, mimeType);
    },

    convertToCSV(geojson) {
        if (!geojson.features || geojson.features.length === 0) {
            return '';
        }

        // Get all unique property keys
        const propertyKeys = new Set();
        geojson.features.forEach(feature => {
            if (feature.properties) {
                Object.keys(feature.properties).forEach(key => propertyKeys.add(key));
            }
        });

        const headers = ['longitude', 'latitude', ...Array.from(propertyKeys)];
        const csvLines = [headers.join(',')];

        geojson.features.forEach(feature => {
            if (feature.geometry && feature.geometry.type === 'Point') {
                const [lon, lat] = feature.geometry.coordinates;
                const row = [lon, lat];
                
                propertyKeys.forEach(key => {
                    const value = feature.properties?.[key] || '';
                    row.push(`"${String(value).replace(/"/g, '""')}"`);
                });
                
                csvLines.push(row.join(','));
            }
        });

        return csvLines.join('\n');
    },

    convertToKML(geojson) {
        let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Exported Data</name>`;

        geojson.features.forEach(feature => {
            const name = feature.properties?.name || feature.properties?._internalId || 'Feature';
            const description = feature.properties?.description || '';
            
            kml += `
    <Placemark>
      <name>${this.escapeXML(name)}</name>
      <description>${this.escapeXML(description)}</description>`;

            if (feature.geometry.type === 'Point') {
                const [lon, lat] = feature.geometry.coordinates;
                kml += `
      <Point>
        <coordinates>${lon},${lat},0</coordinates>
      </Point>`;
            }

            kml += `
    </Placemark>`;
        });

        kml += `
  </Document>
</kml>`;

        return kml;
    },

    escapeXML(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

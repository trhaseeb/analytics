// Snapshot rendering
window.App = window.App || {};

App.Snapshot = {
    render(feature) {
        const container = document.getElementById('snapshot-container');
        if (!feature) {
            container.innerHTML = '<p class="p-4 text-gray-500">Select a feature to see its details.</p>';
            return;
        }

        const info = `
            <div class="p-4 border-b">
                <h3 class="text-lg font-bold">${feature.properties.Name || 'Unnamed Feature'}</h3>
                <p class="text-sm text-gray-600">${feature.properties.category || 'Uncategorized'}</p>
            </div>
            <div class="p-4 text-sm">${feature.properties.Description || 'No description.'}</div>
        `;

        const geoData = App.Utils.calculateGeoData(feature);
        const geoInfo = `
            <div class="p-4 border-t">
                <h4 class="font-semibold mb-2">Geometric Information</h4>
                <table class="w-full text-sm">
                    <tbody>
                        ${geoData.map(item => `<tr><td class="font-medium pr-2">${item.label}</td><td>${item.value}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const snapshotMap = `
            <div class="p-4 border-t">
                <h4 class="font-semibold mb-2">Visual Snapshot</h4>
                <div id="snapshot-map" class="h-48 w-full bg-gray-200 rounded"></div>
            </div>
        `;

        container.innerHTML = info + geoInfo + snapshotMap;

        const [minX, minY, maxX, maxY] = turf.bbox(feature);
        const { longitude, latitude, zoom } = new WebMercatorViewport({
            width: 200,
            height: 200
        }).fitBounds([[minX, minY], [maxX, maxY]], { padding: 20 });

        const snapshotDeck = new deck.DeckGL({
            container: 'snapshot-map',
            mapStyle: 'mapbox://styles/mapbox/satellite-v9',
            initialViewState: {
                longitude,
                latitude,
                zoom
            },
            controller: false,
            mapboxApiAccessToken: 'pk.eyJ1IjoiZGVmYXVsdC11c2VyIiwiYSI6ImNscjB4Z2t2bjFwZWMya3FzMHV2M3M3N2cifQ.50t0m5s-s2FSp3uLwH2nhQ'
        });

        const layer = new deck.GeoJsonLayer({
            id: 'snapshot-feature-layer',
            data: feature,
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
            }
        });

        snapshotDeck.setProps({ layers: [layer] });
    }
};
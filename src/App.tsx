import { useState, useEffect } from 'react';
import { 
  UnifiedMapComponent,
  HomeButton, 
  UniversalModal,
  ProjectComponent,
  SettingsComponent,
  LayersComponent,
  BasemapsComponent
} from './components';
import { useModalManager } from './hooks/useModalManager';
import { componentRegistry } from './systems/ComponentRegistry';
import { storageManager } from './systems/StorageManager';
import type { ViewState } from './types';

// Initial map view state (NYC area)
const INITIAL_VIEW_STATE: ViewState = {
  longitude: -74.006,
  latitude: 40.7128,
  zoom: 11,
  bearing: 0,
  pitch: 0
};

function App() {
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [savedLayers, setSavedLayers] = useState<any[]>([]);
  const [savedBasemaps, setSavedBasemaps] = useState<any[]>([]);
  
  const { 
    launchComponent, 
    closeModal, 
    changeModalState, 
    getActiveModals 
  } = useModalManager();

  // Initialize components and load saved data on app start
  useEffect(() => {
    // Register components
    componentRegistry.register(ProjectComponent);
    componentRegistry.register(SettingsComponent);
    componentRegistry.register(LayersComponent);
    componentRegistry.register(BasemapsComponent);

    // Load saved data
    const loadData = () => {
      const layers = storageManager.loadLayersData();
      const basemaps = storageManager.loadBasemapsData();
      setSavedLayers(layers.filter(layer => layer.visible));
      setSavedBasemaps(basemaps.filter(basemap => basemap.isActive));
    };

    loadData();

    // Listen for layer updates from LayersComponent
    const handleLayersUpdate = () => {
      loadData();
    };
    window.addEventListener('layersUpdated', handleLayersUpdate);

    // Listen for basemap updates from BasemapsComponent
    const handleBasemapsUpdate = () => {
      loadData();
    };
    window.addEventListener('basemapsUpdated', handleBasemapsUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('layersUpdated', handleLayersUpdate);
      window.removeEventListener('basemapsUpdated', handleBasemapsUpdate);
    };
  }, []);

  // Helper function to validate tile URLs
  const isValidTileUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    // Check for valid URL format
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      // Try template URL format
      return url.includes('{x}') && url.includes('{y}') && url.includes('{z}');
    }
  };

  // Convert saved data to tile layers for UnifiedMapComponent
  const tileLayers = [
    // Add default OpenStreetMap background if no basemaps (CORS-friendly)
    ...(savedBasemaps.length === 0 ? [{
      id: 'default-osm',
      name: 'OpenStreetMap',
      type: 'background' as const,
      data: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      visible: true,
      opacity: 1,
      minZoom: 0,
      maxZoom: 20
    }] : []),
    
    // Background tiles from basemaps
    ...savedBasemaps
      .filter(basemap => basemap.url && isValidTileUrl(basemap.url))
      .map(basemap => ({
        id: `basemap-${basemap.id}`,
        name: basemap.name,
        type: 'background' as const,
        data: basemap.url,
        visible: true,
        opacity: basemap.opacity || 1,
        minZoom: basemap.minZoom || 0,
        maxZoom: basemap.maxZoom || 20
      })),
    
    // Data tiles from layers - convert StorageManager format to UnifiedMapComponent format
    ...savedLayers
      .filter(layer => {
        const url = layer.url || layer.tiles;
        return url && isValidTileUrl(url);
      })
      .map(layer => ({
        id: `layer-${layer.id}`,
        name: layer.name,
        type: (layer.type === '2d-orthophoto' ? 'orthophoto' : 
              layer.type === '3d-orthophoto' ? 'orthophoto-3d' : 'orthophoto') as 'orthophoto' | 'orthophoto-3d',
        data: layer.url || layer.tiles || '',
        visible: layer.visible,
        opacity: layer.opacity || 1,
        bounds: layer.bounds ? [
          layer.bounds.west,
          layer.bounds.south, 
          layer.bounds.east,
          layer.bounds.north
        ] as [number, number, number, number] : undefined,
        minZoom: 0,
        maxZoom: 18
      }))
  ];

  // Refresh layers when modals close
  const handleModalClose = (id: string) => {
    closeModal(id);
    
    if (id === 'layers-modal' || id === 'basemaps-modal') {
      const layers = storageManager.loadLayersData();
      const basemaps = storageManager.loadBasemapsData();
      
      setSavedLayers(layers.filter(layer => layer.visible));
      setSavedBasemaps(basemaps.filter(basemap => basemap.isActive));
    }
  };

  const activeModals = getActiveModals();

  // Debug the tile layers
  console.log('App render - tileLayers:', tileLayers);

  return (
    <div className="w-full h-screen relative">
      {/* Main Map Component - Pure Deck.gl */}
      <UnifiedMapComponent
        viewState={viewState}
        onViewStateChange={setViewState}
        tileLayers={tileLayers}
        onClick={(event: any) => console.log('Map clicked:', event)}
        onHover={(event: any) => console.log('Map hovered:', event)}
        is3D={false}
      />

      {/* Home Button */}
      <HomeButton onComponentLaunch={launchComponent} />

      {/* Active Modals */}
      {activeModals.map(({ id, config }) => (
        <UniversalModal
          key={id}
          config={config}
          isOpen={true}
          onClose={() => handleModalClose(id)}
          onStateChange={(newState) => changeModalState(id, newState)}
        />
      ))}
    </div>
  );
}

export default App;

// Storage Manager - Persistent storage for all components

export interface ProjectData {
  name: string;
  description: string;
  fields: Array<{
    id: string;
    name: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }>;
  fieldValues: Record<string, any>;
  lastModified: string;
}

export interface LayerData {
  id: string;
  name: string;
  type: '2d-orthophoto' | '3d-orthophoto';
  tiles?: string;
  url?: string;
  visible: boolean;
  opacity: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  metadata?: {
    resolution: string;
    captureDate: string;
    provider: string;
  };
}

export interface BasemapData {
  id: string;
  name: string;
  type: 'satellite' | 'street' | 'terrain' | 'dark' | 'light' | 'custom';
  url?: string;
  tiles?: string;
  attribution?: string;
  isActive: boolean;
}

export interface SettingsData {
  units: 'metric' | 'imperial';
  coordinateFormat: 'decimal' | 'dms';
  showGrid: boolean;
  showScaleBar: boolean;
  showAttribution: boolean;
  lastModified: string;
}

class StorageManager {
  private static instance: StorageManager;
  private readonly STORAGE_KEYS = {
    PROJECT: 'deckgl-project-data',
    LAYERS: 'deckgl-layers-data',
    BASEMAPS: 'deckgl-basemaps-data',
    SETTINGS: 'deckgl-settings-data',
    APP_VERSION: 'deckgl-app-version'
  };

  private constructor() {
    // Check for version compatibility
    this.checkVersionCompatibility();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private checkVersionCompatibility() {
    const currentVersion = '1.0.0';
    const storedVersion = localStorage.getItem(this.STORAGE_KEYS.APP_VERSION);
    
    if (!storedVersion || storedVersion !== currentVersion) {
      console.log('App version updated, clearing old storage');
      this.clearAllData();
      localStorage.setItem(this.STORAGE_KEYS.APP_VERSION, currentVersion);
    }
  }

  // Project Data
  saveProjectData(data: ProjectData): void {
    try {
      const dataWithTimestamp = {
        ...data,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEYS.PROJECT, JSON.stringify(dataWithTimestamp));
      console.log('Project data saved successfully');
    } catch (error) {
      console.error('Failed to save project data:', error);
      throw new Error('Failed to save project data');
    }
  }

  loadProjectData(): ProjectData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.PROJECT);
      if (data) {
        const parsed = JSON.parse(data) as ProjectData;
        console.log('Project data loaded successfully');
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Failed to load project data:', error);
      return null;
    }
  }

  // Layers Data
  saveLayersData(layers: LayerData[]): void {
    try {
      const dataWithTimestamp = {
        layers,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEYS.LAYERS, JSON.stringify(dataWithTimestamp));
      console.log(`Saved ${layers.length} layers successfully`);
    } catch (error) {
      console.error('Failed to save layers data:', error);
      throw new Error('Failed to save layers data');
    }
  }

  loadLayersData(): LayerData[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.LAYERS);
      if (data) {
        const parsed = JSON.parse(data);
        console.log(`Loaded ${parsed.layers?.length || 0} layers successfully`);
        return parsed.layers || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load layers data:', error);
      return [];
    }
  }

  // Basemaps Data
  saveBasemapsData(basemaps: BasemapData[]): void {
    try {
      const dataWithTimestamp = {
        basemaps,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEYS.BASEMAPS, JSON.stringify(dataWithTimestamp));
      console.log(`Saved ${basemaps.length} basemaps successfully`);
    } catch (error) {
      console.error('Failed to save basemaps data:', error);
      throw new Error('Failed to save basemaps data');
    }
  }

  loadBasemapsData(): BasemapData[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.BASEMAPS);
      if (data) {
        const parsed = JSON.parse(data);
        console.log(`Loaded ${parsed.basemaps?.length || 0} basemaps successfully`);
        return parsed.basemaps || [];
      }
      return this.getDefaultBasemaps();
    } catch (error) {
      console.error('Failed to load basemaps data:', error);
      return this.getDefaultBasemaps();
    }
  }

  // Settings Data
  saveSettingsData(settings: SettingsData): void {
    try {
      const dataWithTimestamp = {
        ...settings,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(dataWithTimestamp));
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  loadSettingsData(): SettingsData {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data) as SettingsData;
        console.log('Settings loaded successfully');
        return parsed;
      }
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      return this.getDefaultSettings();
    }
  }

  // Default Data
  private getDefaultBasemaps(): BasemapData[] {
    return [
      {
        id: 'osm',
        name: 'OpenStreetMap',
        type: 'street',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        isActive: true
      },
      {
        id: 'satellite',
        name: 'Satellite',
        type: 'satellite',
        url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=YOUR_TOKEN',
        attribution: '© Mapbox © OpenStreetMap',
        isActive: false
      }
    ];
  }

  private getDefaultSettings(): SettingsData {
    return {
      units: 'metric',
      coordinateFormat: 'decimal',
      showGrid: false,
      showScaleBar: true,
      showAttribution: true,
      lastModified: new Date().toISOString()
    };
  }

  // Utility Methods
  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('All storage data cleared');
  }

  exportAllData(): string {
    const allData = {
      project: this.loadProjectData(),
      layers: this.loadLayersData(),
      basemaps: this.loadBasemapsData(),
      settings: this.loadSettingsData(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    return JSON.stringify(allData, null, 2);
  }

  importAllData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.project) {
        this.saveProjectData(data.project);
      }
      if (data.layers) {
        this.saveLayersData(data.layers);
      }
      if (data.basemaps) {
        this.saveBasemapsData(data.basemaps);
      }
      if (data.settings) {
        this.saveSettingsData(data.settings);
      }
      
      console.log('All data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  getStorageInfo(): { [key: string]: number } {
    const info: { [key: string]: number } = {};
    Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
      const data = localStorage.getItem(key);
      info[name] = data ? new Blob([data]).size : 0;
    });
    return info;
  }
}

export const storageManager = StorageManager.getInstance();

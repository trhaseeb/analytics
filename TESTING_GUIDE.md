# Testing Guide - Basemaps and Layers

## 🏠 Home Button & Modal System Test

### Testing Steps:
1. **Open Application**: http://localhost:5173/
2. **Test Home Button**: Click the home icon (🏠) in the top-right corner
3. **Verify Modal System**: Modal should open with component options
4. **Test Basemaps**: Click "Basemap Manager" option
5. **Test Layers**: Click "Layers" option

## 🗺️ Basemaps Component Testing

### Default Setup:
- ✅ **Google Hybrid** should be pre-loaded and active
- ✅ Map should display Google satellite + road overlay
- ✅ Status indicator should show "Available" or green checkmark

### Test Procedure:

#### 1. Verify Default Basemap
- **Expected**: Google Hybrid basemap active on load
- **URL**: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}`
- **Attribution**: "© Google"

#### 2. Test Basemap Switching
- Click "Available Basemaps" tab
- Try switching to other preset basemaps:
  - OpenStreetMap
  - CartoDB Positron (Light)
  - CartoDB Dark Matter
  - Stamen Terrain
  - ESRI Satellite

#### 3. Test Connection Testing
- Click "Test" button next to any basemap
- **Expected**: Status changes to "Testing..." then shows result
- **Success**: Green checkmark and "Tested [time]"
- **Failure**: Red X and "Connection failed"

#### 4. Test Custom Basemap Addition
- Click "Add Basemap" tab
- Try adding a custom basemap:
  - **Name**: "Test OSM"
  - **Type**: Street
  - **URL**: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
  - **Attribution**: "© OSM"
  - **Test URL**: Check the box
- Click "Add Basemap"
- **Expected**: Basemap added with connection test results

## 🗃️ Layers Component Testing

### Test 2D Tile Layers

#### Test Case 1: OpenStreetMap XYZ Tiles
- **Format**: 2D Orthophoto
- **URL**: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Expected**: TileLayer should load and auto-zoom
- **Status**: Should show loading indicator then success

#### Test Case 2: ESRI Satellite XYZ Tiles  
- **Format**: 2D Orthophoto
- **URL**: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- **Expected**: TileLayer should load and auto-zoom
- **Status**: Should show loading indicator then success

#### Test Case 3: CartoDB XYZ Tiles
- **Format**: 2D Orthophoto
- **URL**: `https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png`
- **Expected**: TileLayer should load and auto-zoom
- **Status**: Should show loading indicator then success

### Test 3D Tile Layers

#### Test Case 4: 3D Tiles Format
- **Format**: 3D Orthophoto
- **URL**: `https://raw.githubusercontent.com/CesiumGS/3d-tiles-samples/main/tilesets/TilesetWithDiscreteLOD/tileset.json`
- **Expected**: Tile3DLayer should load 3D content
- **Status**: Should show loading indicator and attempt to load

#### Test Case 5: Local 3D Tileset (if available)
- **Format**: 3D Orthophoto  
- **URL**: Path to local tileset.json file
- **Expected**: Tile3DLayer should load local 3D content

### Testing Procedure:

#### 1. Open Layers Component
- Click Home button → "Layers"
- Verify modal opens correctly

#### 2. Test Layer Addition
- Click "Add Layer" tab
- Select "2D Orthophoto" for XYZ tiles
- Select "3D Orthophoto" for 3D tiles
- Enter test URLs from above
- Enable "Auto-zoom to layer when added"
- Click "Add Layer"

#### 3. Verify Layer Loading
- **Expected Behavior**:
  - Loading status appears
  - Map viewport adjusts (auto-zoom)
  - Layer appears on map
  - Status changes to success/loaded
  - Layer appears in "Current Layers" tab

#### 4. Test Layer Management
- **Toggle Visibility**: Click layer visibility toggle
- **Adjust Opacity**: Use opacity slider
- **Remove Layer**: Click remove button
- **Layer Info**: Check metadata display

## 🔍 Expected Results

### ✅ Success Indicators:
- **Basemaps**: Google Hybrid loads by default
- **Modal System**: Smooth opening/closing of dialogs
- **2D Tiles**: XYZ format layers load with TileLayer
- **3D Tiles**: 3D format attempts to load with Tile3DLayer
- **Auto-zoom**: Map adjusts viewport to layer bounds
- **Status**: Real-time feedback during loading
- **UI**: Clean, responsive interface

### ❌ Potential Issues:
- **CORS Errors**: Some tile services may block cross-origin requests
- **404 Errors**: Test URLs may be unavailable
- **Format Errors**: 3D tiles require specific server setup
- **Performance**: Large tilesets may load slowly

## 🐛 Debugging

### Check Browser Console:
1. Open DevTools (F12)
2. Look for network errors
3. Check Deck.gl layer creation logs
4. Verify tile loading messages

### Common Error Messages:
- **CORS**: "Access blocked by CORS policy"
- **404**: "Failed to load resource"
- **Format**: "Invalid tileset.json format"
- **Network**: "Failed to fetch"

## 📋 Test Checklist

- [ ] App loads successfully
- [ ] Home button opens modal
- [ ] Google Hybrid basemap is active by default
- [ ] Can switch between basemaps
- [ ] Basemap connection testing works
- [ ] Can add custom basemaps
- [ ] Can open Layers component
- [ ] Can add 2D XYZ tile layers
- [ ] 2D layers trigger auto-zoom
- [ ] Can add 3D tile layers (if tileset available)
- [ ] Loading status indicators work
- [ ] Layer visibility toggles work
- [ ] Can remove layers
- [ ] Modal system works smoothly

---

**Next Steps**: After verifying core functionality, we can enhance with additional features like layer styling, advanced 3D controls, and performance optimizations.

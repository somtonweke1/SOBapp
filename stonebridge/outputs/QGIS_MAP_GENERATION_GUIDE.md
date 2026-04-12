# QGIS Map Generation Guide
## StoneBridge GIS Case Study Visualization

**Purpose:** Generate professional maps for academic GIS research report
**Required Software:** QGIS 3.28 or higher
**Estimated Time:** 2-3 hours for all maps
**Skill Level:** Beginner to Intermediate

---

## Table of Contents

1. [Installation and Setup](#1-installation-and-setup)
2. [Manual Map Generation (Step-by-Step)](#2-manual-map-generation-step-by-step)
3. [Automated Map Generation (Python Scripts)](#3-automated-map-generation-python-scripts)
4. [Export and Formatting](#4-export-and-formatting)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Installation and Setup

### 1.1 Install QGIS

**macOS:**
```bash
brew install qgis
# OR download from https://qgis.org/download/
```

**Windows:**
Download installer from https://qgis.org/download/

**Linux (Ubuntu):**
```bash
sudo apt-get install qgis
```

### 1.2 Verify Installation

```bash
qgis --version
# Expected: QGIS 3.28.x or higher
```

### 1.3 Prepare GeoJSON Files

Verify all case study files exist:
```bash
ls -lh /Users/somtonweke/SOBApp/stonebridge/outputs/*.geojson
```

Expected output:
```
case_study_1_spatial_context.geojson  (Downtown)
case_study_2_spatial_context.geojson  (West Baltimore)
case_study_3_spatial_context.geojson  (East Baltimore)
```

---

## 2. Manual Map Generation (Step-by-Step)

### 2.1 Map 1: Baltimore Overview with All Three Properties

**Purpose:** Show geographic distribution of case study sites across Baltimore

#### Step 1: Launch QGIS
```bash
open -a QGIS
# OR on Windows: Start → QGIS Desktop
```

#### Step 2: Create New Project
- File → New Project
- Save as: `baltimore_overview_map.qgz`

#### Step 3: Add Basemap
1. In Browser Panel, expand **XYZ Tiles**
2. Double-click **OpenStreetMap** to add basemap
3. Right-click layer → Properties → Symbology → Adjust transparency to 50%

#### Step 4: Add All Three Property Locations

For each GeoJSON file:
1. Layer → Add Layer → Add Vector Layer
2. Browse to: `/Users/somtonweke/SOBApp/stonebridge/outputs/case_study_1_spatial_context.geojson`
3. Click Add
4. Repeat for `case_study_2_spatial_context.geojson` and `case_study_3_spatial_context.geojson`

#### Step 5: Filter to Show Only Properties

For each case study layer:
1. Right-click layer → Filter
2. Enter filter: `"type" = 'property'`
3. Click OK

#### Step 6: Style Property Points

For **Case Study 1 (Downtown)**:
1. Right-click layer → Properties → Symbology
2. Select "Single Symbol"
3. Click "Simple Marker"
4. Set:
   - Size: 8
   - Color: Red (#FF0000)
   - Outline color: White
   - Outline width: 1

For **Case Study 2 (West Baltimore)**:
1. Same as above, but Color: Blue (#0000FF)

For **Case Study 3 (East Baltimore)**:
1. Same as above, but Color: Green (#00FF00)

#### Step 7: Add Labels

For each property layer:
1. Right-click → Properties → Labels
2. Select "Single Labels"
3. Label with: "Case Study 1", "Case Study 2", "Case Study 3"
4. Font size: 12pt
5. Buffer: 1mm white

#### Step 8: Set Map Extent
1. View → Zoom to Layer → OpenStreetMap (to see full Baltimore)
2. Navigate to show all three properties comfortably

#### Step 9: Add Map Elements

**Print Layout:**
1. Project → New Print Layout
2. Name: "Baltimore Overview"
3. Add New Map: Add Item → Add Map
4. Draw rectangle on canvas

**Title:**
1. Add Item → Add Label
2. Text: "Figure 1: Case Study Properties - Baltimore, Maryland"
3. Font: 16pt Bold

**Legend:**
1. Add Item → Add Legend
2. Remove unnecessary items
3. Rename layers:
   - "Case Study 1: Downtown (100 N Holliday St)"
   - "Case Study 2: West Baltimore (1500 W North Ave)"
   - "Case Study 3: East Baltimore (3001 E Baltimore St)"

**Scale Bar:**
1. Add Item → Add Scale Bar
2. Place in lower-left corner

**North Arrow:**
1. Add Item → Add North Arrow
2. Place in upper-right corner

#### Step 10: Export Map
1. Layout → Export as Image
2. Format: PNG
3. Resolution: 300 DPI
4. Save as: `Figure_1_Baltimore_Overview.png`

---

### 2.2 Map 2: Case Study 1 - Downtown Baltimore Spatial Context

**Purpose:** Show 500m buffer with complaints and vacancies

#### Step 1: New Project
- File → New Project
- Save as: `case_study_1_downtown.qgz`

#### Step 2: Add Basemap
- Same as Map 1 (OpenStreetMap, 50% transparency)

#### Step 3: Load Case Study 1 Data
1. Layer → Add Layer → Add Vector Layer
2. Browse to: `case_study_1_spatial_context.geojson`
3. Click Add (DO NOT filter this time - we want all features)

#### Step 4: Style by Feature Type

**Method 1: Categorized Symbology**
1. Right-click layer → Properties → Symbology
2. Select "Categorized"
3. Value: `type`
4. Click "Classify"
5. Style each category:

**Property (type = 'property'):**
- Marker: Star
- Size: 12
- Color: Red (#FF0000)
- Outline: White, 2px

**Complaints (type = 'complaint'):**
- Marker: Circle
- Size: 6
- Color: Orange (#FFA500)
- Outline: Dark orange, 1px
- Opacity: 70%

**Vacancies (type = 'vacancy'):**
- Marker: Triangle
- Size: 7
- Color: Yellow (#FFFF00)
- Outline: Black, 1px

#### Step 5: Add 500m Buffer Visualization

1. Vector → Geoprocessing Tools → Buffer
2. Input layer: case_study_1 (filtered to property only)
3. Distance: 500 meters
4. Output: Save as temporary layer
5. Style buffer:
   - Fill: No fill (transparent)
   - Stroke: Dashed line, 2px, Dark gray
   - Label: "500m Analysis Buffer"

#### Step 6: Zoom to Extent
- Right-click case_study_1 layer → Zoom to Layer
- Adjust to show full 500m buffer + slight margin

#### Step 7: Add Count Labels

1. Add Item → Add Label (in Print Layout)
2. Text:
```
Spatial Analysis Results
Complaints within 500m: 8
Vacancies within 500m: 2
Spatial Risk Score: 19/100
```

#### Step 8: Export
1. Layout → New Print Layout → "Downtown Spatial Context"
2. Add map, title ("Figure 2: Downtown Baltimore Spatial Context"), legend, scale bar, north arrow
3. Export as: `Figure_2_Downtown_Spatial_Context.png` (300 DPI)

---

### 2.3 Map 3: Case Study 2 - West Baltimore Spatial Context

**Repeat Map 2 steps with Case Study 2 data:**

- Input file: `case_study_2_spatial_context.geojson`
- Same styling (property=red star, complaints=orange circles, vacancies=yellow triangles)
- 500m buffer around property
- Label text:
```
Spatial Analysis Results
Complaints within 500m: 28
Vacancies within 500m: 12
Spatial Risk Score: 70/100
```
- Export as: `Figure_3_West_Baltimore_Spatial_Context.png`

---

### 2.4 Map 4: Case Study 3 - East Baltimore Spatial Context

**Repeat Map 2 steps with Case Study 3 data:**

- Input file: `case_study_3_spatial_context.geojson`
- Same styling
- 500m buffer
- Label text:
```
Spatial Analysis Results
Complaints within 500m: 16
Vacancies within 500m: 6
Spatial Risk Score: 44/100
```
- Export as: `Figure_4_East_Baltimore_Spatial_Context.png`

---

## 3. Automated Map Generation (Python Scripts)

### 3.1 QGIS Python Console

QGIS includes a Python console for automation. These scripts automate the manual steps above.

**To access:**
1. In QGIS: Plugins → Python Console
2. Click "Show Editor" button (top toolbar)
3. Paste script below
4. Click "Run Script" (green play button)

### 3.2 Script 1: Generate All Maps Automatically

**Save this as:** `generate_all_maps.py`

```python
# QGIS Python Script: Generate All StoneBridge Case Study Maps
# Run in QGIS Python Console
# Author: StoneBridge GIS Team
# Date: April 2026

from qgis.core import *
from qgis.utils import iface
from PyQt5.QtCore import QSize
import os

# Configuration
BASE_DIR = '/Users/somtonweke/SOBApp/stonebridge/outputs'
OUTPUT_DIR = os.path.join(BASE_DIR, 'maps')
os.makedirs(OUTPUT_DIR, exist_ok=True)

CASE_STUDIES = [
    {
        'id': 1,
        'name': 'Downtown Baltimore',
        'geojson': os.path.join(BASE_DIR, 'case_study_1_spatial_context.geojson'),
        'complaints': 8,
        'vacancies': 2,
        'spatial_risk': 19,
        'color': '#FF0000'
    },
    {
        'id': 2,
        'name': 'West Baltimore',
        'geojson': os.path.join(BASE_DIR, 'case_study_2_spatial_context.geojson'),
        'complaints': 28,
        'vacancies': 12,
        'spatial_risk': 70,
        'color': '#0000FF'
    },
    {
        'id': 3,
        'name': 'East Baltimore',
        'geojson': os.path.join(BASE_DIR, 'case_study_3_spatial_context.geojson'),
        'complaints': 16,
        'vacancies': 6,
        'spatial_risk': 44,
        'color': '#00FF00'
    }
]

def add_osm_basemap():
    """Add OpenStreetMap basemap"""
    urlWithParams = 'type=xyz&url=https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    rlayer = QgsRasterLayer(urlWithParams, 'OpenStreetMap', 'wms')
    if rlayer.isValid():
        QgsProject.instance().addMapLayer(rlayer)
        # Set transparency
        rlayer.renderer().setOpacity(0.5)
        rlayer.triggerRepaint()
    return rlayer

def load_geojson(filepath, name):
    """Load GeoJSON file as vector layer"""
    layer = QgsVectorLayer(filepath, name, 'ogr')
    if not layer.isValid():
        print(f"ERROR: Failed to load {filepath}")
        return None
    QgsProject.instance().addMapLayer(layer)
    return layer

def style_by_type(layer):
    """Apply categorized styling based on 'type' field"""
    # Define styles for each feature type
    styles = {
        'property': {
            'type': 'star',
            'size': 12,
            'color': '255,0,0,255',  # Red
            'outline': '255,255,255,255',
            'outline_width': 2
        },
        'complaint': {
            'type': 'circle',
            'size': 6,
            'color': '255,165,0,178',  # Orange, 70% opacity
            'outline': '255,140,0,255',
            'outline_width': 1
        },
        'vacancy': {
            'type': 'triangle',
            'size': 7,
            'color': '255,255,0,255',  # Yellow
            'outline': '0,0,0,255',
            'outline_width': 1
        }
    }

    # Create categorized renderer
    categories = []
    for type_value, style in styles.items():
        symbol = QgsMarkerSymbol.createSimple({
            'name': style['type'],
            'size': str(style['size']),
            'color': style['color'],
            'outline_color': style['outline'],
            'outline_width': str(style['outline_width'])
        })
        category = QgsRendererCategory(type_value, symbol, type_value.title())
        categories.append(category)

    renderer = QgsCategorizedSymbolRenderer('type', categories)
    layer.setRenderer(renderer)
    layer.triggerRepaint()

def create_buffer(layer, distance_meters=500):
    """Create 500m buffer around property point"""
    # Filter to property features only
    property_features = [f for f in layer.getFeatures() if f['type'] == 'property']

    if not property_features:
        print("ERROR: No property feature found")
        return None

    property_geom = property_features[0].geometry()

    # Buffer in meters (assuming WGS84, approximate)
    # For accurate buffering, should transform to projected CRS
    buffer_geom = property_geom.buffer(distance_meters / 111000, 50)  # Rough conversion

    # Create memory layer for buffer
    buffer_layer = QgsVectorLayer('Polygon?crs=EPSG:4326', 'Analysis Buffer (500m)', 'memory')
    buffer_provider = buffer_layer.dataProvider()

    buffer_feature = QgsFeature()
    buffer_feature.setGeometry(buffer_geom)
    buffer_provider.addFeature(buffer_feature)
    buffer_layer.updateExtents()

    # Style buffer
    symbol = QgsFillSymbol.createSimple({
        'color': '255,255,255,0',  # Transparent fill
        'outline_color': '100,100,100,255',
        'outline_width': '2',
        'outline_style': 'dash'
    })
    buffer_layer.renderer().setSymbol(symbol)

    QgsProject.instance().addMapLayer(buffer_layer)
    return buffer_layer

def generate_case_study_map(case_study):
    """Generate individual case study map"""
    print(f"\n=== Generating Map {case_study['id']}: {case_study['name']} ===")

    # Clear project
    QgsProject.instance().clear()

    # Add basemap
    basemap = add_osm_basemap()

    # Load case study data
    layer = load_geojson(case_study['geojson'], case_study['name'])
    if not layer:
        return

    # Style by feature type
    style_by_type(layer)

    # Create buffer
    buffer_layer = create_buffer(layer, 500)

    # Zoom to layer extent
    iface.mapCanvas().setExtent(layer.extent())
    iface.mapCanvas().zoomByFactor(1.3)  # Zoom out 30% to show margin
    iface.mapCanvas().refresh()

    # Export map
    output_path = os.path.join(OUTPUT_DIR, f'Figure_{case_study["id"] + 1}_{case_study["name"].replace(" ", "_")}.png')
    export_map(output_path, case_study)

    print(f"✓ Map saved: {output_path}")

def export_map(output_path, case_study):
    """Export current map canvas to PNG"""
    # Get map canvas
    canvas = iface.mapCanvas()

    # Set output size (300 DPI equivalent for A4)
    width = 3508  # 297mm at 300 DPI
    height = 2480  # 210mm at 300 DPI

    # Create image
    img = QImage(QSize(width, height), QImage.Format_ARGB32_Premultiplied)
    img.fill(Qt.white)

    # Render map
    painter = QPainter(img)
    render = QgsMapRendererCustomPainterJob(
        QgsMapSettings(canvas.mapSettings()),
        painter
    )
    render.renderSynchronously()
    painter.end()

    # Save image
    img.save(output_path, 'PNG', 100)

# Main execution
print("=== StoneBridge GIS Case Study Map Generation ===")
print(f"Output directory: {OUTPUT_DIR}")

for case_study in CASE_STUDIES:
    generate_case_study_map(case_study)

print("\n=== All maps generated successfully! ===")
print(f"Maps saved to: {OUTPUT_DIR}")
print("\nGenerated files:")
for i in range(1, 4):
    print(f"  - Figure_{i+1}_{CASE_STUDIES[i-1]['name'].replace(' ', '_')}.png")
```

### 3.3 Script 2: Generate Baltimore Overview Map

```python
# Generate Baltimore Overview with All Three Properties

from qgis.core import *
from qgis.utils import iface
import os

BASE_DIR = '/Users/somtonweke/SOBApp/stonebridge/outputs'
OUTPUT_DIR = os.path.join(BASE_DIR, 'maps')

# Clear project
QgsProject.instance().clear()

# Add basemap
urlWithParams = 'type=xyz&url=https://tile.openstreetmap.org/{z}/{x}/{y}.png'
basemap = QgsRasterLayer(urlWithParams, 'OpenStreetMap', 'wms')
QgsProject.instance().addMapLayer(basemap)
basemap.renderer().setOpacity(0.5)

# Load all three case studies
colors = ['#FF0000', '#0000FF', '#00FF00']
names = ['Downtown', 'West Baltimore', 'East Baltimore']

for i in range(1, 4):
    geojson_path = os.path.join(BASE_DIR, f'case_study_{i}_spatial_context.geojson')
    layer = QgsVectorLayer(geojson_path, names[i-1], 'ogr')

    # Filter to property only
    layer.setSubsetString('"type" = \'property\'')

    # Style
    symbol = QgsMarkerSymbol.createSimple({
        'name': 'circle',
        'size': '10',
        'color': colors[i-1],
        'outline_color': '255,255,255,255',
        'outline_width': '2'
    })
    layer.renderer().setSymbol(symbol)

    QgsProject.instance().addMapLayer(layer)

# Zoom to show all layers
iface.mapCanvas().zoomToFullExtent()
iface.mapCanvas().refresh()

# Export
output_path = os.path.join(OUTPUT_DIR, 'Figure_1_Baltimore_Overview.png')
# Manual export: Project → Import/Export → Export Map to Image
print(f"Map ready. Export manually to: {output_path}")
```

---

## 4. Export and Formatting

### 4.1 Recommended Export Settings

**For All Maps:**
- **Format:** PNG (lossless, good for academic publications)
- **Resolution:** 300 DPI minimum (print quality)
- **Color Mode:** RGB
- **Dimensions:** A4 landscape (297mm × 210mm) or custom

**Alternative:** Export as PDF for vector graphics (scalable, smaller file size)

### 4.2 Post-Processing (Optional)

If maps need annotation or touch-ups:
- **macOS:** Preview, Keynote, or Adobe Photoshop
- **Windows:** Paint.NET, GIMP, or Adobe Photoshop
- **Linux:** GIMP

Common adjustments:
- Add figure captions
- Adjust label positions
- Enhance contrast

---

## 5. Troubleshooting

### Problem: GeoJSON files not loading

**Solution:**
1. Verify file paths are correct
2. Check GeoJSON validity: https://geojson.io
3. Ensure QGIS has OGR driver enabled (should be default)

### Problem: Basemap not displaying

**Solution:**
1. Check internet connection (OpenStreetMap requires online access)
2. Alternative: Use blank canvas (remove basemap layer)
3. Try different tile server:
   ```
   https://tile.opentopomap.org/{z}/{x}/{y}.png
   ```

### Problem: Buffer appears too small/large

**Solution:**
- The 500m buffer in WGS84 (degrees) is approximate
- For accurate buffers, transform to projected CRS:
  1. Right-click layer → Set CRS → Select UTM Zone 18N (EPSG:32618 for Baltimore)
  2. Recreate buffer using meters

### Problem: Python script errors

**Solution:**
1. Ensure running in QGIS Python Console (not standalone Python)
2. Check file paths match your system
3. Update `BASE_DIR` variable to correct path
4. Run line-by-line to identify error location

### Problem: Export image is blank

**Solution:**
1. Ensure layers are visible in map canvas before exporting
2. Try Layout → Export as Image instead of map canvas export
3. Check layer order (basemap should be bottom)

---

## 6. Quick Reference Commands

### Load GeoJSON in Python Console
```python
layer = QgsVectorLayer('/path/to/file.geojson', 'Layer Name', 'ogr')
QgsProject.instance().addMapLayer(layer)
```

### Filter Layer
```python
layer.setSubsetString('"type" = \'property\'')
```

### Zoom to Layer
```python
iface.mapCanvas().setExtent(layer.extent())
iface.mapCanvas().refresh()
```

### Export Map Canvas
```python
iface.mapCanvas().saveAsImage('/path/to/output.png')
```

---

## 7. Expected Outputs

After completing all steps, you should have:

**Files:**
```
/Users/somtonweke/SOBApp/stonebridge/outputs/maps/
├── Figure_1_Baltimore_Overview.png
├── Figure_2_Downtown_Spatial_Context.png
├── Figure_3_West_Baltimore_Spatial_Context.png
└── Figure_4_East_Baltimore_Spatial_Context.png
```

**Usage in Report:**
- Embed these figures in ACADEMIC_REPORT.md
- Reference as "Figure 1", "Figure 2", etc. in text
- Include figure captions beneath each image

---

## 8. Time Estimates

| Task | Manual | Automated |
|------|--------|-----------|
| Setup QGIS | 15 min | 15 min |
| Map 1 (Overview) | 30 min | 5 min |
| Map 2 (Downtown) | 30 min | 2 min |
| Map 3 (West Baltimore) | 30 min | 2 min |
| Map 4 (East Baltimore) | 30 min | 2 min |
| Export and formatting | 20 min | 10 min |
| **Total** | **~2.5 hours** | **~30 min** |

---

## 9. Additional Resources

**QGIS Tutorials:**
- Official Docs: https://docs.qgis.org/
- YouTube: "QGIS Beginner Tutorial"

**GeoJSON Specification:**
- https://geojson.org/

**PostGIS + QGIS Integration:**
- https://docs.qgis.org/latest/en/docs/training_manual/databases/index.html

---

## Contact / Support

For questions about this guide or the StoneBridge GIS project:
- Review: `ACADEMIC_REPORT.md` for methodology details
- Review: `RESULTS_ANALYSIS.md` for data interpretation
- Check: `/Users/somtonweke/SOBApp/stonebridge/outputs/` for all generated files

---

**END OF GUIDE**

Good luck with your map generation!

#!/usr/bin/env python3
"""
StoneBridge GIS Map Generation
Generates publication-quality maps from case study GeoJSON data
No QGIS required - uses matplotlib
"""

import json
import os
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import Circle
import numpy as np

# Configuration
BASE_DIR = Path(__file__).parent.parent / 'outputs'
OUTPUT_DIR = BASE_DIR / 'maps'
OUTPUT_DIR.mkdir(exist_ok=True)

# Case study metadata
CASE_STUDIES = [
    {
        'id': 1,
        'name': 'Downtown Baltimore',
        'file': 'case_study_1_spatial_context.geojson',
        'complaints': 8,
        'vacancies': 2,
        'spatial_risk': 19,
        'color': '#FF0000'
    },
    {
        'id': 2,
        'name': 'West Baltimore',
        'file': 'case_study_2_spatial_context.geojson',
        'complaints': 28,
        'vacancies': 12,
        'spatial_risk': 70,
        'color': '#0000FF'
    },
    {
        'id': 3,
        'name': 'East Baltimore',
        'file': 'case_study_3_spatial_context.geojson',
        'complaints': 16,
        'vacancies': 6,
        'spatial_risk': 44,
        'color': '#00FF00'
    }
]

def load_geojson(filepath):
    """Load GeoJSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)

def extract_features_by_type(geojson):
    """Separate features by type"""
    features = {
        'property': [],
        'complaint': [],
        'vacancy': []
    }

    for feature in geojson['features']:
        ftype = feature['properties']['type']
        coords = feature['geometry']['coordinates']
        features[ftype].append({
            'lon': coords[0],
            'lat': coords[1],
            'properties': feature['properties']
        })

    return features

def create_spatial_context_map(case_study):
    """Generate spatial context map for a case study"""
    print(f"\n📍 Generating Map {case_study['id']}: {case_study['name']}")

    # Load GeoJSON
    geojson_path = BASE_DIR / case_study['file']
    geojson = load_geojson(geojson_path)

    # Extract features
    features = extract_features_by_type(geojson)

    # Create figure
    fig, ax = plt.subplots(figsize=(12, 10), dpi=300)

    # Plot complaints (orange circles)
    if features['complaint']:
        complaint_lons = [f['lon'] for f in features['complaint']]
        complaint_lats = [f['lat'] for f in features['complaint']]
        ax.scatter(complaint_lons, complaint_lats,
                  c='#FFA500', s=80, alpha=0.7,
                  edgecolors='#FF8C00', linewidth=1.5,
                  label=f'311 Complaints (n={len(features["complaint"])})',
                  zorder=2)

    # Plot vacancies (yellow triangles)
    if features['vacancy']:
        vacancy_lons = [f['lon'] for f in features['vacancy']]
        vacancy_lats = [f['lat'] for f in features['vacancy']]
        ax.scatter(vacancy_lons, vacancy_lats,
                  c='#FFFF00', s=120, alpha=0.9,
                  marker='^', edgecolors='black', linewidth=1.5,
                  label=f'Vacant Properties (n={len(features["vacancy"])})',
                  zorder=3)

    # Plot property (red star)
    if features['property']:
        prop = features['property'][0]
        ax.scatter([prop['lon']], [prop['lat']],
                  c='#FF0000', s=400, marker='*',
                  edgecolors='white', linewidth=3,
                  label='Target Property',
                  zorder=4)

        # Add 500m buffer circle
        # Approximate: 1 degree ≈ 111 km at Baltimore latitude
        buffer_radius_deg = 500 / 111000  # 500m in degrees
        circle = Circle((prop['lon'], prop['lat']), buffer_radius_deg,
                       fill=False, edgecolor='gray', linewidth=2,
                       linestyle='--', label='500m Buffer', zorder=1)
        ax.add_patch(circle)

    # Styling
    ax.set_xlabel('Longitude', fontsize=12, fontweight='bold')
    ax.set_ylabel('Latitude', fontsize=12, fontweight='bold')
    ax.set_title(f'Figure {case_study["id"] + 1}: {case_study["name"]} Spatial Context\n' +
                f'Spatial Risk Score: {case_study["spatial_risk"]}/100',
                fontsize=14, fontweight='bold', pad=20)

    # Grid
    ax.grid(True, alpha=0.3, linestyle=':', linewidth=0.5)

    # Legend
    ax.legend(loc='upper right', fontsize=10, framealpha=0.9)

    # Add stats box
    stats_text = (
        f'Spatial Analysis Results:\n'
        f'• Complaints within 500m: {case_study["complaints"]}\n'
        f'• Vacancies within 500m: {case_study["vacancies"]}\n'
        f'• Spatial Risk Score: {case_study["spatial_risk"]}/100'
    )
    ax.text(0.02, 0.98, stats_text,
           transform=ax.transAxes,
           fontsize=10,
           verticalalignment='top',
           bbox=dict(boxstyle='round', facecolor='white', alpha=0.9, edgecolor='gray'))

    # Set aspect ratio
    ax.set_aspect('equal', adjustable='box')

    # Tight layout
    plt.tight_layout()

    # Save
    output_path = OUTPUT_DIR / f'Figure_{case_study["id"] + 1}_{case_study["name"].replace(" ", "_")}.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()

    print(f'✅ Saved: {output_path.name}')
    return output_path

def create_overview_map():
    """Generate Baltimore overview map with all 3 properties"""
    print(f"\n🗺️  Generating Figure 1: Baltimore Overview")

    # Create figure
    fig, ax = plt.subplots(figsize=(12, 10), dpi=300)

    # Load all case studies and plot properties
    all_lons = []
    all_lats = []

    for case_study in CASE_STUDIES:
        geojson_path = BASE_DIR / case_study['file']
        geojson = load_geojson(geojson_path)
        features = extract_features_by_type(geojson)

        if features['property']:
            prop = features['property'][0]
            all_lons.append(prop['lon'])
            all_lats.append(prop['lat'])

            # Plot property
            ax.scatter([prop['lon']], [prop['lat']],
                      c=case_study['color'], s=300, marker='o',
                      edgecolors='white', linewidth=3,
                      label=f'Case Study {case_study["id"]}: {case_study["name"]}',
                      zorder=3)

            # Add label
            ax.annotate(f'CS{case_study["id"]}',
                       xy=(prop['lon'], prop['lat']),
                       xytext=(10, 10), textcoords='offset points',
                       fontsize=12, fontweight='bold',
                       bbox=dict(boxstyle='round,pad=0.5',
                               facecolor='white', alpha=0.8))

    # Styling
    ax.set_xlabel('Longitude', fontsize=12, fontweight='bold')
    ax.set_ylabel('Latitude', fontsize=12, fontweight='bold')
    ax.set_title('Figure 1: Case Study Properties - Baltimore, Maryland',
                fontsize=14, fontweight='bold', pad=20)

    # Grid
    ax.grid(True, alpha=0.3, linestyle=':', linewidth=0.5)

    # Legend
    ax.legend(loc='upper left', fontsize=10, framealpha=0.9)

    # Add north arrow
    ax.annotate('N', xy=(0.95, 0.95), xytext=(0.95, 0.85),
               xycoords='axes fraction', textcoords='axes fraction',
               fontsize=20, fontweight='bold', ha='center',
               arrowprops=dict(arrowstyle='->', lw=2))

    # Set extent with margin
    lon_margin = (max(all_lons) - min(all_lons)) * 0.2
    lat_margin = (max(all_lats) - min(all_lats)) * 0.2
    ax.set_xlim(min(all_lons) - lon_margin, max(all_lons) + lon_margin)
    ax.set_ylim(min(all_lats) - lat_margin, max(all_lats) + lat_margin)

    # Set aspect ratio
    ax.set_aspect('equal', adjustable='box')

    # Tight layout
    plt.tight_layout()

    # Save
    output_path = OUTPUT_DIR / 'Figure_1_Baltimore_Overview.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()

    print(f'✅ Saved: {output_path.name}')
    return output_path

def main():
    """Generate all maps"""
    print("=" * 60)
    print("StoneBridge GIS Map Generation")
    print("=" * 60)
    print(f"Output directory: {OUTPUT_DIR}")

    # Generate overview map
    create_overview_map()

    # Generate individual case study maps
    for case_study in CASE_STUDIES:
        create_spatial_context_map(case_study)

    print("\n" + "=" * 60)
    print("✅ All maps generated successfully!")
    print("=" * 60)
    print(f"\nGenerated files in {OUTPUT_DIR}:")
    for file in sorted(OUTPUT_DIR.glob('*.png')):
        print(f"  • {file.name}")

    print("\n📝 Next steps:")
    print("  1. Review maps in outputs/maps/ folder")
    print("  2. Insert into ACADEMIC_REPORT.md")
    print("  3. Submit your project!")

if __name__ == '__main__':
    main()

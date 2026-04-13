/**
 * StoneBridge GIS Spatial Visualization
 * Interactive Leaflet map showing PostGIS spatial analysis results
 */

(function() {
  'use strict';

  const dealId = window.DEAL_ID;
  if (!dealId) {
    console.warn('[spatial-map] No dealId found');
    return;
  }

  // Fetch spatial data from API
  fetch(`/api/spatial/${dealId}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (!data.hasCoordinates) {
        document.getElementById('spatial-map-container').innerHTML =
          '<div class="spatial-no-data">Address could not be geocoded for spatial analysis</div>';
        return;
      }

      renderSpatialMap(data);
    })
    .catch(err => {
      console.error('[spatial-map] Failed to load:', err);
      document.getElementById('spatial-map-container').innerHTML =
        '<div class="spatial-error">Spatial map could not be loaded</div>';
    });

  function renderSpatialMap(data) {
    const { center, radius, complaints, vacancies, summary } = data;

    // Initialize map centered on property
    const map = L.map('spatial-map').setView([center.lat, center.lon], 15);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Define custom icons
    const propertyIcon = L.divIcon({
      className: 'spatial-marker-property',
      html: '<div class="marker-dot marker-dot--property"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const complaintIcon = L.divIcon({
      className: 'spatial-marker-complaint',
      html: '<div class="marker-dot marker-dot--complaint"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    const vacancyIcon = L.divIcon({
      className: 'spatial-marker-vacancy',
      html: '<div class="marker-dot marker-dot--vacancy"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    // Add 500m radius circle
    L.circle([center.lat, center.lon], {
      radius: radius,
      color: '#8b5cf6',
      fillColor: '#8b5cf6',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(map);

    // Add property marker
    L.marker([center.lat, center.lon], { icon: propertyIcon })
      .addTo(map)
      .bindPopup(`
        <div class="spatial-popup">
          <div class="spatial-popup-title">Target Property</div>
          <div class="spatial-popup-address">${center.address}</div>
        </div>
      `);

    // Add complaint markers
    complaints.forEach(complaint => {
      L.marker([complaint.lat, complaint.lon], { icon: complaintIcon })
        .addTo(map)
        .bindPopup(`
          <div class="spatial-popup">
            <div class="spatial-popup-title">311 Service Request</div>
            <div class="spatial-popup-detail"><strong>${complaint.serviceName}</strong></div>
            <div class="spatial-popup-detail">${complaint.address}</div>
            <div class="spatial-popup-detail">Status: ${complaint.status}</div>
            <div class="spatial-popup-distance">${complaint.distance}m away</div>
          </div>
        `);
    });

    // Add vacancy markers
    vacancies.forEach(vacancy => {
      L.marker([vacancy.lat, vacancy.lon], { icon: vacancyIcon })
        .addTo(map)
        .bindPopup(`
          <div class="spatial-popup">
            <div class="spatial-popup-title">Vacant Property</div>
            <div class="spatial-popup-detail">${vacancy.address}</div>
            <div class="spatial-popup-detail">${vacancy.neighborhood}</div>
            <div class="spatial-popup-distance">${vacancy.distance}m away</div>
          </div>
        `);
    });

    // Update summary stats
    document.getElementById('spatial-stat-complaints').textContent = summary.complaintCount;
    document.getElementById('spatial-stat-vacancies').textContent = summary.vacancyCount;
    document.getElementById('spatial-stat-nearest-complaint').textContent =
      summary.nearestComplaint ? `${summary.nearestComplaint}m` : 'N/A';
    document.getElementById('spatial-stat-nearest-vacancy').textContent =
      summary.nearestVacancy ? `${summary.nearestVacancy}m` : 'N/A';

    // Show legend
    document.getElementById('spatial-legend').style.display = 'block';
  }
})();

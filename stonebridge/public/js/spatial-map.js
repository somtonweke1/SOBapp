/**
 * StoneBridge GIS Spatial Visualization
 * Interactive Leaflet map showing PostGIS spatial analysis results
 */

(function() {
  'use strict';

  const spatialDom = {
    mapContainer: document.getElementById('spatial-map-container'),
    statusPill: document.getElementById('spatial-status-pill'),
    overviewTitle: document.getElementById('spatial-overview-title'),
    overviewCopy: document.getElementById('spatial-overview-copy'),
    metaRadius: document.getElementById('spatial-meta-radius'),
    metaCenter: document.getElementById('spatial-meta-center'),
    mapSub: document.getElementById('spatial-map-sub'),
    legend: document.getElementById('spatial-legend'),
    activityChip: document.getElementById('spatial-activity-chip'),
    activityList: document.getElementById('spatial-activity-list'),
    takeaways: document.getElementById('spatial-takeaways')
  };

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
        setSpatialState({
          tone: 'warning',
          title: 'Spatial context unavailable',
          copy: 'The address could not be geocoded into a reliable parcel center, so the map and radius analysis were skipped for this run.'
        });
        spatialDom.mapSub.textContent = 'Geocode unavailable';
        spatialDom.metaCenter.textContent = 'No coordinates';
        spatialDom.activityChip.textContent = 'Unavailable';
        spatialDom.mapContainer.innerHTML =
          '<div class="spatial-no-data"><div class="spatial-empty-title">Spatial context unavailable</div><div class="spatial-empty-copy">This run could not place the address precisely enough to render a neighborhood radius.</div></div>';
        spatialDom.activityList.innerHTML =
          '<div class="spatial-activity-empty">No nearby activity can be shown until the address is geocoded.</div>';
        spatialDom.takeaways.innerHTML = [
          createTakeaway('No coordinate lock', 'The property-level diagnostic still ran, but neighborhood context could not be mapped.'),
          createTakeaway('Next step', 'Try a more exact street address or rerun the diagnostic after confirming the parcel format.')
        ].join('');
        return;
      }

      renderSpatialMap(data);
    })
    .catch(err => {
      console.error('[spatial-map] Failed to load:', err);
      setSpatialState({
        tone: 'danger',
        title: 'Spatial map failed to load',
        copy: 'The deal page loaded, but the live neighborhood layer did not respond cleanly.'
      });
      spatialDom.activityChip.textContent = 'Error';
      spatialDom.mapSub.textContent = 'Map request failed';
      spatialDom.mapContainer.innerHTML =
        '<div class="spatial-error"><div class="spatial-empty-title">Spatial map failed to load</div><div class="spatial-empty-copy">Reload the page to retry the radius query.</div></div>';
    });

  function renderSpatialMap(data) {
    const { center, radius, complaints, vacancies, summary } = data;
    const profile = computeSpatialProfile(summary);

    setSpatialState({
      tone: profile.tone,
      title: profile.title,
      copy: profile.copy
    });
    spatialDom.metaRadius.textContent = `${radius}m`;
    spatialDom.metaCenter.textContent = center.address;
    spatialDom.mapSub.textContent = `${summary.complaintCount} complaints and ${summary.vacancyCount} vacant properties within ${radius}m`;
    spatialDom.activityChip.textContent = profile.chip;

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
    spatialDom.legend.style.display = 'block';

    renderActivityList(complaints, vacancies);
    renderTakeaways(summary, radius);
  }

  function setSpatialState({ tone, title, copy }) {
    spatialDom.statusPill.textContent = title;
    spatialDom.statusPill.className = `spatial-pill spatial-pill--${tone}`;
    spatialDom.overviewTitle.textContent = title;
    spatialDom.overviewCopy.textContent = copy;
  }

  function computeSpatialProfile(summary) {
    const complaintCount = Number(summary?.complaintCount || 0);
    const vacancyCount = Number(summary?.vacancyCount || 0);
    const nearestComplaint = Number(summary?.nearestComplaint || 0);
    const nearestVacancy = Number(summary?.nearestVacancy || 0);

    if (complaintCount === 0 && vacancyCount === 0) {
      return {
        tone: 'calm',
        chip: 'Clean radius',
        title: 'Immediate radius looks clean',
        copy: 'No nearby 311 complaints or vacant-property hits were found inside the 500m query window.'
      };
    }

    if (vacancyCount >= 3 || complaintCount >= 8 || (nearestVacancy && nearestVacancy < 150)) {
      return {
        tone: 'danger',
        chip: 'Elevated friction',
        title: 'Radius shows visible neighborhood stress',
        copy: 'The immediate area contains enough complaints or vacancy pressure to warrant closer underwriting review.'
      };
    }

    if (complaintCount > 0 || vacancyCount > 0 || (nearestComplaint && nearestComplaint < 200)) {
      return {
        tone: 'warning',
        chip: 'Mixed context',
        title: 'Radius is readable but not friction-free',
        copy: 'Some neighborhood activity appears inside the query radius. The address is mapped, but the context is not completely quiet.'
      };
    }

    return {
      tone: 'neutral',
      chip: 'Mapped',
      title: 'Neighborhood context mapped',
      copy: 'The radius query completed and the property can be reviewed against nearby 311 and vacancy activity.'
    };
  }

  function renderActivityList(complaints, vacancies) {
    const rows = [
      ...complaints.slice(0, 3).map((item) => ({
        tone: 'complaint',
        label: item.serviceName || '311 Service Request',
        meta: item.address || 'Baltimore 311 record',
        distance: item.distance,
        detail: item.status ? `Status: ${item.status}` : '311 activity in radius'
      })),
      ...vacancies.slice(0, 3).map((item) => ({
        tone: 'vacancy',
        label: item.address || 'Vacant property',
        meta: item.neighborhood || 'Vacant building record',
        distance: item.distance,
        detail: 'Vacant property in radius'
      }))
    ]
      .sort((left, right) => (left.distance || 999999) - (right.distance || 999999))
      .slice(0, 5);

    if (!rows.length) {
      spatialDom.activityList.innerHTML =
        '<div class="spatial-activity-empty">No complaint or vacancy records were found inside this immediate radius. That is a favorable neighborhood signal, not a loading problem.</div>';
      return;
    }

    spatialDom.activityList.innerHTML = rows.map((row) => `
      <div class="spatial-activity-row">
        <div class="spatial-activity-dot spatial-activity-dot--${row.tone}"></div>
        <div class="spatial-activity-body">
          <div class="spatial-activity-row-title">${escapeHtml(row.label)}</div>
          <div class="spatial-activity-row-meta">${escapeHtml(row.meta)}</div>
          <div class="spatial-activity-row-detail">${escapeHtml(row.detail)}</div>
        </div>
        <div class="spatial-activity-distance">${row.distance ? `${row.distance}m` : 'N/A'}</div>
      </div>
    `).join('');
  }

  function renderTakeaways(summary, radius) {
    const takeaways = [];
    const complaintCount = Number(summary?.complaintCount || 0);
    const vacancyCount = Number(summary?.vacancyCount || 0);

    if (complaintCount === 0) {
      takeaways.push(createTakeaway('Complaint pressure', `No 311 complaint hits were found within ${radius}m of the target property.`));
    } else {
      takeaways.push(createTakeaway('Complaint pressure', `${complaintCount} complaint record${complaintCount === 1 ? '' : 's'} sit within ${radius}m, with the closest ${summary.nearestComplaint ? `at ${summary.nearestComplaint}m` : 'inside the radius'}.`));
    }

    if (vacancyCount === 0) {
      takeaways.push(createTakeaway('Vacancy exposure', `No vacant-property records appear inside the ${radius}m walk-shed around this address.`));
    } else {
      takeaways.push(createTakeaway('Vacancy exposure', `${vacancyCount} vacant propert${vacancyCount === 1 ? 'y appears' : 'ies appear'} in the radius, nearest ${summary.nearestVacancy ? `${summary.nearestVacancy}m away` : 'inside the zone'}.`));
    }

    if (complaintCount === 0 && vacancyCount === 0) {
      takeaways.push(createTakeaway('Decision read', 'The map supports a cleaner immediate-block story. If deal risk remains high, it is likely coming from property-specific or sponsor-specific signals rather than neighborhood distress.'));
    } else {
      takeaways.push(createTakeaway('Decision read', 'Use this radius as a neighborhood cross-check. If the document score and the map diverge, treat that mismatch as a diligence prompt rather than ignoring one side.'));
    }

    spatialDom.takeaways.innerHTML = takeaways.join('');
  }

  function createTakeaway(title, copy) {
    return `
      <div class="spatial-takeaway">
        <div class="spatial-takeaway-title">${escapeHtml(title)}</div>
        <div class="spatial-takeaway-copy">${escapeHtml(copy)}</div>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();

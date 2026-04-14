/**
 * StoneBridge GIS Spatial Visualization
 * Turns neighborhood context into a decision module and uses the map as evidence.
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
    takeaways: document.getElementById('spatial-takeaways'),
    verdictWord: document.getElementById('spatial-verdict-word'),
    scoreChip: document.getElementById('spatial-score-chip'),
    confidenceChip: document.getElementById('spatial-confidence-chip'),
    decisionCopy: document.getElementById('spatial-decision-copy'),
    documentRisk: document.getElementById('spatial-document-risk'),
    neighborhoodRisk: document.getElementById('spatial-neighborhood-risk'),
    gap: document.getElementById('spatial-gap'),
    divergenceTitle: document.getElementById('spatial-divergence-title'),
    divergenceCopy: document.getElementById('spatial-divergence-copy'),
    patternTitle: document.getElementById('spatial-pattern-title'),
    patternCopy: document.getElementById('spatial-pattern-copy'),
    patternFacts: document.getElementById('spatial-pattern-facts'),
    actionTitle: document.getElementById('spatial-action-title'),
    actionCopy: document.getElementById('spatial-action-copy')
  };

  const dealId = window.DEAL_ID;
  if (!dealId) {
    console.warn('[spatial-map] No dealId found');
    return;
  }

  fetch(`/api/spatial/${dealId}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (!data.hasCoordinates) {
        renderUnavailableState();
        return;
      }
      renderSpatialModule(data);
    })
    .catch((error) => {
      console.error('[spatial-map] Failed to load:', error);
      renderErrorState();
    });

  function renderSpatialModule(data) {
    const { center, radius, complaints, vacancies, summary, decision } = data;
    const profile = computeSpatialProfile(decision, summary);

    setSpatialState(profile.tone, profile.title, profile.copy);
    setDecisionModule(decision);
    spatialDom.metaRadius.textContent = `${radius}m`;
    spatialDom.metaCenter.textContent = center.address;
    spatialDom.mapSub.textContent = `${summary.complaintCount} complaints and ${summary.vacancyCount} vacant properties within ${radius}m. Map is evidence, not the headline.`;
    spatialDom.activityChip.textContent = profile.chip;

    renderMap(center, radius, complaints, vacancies);
    renderStats(summary);
    renderActivityList(complaints, vacancies);
    renderTakeaways(summary, radius, decision);
    spatialDom.legend.style.display = 'block';
  }

  function renderUnavailableState() {
    setSpatialState(
      'warning',
      'Spatial context unavailable',
      'The address could not be geocoded into a reliable parcel center, so the map and radius analysis were skipped for this run.'
    );
    setDecisionModule({
      spatialVerdict: 'Unavailable',
      spatialRisk: '—',
      confidence: { level: 'Low' },
      summarySentence: 'Neighborhood context could not be computed for this run.',
      divergence: {
        documentRisk: Number(document.querySelector('#score-target')?.dataset.score || 0),
        spatialRisk: '—',
        gap: null,
        title: 'No divergence read',
        interpretation: 'Without a coordinate lock, the platform cannot compare neighborhood context against the document screen.'
      },
      pattern: {
        label: 'Pattern unavailable',
        description: 'The radius could not be anchored to a reliable Baltimore parcel center.'
      },
      action: 'Retry with a more exact street address or use a locally matched parcel format.',
      indicators: {
        complaints: { count: 0 },
        vacancy: { count: 0, nearestDistanceMeters: null },
        floodZone: { inFloodZone: false },
        zoning: { zoningCode: null }
      },
      geocode: { source: 'unresolved' }
    });
    spatialDom.mapSub.textContent = 'Geocode unavailable';
    spatialDom.metaCenter.textContent = 'No coordinates';
    spatialDom.activityChip.textContent = 'Unavailable';
    spatialDom.mapContainer.innerHTML = '<div class="spatial-no-data"><div class="spatial-empty-title">Spatial context unavailable</div><div class="spatial-empty-copy">This run could not place the address precisely enough to render a neighborhood radius.</div></div>';
    spatialDom.activityList.innerHTML = '<div class="spatial-activity-empty">No nearby activity can be shown until the address is geocoded.</div>';
    spatialDom.takeaways.innerHTML = [
      createTakeaway('No coordinate lock', 'The parcel screen still ran, but neighborhood context could not be mapped.'),
      createTakeaway('Next step', 'Use a full street address with exact Baltimore formatting or rerun after parcel normalization.')
    ].join('');
  }

  function renderErrorState() {
    setSpatialState(
      'danger',
      'Spatial map failed to load',
      'The deal page loaded, but the neighborhood context service did not respond cleanly.'
    );
    spatialDom.activityChip.textContent = 'Error';
    spatialDom.mapSub.textContent = 'Map request failed';
    spatialDom.mapContainer.innerHTML = '<div class="spatial-error"><div class="spatial-empty-title">Spatial map failed to load</div><div class="spatial-empty-copy">Reload the page to retry the radius query.</div></div>';
  }

  function renderMap(center, radius, complaints, vacancies) {
    const map = L.map('spatial-map').setView([center.lat, center.lon], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

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

    L.circle([center.lat, center.lon], {
      radius,
      color: '#8b5cf6',
      fillColor: '#8b5cf6',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(map);

    L.marker([center.lat, center.lon], { icon: propertyIcon })
      .addTo(map)
      .bindPopup(`
        <div class="spatial-popup">
          <div class="spatial-popup-title">Target property</div>
          <div class="spatial-popup-address">${escapeHtml(center.address)}</div>
        </div>
      `);

    complaints.forEach((complaint) => {
      L.marker([complaint.lat, complaint.lon], { icon: complaintIcon })
        .addTo(map)
        .bindPopup(`
          <div class="spatial-popup">
            <div class="spatial-popup-title">311 service request</div>
            <div class="spatial-popup-detail"><strong>${escapeHtml(complaint.serviceName)}</strong></div>
            <div class="spatial-popup-detail">${escapeHtml(complaint.address)}</div>
            <div class="spatial-popup-detail">Status: ${escapeHtml(complaint.status)}</div>
            <div class="spatial-popup-distance">${complaint.distance}m away</div>
          </div>
        `);
    });

    vacancies.forEach((vacancy) => {
      L.marker([vacancy.lat, vacancy.lon], { icon: vacancyIcon })
        .addTo(map)
        .bindPopup(`
          <div class="spatial-popup">
            <div class="spatial-popup-title">Vacant property</div>
            <div class="spatial-popup-detail">${escapeHtml(vacancy.address)}</div>
            <div class="spatial-popup-detail">${escapeHtml(vacancy.neighborhood || 'Baltimore City')}</div>
            <div class="spatial-popup-distance">${vacancy.distance}m away</div>
          </div>
        `);
    });
  }

  function renderStats(summary) {
    document.getElementById('spatial-stat-complaints').textContent = summary.complaintCount;
    document.getElementById('spatial-stat-vacancies').textContent = summary.vacancyCount;
    document.getElementById('spatial-stat-nearest-complaint').textContent = summary.nearestComplaint ? `${summary.nearestComplaint}m` : 'N/A';
    document.getElementById('spatial-stat-nearest-vacancy').textContent = summary.nearestVacancy ? `${summary.nearestVacancy}m` : 'N/A';
  }

  function setSpatialState(tone, title, copy) {
    spatialDom.statusPill.textContent = title;
    spatialDom.statusPill.className = `spatial-pill spatial-pill--${tone}`;
    spatialDom.overviewTitle.textContent = title;
    spatialDom.overviewCopy.textContent = copy;
  }

  function setDecisionModule(decision) {
    spatialDom.verdictWord.textContent = String(decision?.spatialVerdict || 'Unknown').replace(/_/g, ' ');
    spatialDom.scoreChip.textContent = `Spatial score ${decision?.spatialRisk ?? '—'}`;
    spatialDom.confidenceChip.textContent = `${decision?.confidence?.level || 'Unknown'} confidence`;
    spatialDom.decisionCopy.textContent = decision?.summarySentence || 'Neighborhood context loaded.';
    spatialDom.documentRisk.textContent = String(decision?.divergence?.documentRisk ?? decision?.documentRisk ?? '—');
    spatialDom.neighborhoodRisk.textContent = String(decision?.spatialRisk ?? '—');
    spatialDom.gap.textContent = formatGap(decision?.divergence?.gap);
    spatialDom.divergenceTitle.textContent = decision?.divergence?.title || 'No divergence read';
    spatialDom.divergenceCopy.textContent = decision?.divergence?.interpretation || '';
    spatialDom.patternTitle.textContent = decision?.pattern?.label || 'Neighborhood pattern pending';
    spatialDom.patternCopy.textContent = decision?.pattern?.description || '';
    spatialDom.patternFacts.innerHTML = buildPatternFacts(decision);
    spatialDom.actionTitle.textContent = `Action: ${String(decision?.spatialVerdict || 'Review').replace(/_/g, ' ')}`;
    spatialDom.actionCopy.textContent = decision?.action || '';
  }

  function computeSpatialProfile(decision, summary) {
    if (decision?.divergence?.mode === 'HIDDEN_NEIGHBORHOOD_RISK') {
      return {
        tone: 'danger',
        chip: 'Hidden neighborhood risk',
        title: 'The neighborhood context is harsher than the document screen',
        copy: decision.summarySentence
      };
    }
    if (decision?.divergence?.mode === 'PROPERTY_SPECIFIC_RISK') {
      return {
        tone: 'calm',
        chip: 'Property-specific caution',
        title: 'Neighborhood context offsets part of the parcel risk',
        copy: decision.summarySentence
      };
    }
    if (decision?.spatialVerdict === 'ESCALATE') {
      return {
        tone: 'danger',
        chip: 'Concentrated distress',
        title: 'Neighborhood context escalates the deal',
        copy: decision.summarySentence
      };
    }
    if ((summary?.complaintCount || 0) === 0 && (summary?.vacancyCount || 0) === 0) {
      return {
        tone: 'calm',
        chip: 'Clean radius',
        title: 'Immediate radius looks clean',
        copy: decision?.summarySentence || 'No nearby distress indicators were found inside the walk-shed.'
      };
    }
    return {
      tone: decision?.spatialVerdict === 'CAUTION' ? 'warning' : 'neutral',
      chip: decision?.pattern?.label || 'Mapped',
      title: decision?.pattern?.label || 'Neighborhood context mapped',
      copy: decision?.summarySentence || 'The radius query completed and can now be compared against the document screen.'
    };
  }

  function buildPatternFacts(decision) {
    if (!decision) return '<div class="spatial-pattern-fact">Pattern facts unavailable.</div>';
    const facts = [
      `${decision.indicators?.complaints?.count ?? 0} complaint hit${decision.indicators?.complaints?.count === 1 ? '' : 's'} in 500m`,
      `${decision.indicators?.vacancy?.count ?? 0} vacanc${decision.indicators?.vacancy?.count === 1 ? 'y' : 'ies'} in 500m`,
      `Nearest vacancy ${decision.indicators?.vacancy?.nearestDistanceMeters ?? 'N/A'}m`,
      `Complaint baseline ${decision.indicators?.complaints?.bandLabel || 'unavailable'}`,
      `Geocode ${decision.geocode?.source || 'unknown'} / ${decision.confidence?.level || 'Unknown'} confidence`
    ];
    if (decision.indicators?.floodZone?.inFloodZone) facts.push(`Flood zone ${decision.indicators.floodZone.floodZoneType || 'present'}`);
    if (decision.indicators?.zoning?.zoningCode) facts.push(`Zoning ${decision.indicators.zoning.zoningCode}`);
    return facts.map((item) => `<div class="spatial-pattern-fact">${escapeHtml(item)}</div>`).join('');
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
    ].sort((a, b) => (a.distance || 999999) - (b.distance || 999999)).slice(0, 5);

    if (!rows.length) {
      spatialDom.activityList.innerHTML = '<div class="spatial-activity-empty">No complaint or vacancy records were found inside this radius. That is a clean neighborhood signal, not a loading problem.</div>';
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

  function renderTakeaways(summary, radius, decision) {
    const complaintCount = Number(summary?.complaintCount || 0);
    const vacancyCount = Number(summary?.vacancyCount || 0);
    const takeaways = [];

    if (complaintCount === 0) takeaways.push(createTakeaway('Complaint pressure', `No 311 complaint hits were found within ${radius}m of the target property.`));
    else takeaways.push(createTakeaway('Complaint pressure', `${complaintCount} complaint record${complaintCount === 1 ? '' : 's'} sit within ${radius}m, with the closest ${summary.nearestComplaint ? `at ${summary.nearestComplaint}m` : 'inside the radius'}.`));

    if (vacancyCount === 0) takeaways.push(createTakeaway('Vacancy exposure', `No vacant-property records appear inside the ${radius}m walk-shed around this address.`));
    else takeaways.push(createTakeaway('Vacancy exposure', `${vacancyCount} vacant propert${vacancyCount === 1 ? 'y appears' : 'ies appear'} in the radius, nearest ${summary.nearestVacancy ? `${summary.nearestVacancy}m away` : 'inside the zone'}.`));

    if (decision?.divergence?.mode === 'PROPERTY_SPECIFIC_RISK') {
      takeaways.push(createTakeaway('Decision read', 'Neighborhood conditions are cleaner than the document screen. Focus diligence on the parcel, sponsor, or execution mechanics first.'));
    } else if (decision?.divergence?.mode === 'HIDDEN_NEIGHBORHOOD_RISK') {
      takeaways.push(createTakeaway('Decision read', 'The map is surfacing hidden neighborhood risk. Do not let a low document score erase visible block-level pressure.'));
    } else if (decision?.divergence?.mode === 'CONVERGENT_RISK') {
      takeaways.push(createTakeaway('Decision read', 'The map and the parcel screen are reinforcing each other. Treat the risk as structural rather than incidental.'));
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

  function formatGap(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '—';
    return numeric > 0 ? `+${numeric}` : String(numeric);
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

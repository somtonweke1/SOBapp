'use client';

import { useEffect, useMemo, useState } from 'react';
import Map, { Marker, Source, Layer, type ViewStateChangeEvent } from 'react-map-gl/maplibre';

export type ForensicMode = 'asset' | 'compliance';

export interface ForensicMapProps {
  mode: ForensicMode;
  onSelectProperty: (property: any) => void;
  focusPoint?: { lat: number; lng: number; zoom?: number } | null;
  assetRecords?: AssetRecord[];
  complianceSites?: ComplianceSite[];
}

type AssetRecord = {
  id: string;
  address: string;
  position: { lat: number; lng: number };
  lienAmount?: number;
  remediationCost?: number;
  historicalUse?: Array<'dental' | 'medical'>;
};

type ComplianceSite = {
  id: string;
  name: string;
  address: string;
  position: { lat: number; lng: number };
  monthlySpend: number;
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

function currency(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function IconBadge({
  variant,
  title,
  subtitle,
}: {
  variant: 'lien' | 'risk' | 'clinic' | 'cluster';
  title: string;
  subtitle?: string;
}) {
  const palette =
    variant === 'lien'
      ? { bg: 'bg-rose-600', ring: 'ring-rose-200', text: 'text-white' }
      : variant === 'risk'
        ? { bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-white' }
        : variant === 'clinic'
          ? { bg: 'bg-indigo-600', ring: 'ring-indigo-200', text: 'text-white' }
          : { bg: 'bg-emerald-600', ring: 'ring-emerald-200', text: 'text-white' };

  const glyph =
    variant === 'clinic' ? (
      // shield
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ) : variant === 'cluster' ? (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M8 7h8M6 12h12M8 17h8" />
      </svg>
    ) : (
      // exclamation for lien/risk
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    );

  return (
    <div className="flex items-center gap-2">
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${palette.bg} ${palette.text} ring-4 ${palette.ring} shadow-sm`}
      >
        {glyph}
      </div>
      <div className="hidden sm:block">
        <div className="text-xs font-semibold text-gray-900">{title}</div>
        {subtitle ? <div className="text-[11px] text-gray-600">{subtitle}</div> : null}
      </div>
    </div>
  );
}

export default function ForensicMap({
  mode,
  onSelectProperty,
  focusPoint,
  assetRecords = [],
  complianceSites = [],
}: ForensicMapProps) {
  const [viewState, setViewState] = useState({
    longitude: -76.6122,
    latitude: 39.2904,
    zoom: 12.25,
    pitch: 0,
    bearing: 0,
  });

  useEffect(() => {
    if (!focusPoint) return;
    setViewState((prev) => ({
      ...prev,
      longitude: focusPoint.lng,
      latitude: focusPoint.lat,
      zoom: focusPoint.zoom ?? Math.max(prev.zoom, 13.25),
    }));
  }, [focusPoint]);

  const assetPins = useMemo(() => {
    const liens = assetRecords.filter((p) => (p.lienAmount ?? 0) > 0);
    const risks = assetRecords.filter((p) => !p.lienAmount && (p.historicalUse?.length ?? 0) > 0);
    return { liens, risks };
  }, [assetRecords]);

  const routeGeoJson = useMemo(() => {
    const coords = complianceSites.map((s) => [s.position.lng, s.position.lat]);
    return {
      type: 'FeatureCollection' as const,
      features: coords.length >= 2 ? [
        {
          type: 'Feature' as const,
          properties: { label: 'Bundled Route' },
          geometry: { type: 'LineString' as const, coordinates: coords },
        },
      ] : [],
    };
  }, [complianceSites]);

  const clusterSummary = useMemo(() => {
    if (complianceSites.length === 0) return null;
    const avgSpend = complianceSites.reduce((sum, s) => sum + s.monthlySpend, 0) / complianceSites.length;
    return {
      id: 'route-cluster',
      type: 'route_cluster',
      density: 'High',
      estSavingsPct: 30,
      estSavingsMonthly: avgSpend * 0.3,
      count: complianceSites.length,
      position: {
        lat: complianceSites.reduce((sum, s) => sum + s.position.lat, 0) / complianceSites.length,
        lng: complianceSites.reduce((sum, s) => sum + s.position.lng, 0) / complianceSites.length,
      },
    };
  }, [complianceSites]);

  const showCluster = mode === 'compliance' && !!clusterSummary && viewState.zoom < 12.1;

  return (
    <div className="relative h-full w-full">
      <Map
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        reuseMaps
        attributionControl={false}
        maxZoom={17}
        minZoom={10}
      >
        {mode === 'compliance' ? (
          <>
            <Source id="bundled-route" type="geojson" data={routeGeoJson}>
              <Layer
                id="route-line"
                type="line"
                paint={{
                  'line-color': '#059669',
                  'line-width': 4,
                  'line-opacity': 0.55,
                }}
              />
              <Layer
                id="route-line-glow"
                type="line"
                paint={{
                  'line-color': '#10b981',
                  'line-width': 10,
                  'line-opacity': 0.15,
                }}
              />
            </Source>

            {complianceSites.map((site) => (
              <Marker
                key={site.id}
                longitude={site.position.lng}
                latitude={site.position.lat}
                anchor="bottom"
              >
                <button
                  type="button"
                  onClick={() =>
                    onSelectProperty({
                      type: 'dental_site',
                      ...site,
                      estSavingsPct: 30,
                      estSavingsMonthly: site.monthlySpend * 0.3,
                    })
                  }
                  className="rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/40"
                >
                  <IconBadge
                    variant="clinic"
                    title={site.name}
                    subtitle={`Est. savings: $${currency(site.monthlySpend * 0.3)}/mo`}
                  />
                </button>
              </Marker>
            ))}

            {showCluster && clusterSummary ? (
              <Marker longitude={clusterSummary.position.lng} latitude={clusterSummary.position.lat} anchor="bottom">
                <button
                  type="button"
                  onClick={() => onSelectProperty(clusterSummary)}
                  className="rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                >
                  <IconBadge
                    variant="cluster"
                    title={`Route Density: ${clusterSummary.density}`}
                    subtitle={`${clusterSummary.count} sites in bundle`}
                  />
                </button>
              </Marker>
            ) : null}
          </>
        ) : (
          <>
            {assetPins.liens.map((property) => (
              <Marker
                key={property.id}
                longitude={property.position.lng}
                latitude={property.position.lat}
                anchor="bottom"
              >
                <button
                  type="button"
                  onClick={() =>
                    onSelectProperty({
                      type: 'asset_property',
                      ...property,
                      primarySignal: 'DPW Lien',
                    })
                  }
                  className="rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-600/40"
                >
                  <IconBadge
                    variant="lien"
                    title="Active DPW Lien"
                    subtitle={`$${currency(property.lienAmount ?? 0)} recoverable`}
                  />
                </button>
              </Marker>
            ))}

            {assetPins.risks.map((property) => (
              <Marker
                key={property.id}
                longitude={property.position.lng}
                latitude={property.position.lat}
                anchor="bottom"
              >
                <button
                  type="button"
                  onClick={() =>
                    onSelectProperty({
                      type: 'asset_property',
                      ...property,
                      primarySignal: 'Historical Medical/Dental',
                    })
                  }
                  className="rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <IconBadge
                    variant="risk"
                    title="Historical Medical/Dental"
                    subtitle={`Est. remediation: $${currency(property.remediationCost ?? 0)}`}
                  />
                </button>
              </Marker>
            ))}
          </>
        )}
      </Map>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-xl border border-gray-200 bg-white/90 p-3 shadow-sm backdrop-blur">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Active Layer</div>
        <div className="mt-1 flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${mode === 'asset' ? 'bg-rose-600' : 'bg-indigo-600'}`} />
          <div className="text-sm font-semibold text-gray-900">
            {mode === 'asset' ? 'Lien & Risk Scan' : 'Route Density Scan'}
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-600">
          {mode === 'asset'
            ? 'Red: DPW liens. Amber: historical dental/medical usage.'
            : 'Blue: active clinics. Green: bundled pickup route.'}
        </div>
      </div>
    </div>
  );
}

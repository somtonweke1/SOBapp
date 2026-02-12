import { NextResponse } from 'next/server';
import {
  fetch311WaterRequests,
  fetchForeclosureFilings,
  fetchPermits,
  hasEnvironmentalRisk,
  normalizeAddress,
} from '@/lib/data-sources';

export const runtime = 'nodejs';

type NodePayload = {
  id: string;
  type: 'mining_site' | 'processing_facility' | 'research_lab' | 'logistics_hub';
  name: string;
  address?: string;
  position: { lat: number; lng: number; elevation: number };
    data: {
      production: number;
      efficiency: number;
      status: 'operational' | 'maintenance' | 'offline';
      connections: string[];
      lienTotal?: number;
      riskProfile?: string;
      distressType?: 'DISTRESS_RED' | 'ENVIRONMENTAL_RISK' | 'STANDARD';
      evidence?: {
        serviceRequestId?: string;
        foreclosureId?: string;
        foreclosureStatus?: string;
        filingDate?: string;
        openedDate?: string;
      };
      permits?: Array<{
        type: 'dental' | 'medical' | 'environmental' | 'other';
        isHistorical: boolean;
      }>;
  };
};

const parseNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickLatLng = (record: Record<string, unknown>) => {
  const lat = parseNumber(record.latitude ?? record.lat ?? record.y, 39.2904);
  const lng = parseNumber(record.longitude ?? record.lon ?? record.lng ?? record.x, -76.6122);
  return { lat, lng };
};

export async function GET(request: Request) {
  try {
    const accessKey = process.env.OPS_ACCESS_KEY;
    const providedKey = new URL(request.url).searchParams.get('key') || request.headers.get('x-ops-key');
    if (accessKey && providedKey !== accessKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const zipCode = new URL(request.url).searchParams.get('zipCode');
    const zipFilter = zipCode ? zipCode.split(',').map((zip) => zip.trim()).filter(Boolean) : [];

    const [waterRequests, foreclosureRecords, permitRecords] = await Promise.all([
      fetch311WaterRequests(250, zipFilter),
      fetchForeclosureFilings(250, zipFilter),
      fetchPermits(250, zipFilter),
    ]);

    const foreclosureByAddress = new Map<string, Record<string, unknown>>();
    foreclosureRecords.forEach((record) => {
      const address = String(
        record.address || record.property_address || record.location || record.site_address || ''
      );
      const normalized = normalizeAddress(address);
      if (!normalized) return;
      if (!foreclosureByAddress.has(normalized)) {
        foreclosureByAddress.set(normalized, record);
      }
    });

    const permitsByAddress = new Map<string, Record<string, unknown>[]>();
    permitRecords.forEach((record) => {
      const address = String(record.address || '');
      const normalized = normalizeAddress(address);
      if (!normalized) return;
      const entry = permitsByAddress.get(normalized) || [];
      entry.push(record);
      permitsByAddress.set(normalized, entry);
    });

    const nodes: NodePayload[] = [];

    waterRequests.forEach((request, index) => {
      const normalized = normalizeAddress(request.address || '');
      if (!normalized) return;
      const foreclosure = foreclosureByAddress.get(normalized);
      if (!foreclosure) return;

      const { lat, lng } = pickLatLng(foreclosure as Record<string, unknown>);
      nodes.push({
        id: `distress-${index}`,
        type: 'processing_facility',
        name: request.address || 'Distress Node',
        address: request.address,
        position: { lat, lng, elevation: 12 },
        data: {
          production: 0,
          efficiency: 62,
          status: 'maintenance',
          connections: [],
          lienTotal: 1500,
          riskProfile: 'Operational Deadlock',
          distressType: 'DISTRESS_RED',
          evidence: {
            serviceRequestId: request.serviceRequestId,
            foreclosureId: String((foreclosure as Record<string, unknown>).case_number || (foreclosure as Record<string, unknown>).fileid || ''),
            foreclosureStatus: String((foreclosure as Record<string, unknown>).status || 'Open'),
            filingDate: String((foreclosure as Record<string, unknown>).filing_date || (foreclosure as Record<string, unknown>).filedate || ''),
            openedDate: request.openedAt,
          },
        },
      });
    });

    permitsByAddress.forEach((records, normalized) => {
      const riskPermit = records.find((record) =>
        hasEnvironmentalRisk({
          address: String(record.address || record.location || ''),
          permitDate: String(record.permit_date || record.issue_date || ''),
          permitType: String(record.permit_type || record.permitcategory || record.permit || ''),
          description: String(record.description || record.work_description || ''),
        })
      );

      if (!riskPermit) return;
      const address = String(riskPermit.address || riskPermit.location || '');
      const { lat, lng } = pickLatLng(riskPermit as Record<string, unknown>);
      nodes.push({
        id: `risk-${normalized}`,
        type: 'research_lab',
        name: address || 'Environmental Risk Node',
        address,
        position: { lat, lng, elevation: 10 },
        data: {
          production: 0,
          efficiency: 70,
          status: 'operational',
          connections: [],
          lienTotal: 0,
          riskProfile: 'CERCLA High Priority',
          distressType: 'ENVIRONMENTAL_RISK',
          permits: [{ type: 'medical', isHistorical: true }],
        },
      });
    });

    return NextResponse.json(
      { nodes },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Node scan error:', error);
    return NextResponse.json({ error: 'Failed to scan nodes' }, { status: 500 });
  }
}

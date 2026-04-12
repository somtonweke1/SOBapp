import {
  parseBidsUsaMarylandHtml,
  parseDgsBidsAwardsHtml,
  parseMarylandBidsHtml,
} from '@/lib/api/procurement-live';

describe('procurement-live parsers', () => {
  it('parses DGS bid and award entries with vendor data', () => {
    const html = `
      <div>Description:</div>
      <div>Roof Replacement</div>
      <div>Status:</div>
      <div>Awarded</div>
      <div>Vendor:</div>
      <div>Acme Roofing LLC</div>
      <div>Award Start Date:</div>
      <div>2026-03-01</div>
      <div>Award End Date:</div>
      <div>2026-08-01</div>
      <div>Bid No:</div>
      <div>DGS-001</div>
      <div>Category:</div>
      <div>Construction</div>
    `;

    const result = parseDgsBidsAwardsHtml(html);

    expect(result.contracts).toHaveLength(1);
    expect(result.contracts[0].vendor).toBe('Acme Roofing LLC');
    expect(result.contracts[0].activityType).toBe('award');
    expect(result.summary.recordsDetected).toBe(1);
    expect(result.summary.status).toBe('live');
  });

  it('parses MarylandBids low bidder listings', () => {
    const html = `
      <a>Harkins Contracting, Inc. Low Bidder on Snow Hill Library Renovation in Maryland at 125,000 USD</a>
      <div>Added/Updated Solicitation Title 03/18/26</div>
    `;

    const result = parseMarylandBidsHtml(html);

    expect(result.contracts).toHaveLength(1);
    expect(result.contracts[0].vendor).toBe('Harkins Contracting, Inc.');
    expect(result.contracts[0].amount).toBe(125000);
    expect(result.contracts[0].activityType).toBe('low_bidder');
    expect(result.summary.lastUpdatedAt).toBe('2026-03-18');
  });

  it('parses bidsUSA page as solicitation telemetry only', () => {
    const html = `
      <div>Last updated on Tuesday, March 18, 2026</div>
      <div>RFP Source: SAM.GOV Contract Opportunities - Maryland</div>
      <div>RFP Source: SAM.GOV Contract Opportunities - Maryland</div>
    `;

    const result = parseBidsUsaMarylandHtml(html);

    expect(result.contracts).toHaveLength(0);
    expect(result.summary.recordsDetected).toBe(2);
    expect(result.summary.activityType).toBe('solicitations');
    expect(result.summary.lastUpdatedAt).toBe('2026-03-18');
  });
});

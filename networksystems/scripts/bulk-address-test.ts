import { performForensicScan } from '../src/lib/api/forensic-scan';

const ADDRESSES = [
  '1507 Laurens St, Baltimore, MD 21217',
  '2121 N Broadway, Baltimore, MD 21213',
  '3210 Greenmount Ave, Baltimore, MD 21218',
  '412 E 33rd St, Baltimore, MD 21218',
  '1823 W North Ave, Baltimore, MD 21217',
  '2800 Keyworth Ave, Baltimore, MD 21215',
  '3601 Cottage Ave, Baltimore, MD 21215',
  '1634 E Chase St, Baltimore, MD 21213',
  '2419 Barclay St, Baltimore, MD 21218',
  '3318 Woodland Ave, Baltimore, MD 21215',
  '25 W Fayette St, Baltimore, MD 21201',
  '1509 Havenwood Road, Baltimore, MD 21218',
  '801 W Fayette St, Baltimore, MD 21201',
  '300 E Lombard St, Baltimore, MD 21202',
  '1 E Pratt St, Baltimore, MD 21202',
  '2600 N Howard St, Baltimore, MD 21218',
  '400 W Lexington St, Baltimore, MD 21201',
  '3500 Boston St, Baltimore, MD 21224',
  '100 S Charles St, Baltimore, MD 21201',
  '2210 W Fayette St, Baltimore, MD 21223',
  '1400 Aliceanna St, Baltimore, MD 21231',
  '2000 E Monument St, Baltimore, MD 21205',
  '3000 Erdman Ave, Baltimore, MD 21213',
  '1100 Wicomico St, Baltimore, MD 21230',
  '4000 Frederick Ave, Baltimore, MD 21229',
  '2700 W Baltimore St, Baltimore, MD 21223',
  '1800 N Fulton Ave, Baltimore, MD 21217',
  '3200 Belair Rd, Baltimore, MD 21213',
  '500 W Coldspring Lane, Baltimore, MD 21210',
  '2100 E Federal St, Baltimore, MD 21213',
] as const;

type ScannerReport = Awaited<ReturnType<typeof performForensicScan>>;

type ParsedAddress = {
  houseNumber: string | null;
  direction: string | null;
  streetName: string | null;
  streetType: string | null;
  zipCode: string | null;
};

type RunRecord = {
  address: string;
  report: ScannerReport;
  durationMs: number;
  likelyWrongProperty: boolean;
  failureReason: string | null;
};

const TYPE_ALIASES: Record<string, { short: string; full: string }> = {
  ST: { short: 'St', full: 'Street' },
  STREET: { short: 'St', full: 'Street' },
  AVE: { short: 'Ave', full: 'Avenue' },
  AVENUE: { short: 'Ave', full: 'Avenue' },
  RD: { short: 'Rd', full: 'Road' },
  ROAD: { short: 'Rd', full: 'Road' },
  LN: { short: 'Ln', full: 'Lane' },
  LANE: { short: 'Ln', full: 'Lane' },
};

function parseAddress(address: string): ParsedAddress {
  const upper = address
    .toUpperCase()
    .replace(/,\s*BALTIMORE\s*,\s*MD/, '')
    .replace(/,\s*MD/, '')
    .replace(/,\s*BALTIMORE/, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const zipMatch = upper.match(/\b(\d{5})\b/);
  const zipCode = zipMatch?.[1] ?? null;
  const withoutZip = zipCode ? upper.replace(zipCode, '').trim() : upper;
  const parts = withoutZip.split(' ').filter(Boolean);

  const houseNumber = parts[0] ?? null;
  const direction = parts[1] && ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'].includes(parts[1]) ? parts[1] : null;
  const tail = direction ? parts.slice(2) : parts.slice(1);
  const maybeType = tail[tail.length - 1] ?? null;
  const streetType = maybeType && TYPE_ALIASES[maybeType] ? maybeType : null;
  const streetName = streetType ? tail.slice(0, -1).join(' ') : tail.join(' ');

  return {
    houseNumber,
    direction,
    streetName: streetName || null,
    streetType,
    zipCode,
  };
}

function normalizedCore(address: string) {
  const parsed = parseAddress(address);
  return {
    houseNumber: parsed.houseNumber,
    direction: parsed.direction,
    streetName: parsed.streetName,
  };
}

function likelyWrongProperty(queryAddress: string, returnedAddress: string | undefined) {
  if (!returnedAddress) return false;
  const query = normalizedCore(queryAddress);
  const returned = normalizedCore(returnedAddress);

  return Boolean(
    query.houseNumber &&
      returned.houseNumber &&
      (query.houseNumber !== returned.houseNumber ||
        (query.streetName && returned.streetName && query.streetName !== returned.streetName) ||
        ((query.direction || null) !== (returned.direction || null)))
  );
}

function decisionLabel(report: ScannerReport) {
  if (report.status === 'not_found') return 'NOT FOUND';
  if (report.decision.outcome === 'proceed') return 'PROCEED';
  if (report.decision.outcome === 'caution') return 'CAUTION';
  if (report.decision.outcome === 'escalate') return 'ESCALATE';
  return 'INSUFFICIENT DATA';
}

function datasetLabel(status: ScannerReport['datasets']['permits']['status']) {
  switch (status) {
    case 'returned_data':
      return 'returned data';
    case 'no_records_found':
      return 'no records';
    default:
      return 'unavailable';
  }
}

async function runOne(address: string): Promise<RunRecord> {
  const started = Date.now();
  const report = await performForensicScan(address, 'asset');
  const durationMs = Date.now() - started;
  const wrongProperty = likelyWrongProperty(address, report.subject?.address);
  const failureReason =
    report.status === 'error'
      ? report.logs[report.logs.length - 1] || 'Unknown error'
      : report.status === 'not_found'
        ? report.decision.rationale[0] || 'Not found'
        : null;

  return {
    address,
    report,
    durationMs,
    likelyWrongProperty: wrongProperty,
    failureReason,
  };
}

function buildVariants(address: string) {
  const parsed = parseAddress(address);
  const variants = new Set<string>();

  const type = parsed.streetType ? TYPE_ALIASES[parsed.streetType] : null;
  const lineWithType = [parsed.houseNumber, parsed.direction, parsed.streetName, type?.short ?? parsed.streetType]
    .filter(Boolean)
    .join(' ');
  const lineWithFullType = [parsed.houseNumber, parsed.direction, parsed.streetName, type?.full ?? parsed.streetType]
    .filter(Boolean)
    .join(' ');
  const lineWithoutDirection = [parsed.houseNumber, parsed.streetName, type?.short ?? parsed.streetType]
    .filter(Boolean)
    .join(' ');
  const lineWithoutZip = `${lineWithType}, Baltimore, MD`;
  const lineWithZip = parsed.zipCode ? `${lineWithType}, Baltimore, MD ${parsed.zipCode}` : `${lineWithType}, Baltimore, MD`;
  const lineWithFullTypeAndZip = parsed.zipCode ? `${lineWithFullType}, Baltimore, MD ${parsed.zipCode}` : `${lineWithFullType}, Baltimore, MD`;
  const lineWithoutDirectionAndZip = parsed.zipCode ? `${lineWithoutDirection}, Baltimore, MD ${parsed.zipCode}` : `${lineWithoutDirection}, Baltimore, MD`;

  variants.add(lineWithZip);
  variants.add(lineWithoutZip);
  variants.add(lineWithFullTypeAndZip);
  if (parsed.direction) variants.add(lineWithoutDirectionAndZip);
  if (parsed.direction) variants.add(`${lineWithoutDirection}, Baltimore, MD`);

  variants.delete(address);
  return Array.from(variants).filter(Boolean);
}

function printRecord(record: RunRecord) {
  const report = record.report;
  console.log(`ADDRESS: ${record.address}`);
  console.log(`  SDAT match: ${report.subject ? 'yes' : 'no'}`);
  console.log(`  Owner returned: ${report.subject?.owner ? 'yes' : 'no'}`);
  console.log(`  Zoning returned: ${report.subject?.zoning ? 'yes' : 'no'}`);
  console.log(`  Assessment returned: ${typeof report.subject?.assessmentValue === 'number' ? 'yes' : 'no'}`);
  console.log(`  Permits queried: ${datasetLabel(report.datasets.permits.status)}`);
  console.log(`  Code violations queried: ${datasetLabel(report.datasets.codeViolations.status)}`);
  console.log(`  Vacant notices queried: ${datasetLabel(report.datasets.vacantBuildingNotices.status)}`);
  console.log(`  Final decision: ${decisionLabel(report)}`);
  console.log(`  Scan status: ${report.status}`);
  console.log(`  Time to complete in ms: ${record.durationMs}`);
  if (record.likelyWrongProperty) {
    console.log(`  Address matching issue: returned ${report.subject?.address}`);
  }
  if (record.failureReason) {
    console.log(`  Failure reason: ${record.failureReason}`);
  }
  if (report.status === 'error') {
    console.log('  RAW ERROR RESULT:');
    console.log(JSON.stringify(report, null, 2));
  }
  console.log('');
}

async function main() {
  const results: RunRecord[] = [];

  console.log('RUNNING BULK ADDRESS TEST');
  console.log(`Total addresses queued: ${ADDRESSES.length}`);
  console.log('');

  for (const address of ADDRESSES) {
    const result = await runOne(address);
    results.push(result);
    printRecord(result);
  }

  const notFoundResults = results.filter((result) => result.report.status === 'not_found');
  const variantResults: Array<{
    address: string;
    workedVariant: string | null;
    attempts: Array<{ variant: string; status: ScannerReport['status']; returnedAddress: string | null }>;
  }> = [];

  for (const result of notFoundResults) {
    const variants = buildVariants(result.address);
    const attempts: Array<{ variant: string; status: ScannerReport['status']; returnedAddress: string | null }> = [];
    let workedVariant: string | null = null;

    for (const variant of variants) {
      const variantRun = await runOne(variant);
      attempts.push({
        variant,
        status: variantRun.report.status,
        returnedAddress: variantRun.report.subject?.address ?? null,
      });
      if (variantRun.report.status === 'success' && !workedVariant) {
        workedVariant = variant;
      }
    }

    variantResults.push({
      address: result.address,
      workedVariant,
      attempts,
    });
  }

  const total = results.length;
  const sdatMatches = results.filter((result) => Boolean(result.report.subject)).length;
  const owners = results.filter((result) => Boolean(result.report.subject?.owner)).length;
  const permitsReturned = results.filter((result) => result.report.datasets.permits.status === 'returned_data').length;
  const violationsReturned = results.filter((result) => result.report.datasets.codeViolations.status === 'returned_data').length;
  const vacantReturned = results.filter((result) => result.report.datasets.vacantBuildingNotices.status === 'returned_data').length;

  const proceed = results.filter((result) => decisionLabel(result.report) === 'PROCEED').length;
  const caution = results.filter((result) => decisionLabel(result.report) === 'CAUTION').length;
  const escalate = results.filter((result) => decisionLabel(result.report) === 'ESCALATE').length;
  const insufficient = results.filter((result) => decisionLabel(result.report) === 'INSUFFICIENT DATA').length;
  const notFound = results.filter((result) => decisionLabel(result.report) === 'NOT FOUND').length;

  const wrongProperty = results.filter((result) => result.likelyWrongProperty);
  const failures = results.filter((result) => result.report.status === 'not_found' || result.report.status === 'error');

  const hitRate = (sdatMatches / total) * 100;
  const residential = results.slice(0, 10);
  const commercial = results.slice(10, 20);
  const mixed = results.slice(20);

  const groupHitRate = (group: RunRecord[]) =>
    `${group.filter((result) => Boolean(result.report.subject)).length}/${group.length} (${((group.filter((result) => Boolean(result.report.subject)).length / group.length) * 100).toFixed(1)}%)`;

  console.log('COVERAGE STATS:');
  console.log(`- Total addresses tested: ${total}`);
  console.log(`- SDAT match found: ${sdatMatches} of ${total} (${hitRate.toFixed(1)}%)`);
  console.log(`- Owner name returned: ${owners} of ${total} (${((owners / total) * 100).toFixed(1)}%)`);
  console.log(`- Permits returned data: ${permitsReturned} of ${total} (${((permitsReturned / total) * 100).toFixed(1)}%)`);
  console.log(`- Code violations returned data: ${violationsReturned} of ${total} (${((violationsReturned / total) * 100).toFixed(1)}%)`);
  console.log(`- Vacant notices returned data: ${vacantReturned} of ${total} (${((vacantReturned / total) * 100).toFixed(1)}%)`);
  console.log('');

  console.log('DECISION DISTRIBUTION:');
  console.log(`- PROCEED: ${proceed}`);
  console.log(`- CAUTION: ${caution}`);
  console.log(`- ESCALATE: ${escalate}`);
  console.log(`- INSUFFICIENT DATA: ${insufficient}`);
  console.log(`- NOT FOUND: ${notFound}`);
  console.log('');

  console.log('FAILURES:');
  if (failures.length === 0) {
    console.log('- None');
  } else {
    for (const failure of failures) {
      console.log(`- ${failure.address}: ${failure.failureReason || 'Unknown failure'}`);
    }
  }
  console.log('');

  console.log('ADDRESS MATCHING ISSUES:');
  if (wrongProperty.length === 0) {
    console.log('- None detected');
  } else {
    for (const issue of wrongProperty) {
      console.log(`- ${issue.address} -> returned ${issue.report.subject?.address}`);
    }
  }
  console.log('');

  console.log('NOT_FOUND VARIANT RETRIES:');
  if (variantResults.length === 0) {
    console.log('- No initial not_found addresses');
  } else {
    for (const variantResult of variantResults) {
      console.log(`- ${variantResult.address}`);
      console.log(`  Worked variant: ${variantResult.workedVariant || 'none'}`);
      for (const attempt of variantResult.attempts) {
        console.log(`  ${attempt.variant} -> ${attempt.status}${attempt.returnedAddress ? ` (${attempt.returnedAddress})` : ''}`);
      }
    }
  }
  console.log('');

  console.log('FINAL HONEST ASSESSMENT:');
  console.log(`1. Real hit rate: ${hitRate.toFixed(1)}% (${sdatMatches} of ${total} matched to SDAT)`);
  console.log(
    `2. Failure pattern: residential ${groupHitRate(residential)}, commercial ${groupHitRate(commercial)}, mixed/other ${groupHitRate(mixed)}`
  );
  console.log(
    `3. Parsing vs coverage: ${notFoundResults.length === 0 ? 'Current failures are not showing as SDAT misses in this sample; the main limitations are owner-link sparsity and city-dataset sparsity.' : 'See variant retry block for whether alternate formatting fixed any not_found addresses.'}`
  );
  console.log(
    '4. Minimum fix to get hit rate above 80%: improve owner extraction only if owner-return rate is the target; SDAT address-match rate is already above 80% if the sample clears. If not, focus on directional/street-type fallback before any new data source work.'
  );
  console.log(
    `5. Ready to demonstrate on any Baltimore address a banker might submit: ${hitRate >= 80 && notFoundResults.length === 0 ? 'yes, with caution that some city datasets will legitimately return no records' : 'no'}`
  );
}

main().catch((error) => {
  console.error('Bulk address test failed.');
  console.error(error);
  process.exit(1);
});

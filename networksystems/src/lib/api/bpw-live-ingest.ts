import type { ProcurementRecord } from '@/lib/api/procurement-ingest';

type ParsedLink = {
  href: string;
  text: string;
};

const BPW_DOCS_PAGE = 'https://bpw.maryland.gov/Pages/meetingDocuments_year.aspx';

function absoluteUrl(href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href.startsWith('/')) return `https://bpw.maryland.gov${href}`;
  return `https://bpw.maryland.gov/${href.replace(/^\.?\//, '')}`;
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parsePdfLinks(html: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  const re = /<a[^>]+href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    links.push({
      href: absoluteUrl(match[1]),
      text: stripHtml(match[2]),
    });
  }
  return links;
}

function parseDateFromTitle(title: string): string | null {
  const monthMap: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };

  const m1 = title.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})\b/i);
  if (!m1) return null;
  const month = monthMap[m1[1].slice(0, 3).toLowerCase()];
  const day = Number(m1[2]);
  if (!month || !day) return null;

  const year = new Date().getFullYear();
  const iso = new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
  return iso;
}

function dedupeByUrl(rows: ParsedLink[]): ParsedLink[] {
  const seen = new Set<string>();
  const out: ParsedLink[] = [];
  for (const row of rows) {
    if (seen.has(row.href)) continue;
    seen.add(row.href);
    out.push(row);
  }
  return out;
}

export async function fetchBpwLiveRecords(): Promise<ProcurementRecord[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(BPW_DOCS_PAGE, {
      headers: {
        'User-Agent': 'StoneBridgeAI/1.0 (+https://stonebridgeai.vercel.app)',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) return [];
    const html = await response.text();

    const links = dedupeByUrl(parsePdfLinks(html)).filter((link) => /agenda/i.test(link.text));

    return links.slice(0, 30).map((link, index) => {
      const parsedDate = parseDateFromTitle(link.text) || new Date().toISOString().slice(0, 10);
      const idSeed = Buffer.from(link.href).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
      return {
        id: `BPW-LIVE-${idSeed}-${index}`,
        agency: 'Maryland Board of Public Works',
        vendor: 'Pending Parse From Agenda',
        amount: 0,
        method: 'Unknown',
        category: 'BPW Agenda (live)',
        startDate: parsedDate,
        currentEndDate: parsedDate,
        jurisdiction: 'Maryland State',
        sourceUrl: link.href,
        boardActionDate: parsedDate,
      } satisfies ProcurementRecord;
    });
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

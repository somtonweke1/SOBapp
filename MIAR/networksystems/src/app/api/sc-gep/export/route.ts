import { NextRequest, NextResponse } from 'next/server';
import ExportReportingService from '@/services/export-reporting-service';
import SCGEPSolver from '@/services/sc-gep-solver';
import { createAfricanMiningSCGEPConfig, createMarylandSCGEPConfig, ScenarioType } from '@/services/sc-gep-enhanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      format = 'json',
      scenario = 'baseline',
      region = 'maryland',
      includeAnalysis = true,
      generateReport = false
    } = body;

    const exportService = new ExportReportingService();

    // Generate solution
    const config = region === 'maryland'
      ? createMarylandSCGEPConfig(scenario as ScenarioType)
      : createAfricanMiningSCGEPConfig(scenario as ScenarioType);

    const solver = new SCGEPSolver(config);
    const solution = await solver.solve();
    const bottlenecks = includeAnalysis ? solver.analyzeBottlenecks() : undefined;

    // Generate comprehensive report if requested
    if (generateReport && bottlenecks) {
      const report = exportService.generateComprehensiveReport(
        scenario as ScenarioType,
        region,
        solution,
        config,
        bottlenecks
      );

      if (format === 'html') {
        const html = exportService.exportReportToHTML(report);
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="sc-gep-report-${scenario}-${region}-${Date.now()}.html"`
          }
        });
      }

      // Return report as JSON
      return NextResponse.json({
        success: true,
        report,
        timestamp: new Date().toISOString()
      });
    }

    // Export solution in requested format
    let output: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        output = exportService.exportToCSV(solution, config);
        contentType = 'text/csv';
        filename = `sc-gep-solution-${scenario}-${region}-${Date.now()}.csv`;
        break;

      case 'json':
      default:
        output = exportService.exportToJSON(solution, config, bottlenecks, true);
        contentType = 'application/json';
        filename = `sc-gep-solution-${scenario}-${region}-${Date.now()}.json`;
        break;
    }

    return new NextResponse(output, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate export',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'baseline';
    const region = searchParams.get('region') || 'maryland';
    const format = searchParams.get('format') || 'json';

    const exportService = new ExportReportingService();

    // Generate solution
    const config = region === 'maryland'
      ? createMarylandSCGEPConfig(scenario as ScenarioType)
      : createAfricanMiningSCGEPConfig(scenario as ScenarioType);

    const solver = new SCGEPSolver(config);
    const solution = await solver.solve();
    const bottlenecks = solver.analyzeBottlenecks();

    // Quick export
    let output: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      output = exportService.exportToCSV(solution, config);
      contentType = 'text/csv';
      filename = `sc-gep-${scenario}-${region}.csv`;
    } else {
      output = exportService.exportToJSON(solution, config, bottlenecks, true);
      contentType = 'application/json';
      filename = `sc-gep-${scenario}-${region}.json`;
    }

    return new NextResponse(output, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate export',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

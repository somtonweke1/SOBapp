'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CSVUploadProps {
  onDataUploaded?: (data: any[]) => void;
  templateType?: 'facilities' | 'assets' | 'constraints' | 'materials';
  acceptedFormats?: string;
}

interface ParsedRow {
  [key: string]: string | number;
}

export default function CSVUpload({
  onDataUploaded,
  templateType = 'facilities',
  acceptedFormats = '.csv,.xlsx'
}: CSVUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [preview, setPreview] = useState<ParsedRow[]>([]);

  const templateColumns: Record<string, string[]> = {
    facilities: ['facility_name', 'location', 'capacity_mw', 'fuel_type', 'operational_status', 'outage_cost_per_day'],
    assets: ['asset_id', 'asset_name', 'type', 'location', 'value', 'risk_level', 'criticality'],
    constraints: ['constraint_type', 'severity', 'affected_assets', 'financial_impact', 'probability', 'duration_days'],
    materials: ['material_name', 'category', 'current_price', 'unit', 'supplier', 'lead_time_days', 'inventory_level']
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (uploadedFile: File) => {
    setError(null);
    setParsed(false);
    setFile(uploadedFile);

    // Validate file type
    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    setParsing(true);

    try {
      // Parse CSV
      const text = await uploadedFile.text();
      const rows = text.split('\n').filter(row => row.trim());

      if (rows.length === 0) {
        throw new Error('File is empty');
      }

      // Parse header
      const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));

      // Validate headers match template
      const expectedHeaders = templateColumns[templateType];
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setError(`Missing required columns: ${missingHeaders.join(', ')}`);
        setParsing(false);
        return;
      }

      // Parse data rows
      const data: ParsedRow[] = [];
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length === headers.length) {
          const row: ParsedRow = {};
          headers.forEach((header, index) => {
            // Try to convert to number if applicable
            const value = values[index];
            row[header] = isNaN(Number(value)) ? value : Number(value);
          });
          data.push(row);
        }
      }

      if (data.length === 0) {
        throw new Error('No valid data rows found');
      }

      setParsedData(data);
      setPreview(data.slice(0, 5)); // Show first 5 rows
      setParsed(true);
      setParsing(false);

      // Call callback
      if (onDataUploaded) {
        onDataUploaded(data);
      }

    } catch (err) {
      console.error('CSV parsing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setParsing(false);
    }
  };

  const downloadTemplate = () => {
    const headers = templateColumns[templateType];
    const sampleRow = headers.map(h => {
      // Provide sample data based on header
      switch (h) {
        case 'facility_name': return 'Example Power Plant';
        case 'location': return 'Houston, TX';
        case 'capacity_mw': return '500';
        case 'fuel_type': return 'Natural Gas';
        case 'operational_status': return 'online';
        case 'outage_cost_per_day': return '2500000';
        case 'asset_id': return 'ASSET_001';
        case 'asset_name': return 'Primary Generator';
        case 'type': return 'equipment';
        case 'value': return '5000000';
        case 'risk_level': return 'medium';
        case 'criticality': return 'high';
        default: return 'sample_value';
      }
    });

    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setParsed(false);
    setError(null);
    setParsedData([]);
    setPreview([]);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-zinc-900">Upload Your Data</h3>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
        <p className="text-sm text-zinc-600">
          Upload your {templateType} data in CSV or Excel format. Download the template to see the required format.
        </p>
      </div>

      {!parsed ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : error
                ? 'border-rose-300 bg-rose-50'
                : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="csv-upload"
            className="hidden"
            accept={acceptedFormats}
            onChange={handleChange}
          />

          <label htmlFor="csv-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              {parsing ? (
                <>
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium text-zinc-700">Parsing file...</p>
                </>
              ) : error ? (
                <>
                  <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
                  <p className="text-sm font-medium text-rose-700 mb-2">{error}</p>
                  <p className="text-xs text-zinc-500">Click or drag to try again</p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-zinc-400 mb-4" />
                  <p className="text-sm font-medium text-zinc-700 mb-2">
                    {dragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-zinc-500">
                    CSV or Excel files accepted
                  </p>
                </>
              )}
            </div>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Success message */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Successfully parsed {parsedData.length} rows
                  </p>
                  <p className="text-xs text-emerald-700">
                    File: {file?.name}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Data preview */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 mb-3">Data Preview (first 5 rows)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-zinc-200 rounded-lg overflow-hidden">
                <thead className="bg-zinc-100">
                  <tr>
                    {Object.keys(preview[0] || {}).map(header => (
                      <th key={header} className="px-4 py-2 text-left font-semibold text-zinc-700 border-b border-zinc-200">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-zinc-100 hover:bg-zinc-50">
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-zinc-700">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.length > 5 && (
              <p className="text-xs text-zinc-500 mt-2">
                ... and {parsedData.length - 5} more rows
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              Process Data
            </Button>
            <Button variant="outline" onClick={reset}>
              Upload Different File
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

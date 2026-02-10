'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle, X, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUnifiedPlatform } from '@/stores/unified-platform-store';

interface QuickDataUploadProps {
  onClose?: () => void;
}

export default function QuickDataUpload({ onClose }: QuickDataUploadProps) {
  const { addDataset } = useUnifiedPlatform();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploaded(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // Parse CSV (simple implementation)
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));

      const data = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i];
        });
        return obj;
      });

      // Add to unified platform store
      addDataset({
        id: `dataset_${Date.now()}`,
        name: file.name,
        type: 'facilities', // Auto-detect or let user choose
        data,
        uploadedAt: new Date(),
        processedBy: []
      });

      setUploaded(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-zinc-900">Quick Upload</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!uploaded ? (
        <>
          <p className="text-sm text-zinc-600 mb-4">
            Upload facility, asset, or material data to integrate across all analytics
          </p>

          <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <input
              type="file"
              id="quick-upload"
              className="hidden"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
            />
            <label htmlFor="quick-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-700">
                {file ? file.name : 'Choose CSV or Excel file'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Drag and drop or click to browse
              </p>
            </label>
          </div>

          {file && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Integrate
                </>
              )}
            </Button>
          )}
        </>
      ) : (
        <div className="text-center py-6">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h4 className="font-semibold text-emerald-900 mb-1">Data Integrated!</h4>
          <p className="text-sm text-emerald-700">
            Your data is now available across all platform components
          </p>
        </div>
      )}
    </Card>
  );
}

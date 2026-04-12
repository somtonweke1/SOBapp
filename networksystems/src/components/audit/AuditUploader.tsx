'use client';

import { useCallback, useRef, useState } from 'react';

export default function AuditUploader({
  label,
  hint,
  onFileSelected,
}: {
  label: string;
  hint?: string;
  onFileSelected: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const pickFile = useCallback((file: File | null) => {
    setFileName(file ? file.name : null);
    onFileSelected(file);
  }, [onFileSelected]);

  return (
    <div>
      <div className="text-sm font-medium text-gray-900">{label}</div>
      {hint ? <div className="mt-1 text-sm text-gray-600">{hint}</div> : null}

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0] ?? null;
          pickFile(file);
        }}
        className={`mt-3 rounded-2xl border border-dashed p-6 transition-colors ${
          isDragging ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <path d="M20 16.5a4.5 4.5 0 00-3.5-4.4A5.5 5.5 0 006 13a4 4 0 000 8h12a4 4 0 002-7.5z" />
            </svg>
          </div>
          <div className="mt-3 text-sm text-gray-700">
            Drag and drop a PDF/image, or{' '}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-semibold text-gray-900 underline underline-offset-2"
            >
              browse
            </button>
            .
          </div>
          <div className="mt-1 text-xs text-gray-500">PDF, PNG, JPG. Demo parser is simulated.</div>

          {fileName ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              {fileName}
              <button
                type="button"
                onClick={() => pickFile(null)}
                className="ml-2 text-gray-500 hover:text-gray-900"
                aria-label="Remove file"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            pickFile(file);
          }}
        />
      </div>
    </div>
  );
}


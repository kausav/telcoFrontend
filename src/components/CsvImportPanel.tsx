import React, { useId, useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { CSV_ACCEPT, CSV_COLUMNS, CSV_TEMPLATE, CSV_TEMPLATE_FILE_NAME, csvFileProblem, formatBytes } from '../lib/csvImport';
import { downloadText } from '../lib/exportData';

export interface CsvImportPanelProps {
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}

/** Shown under the schema-source choice once "Upload your own schema" is picked: choose a CSV, or download a sample to start from. */
export const CsvImportPanel: React.FC<CsvImportPanelProps> = ({ file, onFile, disabled }) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const take = (picked: File | undefined) => {
    if (!picked) return;
    const why = csvFileProblem(picked);
    setProblem(why);
    onFile(why ? null : picked);
  };

  return (
    <div className="wb-rise mt-2 border border-dashed border-[#0B0B0C]/25 rounded-xs bg-white p-2.5">
      <div
        onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (!disabled) take(e.dataTransfer.files?.[0]); }}
        className={`flex items-center gap-3 flex-wrap rounded-xs px-2 py-1.5 transition-colors ${dragging ? 'bg-[#E31837]/5' : ''}`}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={CSV_ACCEPT}
          className="sr-only"
          disabled={disabled}
          onChange={e => { take(e.target.files?.[0]); e.target.value = ''; }}
        />
        {file ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText className="w-4 h-4 text-[#E31837] shrink-0" aria-hidden="true" />
            <span className="text-[13px] font-medium truncate" title={file.name}>{file.name}</span>
            <span className="wb-cap text-[#0B0B0C]/50 shrink-0">{formatBytes(file.size)}</span>
            <button
              type="button"
              onClick={() => { setProblem(null); onFile(null); }}
              disabled={disabled}
              aria-label="Remove the chosen file"
              className="ml-1 p-1 text-[#0B0B0C]/55 hover:text-[#E31837] cursor-pointer focus-techm rounded-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-[12px] text-[#0B0B0C]/65 flex-1 min-w-[200px]">
            Drop a <span className="font-mono text-[11px]">.csv</span> here, or choose one. One row per column you want in the data.
          </p>
        )}
        <label
          htmlFor={inputId}
          className={`wb-ghost h-8 px-3 text-[12px] ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
          {file ? 'Choose another' : 'Choose CSV'}
        </label>
        <button
          type="button"
          onClick={() => downloadText(CSV_TEMPLATE_FILE_NAME, CSV_TEMPLATE, 'text/csv;charset=utf-8')}
          className="wb-link text-[#E31837] focus-techm"
        >
          Sample CSV
        </button>
      </div>
      {problem && <p role="alert" className="mt-1.5 px-2 text-[12px] text-[#9C1936]">{problem}</p>}
      <p className="wb-tall-only mt-1.5 px-2 text-[11px] text-[#0B0B0C]/55">
        Columns: {CSV_COLUMNS.map((c, i) => (
          <React.Fragment key={c.name}>
            {i > 0 && ', '}
            <span className="font-mono" title={c.note}>{c.name}{c.required ? '*' : ''}</span>
          </React.Fragment>
        ))}
        . * required.
      </p>
    </div>
  );
};
